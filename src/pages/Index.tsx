import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import DuelSection, { type DuelReward } from "@/components/DuelSection";

const BANNER_URL =
  "https://cdn.poehali.dev/projects/e03d01dd-c207-488c-aa14-9e40184b6c24/files/840de9ee-8516-4aab-88ca-92499cb030ec.jpg";

const AVATAR_URL =
  "https://cdn.poehali.dev/projects/e03d01dd-c207-488c-aa14-9e40184b6c24/bucket/884f7408-826e-40ed-b0c4-6d765a19bc86.jpg";

const MAX_BATTLES = 6;
const REGEN_MS = 5 * 60 * 1000;

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

const INITIAL_STATS: HeroStats = { strength: 5, defense: 5, agility: 5, mastery: 5, vitality: 5 };

const STAT_COST = (level: number) => level * 50;

const HERO_BASE = {
  name: "Странник",
  level: 1,
  hp: 100,
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

const SECTIONS = [
  { id: "diary", label: "Дневник", icon: "📖" },
  { id: "quests", label: "Задания", icon: "📜" },
  { id: "duel", label: "Дуэль", icon: "⚔️" },
  { id: "village", label: "Поселок", icon: "🏘️" },
  { id: "campaign", label: "Поход", icon: "🗺️" },
  { id: "dungeon", label: "Подземелье", icon: "🕳️" },
  { id: "dragon", label: "Дракон", icon: "🐉" },
  { id: "orcs", label: "Орки", icon: "👹" },
  { id: "order", label: "Орден", icon: "🛡️" },
  { id: "guild", label: "Дружина", icon: "🤝" },
  { id: "menagerie", label: "Зверинец", icon: "🦁" },
  { id: "top", label: "Лучшие", icon: "🏆" },
];

const STAT_INFO = [
  { key: "strength" as const, label: "Сила", icon: "💪", desc: "Увеличивает урон атаки" },
  { key: "defense" as const, label: "Защита", icon: "🛡️", desc: "Снижает получаемый урон" },
  { key: "agility" as const, label: "Ловкость", icon: "🏃", desc: "Повышает шанс уклонения и скорость" },
  { key: "mastery" as const, label: "Мастерство", icon: "⚔️", desc: "Увеличивает крит и точность" },
  { key: "vitality" as const, label: "Живучесть", icon: "❤️", desc: "Увеличивает максимальное HP и восстановление" },
];

const TOP_HEROES = [
  { rank: 1, name: "Громозека", level: 47, guild: "Орден Огня", power: 18450 },
  { rank: 2, name: "Ведьмак77", level: 44, guild: "Серые Волки", power: 16200 },
  { rank: 3, name: "Стальной", level: 43, guild: "Орден Огня", power: 15800 },
  { rank: 4, name: "ТёмнаяЗвезда", level: 41, guild: "Одиночки", power: 14100 },
  { rank: 5, name: "Скиталец", level: 38, guild: "Серые Волки", power: 12900 },
];

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
  type: "duel_wins" | "campaign_count" | "upgrade_stat" | "silver_earn" | "glory_earn";
}

const QUESTS_DEF: QuestDef[] = [
  { id: 1, title: "Дуэлянт", desc: "Одержи 3 победы в дуэлях", reward: "50 серебра", target: 3, type: "duel_wins" },
  { id: 2, title: "Путешественник", desc: "Соверши 2 похода", reward: "30 серебра", target: 2, type: "campaign_count" },
  { id: 3, title: "Тренировка", desc: "Улучши любой параметр 3 раза", reward: "80 серебра", target: 3, type: "upgrade_stat" },
  { id: 4, title: "Богач", desc: "Заработай 200 серебра", reward: "1 💎 кристалл", target: 200, type: "silver_earn" },
  { id: 5, title: "Славный герой", desc: "Набери 5 славы", reward: "100 серебра", target: 5, type: "glory_earn" },
];

type SectionId = typeof SECTIONS[number]["id"] | "main" | "hero" | "profile";

