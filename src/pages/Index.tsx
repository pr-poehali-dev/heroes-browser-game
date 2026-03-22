import { useState, useEffect, useRef, useCallback } from "react";
import { type DuelReward } from "@/components/DuelSection";
import GameHeader from "@/components/GameHeader";
import MainPage from "@/components/MainPage";
import SectionPage from "@/components/SectionPage";
import GameFooter from "@/components/GameFooter";

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

export default function Index() {
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
    setBattles((b) => b - 1);
    return true;
  }, [battles]);

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
        setQuestProgress((prev) => ({ ...prev, 1: (prev[1] || 0) + 1 }));
      } else {
        addDiaryEntry({
          date: dateStr,
          icon: "💀",
          text: `Поражение от ${enemyName} в дуэли.`,
          type: "duel_lose",
        });
      }
    },
    [addDiaryEntry],
  );

  const upgradeStat = (key: keyof HeroStats) => {
    const currentLevel = stats[key];
    const cost = STAT_COST(currentLevel);
    if (silver < cost) return;
    setSilver((s) => s - cost);
    setStats((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    setQuestProgress((prev) => ({ ...prev, 3: (prev[3] || 0) + 1 }));
  };

  const startCampaign = (option: (typeof CAMPAIGN_OPTIONS)[number]) => {
    if (campaignEnd !== null) return;
    const reward =
      Math.floor(Math.random() * (option.silverMax - option.silverMin + 1)) +
      option.silverMin;
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

  const openSection = (id: SectionId) => {
    setCampaignNotice(null);
    setActiveSection(id);
  };

  const viewProfile = (name: string, level: number) => {
    setProfileView({ name, level });
    setActiveSection("profile");
  };

  const isOnSection = activeSection !== "main";
  const isCampaignActive = campaignEnd !== null;

  // suppress unused warning
  void xp;

  return (
    <div style={{ minHeight: "100vh", background: "var(--parchment)" }}>
      <GameHeader
        hero={hero}
        currentHp={currentHp}
        silver={silver}
        battles={battles}
        regenTimer={regenTimer}
        campaignTimer={campaignTimer}
        isCampaignActive={isCampaignActive}
        campaignNotice={campaignNotice}
        onOpenSection={openSection}
      />

      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        {activeSection === "main" && (
          <MainPage
            hero={hero}
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
