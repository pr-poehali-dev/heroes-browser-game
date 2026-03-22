import { useState, useEffect, useRef, useCallback } from "react";
import { type DuelReward } from "@/components/DuelSection";
import GameHeader from "@/components/GameHeader";
import MainPage from "@/components/MainPage";
import SectionPage from "@/components/SectionPage";
import GameFooter from "@/components/GameFooter";
import AuthScreen from "@/components/AuthScreen";

const MAX_BATTLES = 6;
const REGEN_MS = 5 * 60 * 1000;
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

const STAT_COST = (level: number) => level * 50;

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

const CAMPAIGN_OPTIONS = [
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
  type:
    | "duel_wins"
    | "campaign_count"
    | "upgrade_stat"
    | "silver_earn"
    | "glory_earn";
}

const QUESTS_DEF: QuestDef[] = [
  { id: 1, title: "Дуэлянт", desc: "Одержи 3 победы в дуэлях", reward: "50 серебра", target: 3, type: "duel_wins" },
  { id: 2, title: "Путешественник", desc: "Соверши 2 похода", reward: "30 серебра", target: 2, type: "campaign_count" },
  { id: 3, title: "Тренировка", desc: "Улучши любой параметр 3 раза", reward: "80 серебра", target: 3, type: "upgrade_stat" },
  { id: 4, title: "Богач", desc: "Заработай 200 серебра", reward: "1 💎 кристалл", target: 200, type: "silver_earn" },
  { id: 5, title: "Славный герой", desc: "Набери 5 славы", reward: "100 серебра", target: 5, type: "glory_earn" },
];

