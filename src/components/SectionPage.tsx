import { useState } from "react";
import Icon from "@/components/ui/icon";
import DuelSection, { type DuelReward } from "@/components/DuelSection";
import { DiaryEntry, HeroStats, SectionId } from "@/pages/Index";

// ── Аватарки ──────────────────────────────────────────────────────────────────
export const MALE_AVATARS = [
  <img
  src=""
  alt=""
>
  { id: "m2", emoji: "🗡️", label: "Разбойник" },
  { id: "m3", emoji: "🛡️", label: "Страж" },
  { id: "m4", emoji: "🏹", label: "Лучник" },
  { id: "m5", emoji: "🪓", label: "Варвар" },
  { id: "m6", emoji: "🔱", label: "Вождь" },
];
export const FEMALE_AVATARS = [
  { id: "f1", emoji: "🔮", label: "Чародейка" },
  { id: "f2", emoji: "🌙", label: "Ведьма" },
  { id: "f3", emoji: "🌸", label: "Жрица" },
  { id: "f4", emoji: "⚡", label: "Буревестник" },
  { id: "f5", emoji: "🌿", label: "Друидка" },
  { id: "f6", emoji: "💫", label: "Провидица" },
];
export const ALL_AVATARS = [...MALE_AVATARS, ...FEMALE_AVATARS];
export const getAvatarEmoji = (id: string) =>
  ALL_AVATARS.find((a) => a.id === id)?.emoji ?? "⚔️";
export const getAvatarLabel = (id: string) =>
  ALL_AVATARS.find((a) => a.id === id)?.label ?? "Герой";

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

// Стоимость статов
const STAT_COST = (key: keyof HeroStats, level: number): number => {
  const base = level * 50;
  if (key === "strength" || key === "mastery") return Math.round(base * 1.5);
  if (key === "vitality") return Math.round(base * 0.6);
  return base;
};

const STAT_INFO = [
  {
    key: "strength" as const,
    label: "Сила",
    icon: "💪",
    desc: "Увеличивает урон атаки",
    badge: "Дорого",
  },
  {
    key: "defense" as const,
    label: "Защита",
    icon: "🛡️",
    desc: "Снижает получаемый урон",
    badge: "",
  },
  {
    key: "agility" as const,
    label: "Ловкость",
    icon: "🏃",
    desc: "Повышает шанс уклонения и скорость",
    badge: "",
  },
  {
    key: "mastery" as const,
    label: "Мастерство",
    icon: "⚔️",
    desc: "Увеличивает крит и точность",
    badge: "Дорого",
  },
  {
    key: "vitality" as const,
    label: "Живучесть",
    icon: "❤️",
    desc: "Увеличивает максимальное HP и восстановление",
    badge: "Дёшево",
  },
];

const TOP_HEROES: {
  rank: number;
  name: string;
  level: number;
  guild: string;
  power: number;
}[] = [];

// Поход
const CAMPAIGN_PRESETS = [
  { minutes: 10, label: "10 мин", silverMin: 5, silverMax: 15 },
  { minutes: 30, label: "30 мин", silverMin: 15, silverMax: 40 },
  { minutes: 60, label: "1 час", silverMin: 35, silverMax: 80 },
  { minutes: 120, label: "2 часа", silverMin: 75, silverMax: 160 },
  { minutes: 240, label: "4 часа", silverMin: 160, silverMax: 350 },
  { minutes: 480, label: "8 часов", silverMin: 350, silverMax: 700 },
];
const MAX_CAMPAIGN_MINUTES_DAY = 480;

// Подземелье
const DUNGEON_LOCATIONS = [
  {
    id: "crypt",
    name: "Склеп",
    icon: "⚰️",
    difficulty: "Лёгкая",
    desc: "Древние захоронения. Нежить и пауки.",
    xpMin: 5,
    xpMax: 15,
    silverMin: 20,
    silverMax: 60,
  },
  {
    id: "caverns",
    name: "Пещеры троллей",
    icon: "🪨",
    difficulty: "Средняя",
    desc: "Тёмные пещеры с ордами троллей.",
    xpMin: 10,
    xpMax: 25,
    silverMin: 50,
    silverMax: 120,
  },
  {
    id: "labyrinth",
    name: "Лабиринт",
    icon: "🌀",
    difficulty: "Сложная",
    desc: "Бесконечный лабиринт с ловушками.",
    xpMin: 20,
    xpMax: 45,
    silverMin: 100,
    silverMax: 250,
  },
  {
    id: "abyss",
    name: "Бездна",
    icon: "🕳️",
    difficulty: "Эпик",
    desc: "Врата в тёмный мир. Только сильнейшие.",
    xpMin: 40,
    xpMax: 80,
    silverMin: 200,
    silverMax: 500,
  },
];