function formatTimer(ms: number) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTimerShort(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Index() {
  const [activeSection, setActiveSection] = useState<SectionId>("main");
  const [hero] = useState(HERO_BASE);
  const [silver, setSilver] = useState(480);
  const [glory, setGlory] = useState(0);
  const [xp, setXp] = useState(0);
  const [stats, setStats] = useState<HeroStats>(INITIAL_STATS);
  const [duelDifficulty, setDuelDifficulty] = useState<"higher" | "equal" | "lower">("equal");

  const healthParam = 5;
  const maxHp = 100 + stats.vitality * 15;
  const [currentHp, setCurrentHp] = useState(100);
  const regenPerHour = Math.round(maxHp * (0.05 + stats.vitality * 0.01));

  const [profileView, setProfileView] = useState<{ name: string; level: number } | null>(null);

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

  const [questProgress, setQuestProgress] = useState<Record<number, number>>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  });
  const [questClaimed, setQuestClaimed] = useState<Record<number, boolean>>({});
  const [totalSilverEarned, setTotalSilverEarned] = useState(0);

  useEffect(() => {
    if (campaignEnd === null) return;
    const tick = () => {
      const left = campaignEnd - Date.now();
      if (left <= 0) {
        setCampaignTimer(null);
        const reward = campaignReward;
        setSilver((s) => s + reward);
        setTotalSilverEarned((t) => t + reward);
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
  }, [campaignEnd, campaignReward]);

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
        setRegenTimer(regenQueue.current.length > 0 ? regenQueue.current[0] + REGEN_MS - Date.now() : null);
      } else {
        setRegenTimer(left);
      }
    };
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(tick, 1000);
    tick();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [battles]);

  const spendBattle = useCallback(() => {
    if (battles <= 0) return false;
    regenQueue.current = [...regenQueue.current, Date.now()];
    setBattles((b) => b - 1);
    return true;
  }, [battles]);

  const addDiaryEntry = useCallback((entry: Omit<DiaryEntry, "id">) => {
    diaryIdRef.current += 1;
    setDiary((prev) => [{ ...entry, id: diaryIdRef.current }, ...prev]);
  }, []);

  const onDuelEnd = useCallback((result: "victory" | "defeat", enemyName: string, reward: DuelReward) => {
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
      addDiaryEntry({ date: dateStr, icon: "🏆", text: `Победа над ${enemyName}! ${parts.join(", ")}.`, type: "duel_win" });
      setQuestProgress((prev) => ({ ...prev, 1: (prev[1] || 0) + 1 }));
    } else {
      addDiaryEntry({ date: dateStr, icon: "💀", text: `Поражение от ${enemyName} в дуэли.`, type: "duel_lose" });
    }
  }, [addDiaryEntry]);

  const upgradeStat = (key: keyof HeroStats) => {
    const currentLevel = stats[key];
    const cost = STAT_COST(currentLevel);
    if (silver < cost) return;
    setSilver((s) => s - cost);
    setStats((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    setQuestProgress((prev) => ({ ...prev, 3: (prev[3] || 0) + 1 }));
  };

  const startCampaign = (option: typeof CAMPAIGN_OPTIONS[number]) => {
    if (campaignEnd !== null) return;
    const reward = Math.floor(Math.random() * (option.silverMax - option.silverMin + 1)) + option.silverMin;
    setCampaignReward(reward);
    setCampaignEnd(Date.now() + option.minutes * 60 * 1000);
    setCampaignNotice(null);
  };

  const claimQuest = (quest: QuestDef) => {
    if (questClaimed[quest.id]) return;
    const progress = getQuestProgress(quest);
    if (progress < quest.target) return;
    setQuestClaimed((prev) => ({ ...prev, [quest.id]: true }));
    if (quest.id === 4) {
      // gems reward
    } else {
      const match = quest.reward.match(/(\d+)/);
      if (match) setSilver((s) => s + parseInt(match[1]));
    }
  };

  const getQuestProgress = (quest: QuestDef): number => {
    if (quest.type === "silver_earn") return totalSilverEarned;
    if (quest.type === "glory_earn") return glory;
    return questProgress[quest.id] || 0;
  };

  const heroForDuel = {
    ...hero,
    attack: hero.attack + stats.strength * 2 + stats.mastery,
    defense: hero.defense + stats.defense * 2,
    magic: hero.magic + stats.mastery,
    speed: hero.speed + stats.agility,
    maxHp: maxHp,
    hp: currentHp,
  };

  const openSection = (id: SectionId) => {
    setCampaignNotice(null);
    setActiveSection(id);
  };

  const viewProfile = (name: string, level: number) => {
    setProfileView({ name, level });
    setActiveSection("profile");
  };

  const renderSectionPage = () => {
    switch (activeSection) {
      case "diary": {
        const filteredDiary = diary.filter((e) => e.type === "duel_win" || e.type === "duel_lose" || e.type === "campaign");
        return (
          <div className="animate-fade-in">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              📖 Дневник приключений
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredDiary.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, color: "var(--text-medium)" }}>
                  Записей пока нет. Сражайся в дуэлях и ходи в походы!
                </div>
              )}
              {filteredDiary.map((e) => {
                const bg = e.type === "duel_win" ? "#f0fdf4" : e.type === "campaign" ? "#eff6ff" : "#fff5f5";
                const border = e.type === "duel_win" ? "#86efac" : e.type === "campaign" ? "#93c5fd" : "#fca5a5";
                return (
                  <div key={e.id} className="game-panel-inner" style={{ borderRadius: 4, padding: "9px 13px", background: bg, border: `1px solid ${border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 15 }}>{e.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gold)" }}>{e.date}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-dark)", lineHeight: 1.5 }}>{e.text}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case "quests":
        return (
          <div className="animate-fade-in">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              📜 Задания
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {QUESTS_DEF.map((q) => {
                const progress = getQuestProgress(q);
                const done = progress >= q.target;
                const claimed = questClaimed[q.id];
                return (
                  <div key={q.id} className="game-panel-inner" style={{ borderRadius: 4, padding: "10px 14px", opacity: claimed ? 0.5 : 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-dark)" }}>{q.title}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 3, background: claimed ? "#e5e7eb" : done ? "#f0fdf4" : "#fef9c3", color: claimed ? "#9ca3af" : done ? "#166534" : "#854d0e", border: `1px solid ${claimed ? "#d1d5db" : done ? "#86efac" : "#fde047"}` }}>
                        {claimed ? "Получено" : done ? "Готово!" : "В процессе"}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-medium)", marginBottom: 8 }}>{q.desc}</p>
                    <div style={{ marginBottom: 6 }}>
                      <div className="xp-bar"><div className="xp-fill" style={{ width: `${Math.min(100, (progress / q.target) * 100)}%` }} /></div>
                      <div style={{ fontSize: 11, marginTop: 2, color: "var(--text-medium)" }}>{Math.min(progress, q.target)}/{q.target}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 12, color: "var(--gold)" }}>🎁 {q.reward}</div>
                      {done && !claimed && (
                        <button onClick={() => claimQuest(q)} style={{ padding: "4px 12px", borderRadius: 3, fontWeight: 600, fontSize: 11, background: "var(--crimson)", color: "var(--parchment)", border: "none", cursor: "pointer" }}>
                          Забрать
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "duel":
        return (
          <DuelSection
            hero={heroForDuel}
            battles={battles}
            maxBattles={MAX_BATTLES}
            regenTimer={regenTimer}
            onSpendBattle={spendBattle}
            onDuelEnd={onDuelEnd}
            difficulty={duelDifficulty}
            onDifficultyChange={setDuelDifficulty}
            playerLevel={hero.level}
            onViewProfile={viewProfile}
          />
        );

      case "hero":
        return (
          <div className="animate-fade-in">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
              Твой Герой
            </h2>

            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <img src={AVATAR_URL} alt="Аватар" style={{ width: 100, height: 100, borderRadius: 8, border: "3px solid var(--parchment-border)", objectFit: "cover" }} />
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8, color: "var(--text-dark)" }}>{hero.name}</div>
              <div style={{ fontSize: 12, color: "var(--gold)" }}>Уровень {hero.level}</div>
            </div>

            <div className="game-panel-inner" style={{ borderRadius: 4, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 10, color: "var(--text-dark)", borderBottom: "1px solid var(--parchment-border)", paddingBottom: 8 }}>
                Параметры
              </div>
              <div style={{ fontSize: 12, color: "var(--text-medium)", marginBottom: 10 }}>Серебро: <strong style={{ color: "var(--text-dark)" }}>🪙 {silver}</strong></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {STAT_INFO.map((s) => {
                  const base = INITIAL_STATS[s.key];
                  const bonus = stats[s.key] - base;
                  const level = stats[s.key];
                  const cost = STAT_COST(level);
                  const canAfford = silver >= cost;
                  return (
                    <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                      <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{s.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dark)", minWidth: 100 }}>{s.label}:</span>
                      <span style={{ fontSize: 14, color: "var(--text-dark)" }}>{base}</span>
                      {bonus > 0 && <span style={{ fontSize: 14, color: "#15803d" }}>+{bonus}</span>}
                      <div style={{ marginLeft: "auto" }}>
                        <button
                          onClick={() => upgradeStat(s.key)}
                          disabled={!canAfford || level >= 50}
                          style={{
                            padding: "3px 8px", borderRadius: 3, fontWeight: 600, fontSize: 11,
                            border: "none", cursor: canAfford && level < 50 ? "pointer" : "not-allowed",
                            background: level >= 50 ? "#ccc" : canAfford ? "var(--crimson)" : "#e8dcc0",
                            color: level >= 50 ? "#888" : canAfford ? "var(--parchment)" : "#a08040",
                          }}
                        >
                          {level >= 50 ? "Макс" : `+1 (${cost}🪙)`}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div style={{ borderTop: "1px solid var(--parchment-border)", paddingTop: 6, marginTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                    <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>❤️</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dark)", minWidth: 100 }}>Здоровье:</span>
                    <span style={{ fontSize: 14, color: "var(--text-dark)" }}>{currentHp}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                    <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>❤️</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dark)", minWidth: 100 }}>Здор. Макс.:</span>
                    <span style={{ fontSize: 14, color: "var(--text-dark)" }}>{maxHp}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                    <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>❤️</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dark)", minWidth: 100 }}>Восст.:</span>
                    <span style={{ fontSize: 14, color: "var(--text-dark)" }}>{regenPerHour} в час</span>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid var(--parchment-border)", paddingTop: 6, marginTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                    <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>⭐</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dark)", minWidth: 100 }}>Слава:</span>
                    <span style={{ fontSize: 14, color: "var(--gold)" }}>{glory}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "profile": {
        if (!profileView) return null;
        const fakeStats = {
          strength: 3 + profileView.level * 2 + Math.floor(Math.random() * 5),
          defense: 3 + profileView.level * 2 + Math.floor(Math.random() * 5),
          agility: 3 + profileView.level + Math.floor(Math.random() * 4),
          mastery: 3 + profileView.level + Math.floor(Math.random() * 4),
          vitality: 3 + profileView.level + Math.floor(Math.random() * 3),
        };
        const fakeMaxHp = 100 + fakeStats.vitality * 15;
        return (
          <div className="animate-fade-in">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
              Профиль героя
            </h2>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-dark)" }}>{profileView.name}</div>
              <div style={{ fontSize: 12, color: "var(--gold)" }}>Уровень {profileView.level}</div>
            </div>
            <div className="game-panel-inner" style={{ borderRadius: 4, padding: "12px 14px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 10, color: "var(--text-dark)" }}>Параметры</div>
              {[
                { icon: "💪", label: "Сила", val: fakeStats.strength },
                { icon: "🛡️", label: "Защита", val: fakeStats.defense },
                { icon: "🏃", label: "Ловкость", val: fakeStats.agility },
                { icon: "⚔️", label: "Мастерство", val: fakeStats.mastery },
                { icon: "❤️", label: "Живучесть", val: fakeStats.vitality },
                { icon: "❤️", label: "Здор. Макс.", val: fakeMaxHp },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                  <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{s.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-dark)", minWidth: 100 }}>{s.label}:</span>
                  <span style={{ fontSize: 13, color: "var(--text-dark)" }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "campaign":
        return (
          <div className="animate-fade-in">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              🗺️ Поход
            </h2>

            {campaignEnd !== null ? (
              <div className="game-panel-inner" style={{ borderRadius: 4, padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🏕️</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-dark)", marginBottom: 8 }}>Герой в походе</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--crimson)", fontFamily: "monospace", marginBottom: 8 }}>
                  {campaignTimer !== null ? formatTimer(campaignTimer) : "..."}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-medium)", lineHeight: 1.6 }}>
                  Герой исследует дикие земли.<br />
                  Вернуться в поселок нельзя, пока поход не завершён.
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: "var(--text-medium)", marginBottom: 14, lineHeight: 1.6 }}>
                  Отправь героя в поход. Чем дольше путешествие — тем больше серебра он принесёт.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {CAMPAIGN_OPTIONS.map((opt) => (
                    <button
                      key={opt.minutes}
                      onClick={() => startCampaign(opt)}
                      className="game-panel-inner"
                      style={{ borderRadius: 4, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", border: "1px solid var(--parchment-border)", background: "#faf6e8", textAlign: "left" }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dark)" }}>🗺️ {opt.label}</div>
                        <div style={{ fontSize: 11, color: "var(--text-medium)", marginTop: 2 }}>Награда: {opt.silverMin}–{opt.silverMax} серебра</div>
                      </div>
                      <div style={{ padding: "6px 14px", borderRadius: 4, background: "var(--crimson)", color: "var(--parchment)", fontWeight: 700, fontSize: 12 }}>
                        Идти
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        );

      case "top":
        return (
          <div className="animate-fade-in">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              🏆 Лучшие герои
            </h2>
            <div className="game-panel-inner" style={{ borderRadius: 4, overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--crimson)", color: "var(--parchment)" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>#</th>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Герой</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Ур.</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Сила</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_HEROES.map((h, i) => (
                    <tr key={h.rank} style={{ background: i % 2 === 0 ? "#fffbeb" : "#fff", borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 700, color: h.rank <= 3 ? "var(--gold)" : "var(--text-medium)" }}>
                        {h.rank === 1 ? "🥇" : h.rank === 2 ? "🥈" : h.rank === 3 ? "🥉" : h.rank}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <div
                          style={{ fontWeight: 600, color: "var(--text-dark)", cursor: "pointer", textDecoration: "underline dotted" }}
                          onClick={() => viewProfile(h.name, h.level)}
                        >
                          {h.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-medium)" }}>{h.guild}</div>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: "var(--crimson)" }}>{h.level}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--gold)" }}>{h.power.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "village":
        return (
          <div className="animate-fade-in">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              🏘️ Поселок
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { name: "Кузница", icon: "🔨", desc: "Улучши оружие и броню", level: 2 },
                { name: "Таверна", icon: "🍺", desc: "Отдохни и найди задания", level: 1 },
                { name: "Храм", icon: "⛪", desc: "Исцелись и получи благословение", level: 1 },
                { name: "Рынок", icon: "🛒", desc: "Купи и продай предметы", level: 3 },
                { name: "Казарма", icon: "🗡️", desc: "Найми воинов в отряд", level: 2 },
                { name: "Башня мага", icon: "🔮", desc: "Изучи заклинания", level: 1 },
              ].map((b) => (
                <div key={b.name} className="game-panel-inner" style={{ borderRadius: 4, padding: 12, cursor: "pointer" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{b.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: "var(--text-dark)" }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-medium)", marginBottom: 6 }}>{b.desc}</div>
                  <div style={{ fontSize: 11, color: "var(--gold)" }}>Уровень {b.level}</div>
                </div>
              ))}
            </div>
          </div>
        );

      default: {
        const section = SECTIONS.find((s) => s.id === activeSection);
        return (
          <div className="animate-fade-in" style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>{section?.icon}</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              {section?.label}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-medium)" }}>Раздел в разработке</p>
          </div>
        );
      }
    }
  };

  const isOnSection = activeSection !== "main";
  const isCampaignActive = campaignEnd !== null;
  const canNavigate = !isCampaignActive || activeSection === "campaign";

  return (
    <div style={{ minHeight: "100vh", background: "var(--parchment)" }}>
      <header className="game-header">
        <div style={{ textAlign: "center", padding: "8px 0", borderBottom: "1px solid rgba(200,150,60,0.4)" }}>
          {campaignNotice && (
            <div style={{ fontSize: 12, color: "#15803d", fontWeight: 600, marginBottom: 4, background: "#f0fdf4", padding: "4px 8px", borderRadius: 3 }}>
              {campaignNotice}
            </div>
          )}
          <h1 className="game-title" style={{ fontSize: 22, letterSpacing: "0.3em" }}>⚜ Г Е Р О И ⚜</h1>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px", justifyContent: "center" }}>
          <div className="stat-badge" onClick={() => openSection("hero")} style={{ cursor: "pointer" }}><span>👤</span><span style={{ fontWeight: 600 }}>{hero.name}</span></div>
          <div className="stat-badge"><span>⭐</span><span>{hero.level} ур.</span></div>
          <div className="stat-badge"><span>❤️</span><span>{currentHp}</span></div>
          <div className="stat-badge"><span style={{ fontSize: 12 }}>🥈</span><span>{silver}</span></div>
          <div className="stat-badge"><span style={{ fontSize: 12 }}>🥇</span><span>{hero.gold}</span></div>
          <div className="stat-badge"><span>💎</span><span>{hero.gems}</span></div>
          <div className="stat-badge" style={{ gap: 5, alignItems: "center" }}>
            <span>⚔️</span>
            <span style={{ fontWeight: 600 }}>{battles}/{MAX_BATTLES}</span>
            {regenTimer !== null && battles < MAX_BATTLES && (
              <span style={{ fontSize: 10, color: "#f0d080", marginLeft: 2 }}>+{formatTimerShort(regenTimer)}</span>
            )}
          </div>
          {isCampaignActive && (
            <div className="stat-badge" style={{ gap: 5 }}>
              <span>🗺️</span>
              <span style={{ fontWeight: 600 }}>{campaignTimer !== null ? formatTimer(campaignTimer) : "..."}</span>
            </div>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        {activeSection === "main" && (
          <>
            <div style={{ height: 140, background: "#1a0a0a", overflow: "hidden", position: "relative" }}>
              <img src={BANNER_URL} alt="Герои" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(245,240,224,0.85) 100%)" }} />
            </div>

            <div className="game-panel">
              <div className="animate-fade-in" style={{ padding: "14px 16px", borderBottom: "1px solid var(--parchment-border)", background: "linear-gradient(180deg, #fffef5 0%, #faf4dc 100%)" }}>
                <h2 style={{ textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, marginBottom: 6, color: "var(--text-dark)" }}>
                  Добро пожаловать!
                </h2>
                <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-medium)", lineHeight: 1.6 }}>
                  Герой <strong>{hero.name}</strong>, уровень <strong>{hero.level}</strong>.
                </p>
              </div>

              <div style={{ padding: "12px 16px", background: "#faf6e8" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {SECTIONS.map((s) => {
                    const blocked = isCampaignActive && s.id !== "campaign" && s.id !== "diary";
                    return (
                      <button
                        key={s.id}
                        onClick={() => !blocked && openSection(s.id as SectionId)}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          padding: "10px 4px", borderRadius: 6,
                          background: blocked ? "#e8e0c8" : "#faf6e8",
                          border: "1px solid var(--parchment-border)", cursor: blocked ? "not-allowed" : "pointer",
                          opacity: blocked ? 0.5 : 1,
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 24 }}>{s.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dark)" }}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bottom-nav" style={{ padding: "8px 16px", display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                <a onClick={() => openSection("main")}>🏠 Главная</a>
                <a onClick={() => openSection("hero")}>🧙 Герой</a>
                <a>💬 Чат</a>
                <a>📬 Почта</a>
              </div>
            </div>
          </>
        )}

        {isOnSection && (
          <div className="game-panel" style={{ marginTop: 0 }}>
            <div style={{ padding: "14px 16px", background: "#faf6e8" }}>
              <button
                onClick={() => openSection("main")}
                style={{ fontSize: 12, color: "var(--crimson)", background: "none", border: "none", cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", gap: 4 }}
              >
                <Icon name="ChevronLeft" size={13} />
                На главную
              </button>
              {renderSectionPage()}
            </div>

            <div className="bottom-nav" style={{ padding: "8px 16px", display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
              <a onClick={() => openSection("main")}>🏠 Главная</a>
              <a onClick={() => openSection("hero")}>🧙 Герой</a>
              <a>💬 Чат</a>
              <a>📬 Почта</a>
            </div>
          </div>
        )}

        <footer className="game-footer" style={{ textAlign: "center", padding: "12px 16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 16px", marginBottom: 4 }}>
            <a className="footer-link">Правила</a>
            <a className="footer-link">Помощь</a>
            <a className="footer-link">Контакты</a>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-medium)" }}>⚜ Герои — 2025 ⚜</div>
        </footer>
      </div>
    </div>
  );
}