export type SectionId =
  | "diary"
  | "quests"
  | "duel"
  | "village"
  | "campaign"
  | "dungeon"
  | "dragon"
  | "orcs"
  | "order"
  | "guild"
  | "menagerie"
  | "top"
  | "main"
  | "hero"
  | "profile";

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

  const maxHp = 100 + stats.vitality * 15;
  const [currentHp, setCurrentHp] = useState(100);
  const regenPerHour = Math.round(maxHp * (0.05 + stats.vitality * 0.01));

  const [profileView, setProfileView] = useState<{ name: string; level: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const regenInterval = Math.max(5, 30 - stats.vitality * 2) * 1000;
    const timer = setInterval(() => {
      setCurrentHp((prev) => {
        const max = 100 + stats.vitality * 15;
        return prev < max ? Math.min(max, prev + 1) : prev;
      });
    }, regenInterval);
    return () => clearInterval(timer);
  }, [stats.vitality]);

  const [battles, setBattles] = useState(MAX_BATTLES);
  const regenQueue = useRef<number[]>([]);
  const [regenTimer, setRegenTimer] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const diaryIdRef = useRef(10);

  const [campaignEnd, setCampaignEnd] = useState<number | null>(null);
  const [campaignTimer, setCampaignTimer] = useState<number | null>(null);
  const [campaignReward, setCampaignReward] = useState(0);
  const [campaignNotice, setCampaignNotice] = useState<string | null>(null);

  const [questProgress, setQuestProgress] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [questClaimed, setQuestClaimed] = useState<Record<number, boolean>>({});
  const [totalSilverEarned, setTotalSilverEarned] = useState(0);

  // Load hero from DB on first render
  useEffect(() => {
    if (!session) return;
    const uid = session.userId;
    fetch(HERO_SAVE_URL, { headers: { "X-User-Id": uid } })
      .then((r) => r.json())
      .then((data) => {
        if (!data.found) return;
        const h = data.hero;
        setSilver(h.silver ?? 480);
        setGlory(h.glory ?? 0);
        setXp(h.xp ?? 0);
        setCurrentHp(h.hp ?? 100);
        setBattles(h.battles ?? MAX_BATTLES);
        setTotalSilverEarned(h.total_silver_earned ?? 0);
        setStats({
          strength: h.stat_strength ?? 5,
          defense: h.stat_defense ?? 5,
          agility: h.stat_agility ?? 5,
          mastery: h.stat_mastery ?? 5,
          vitality: h.stat_vitality ?? 5,
        });
        if (h.quest_progress && typeof h.quest_progress === "object") {
          setQuestProgress(h.quest_progress);
        }
        if (h.quest_claimed && typeof h.quest_claimed === "object") {
          setQuestClaimed(h.quest_claimed);
        }
        if (h.campaign_end_at) {
          const endMs = new Date(h.campaign_end_at).getTime();
          if (endMs > Date.now()) {
            setCampaignEnd(endMs);
            setCampaignReward(h.campaign_reward ?? 0);
          }
        }
        loadedRef.current = true;
      })
      .catch(() => {
        loadedRef.current = true;
      });
  }, [session]);

  // Autosave with debounce
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
  }, []);

  // Build save payload from current state
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
      campaign_end_at: campaignEnd ? new Date(campaignEnd).toISOString() : null,
      campaign_reward: campaignReward,
      location: hero.location,
      quest_progress: questProgress,
      quest_claimed: questClaimed,
      total_silver_earned: totalSilverEarned,
      ...overrides,
    }),
    [hero, xp, currentHp, maxHp, silver, glory, stats, battles, campaignEnd, campaignReward, questProgress, questClaimed, totalSilverEarned],
  );

  useEffect(() => {
    if (campaignEnd === null) return;
    const tick = () => {
      const left = campaignEnd - Date.now();
      if (left <= 0) {
        setCampaignTimer(null);
        const reward = campaignReward;
        setSilver((s) => {
          const newSilver = s + reward;
          setTotalSilverEarned((t) => {
            const newTotal = t + reward;
            triggerSave(buildPayload({ silver: newSilver, campaign_end_at: null, campaign_reward: 0, total_silver_earned: newTotal }));
            return newTotal;
          });
          return newSilver;
        });
        const now = new Date();
        const dateStr = `${now.getDate()} марта, ${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
        const entry: DiaryEntry = {
          id: ++diaryIdRef.current,
          date: dateStr,
          icon: "🗺️",
          text: `Поход завершён! Получено ${reward} серебра.`,
          type: "campaign",
        };
        setDiary((prev) => [entry, ...prev]);
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
  }, [campaignEnd, campaignReward, triggerSave, buildPayload]);

  useEffect(() => {
    if (battles >= MAX_BATTLES) {
      if (timerRef.current) clearInterval(timerRef.current);
      setRegenTimer(null);
      return;
    }
    const tick = () => {
      const now = Date.now();
      const queue = regenQueue.current;
      if (queue.length === 0) return;
      const earliest = queue[0];
      const left = earliest + REGEN_MS - now;
      if (left <= 0) {
        regenQueue.current = queue.slice(1);
        setBattles((b) => {
          const next = Math.min(MAX_BATTLES, b + 1);
          if (next >= MAX_BATTLES && timerRef.current) {
            clearInterval(timerRef.current);
            setRegenTimer(null);
          }
          return next;
        });
        setRegenTimer(
          regenQueue.current.length > 0
            ? regenQueue.current[0] + REGEN_MS - Date.now()
            : null,
        );
      } else {
        setRegenTimer(left);
      }
    };
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(tick, 1000);
    tick();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [battles]);

  const spendBattle = useCallback(() => {
    if (battles <= 0) return false;
    regenQueue.current = [...regenQueue.current, Date.now()];
    setBattles((b) => {
      triggerSave(buildPayload({ battles: b - 1 }));
      return b - 1;
    });
    return true;
  }, [battles, triggerSave, buildPayload]);

  const addDiaryEntry = useCallback((entry: Omit<DiaryEntry, "id">) => {
    diaryIdRef.current += 1;
    setDiary((prev) => [{ ...entry, id: diaryIdRef.current }, ...prev]);
  }, []);

  const onDuelEnd = useCallback(
    (result: "victory" | "defeat", enemyName: string, reward: DuelReward) => {
      setSilver((s) => s + reward.silver);
      setGlory((g) => g + reward.glory);
      setXp((x) => x + reward.xp);
      if (reward.silver > 0) setTotalSilverEarned((t) => t + reward.silver);

      const now = new Date();
      const dateStr = `${now.getDate()} марта, ${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
      if (result === "victory") {
        const parts: string[] = [];
        if (reward.glory > 0) parts.push(`+${reward.glory} ⭐ славы`);
        if (reward.xp > 0) parts.push(`+${reward.xp} опыта`);
        if (reward.silver > 0) parts.push(`+${reward.silver} серебра`);
        addDiaryEntry({
          date: dateStr,
          icon: "🏆",
          text: `Победа над ${enemyName}! ${parts.join(", ")}.`,
          type: "duel_win",
        });
        setQuestProgress((prev) => {
          const next = { ...prev, 1: (prev[1] || 0) + 1 };
          triggerSave(buildPayload({
            silver: silver + reward.silver,
            glory: glory + reward.glory,
            xp: xp + reward.xp,
            total_silver_earned: totalSilverEarned + reward.silver,
            quest_progress: next,
          }));
          return next;
        });
      } else {
        addDiaryEntry({
          date: dateStr,
          icon: "💀",
          text: `Поражение от ${enemyName} в дуэли.`,
          type: "duel_lose",
        });
        triggerSave(buildPayload());
      }
    },
    [addDiaryEntry, triggerSave, buildPayload, silver, glory, xp, totalSilverEarned],
  );

  const upgradeStat = (key: keyof HeroStats) => {
    const currentLevel = stats[key];
    const cost = STAT_COST(currentLevel);
    if (silver < cost) return;
    const newSilver = silver - cost;
    const newStats = { ...stats, [key]: stats[key] + 1 };
    const newQP = { ...questProgress, 3: (questProgress[3] || 0) + 1 };
    setSilver(newSilver);
    setStats(newStats);
    setQuestProgress(newQP);
    triggerSave(buildPayload({
      silver: newSilver,
      [`stat_${key}`]: newStats[key],
      quest_progress: newQP,
    }));
  };

  const startCampaign = (option: (typeof CAMPAIGN_OPTIONS)[number]) => {
    if (campaignEnd !== null) return;
    const reward =
      Math.floor(Math.random() * (option.silverMax - option.silverMin + 1)) +
      option.silverMin;
    const endAt = Date.now() + option.minutes * 60 * 1000;
    setCampaignReward(reward);
    setCampaignEnd(endAt);
    setCampaignNotice(null);
    triggerSave(buildPayload({
      campaign_end_at: new Date(endAt).toISOString(),
      campaign_reward: reward,
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
      if (match) {
        newSilver = silver + parseInt(match[1]);
        setSilver(newSilver);
      }
    }
    triggerSave(buildPayload({ silver: newSilver, quest_claimed: newClaimed }));
  };

  const getQuestProgress = (quest: QuestDef): number => {
    if (quest.type === "silver_earn") return totalSilverEarned;
    if (quest.type === "glory_earn") return glory;
    return questProgress[quest.id] || 0;
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
    return <AuthScreen onAuth={(userId, username) => setSession({ userId, username })} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--parchment)" }}>
      <GameHeader
        hero={{ ...hero, name: session.username }}
        currentHp={currentHp}
        silver={silver}
        battles={battles}
        regenTimer={regenTimer}
        campaignTimer={campaignTimer}
        isCampaignActive={isCampaignActive}
        campaignNotice={campaignNotice}
        onOpenSection={openSection}
        saveStatus={saveStatus}
        onLogout={handleLogout}
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
            hero={hero}
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
            questProgress={questProgress}
            questClaimed={questClaimed}
            totalSilverEarned={totalSilverEarned}
            duelDifficulty={duelDifficulty}
            profileView={profileView}
            onOpenSection={openSection}
            onSpendBattle={spendBattle}
            onDuelEnd={onDuelEnd}
            onUpgradeStat={upgradeStat}
            onStartCampaign={startCampaign}
            onClaimQuest={claimQuest}
            onDifficultyChange={setDuelDifficulty}
            onViewProfile={viewProfile}
          />
        )}

        <GameFooter />
      </div>
    </div>
  );
}