// Зверинец
const PET_TYPES = [
  {
    id: "wolf",
    name: "Волк",
    icon: "🐺",
    desc: "Верный боевой зверь",
    baseStats: { attack: 10, defense: 10, magic: 10, speed: 10, hp: 10 },
  },
  {
    id: "bear",
    name: "Медведь",
    icon: "🐻",
    desc: "Могучий защитник",
    baseStats: { attack: 10, defense: 10, magic: 10, speed: 10, hp: 10 },
  },
  {
    id: "eagle",
    name: "Орёл",
    icon: "🦅",
    desc: "Быстрый разведчик",
    baseStats: { attack: 10, defense: 10, magic: 10, speed: 10, hp: 10 },
  },
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
  {
    id: 1,
    title: "Дуэлянт",
    desc: "Одержи 3 победы в дуэлях",
    reward: "50 серебра",
    target: 3,
    type: "duel_wins",
  },
  {
    id: 2,
    title: "Путешественник",
    desc: "Соверши 2 похода",
    reward: "30 серебра",
    target: 2,
    type: "campaign_count",
  },
  {
    id: 3,
    title: "Тренировка",
    desc: "Улучши любой параметр 3 раза",
    reward: "80 серебра",
    target: 3,
    type: "upgrade_stat",
  },
  {
    id: 4,
    title: "Богач",
    desc: "Заработай 200 серебра",
    reward: "1 💎 кристалл",
    target: 200,
    type: "silver_earn",
  },
  {
    id: 5,
    title: "Славный герой",
    desc: "Набери 5 славы",
    reward: "100 серебра",
    target: 5,
    type: "glory_earn",
  },
];

