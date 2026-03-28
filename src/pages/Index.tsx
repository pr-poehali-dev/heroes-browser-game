/**
 * Index.tsx — Главная страница игры (точка входа для залогиненных)
 *
 * За что отвечает:
 * - Хранит и управляет ВСЕМ игровым состоянием героя (HP, серебро, слава, XP, статы)
 * - Управляет системой боёв (6 дуэлей с кулдауном 5 минут)
 * - Управляет системой походов (от 10 мин до 8 часов, награда серебром)
 * - Управляет квестами (5 заданий с прогрессом и наградами)
 * - Управляет зверинцем (питомцы) и шахтой
 * - Регенерация HP (10% от максимума в час)
 * - Автосохранение прогресса на сервер
 * - Показывает экран авторизации, если пользователь не залогинен
 *
 * Основные интерфейсы:
 * - DiaryEntry — запись в дневнике боя
 * - HeroStats — 5 параметров героя (сила, защита, ловкость, мастерство, живучесть)
 * - SectionId — список всех разделов игры
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { type DuelReward } from "@/components/DuelSection";
import GameHeader from "@/components/GameHeader";
import MainPage from "@/components/MainPage";
import SectionPage from "@/components/SectionPage";
import GameFooter from "@/components/GameFooter";
import AuthScreen from "@/components/AuthScreen";

const MAX_BATTLES = 6;
const REGEN_MS = 5 * 60 * 1000;
const MAX_DIARY_ENTRIES = 20;

const MONTHS_RU = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
function formatDiaryDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}, ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
}
const HERO_SAVE_URL = "https://functions.poehali.dev/a540a07e-c67f-47e9-bb14-59ba436a93d8";

export interface DiaryEntry {
  id: number;
  date: string;
  icon: string;
  text: string;
  type: "duel_win" | "duel_lose" | "campaign" | "system";
}

export interface HeroStats {
  strength: number;
  defense: number;
  agility: number;
  mastery: number;
  vitality: number;
}

const INITIAL_STATS: HeroStats = {
  strength: 5,
  defense: 5,
  agility: 5,
  mastery: 5,
  vitality: 5,
};

// Стоимость прокачки: степенная формула подобрана по реальным данным
// cost = a * level^n, где при level=5 cost≈1, проверено на высоких уровнях
const STAT_COST_COEFFS: Record<keyof HeroStats, { a: number; n: number }> = {
  strength:  { a: 0.000344, n: 4.856 }, // Сила 28→29: 4300 серебра
  defense:   { a: 0.000631, n: 4.378 }, // Защита 29→30: 2105 серебра
  agility:   { a: 0.000588, n: 4.419 }, // Ловкость 25→26: 1225 серебра
  mastery:   { a: 0.000160, n: 5.283 }, // Мастерство 18→19: 870 серебра
  vitality:  { a: 0.000419, n: 4.705 }, // Живучесть 19→20: 860 серебра
};
const STAT_COST_FN = (key: keyof HeroStats, level: number): number => {
  const c = STAT_COST_COEFFS[key];
  return Math.max(1, Math.round(c.a * Math.pow(level, c.n)));
};
// HP: на уровне 5 = 100, на уровне 152 = 129500
const calcMaxHp = (vit: number) => Math.max(1, Math.round(68.29 * Math.pow(vit, 1.51) - 687.7));

const HERO_BASE = {
  name: "Странник",
  level: 1,
  hp: 1000,
  maxHp: 100,
  xp: 0,
  xpNext: 300,
  gold: 250,
  silver: 480,
  gems: 5,
  attack: 12,
  defense: 8,
  magic: 6,
  speed: 10,
  location: "Поселок",
};

const CAMPAIGN_OPTIONS_LIST = [
  { minutes: 10, label: "10 минут", silverMin: 5, silverMax: 15 },
  { minutes: 30, label: "30 минут", silverMin: 15, silverMax: 40 },
  { minutes: 60, label: "1 час", silverMin: 35, silverMax: 80 },
  { minutes: 120, label: "2 часа", silverMin: 75, silverMax: 160 },
  { minutes: 240, label: "4 часа", silverMin: 160, silverMax: 350 },
  { minutes: 480, label: "8 часов", silverMin: 350, silverMax: 700 },
];

interface QuestDef {
  id: number;
  title: string;
  desc: string;
  reward: string;
  target: number;
  type: "duel_wins" | "campaign_count" | "upgrade_stat" | "silver_earn" | "glory_earn";
}

const QUESTS_DEF: QuestDef[] = [
  { id: 1, title: "Дуэлянт", desc: "Одержи 3 победы в дуэлях", reward: "50 серебра", target: 3, type: "duel_wins" },
  { id: 2, title: "Путешественник", desc: "Соверши 2 похода", reward: "30 серебра", target: 2, type: "campaign_count" },
  { id: 3, title: "Тренировка", desc: "Улучши любой параметр 3 раза", reward: "80 серебра", target: 3, type: "upgrade_stat" },
  { id: 4, title: "Богач", desc: "Заработай 200 серебра", reward: "1 💎 кристалл", target: 200, type: "silver_earn" },
  { id: 5, title: "Славный герой", desc: "Набери 5 славы", reward: "100 серебра", target: 5, type: "glory_earn" },
];

export type SectionId =
  | "diary" | "quests" | "duel" | "village" | "campaign" | "dungeon"
  | "dragon" | "orcs" | "order" | "guild" | "menagerie" | "top"
  | "main" | "hero" | "profile"
  | "training" | "mercenaries" | "march" | "invite" | "params";

function getSavedSession(): { userId: string; username: string } | null {
  const userId = localStorage.getItem("heroes_user_id");
  const username = localStorage.getItem("heroes_username");
  if (userId && username) return { userId, username };
  return null;
}

export default function Index() {
  const savedSession = getSavedSession();
  const [session, setSession] = useState<{ userId: string; username: string } | null>(savedSession);

  const [activeSection, setActiveSection] = useState<SectionId>("main");
  const [hero] = useState(HERO_BASE);
  const [silver, setSilver] = useState(480);
  const [glory, setGlory] = useState(0);
  const [xp, setXp] = useState(0);
  const [stats, setStats] = useState<HeroStats>(INITIAL_STATS);
  const [duelDifficulty, setDuelDifficulty] = useState<"higher" | "equal" | "lower">("equal");
  const [avatarId, setAvatarId] = useState<string>(localStorage.getItem("heroes_avatar") || "m1");
  const [avatarImageUrl, setAvatarImageUrl] = useState<string>(localStorage.getItem("heroes_avatar_image") || "");

  // Статистика побед/поражений/походов/времени в походе
  const [duelWins, setDuelWins] = useState(0);
  const [duelLosses, setDuelLosses] = useState(0);
  const [campaignCount, setCampaignCount] = useState(0);
  const [campaignMinutesTotal, setCampaignMinutesTotal] = useState(0);

  // HP: степенная формула — 5 уровень = 100 HP, 152 уровень = 129500 HP
  const maxHp = calcMaxHp(stats.vitality);
  const [currentHp, setCurrentHp] = useState(calcMaxHp(5));
  const regenPerHour = Math.round(maxHp * 0.10);

  const [profileView, setProfileView] = useState<{ name: string; level: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  // HP regeneration: 10% от maxHp в час = regenPerHour/3600 в секунду
  // Тикаем каждую секунду, добавляем дробно, округляем HP
  const hpAccRef = useRef(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHp((prev) => {
        const max = calcMaxHp(stats.vitality);
        if (prev >= max) return prev;
        const perHour = Math.round(max * 0.10);
        hpAccRef.current += perHour / 3600;
        if (hpAccRef.current >= 1) {
          const add = Math.floor(hpAccRef.current);
          hpAccRef.current -= add;
          return Math.min(max, prev + add);
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stats.vitality]);

  const [battles, setBattles] = useState(MAX_BATTLES);
  const regenQueue = useRef<number[]>([]);
  const [regenQueueState, setRegenQueueState] = useState<number[]>([]);
  const [regenTimer, setRegenTimer] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggerSaveRef = useRef<((payload: object) => void) | null>(null);
  const buildPayloadRef = useRef<((overrides?: Partial<Record<string, unknown>>) => object) | null>(null);

  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const diaryIdRef = useRef(10);

  const [campaignEnd, setCampaignEnd] = useState<number | null>(null);
  const [campaignTimer, setCampaignTimer] = useState<number | null>(null);
  const [campaignReward, setCampaignReward] = useState(0);
  const [campaignNotice, setCampaignNotice] = useState<string | null>(null);
  const [campaignMinutes, setCampaignMinutes] = useState(0); // продолжительность текущего/последнего похода
  const [campaignUsedMinutesToday, setCampaignUsedMinutesToday] = useState(0); // лимит

  const [questProgress, setQuestProgress] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [questClaimed, setQuestClaimed] = useState<Record<number, boolean>>({});
  const [totalSilverEarned, setTotalSilverEarned] = useState(0);

  // Зверинец — питомцы
  const [pets, setPets] = useState<{ id: string; level: number }[]>([]);
  // Шахта
  const [mineEnd, setMineEnd] = useState<number | null>(null);
  const [mineDepth, setMineDepth] = useState(0);
  const [mineTimer, setMineTimer] = useState<number | null>(null);

  // Load hero from DB on first render
  useEffect(() => {
    if (!session) return;
    const uid = session.userId;
    fetch(HERO_SAVE_URL, { headers: { "X-User-Id": uid } })
      .then((r) => r.json())
      .then((data) => {
        if (!data.found) { loadedRef.current = true; return; }
        const h = data.hero;
        setSilver(h.silver ?? 480);
        setGlory(h.glory ?? 0);
        setXp(h.xp ?? 0);
        setCurrentHp(h.hp ?? 100);
        setBattles(h.battles ?? MAX_BATTLES);
        setTotalSilverEarned(h.total_silver_earned ?? 0);
        setDuelWins(h.duel_wins ?? 0);
        setDuelLosses(h.duel_losses ?? 0);
        setCampaignCount(h.campaign_count ?? 0);
        setCampaignMinutesTotal(h.campaign_minutes_total ?? 0);
        if (h.avatar) { setAvatarId(h.avatar); localStorage.setItem("heroes_avatar", h.avatar); }
        setStats({
          strength: h.stat_strength ?? 5,
          defense: h.stat_defense ?? 5,
          agility: h.stat_agility ?? 5,
          mastery: h.stat_mastery ?? 5,
          vitality: h.stat_vitality ?? 5,
        });
        if (h.quest_progress && typeof h.quest_progress === "object") setQuestProgress(h.quest_progress);
        if (h.quest_claimed && typeof h.quest_claimed === "object") setQuestClaimed(h.quest_claimed);
        if (h.pets && Array.isArray(h.pets)) setPets(h.pets);
        if (h.diary && Array.isArray(h.diary)) {
          setDiary(h.diary.slice(0, MAX_DIARY_ENTRIES));
          diaryIdRef.current = h.diary.length > 0 ? Math.max(...h.diary.map((d: DiaryEntry) => d.id)) + 1 : 10;
        }
        if (h.campaign_used_minutes_today) {
          // Сбрасываем если прошли сутки
          const lastDay = h.campaign_day ?? "";
          const today = new Date().toISOString().slice(0, 10);
          if (lastDay !== today) { setCampaignUsedMinutesToday(0); }
          else setCampaignUsedMinutesToday(h.campaign_used_minutes_today ?? 0);
        }
        if (h.campaign_end_at) {
          const endMs = new Date(h.campaign_end_at).getTime();
          if (endMs > Date.now()) {
            setCampaignEnd(endMs);
            setCampaignReward(h.campaign_reward ?? 0);
            setCampaignMinutes(h.campaign_minutes ?? 0);
          }
        }
        if (h.mine_end_at) {
          const mineEndMs = new Date(h.mine_end_at).getTime();
          if (mineEndMs > Date.now()) {
            setMineEnd(mineEndMs);
            setMineDepth(h.mine_depth ?? 0);
          }
        }

        // Восстанавливаем очередь регенерации боёв после перезагрузки
        const savedQueue: number[] = Array.isArray(h.battles_regen_queue)
          ? h.battles_regen_queue.map((t: number) => Number(t))
          : [];
        if (savedQueue.length > 0) {
          const now = Date.now();
          // Отфильтровываем уже сгенерировавшиеся слоты (прошло REGEN_MS с момента траты)
          const stillPending = savedQueue.filter((t) => t + REGEN_MS > now);
          const regenedOffline = savedQueue.length - stillPending.length;
          const loadedBattles = h.battles ?? MAX_BATTLES;
          const newBattles = Math.min(MAX_BATTLES, loadedBattles + regenedOffline);
          setBattles(newBattles);
          regenQueue.current = stillPending;
          setRegenQueueState(stillPending);
        }
        loadedRef.current = true;
      })
      .catch(() => { loadedRef.current = true; });
  }, [session]);

  // Autosave
  const triggerSave = useCallback((payload: object) => {
    if (!loadedRef.current || !session) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus("saving");
    saveTimerRef.current = setTimeout(() => {
      const uid = session.userId;
      fetch(HERO_SAVE_URL, {
        method: "POST",
        headers: { "X-User-Id": uid, "Content-Type": "application/json" },
        body: JSON.stringify({ hero: payload }),
      }).then(() => {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }).catch(() => setSaveStatus("idle"));
    }, 1500);
  }, [session]);

  const buildPayload = useCallback(
    (overrides: Partial<Record<string, unknown>> = {}) => ({
      name: hero.name,
      level: hero.level,
      xp,
      xp_next: hero.xpNext,
      hp: currentHp,
      max_hp: maxHp,
      gold: hero.gold,
      silver,
      gems: hero.gems,
      glory,
      attack: hero.attack,
      defense: hero.defense,
      magic: hero.magic,
      speed: hero.speed,
      stat_strength: stats.strength,
      stat_defense: stats.defense,
      stat_agility: stats.agility,
      stat_mastery: stats.mastery,
      stat_vitality: stats.vitality,
      battles,
      battles_last_regen_at: null,
      battles_regen_queue: regenQueue.current,
      campaign_end_at: campaignEnd ? new Date(campaignEnd).toISOString() : null,
      campaign_reward: campaignReward,
      campaign_minutes: campaignMinutes,
      campaign_used_minutes_today: campaignUsedMinutesToday,
      campaign_day: new Date().toISOString().slice(0, 10),
      campaign_count: campaignCount,
      campaign_minutes_total: campaignMinutesTotal,
      location: hero.location,
      quest_progress: questProgress,
      quest_claimed: questClaimed,
      total_silver_earned: totalSilverEarned,
      duel_wins: duelWins,
      duel_losses: duelLosses,
      avatar: avatarId,
      pets,
      mine_end_at: mineEnd ? new Date(mineEnd).toISOString() : null,
      mine_depth: mineDepth,
      diary: diary.slice(0, MAX_DIARY_ENTRIES),
      ...overrides,
    }),
    [hero, xp, currentHp, maxHp, silver, glory, stats, battles, campaignEnd, campaignReward, campaignMinutes, campaignUsedMinutesToday, campaignCount, campaignMinutesTotal, questProgress, questClaimed, totalSilverEarned, duelWins, duelLosses, avatarId, pets, mineEnd, mineDepth, diary],
  );

  // Синхронизируем refs для доступа внутри таймеров
  useEffect(() => { triggerSaveRef.current = triggerSave; }, [triggerSave]);
  useEffect(() => { buildPayloadRef.current = buildPayload; }, [buildPayload]);

  // Поход таймер
  useEffect(() => {
    if (campaignEnd === null) return;
    const tick = () => {
      const left = campaignEnd - Date.now();
      if (left <= 0) {
        setCampaignTimer(null);
        const reward = campaignReward;
        const mins = campaignMinutes;
        const now = new Date();
        const entry: DiaryEntry = {
          id: ++diaryIdRef.current,
          date: formatDiaryDate(now),
          icon: "🗺️",
          text: `Поход завершён! Получено ${reward} серебра.`,
          type: "campaign",
        };
        setSilver((s) => s + reward);
        setTotalSilverEarned((t) => t + reward);
        setCampaignCount((c) => c + 1);
        setCampaignMinutesTotal((m) => m + mins);
        setDiary((prev) => {
          const newDiary = [entry, ...prev].slice(0, MAX_DIARY_ENTRIES);
          triggerSave(buildPayload({
            silver: silver + reward,
            campaign_end_at: null,
            campaign_reward: 0,
            total_silver_earned: totalSilverEarned + reward,
            campaign_count: campaignCount + 1,
            campaign_minutes_total: campaignMinutesTotal + mins,
            diary: newDiary,
          }));
          return newDiary;
        });
        setCampaignNotice(`Поход завершён! +${reward} серебра`);
        setCampaignEnd(null);
        setCampaignReward(0);
        setQuestProgress((prev) => ({ ...prev, 2: (prev[2] || 0) + 1 }));
        return;
      }
      setCampaignTimer(left);
    };
    const interval = setInterval(tick, 1000);
    tick();
    return () => clearInterval(interval);
  }, [campaignEnd, campaignReward, campaignMinutes, triggerSave, buildPayload, silver, totalSilverEarned, campaignCount, campaignMinutesTotal]);

  // Шахта таймер
  useEffect(() => {
    if (mineEnd === null) return;
    const tick = () => {
      const left = mineEnd - Date.now();
      if (left <= 0) {
        setMineTimer(null);
        setMineEnd(null);
        return;
      }
      setMineTimer(left);
    };
    const interval = setInterval(tick, 1000);
    tick();
    return () => clearInterval(interval);
  }, [mineEnd]);

  // Боёв регенерация — запускается один раз, читает очередь через ref
  useEffect(() => {
    const tick = () => {
      const queue = regenQueue.current;
      if (queue.length === 0) {
        setRegenTimer(null);
        return;
      }
      const now = Date.now();
      const earliest = queue[0];
      const left = earliest + REGEN_MS - now;
      if (left <= 0) {
        const updatedQueue = queue.slice(1);
        regenQueue.current = updatedQueue;
        setRegenQueueState(updatedQueue);
        setBattles((b) => {
          const newB = Math.min(MAX_BATTLES, b + 1);
          if (triggerSaveRef.current && buildPayloadRef.current) {
            triggerSaveRef.current(buildPayloadRef.current({ battles: newB, battles_regen_queue: updatedQueue }));
          }
          return newB;
        });
        const nextQueue = regenQueue.current;
        if (nextQueue.length > 0) {
          setRegenTimer(Math.max(0, nextQueue[0] + REGEN_MS - Date.now()));
        } else {
          setRegenTimer(null);
        }
      } else {
        setRegenTimer(left);
      }
    };
    timerRef.current = setInterval(tick, 1000);
    tick();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const spendBattle = useCallback(() => {
    if (battles <= 0) return false;
    const spentAt = Date.now();
    const newQueue = [...regenQueue.current, spentAt];
    regenQueue.current = newQueue;
    setRegenQueueState(newQueue);
    setBattles((b) => {
      triggerSave(buildPayload({
        battles: b - 1,
        battles_regen_queue: newQueue,
      }));
      return b - 1;
    });
    return true;
  }, [battles, triggerSave, buildPayload]);

  const addDiaryEntry = useCallback((entry: Omit<DiaryEntry, "id">) => {
    diaryIdRef.current += 1;
    setDiary((prev) => [{ ...entry, id: diaryIdRef.current }, ...prev].slice(0, MAX_DIARY_ENTRIES));
  }, []);

  const onDuelEnd = useCallback(
    (result: "victory" | "defeat", enemyName: string, reward: DuelReward) => {
      // Вычитаем полученный урон из текущего HP
      const damageTaken = reward.damageTaken ?? 0;
      let newHp = 0;
      let forcedDefeat = false;
      setCurrentHp((prev) => {
        newHp = Math.max(40, prev - damageTaken);
        if (prev - damageTaken < 40) forcedDefeat = true;
        return newHp;
      });

      const finalResult = (result === "defeat" || forcedDefeat) ? "defeat" : "victory";

      setSilver((s) => s + reward.silver);
      setGlory((g) => g + reward.glory);
      setXp((x) => x + reward.xp);
      if (reward.silver > 0) setTotalSilverEarned((t) => t + reward.silver);

      const now = new Date();
      const dateStr = formatDiaryDate(now);
      if (finalResult === "victory") {
        setDuelWins((w) => w + 1);
        const parts: string[] = [];
        if (reward.glory > 0) parts.push(`+${reward.glory} ⭐ славы`);
        if (reward.xp > 0) parts.push(`+${reward.xp} опыта`);
        if (reward.silver > 0) parts.push(`+${reward.silver} серебра`);
        const newEntry: DiaryEntry = { id: diaryIdRef.current + 1, date: dateStr, icon: "🏆", text: `Победа над ${enemyName}! ${parts.join(", ")}.`, type: "duel_win" };
        diaryIdRef.current += 1;
        const newDiary = [newEntry, ...diary].slice(0, MAX_DIARY_ENTRIES);
        setDiary(newDiary);
        setQuestProgress((prev) => {
          const next = { ...prev, 1: (prev[1] || 0) + 1 };
          triggerSave(buildPayload({
            silver: silver + reward.silver,
            glory: glory + reward.glory,
            xp: xp + reward.xp,
            total_silver_earned: totalSilverEarned + reward.silver,
            quest_progress: next,
            duel_wins: duelWins + 1,
            diary: newDiary,
          }));
          return next;
        });
      } else {
        setDuelLosses((l) => l + 1);
        const defeatText = forcedDefeat
          ? `Поражение от ${enemyName} — слишком мало здоровья после боя.`
          : `Поражение от ${enemyName} в дуэли.`;
        const newEntry: DiaryEntry = { id: diaryIdRef.current + 1, date: dateStr, icon: "💀", text: defeatText, type: "duel_lose" };
        diaryIdRef.current += 1;
        const newDiary = [newEntry, ...diary].slice(0, MAX_DIARY_ENTRIES);
        setDiary(newDiary);
        triggerSave(buildPayload({ duel_losses: duelLosses + 1, diary: newDiary }));
      }
    },
    [triggerSave, buildPayload, silver, glory, xp, totalSilverEarned, duelWins, duelLosses, diary],
  );

  const upgradeStat = (key: keyof HeroStats) => {
    const currentLevel = stats[key];
    const cost = STAT_COST_FN(key, currentLevel);
    if (silver < cost) return;
    const newSilver = silver - cost;
    const newStats = { ...stats, [key]: stats[key] + 1 };
    const newQP = { ...questProgress, 3: (questProgress[3] || 0) + 1 };
    setSilver(newSilver);
    setStats(newStats);
    setQuestProgress(newQP);
    triggerSave(buildPayload({ silver: newSilver, [`stat_${key}`]: newStats[key], quest_progress: newQP }));
  };

  const startCampaign = (minutes: number) => {
    if (campaignEnd !== null) return;
    const opt = CAMPAIGN_OPTIONS_LIST.find(o => o.minutes === minutes) || CAMPAIGN_OPTIONS_LIST[0];
    const reward = Math.floor(Math.random() * (opt.silverMax - opt.silverMin + 1)) + opt.silverMin;
    const endAt = Date.now() + minutes * 60 * 1000;
    setCampaignReward(reward);
    setCampaignEnd(endAt);
    setCampaignMinutes(minutes);
    setCampaignUsedMinutesToday((prev) => prev + minutes);
    setCampaignNotice(null);
    triggerSave(buildPayload({
      campaign_end_at: new Date(endAt).toISOString(),
      campaign_reward: reward,
      campaign_minutes: minutes,
      campaign_used_minutes_today: campaignUsedMinutesToday + minutes,
      campaign_day: new Date().toISOString().slice(0, 10),
    }));
  };

  const claimQuest = (quest: QuestDef) => {
    if (questClaimed[quest.id]) return;
    const progress = getQuestProgress(quest);
    if (progress < quest.target) return;
    const newClaimed = { ...questClaimed, [quest.id]: true };
    setQuestClaimed(newClaimed);
    let newSilver = silver;
    if (quest.id !== 4) {
      const match = quest.reward.match(/(\d+)/);
      if (match) { newSilver = silver + parseInt(match[1]); setSilver(newSilver); }
    }
    triggerSave(buildPayload({ silver: newSilver, quest_claimed: newClaimed }));
  };

  const getQuestProgress = (quest: QuestDef): number => {
    if (quest.type === "silver_earn") return totalSilverEarned;
    if (quest.type === "glory_earn") return glory;
    return questProgress[quest.id] || 0;
  };

  const changeAvatar = (id: string) => {
    setAvatarId(id);
    localStorage.setItem("heroes_avatar", id);
    triggerSave(buildPayload({ avatar: id }));
  };

  const upgradePet = (petId: string) => {
    const existing = pets.find(p => p.id === petId);
    if (existing) {
      const cost = existing.level * 80;
      if (silver < cost) return;
      const newSilver = silver - cost;
      setSilver(newSilver);
      const newPets = pets.map(p => p.id === petId ? { ...p, level: p.level + 1 } : p);
      setPets(newPets);
      triggerSave(buildPayload({ silver: newSilver, pets: newPets }));
    } else {
      const cost = 100;
      if (silver < cost) return;
      const newSilver = silver - cost;
      setSilver(newSilver);
      const newPets = [...pets, { id: petId, level: 1 }];
      setPets(newPets);
      triggerSave(buildPayload({ silver: newSilver, pets: newPets }));
    }
  };

  const startMine = (depth: number) => {
    if (mineEnd !== null) return;
    const endAt = Date.now() + 20 * 60 * 1000;
    setMineEnd(endAt);
    setMineDepth(depth);
    triggerSave(buildPayload({ mine_end_at: new Date(endAt).toISOString(), mine_depth: depth }));
  };

  const claimMine = (): number => {
    if (mineEnd !== null && Date.now() < mineEnd) return 0;
    const gems = mineDepth + Math.floor(Math.random() * 3);
    triggerSave(buildPayload({ mine_end_at: null, mine_depth: 0 }));
    setMineEnd(null);
    setMineDepth(0);
    return gems;
  };

  const openSection = (id: SectionId) => {
    setCampaignNotice(null);
    setActiveSection(id);
  };

  const viewProfile = (name: string, level: number) => {
    setProfileView({ name, level });
    setActiveSection("profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("heroes_user_id");
    localStorage.removeItem("heroes_username");
    setSession(null);
  };

  const isOnSection = activeSection !== "main";
  const isCampaignActive = campaignEnd !== null;

  void xp;

  if (!session) {
    return <AuthScreen onAuth={(userId, username, avatar) => {
      if (avatar) { setAvatarId(avatar); localStorage.setItem("heroes_avatar", avatar); }
      setSession({ userId, username });
    }} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--parchment)" }}>
      <GameHeader
        hero={{ ...hero, name: session.username }}
        currentHp={currentHp}
        maxHp={maxHp}
        silver={silver}
        battles={battles}
        regenTimer={regenTimer}
        regenQueue={regenQueueState}
        campaignTimer={campaignTimer}
        isCampaignActive={isCampaignActive}
        campaignNotice={campaignNotice}
        onOpenSection={openSection}
        saveStatus={saveStatus}
        onLogout={handleLogout}
        avatarId={avatarId}
        avatarImageUrl={avatarImageUrl}
      />

      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        {activeSection === "main" && (
          <MainPage
            hero={{ ...hero, name: session.username }}
            isCampaignActive={isCampaignActive}
            onOpenSection={openSection}
          />
        )}

        {isOnSection && (
          <SectionPage
            activeSection={activeSection}
            hero={{ ...hero, name: session.username }}
            silver={silver}
            glory={glory}
            stats={stats}
            currentHp={currentHp}
            maxHp={maxHp}
            regenPerHour={regenPerHour}
            battles={battles}
            regenTimer={regenTimer}
            diary={diary}
            campaignEnd={campaignEnd}
            campaignTimer={campaignTimer}
            campaignUsedMinutesToday={campaignUsedMinutesToday}
            questProgress={questProgress}
            questClaimed={questClaimed}
            totalSilverEarned={totalSilverEarned}
            duelDifficulty={duelDifficulty}
            profileView={profileView}
            avatarId={avatarId}
            duelWins={duelWins}
            duelLosses={duelLosses}
            campaignCount={campaignCount}
            campaignMinutesTotal={campaignMinutesTotal}
            pets={pets}
            mineEnd={mineEnd}
            mineDepth={mineDepth}
            mineTimer={mineTimer}
            onOpenSection={openSection}
            onSpendBattle={spendBattle}
            onDuelEnd={onDuelEnd}
            onUpgradeStat={upgradeStat}
            onStartCampaign={startCampaign}
            onClaimQuest={claimQuest}
            onDifficultyChange={setDuelDifficulty}
            onViewProfile={viewProfile}
            onChangeAvatar={changeAvatar}
            onUpgradePet={upgradePet}
            onStartMine={startMine}
            onClaimMine={claimMine}
            avatarImageUrl={avatarImageUrl}
            onChangeAvatarImage={(url) => {
              setAvatarImageUrl(url);
              localStorage.setItem("heroes_avatar_image", url);
            }}
          />
        )}

        <GameFooter />
      </div>
    </div>
  );
}