function formatTimer(ms: number) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}ч ${m}мин` : `${h}ч`;
}

interface SectionPageProps {
  activeSection: SectionId;
  hero: {
    name: string;
    level: number;
    attack: number;
    defense: number;
    magic: number;
    speed: number;
    hp: number;
    maxHp: number;
    gold: number;
    gems: number;
  };
  silver: number;
  glory: number;
  stats: HeroStats;
  currentHp: number;
  maxHp: number;
  regenPerHour: number;
  battles: number;
  regenTimer: number | null;
  diary: DiaryEntry[];
  campaignEnd: number | null;
  campaignTimer: number | null;
  campaignUsedMinutesToday: number;
  questProgress: Record<number, number>;
  questClaimed: Record<number, boolean>;
  totalSilverEarned: number;
  duelDifficulty: "higher" | "equal" | "lower";
  profileView: { name: string; level: number } | null;
  avatarId: string;
  duelWins: number;
  duelLosses: number;
  campaignCount: number;
  campaignMinutesTotal: number;
  pets: { id: string; level: number }[];
  mineEnd: number | null;
  mineDepth: number;
  mineTimer: number | null;
  onOpenSection: (id: SectionId) => void;
  onSpendBattle: () => boolean;
  onDuelEnd: (
    result: "victory" | "defeat",
    enemyName: string,
    reward: DuelReward,
  ) => void;
  onUpgradeStat: (key: keyof HeroStats) => void;
  onStartCampaign: (minutes: number) => void;
  onClaimQuest: (quest: QuestDef) => void;
  onDifficultyChange: (d: "higher" | "equal" | "lower") => void;
  onViewProfile: (name: string, level: number) => void;
  onChangeAvatar: (id: string) => void;
  onUpgradePet: (petId: string) => void;
  onStartMine: (depth: number) => void;
  onClaimMine: () => number;
}

export default function SectionPage({
  activeSection,
  hero,
  silver,
  glory,
  stats,
  currentHp,
  maxHp,
  regenPerHour,
  battles,
  regenTimer,
  diary,
  campaignEnd,
  campaignTimer,
  campaignUsedMinutesToday,
  questProgress,
  questClaimed,
  totalSilverEarned,
  duelDifficulty,
  profileView,
  avatarId,
  duelWins,
  duelLosses,
  campaignCount,
  campaignMinutesTotal,
  pets,
  mineEnd,
  mineDepth,
  mineTimer,
  onOpenSection,
  onSpendBattle,
  onDuelEnd,
  onUpgradeStat,
  onStartCampaign,
  onClaimQuest,
  onDifficultyChange,
  onViewProfile,
  onChangeAvatar,
  onUpgradePet,
  onStartMine,
  onClaimMine,
}: SectionPageProps) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [campaignSlider, setCampaignSlider] = useState(0); // 0..5 индекс пресета
  const [mineLocalDepth, setMineLocalDepth] = useState(1);

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
    maxHp,
    hp: currentHp,
  };

  const selectedPreset = CAMPAIGN_PRESETS[campaignSlider];
  const remainCampaignMinutes =
    MAX_CAMPAIGN_MINUTES_DAY - campaignUsedMinutesToday;

  const renderContent = () => {
    switch (activeSection) {
      case "diary": {
        const filteredDiary = diary.filter(
          (e) =>
            e.type === "duel_win" ||
            e.type === "duel_lose" ||
            e.type === "campaign",
        );
        return (
          <div className="animate-fade-in">
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "var(--crimson)",
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              📖 Дневник приключений
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredDiary.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px 0",
                    fontSize: 13,
                    color: "var(--text-medium)",
                  }}
                >
                  Записей пока нет.
                </div>
              )}
              {filteredDiary.map((e) => {
                const bg =
                  e.type === "duel_win"
                    ? "#f0fdf4"
                    : e.type === "campaign"
                      ? "#eff6ff"
                      : "#fff5f5";
                const border =
                  e.type === "duel_win"
                    ? "#86efac"
                    : e.type === "campaign"
                      ? "#93c5fd"
                      : "#fca5a5";
                return (
                  <div
                    key={e.id}
                    className="game-panel-inner"
                    style={{
                      borderRadius: 4,
                      padding: "9px 13px",
                      background: bg,
                      border: `1px solid ${border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 3,
                      }}
                    >
                      <span style={{ fontSize: 15 }}>{e.icon}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--gold)",
                        }}
                      >
                        {e.date}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-dark)" }}>
                      {e.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case "quests": {
        return (
          <div className="animate-fade-in">
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "var(--crimson)",
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              📜 Задания
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {QUESTS_DEF.map((q) => {
                const prog = getQuestProgress(q);
                const done = prog >= q.target;
                const claimed = questClaimed[q.id];
                return (
                  <div
                    key={q.id}
                    className="game-panel-inner"
                    style={{
                      borderRadius: 4,
                      padding: "12px 14px",
                      opacity: claimed ? 0.5 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 6,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "var(--text-dark)",
                          }}
                        >
                          {q.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-medium)",
                            marginTop: 2,
                          }}
                        >
                          {q.desc}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--gold)",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          marginLeft: 8,
                        }}
                      >
                        {q.reward}
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          background: "#e5e7eb",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(100, (prog / q.target) * 100)}%`,
                            background: done ? "#22c55e" : "var(--crimson)",
                            borderRadius: 3,
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-medium)",
                          minWidth: 40,
                          textAlign: "right",
                        }}
                      >
                        {Math.min(prog, q.target)}/{q.target}
                      </span>
                      {done && !claimed && (
                        <button
                          onClick={() => onClaimQuest(q)}
                          style={{
                            padding: "3px 10px",
                            borderRadius: 3,
                            fontSize: 11,
                            fontWeight: 700,
                            background: "var(--crimson)",
                            color: "var(--parchment)",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Забрать
                        </button>
                      )}
                      {claimed && (
                        <span style={{ fontSize: 11, color: "#22c55e" }}>
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case "duel":
        return (
          <DuelSection
            hero={heroForDuel}
            stats={stats}
            battles={battles}
            maxBattles={6}
            regenTimer={regenTimer}
            onSpendBattle={onSpendBattle}
            onDuelEnd={onDuelEnd}
            difficulty={duelDifficulty}
            onDifficultyChange={onDifficultyChange}
            playerLevel={hero.level}
            onViewProfile={onViewProfile}
            key="duel"
          />
        );

      case "hero": {
        const attackVal = hero.attack + stats.strength * 2 + stats.mastery;
        const defenseVal = hero.defense + stats.defense * 2;
        const magicVal = hero.magic + stats.mastery;
        const speedVal = hero.speed + stats.agility;
        return (
          <div className="animate-fade-in">
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "var(--crimson)",
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Твой персонаж
            </h2>

            {/* Аватарка по центру */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div
                onClick={() => setShowAvatarPicker(true)}
                style={{
                  display: "inline-block",
                  position: "relative",
                  cursor: "pointer",
                }}
                title="Нажми чтобы сменить аватарку"
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    border: "3px solid var(--parchment-border)",
                    background: "#2a1010",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 44,
                    margin: "0 auto",
                  }}
                >
                  {getAvatarEmoji(avatarId)}
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "var(--crimson)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    border: "2px solid var(--parchment)",
                  }}
                >
                  ✎
                </div>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  marginTop: 10,
                  color: "var(--text-dark)",
                }}
              >
                {hero.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--gold)" }}>
                Уровень {hero.level} · {getAvatarLabel(avatarId)}
              </div>
            </div>

            {/* Выбор аватарки */}
            {showAvatarPicker && (
              <div
                className="game-panel-inner"
                style={{
                  borderRadius: 6,
                  padding: "12px 14px",
                  marginBottom: 12,
                  border: "2px solid var(--parchment-border)",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--text-dark)",
                    marginBottom: 8,
                  }}
                >
                  Мужские:
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  {MALE_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      onClick={() => {
                        onChangeAvatar(av.id);
                        setShowAvatarPicker(false);
                      }}
                      style={{
                        padding: "8px 4px",
                        borderRadius: 6,
                        border: `2px solid ${avatarId === av.id ? "var(--crimson)" : "var(--parchment-border)"}`,
                        background: avatarId === av.id ? "#fff5f0" : "#faf6e8",
                        cursor: "pointer",
                        fontSize: 22,
                      }}
                      title={av.label}
                    >
                      {av.emoji}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--text-dark)",
                    marginBottom: 8,
                  }}
                >
                  Женские:
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  {FEMALE_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      onClick={() => {
                        onChangeAvatar(av.id);
                        setShowAvatarPicker(false);
                      }}
                      style={{
                        padding: "8px 4px",
                        borderRadius: 6,
                        border: `2px solid ${avatarId === av.id ? "var(--crimson)" : "var(--parchment-border)"}`,
                        background: avatarId === av.id ? "#fff5f0" : "#faf6e8",
                        cursor: "pointer",
                        fontSize: 22,
                      }}
                      title={av.label}
                    >
                      {av.emoji}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowAvatarPicker(false)}
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: 3,
                    border: "1px solid var(--parchment-border)",
                    background: "#f0e8d0",
                    fontSize: 12,
                    cursor: "pointer",
                    color: "var(--text-dark)",
                  }}
                >
                  Закрыть
                </button>
              </div>
            )}

            {/* Боевые характеристики */}
            <div
              className="game-panel-inner"
              style={{
                borderRadius: 4,
                padding: "12px 14px",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-dark)",
                  borderBottom: "1px solid var(--parchment-border)",
                  paddingBottom: 6,
                  marginBottom: 10,
                }}
              >
                Боевые характеристики
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 12px",
                }}
              >
                {[
                  { icon: "⚔️", label: "Атака", val: attackVal },
                  { icon: "🛡️", label: "Защита", val: defenseVal },
                  { icon: "🔮", label: "Магия", val: magicVal },
                  { icon: "🏃", label: "Скорость", val: speedVal },
                  { icon: "❤️", label: "HP", val: `${currentHp}/${maxHp}` },
                  { icon: "💚", label: "Восст./ч", val: `+${regenPerHour}` },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{row.icon}</span>
                    <span style={{ color: "var(--text-medium)" }}>
                      {row.label}:
                    </span>
                    <span
                      style={{ fontWeight: 700, color: "var(--text-dark)" }}
                    >
                      {row.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Прокачка статов */}
            <div
              className="game-panel-inner"
              style={{
                borderRadius: 4,
                padding: "12px 14px",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--parchment-border)",
                  paddingBottom: 6,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-dark)",
                  }}
                >
                  Параметры
                </div>
                <div style={{ fontSize: 12, color: "var(--text-medium)" }}>
                  🪙 {silver} серебра
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {STAT_INFO.map((s) => {
                  const level = stats[s.key];
                  const cost = STAT_COST(s.key, level);
                  const canAfford = silver >= cost;
                  return (
                    <div
                      key={s.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 0",
                      }}
                    >
                      <span
                        style={{ fontSize: 18, width: 24, textAlign: "center" }}
                      >
                        {s.icon}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "var(--text-dark)",
                          minWidth: 90,
                        }}
                      >
                        {s.label}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: "var(--text-dark)",
                          fontWeight: 600,
                          minWidth: 20,
                        }}
                      >
                        {level}
                      </span>
                      {s.badge && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "1px 5px",
                            borderRadius: 3,
                            background:
                              s.badge === "Дорого" ? "#fde8e8" : "#e8fde8",
                            color: s.badge === "Дорого" ? "#b91c1c" : "#166534",
                            fontWeight: 700,
                          }}
                        >
                          {s.badge}
                        </span>
                      )}
                      <div style={{ marginLeft: "auto" }}>
                        <button
                          onClick={() => onUpgradeStat(s.key)}
                          disabled={!canAfford}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 3,
                            fontWeight: 600,
                            fontSize: 11,
                            border: "none",
                            cursor: canAfford ? "pointer" : "not-allowed",
                            background: canAfford
                              ? "var(--crimson)"
                              : "#e5e7eb",
                            color: canAfford ? "var(--parchment)" : "#9ca3af",
                          }}
                          title={`${s.desc} · Стоимость: ${cost}🪙`}
                        >
                          +1 ({cost}🪙)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Статистика */}
            <div
              className="game-panel-inner"
              style={{ borderRadius: 4, padding: "12px 14px" }}
            >
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-dark)",
                  borderBottom: "1px solid var(--parchment-border)",
                  paddingBottom: 6,
                  marginBottom: 10,
                }}
              >
                Статистика
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 12px",
                  fontSize: 13,
                }}
              >
                {[
                  { icon: "🏆", label: "Победы", val: duelWins },
                  { icon: "💀", label: "Поражения", val: duelLosses },
                  { icon: "🗺️", label: "Походов", val: campaignCount },
                  {
                    icon: "⏱️",
                    label: "В походах",
                    val: formatHours(campaignMinutesTotal),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span style={{ fontSize: 16 }}>{row.icon}</span>
                    <span style={{ color: "var(--text-medium)" }}>
                      {row.label}:
                    </span>
                    <span
                      style={{ fontWeight: 700, color: "var(--text-dark)" }}
                    >
                      {row.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case "campaign": {
        const limitReached = remainCampaignMinutes <= 0;
        return (
          <div className="animate-fade-in">
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "var(--crimson)",
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              🗺️ Поход
            </h2>

            {/* Дневной лимит */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                background: "#faf6e8",
                border: "1px solid var(--parchment-border)",
                borderRadius: 4,
                padding: "8px 12px",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-medium)" }}>
                Лимит сегодня:
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color:
                    remainCampaignMinutes < 60
                      ? "var(--crimson)"
                      : "var(--text-dark)",
                }}
              >
                {formatHours(campaignUsedMinutesToday)} / 8ч использовано
              </span>
              {limitReached && (
                <span style={{ fontSize: 11, color: "var(--crimson)" }}>
                  Лимит исчерпан!
                </span>
              )}
            </div>

            {campaignEnd !== null ? (
              <div
                className="game-panel-inner"
                style={{
                  borderRadius: 4,
                  padding: "20px 14px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--text-dark)",
                    marginBottom: 4,
                  }}
                >
                  Герой в походе
                </div>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: "var(--crimson)",
                    fontFamily: "monospace",
                    marginBottom: 8,
                  }}
                >
                  {campaignTimer !== null ? formatTimer(campaignTimer) : "..."}
                </div>
                <p style={{ fontSize: 12, color: "var(--text-medium)" }}>
                  Можно делать всё, кроме дуэлей.
                </p>
              </div>
            ) : (
              <>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-medium)",
                    marginBottom: 16,
                    lineHeight: 1.6,
                  }}
                >
                  Отправь героя в поход. Чем дольше путешествие — тем больше
                  серебра.
                </p>

                {/* Ползунок времени */}
                <div
                  className="game-panel-inner"
                  style={{
                    borderRadius: 6,
                    padding: "16px 14px",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 12, color: "var(--text-medium)" }}>
                      Длительность похода
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--crimson)",
                      }}
                    >
                      {selectedPreset.label}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={1}
                    value={campaignSlider}
                    onChange={(e) => setCampaignSlider(Number(e.target.value))}
                    disabled={
                      limitReached ||
                      selectedPreset.minutes > remainCampaignMinutes
                    }
                    style={{
                      width: "100%",
                      accentColor: "var(--crimson)",
                      cursor: limitReached ? "not-allowed" : "pointer",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 4,
                    }}
                  >
                    {CAMPAIGN_PRESETS.map((p, i) => (
                      <span
                        key={p.minutes}
                        style={{
                          fontSize: 9,
                          color:
                            i === campaignSlider
                              ? "var(--crimson)"
                              : "var(--text-medium)",
                          fontWeight: i === campaignSlider ? 700 : 400,
                        }}
                      >
                        {p.label}
                      </span>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      padding: "8px 10px",
                      background: "#faf6e8",
                      borderRadius: 4,
                      border: "1px solid var(--parchment-border)",
                      fontSize: 13,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "var(--text-medium)" }}>
                        Награда:
                      </span>
                      <span style={{ fontWeight: 700, color: "var(--gold)" }}>
                        🥈 {selectedPreset.silverMin}–{selectedPreset.silverMax}{" "}
                        серебра
                      </span>
                    </div>
                    {selectedPreset.minutes > remainCampaignMinutes &&
                      !limitReached && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--crimson)",
                            marginTop: 4,
                          }}
                        >
                          Осталось лимита: {formatHours(remainCampaignMinutes)}.
                          Выбери меньший поход.
                        </div>
                      )}
                  </div>

                  <button
                    onClick={() => onStartCampaign(selectedPreset.minutes)}
                    disabled={
                      limitReached ||
                      selectedPreset.minutes > remainCampaignMinutes
                    }
                    style={{
                      width: "100%",
                      marginTop: 12,
                      padding: "11px",
                      borderRadius: 4,
                      fontWeight: 700,
                      fontSize: 15,
                      background:
                        limitReached ||
                        selectedPreset.minutes > remainCampaignMinutes
                          ? "#ccc"
                          : "var(--crimson)",
                      color: "var(--parchment)",
                      border: "none",
                      cursor:
                        limitReached ||
                        selectedPreset.minutes > remainCampaignMinutes
                          ? "not-allowed"
                          : "pointer",
                      fontFamily: "'Cormorant Garamond', serif",
                    }}
                  >
                    🗺️ Отправиться в поход
                  </button>
                </div>
              </>
            )}
          </div>
        );
      }

      case "dungeon": {
        return (
          <div className="animate-fade-in">
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "var(--crimson)",
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              🕳️ Подземелье
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-medium)",
                marginBottom: 14,
                lineHeight: 1.6,
              }}
            >
              Выбери локацию для исследования. Чем опаснее — тем богаче добыча.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DUNGEON_LOCATIONS.map((loc) => {
                const diffColor =
                  loc.difficulty === "Лёгкая"
                    ? "#22c55e"
                    : loc.difficulty === "Средняя"
                      ? "#f59e0b"
                      : loc.difficulty === "Сложная"
                        ? "#ef4444"
                        : "#7c3aed";
                return (
                  <div
                    key={loc.id}
                    className="game-panel-inner"
                    style={{
                      borderRadius: 6,
                      padding: "14px",
                      border: "1px solid var(--parchment-border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <div style={{ fontSize: 36, lineHeight: 1 }}>
                        {loc.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 15,
                              color: "var(--text-dark)",
                            }}
                          >
                            {loc.name}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: 3,
                              background: "#f0e0ff",
                              color: diffColor,
                              fontWeight: 700,
                            }}
                          >
                            {loc.difficulty}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-medium)",
                            marginBottom: 8,
                          }}
                        >
                          {loc.desc}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            fontSize: 11,
                            color: "var(--text-medium)",
                            marginBottom: 10,
                          }}
                        >
                          <span>
                            📈 {loc.xpMin}–{loc.xpMax} опыта
                          </span>
                          <span>
                            🥈 {loc.silverMin}–{loc.silverMax} серебра
                          </span>
                        </div>
                        <button
                          style={{
                            padding: "6px 16px",
                            borderRadius: 4,
                            fontWeight: 700,
                            fontSize: 13,
                            background: "var(--crimson)",
                            color: "var(--parchment)",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Исследовать
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case "village": {
        return (
          <div className="animate-fade-in">
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "var(--crimson)",
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              🏘️ Поселок
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                {
                  name: "Кузница",
                  icon: "🔨",
                  desc: "Улучши оружие и броню",
                  id: "forge",
                },
                {
                  name: "Рынок",
                  icon: "🏪",
                  desc: "Купи и продай товары",
                  id: "market",
                },
                {
                  name: "Таверна",
                  icon: "🍺",
                  desc: "Отдых и задания",
                  id: "tavern",
                },
                {
                  name: "Шахта",
                  icon: "⛏️",
                  desc: "Добыча кристаллов",
                  id: "mine",
                },
              ].map((b) => (
                <div
                  key={b.id}
                  className="game-panel-inner"
                  onClick={() =>
                    b.id === "mine" ? onOpenSection("dungeon") : undefined
                  }
                  style={{
                    borderRadius: 6,
                    padding: "14px 12px",
                    cursor: b.id === "mine" ? "pointer" : "default",
                    border:
                      b.id === "mine"
                        ? "2px solid var(--gold)"
                        : "1px solid var(--parchment-border)",
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{b.icon}</div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: "var(--text-dark)",
                      marginBottom: 3,
                    }}
                  >
                    {b.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-medium)" }}>
                    {b.desc}
                  </div>
                  {b.id === "mine" && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 10,
                        color: "var(--gold)",
                        fontWeight: 700,
                      }}
                    >
                      ⛏️ Добыча кристаллов
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Шахта */}
            <div
              className="game-panel-inner"
              style={{
                borderRadius: 6,
                padding: "16px 14px",
                marginTop: 14,
                border: "2px solid var(--gold)",
              }}
            >
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-dark)",
                  marginBottom: 8,
                }}
              >
                ⛏️ Шахта
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-medium)",
                  marginBottom: 12,
                  lineHeight: 1.6,
                }}
              >
                Спустись в шахту и ищи кристаллы. На добычу даётся 20 минут. Чем
                глубже — тем больше найдёшь.
              </p>

              {mineEnd !== null && Date.now() < mineEnd ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "12px",
                    background: "#faf0e0",
                    borderRadius: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text-dark)",
                      marginBottom: 4,
                    }}
                  >
                    ⛏️ Добываешь кристаллы... Глубина:{" "}
                    {mineDepth > 0 ? mineDepth * 10 : mineLocalDepth * 10}м
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: "var(--crimson)",
                      fontFamily: "monospace",
                    }}
                  >
                    {mineTimer !== null ? formatTimer(mineTimer) : "..."}
                  </div>
                </div>
              ) : mineEnd !== null && Date.now() >= mineEnd ? (
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#166534",
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    ✅ Добыча завершена!
                  </div>
                  <button
                    onClick={() => onClaimMine()}
                    style={{
                      padding: "10px 24px",
                      borderRadius: 4,
                      fontWeight: 700,
                      fontSize: 14,
                      background: "#7c3aed",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    💎 Забрать кристаллы
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-medium)",
                        marginBottom: 6,
                      }}
                    >
                      <span>Глубина спуска</span>
                      <span style={{ color: "var(--crimson)" }}>
                        ~{mineLocalDepth * 10}м · ~{mineLocalDepth + 1}-
                        {mineLocalDepth + 3} 💎
                      </span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={mineLocalDepth}
                      onChange={(e) =>
                        setMineLocalDepth(Number(e.target.value))
                      }
                      style={{ width: "100%", accentColor: "#7c3aed" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10,
                        color: "var(--text-medium)",
                        marginTop: 2,
                      }}
                    >
                      <span>10м</span>
                      <span>50м</span>
                      <span>100м</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onStartMine(mineLocalDepth)}
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: 4,
                      fontWeight: 700,
                      fontSize: 14,
                      background: "#7c3aed",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ⛏️ Спуститься в шахту
                  </button>
                </>
              )}
            </div>
          </div>
        );
      }

      case "menagerie": {
        return (
          <div className="animate-fade-in">
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "var(--crimson)",
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              🦁 Зверинец
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-medium)",
                marginBottom: 14,
                lineHeight: 1.6,
              }}
            >
              Приручи зверя — он будет сражаться вместе с тобой. Прокачка зверей
              дороже, чем у персонажа.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PET_TYPES.map((pet) => {
                const owned = pets.find((p) => p.id === pet.id);
                const lvl = owned?.level ?? 0;
                const upgradeCost = owned ? lvl * 80 : 100;
                const canAfford = silver >= upgradeCost;
                return (
                  <div
                    key={pet.id}
                    className="game-panel-inner"
                    style={{
                      borderRadius: 6,
                      padding: "14px",
                      border: `2px solid ${owned ? "var(--gold)" : "var(--parchment-border)"}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 44,
                          lineHeight: 1,
                          width: 56,
                          textAlign: "center",
                        }}
                      >
                        {pet.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 15,
                              color: "var(--text-dark)",
                            }}
                          >
                            {pet.name}
                          </span>
                          {owned ? (
                            <span
                              style={{
                                fontSize: 11,
                                padding: "2px 8px",
                                borderRadius: 10,
                                background: "#fff3cd",
                                color: "#856404",
                                fontWeight: 700,
                              }}
                            >
                              Ур. {lvl}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--text-medium)",
                              }}
                            >
                              Не приручён
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-medium)",
                            marginBottom: 8,
                          }}
                        >
                          {pet.desc}
                        </div>

                        {/* Параметры */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5,1fr)",
                            gap: 4,
                            marginBottom: 10,
                            fontSize: 11,
                            textAlign: "center",
                          }}
                        >
                          {(
                            Object.entries(pet.baseStats) as [string, number][]
                          ).map(([k, v]) => (
                            <div
                              key={k}
                              style={{
                                background: "#faf6e8",
                                borderRadius: 3,
                                padding: "3px 2px",
                              }}
                            >
                              <div style={{ color: "var(--text-medium)" }}>
                                {k === "attack"
                                  ? "⚔️"
                                  : k === "defense"
                                    ? "🛡️"
                                    : k === "magic"
                                      ? "🔮"
                                      : k === "speed"
                                        ? "🏃"
                                        : "❤️"}
                              </div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: "var(--text-dark)",
                                }}
                              >
                                {v + (owned ? (lvl - 1) * 2 : 0)}
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => onUpgradePet(pet.id)}
                          disabled={!canAfford}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 4,
                            fontWeight: 700,
                            fontSize: 12,
                            border: "none",
                            cursor: canAfford ? "pointer" : "not-allowed",
                            background: canAfford
                              ? owned
                                ? "var(--crimson)"
                                : "#4ade80"
                              : "#e5e7eb",
                            color: canAfford ? "var(--parchment)" : "#9ca3af",
                          }}
                        >
                          {owned
                            ? `⬆️ Прокачать (${upgradeCost}🪙)`
                            : `🐾 Приручить (100🪙)`}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case "top":
        return (
          <div className="animate-fade-in">
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "var(--crimson)",
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              🏆 Лучшие герои
            </h2>
            <div
              className="game-panel-inner"
              style={{ borderRadius: 4, overflow: "hidden" }}
            >
              <table
                style={{
                  width: "100%",
                  fontSize: 13,
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "var(--crimson)",
                      color: "var(--parchment)",
                    }}
                  >
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>
                      #
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>
                      Герой
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>
                      Ур.
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>
                      Сила
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_HEROES.map((h, i) => (
                    <tr
                      key={h.rank}
                      style={{
                        background: i % 2 === 0 ? "#fffbeb" : "#fff",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <td
                        style={{
                          padding: "8px 12px",
                          fontWeight: 700,
                          color:
                            h.rank <= 3 ? "var(--gold)" : "var(--text-medium)",
                        }}
                      >
                        {h.rank === 1
                          ? "🥇"
                          : h.rank === 2
                            ? "🥈"
                            : h.rank === 3
                              ? "🥉"
                              : h.rank}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "var(--text-dark)",
                            cursor: "pointer",
                            textDecoration: "underline dotted",
                          }}
                          onClick={() => onViewProfile(h.name, h.level)}
                        >
                          {h.name}
                        </div>
                        <div
                          style={{ fontSize: 11, color: "var(--text-medium)" }}
                        >
                          {h.guild}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          textAlign: "center",
                          fontWeight: 600,
                          color: "var(--crimson)",
                        }}
                      >
                        {h.level}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "var(--gold)",
                        }}
                      >
                        {h.power.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {TOP_HEROES.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: "24px",
                          textAlign: "center",
                          color: "var(--text-medium)",
                          fontSize: 13,
                        }}
                      >
                        Список скоро появится...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "profile":
        return (
          <div
            className="animate-fade-in"
            style={{ textAlign: "center", padding: "24px 0" }}
          >
            <div style={{ fontSize: 52, marginBottom: 12 }}>🗡️</div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "var(--crimson)",
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              {profileView?.name ?? "Герой"}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-medium)" }}>
              Уровень {profileView?.level ?? 1}
            </p>
          </div>
        );

      default: {
        const section = SECTIONS.find((s) => s.id === activeSection);
        return (
          <div
            className="animate-fade-in"
            style={{ textAlign: "center", padding: "32px 0" }}
          >
            <div style={{ fontSize: 52, marginBottom: 16 }}>
              {section?.icon}
            </div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "var(--crimson)",
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {section?.label}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-medium)" }}>
              Раздел в разработке
            </p>
          </div>
        );
      }
    }
  };

  return (
    <div className="game-panel" style={{ marginTop: 0 }}>
      <div style={{ padding: "14px 16px", background: "#faf6e8" }}>
        <button
          onClick={() => onOpenSection("main")}
          style={{
            fontSize: 12,
            color: "var(--crimson)",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon name="ChevronLeft" size={13} />
          На главную
        </button>
        {renderContent()}
      </div>

      <div
        className="bottom-nav"
        style={{
          padding: "8px 16px",
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 16px",
        }}
      >
        <a onClick={() => onOpenSection("main")}>🏠 Главная</a>
        <a onClick={() => onOpenSection("hero")}>🧙 Герой</a>
        <a>💬 Чат</a>
        <a>📬 Почта</a>
      </div>
    </div>
  );
}