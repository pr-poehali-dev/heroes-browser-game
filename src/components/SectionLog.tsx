import DuelSection, { type DuelReward } from "@/components/DuelSection";
import { DiaryEntry, HeroStats, SectionId } from "@/pages/Index";

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

const TOP_HEROES: {
  rank: number;
  name: string;
  level: number;
  guild: string;
  power: number;
}[] = [];

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

interface SectionLogProps {
  activeSection: SectionId;
  hero: {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    gold: number;
    gems: number;
  };
  stats: HeroStats;
  currentHp: number;
  maxHp: number;
  glory: number;
  battles: number;
  regenTimer: number | null;
  diary: DiaryEntry[];
  questProgress: Record<number, number>;
  questClaimed: Record<number, boolean>;
  totalSilverEarned: number;
  duelDifficulty: "higher" | "equal" | "lower";
  avatarId: string;
  avatarImageUrl?: string;
  onSpendBattle: () => boolean;
  onDuelEnd: (
    result: "victory" | "defeat",
    enemyName: string,
    reward: DuelReward,
  ) => void;
  onClaimQuest: (quest: QuestDef) => void;
  onDifficultyChange: (d: "higher" | "equal" | "lower") => void;
  onViewProfile: (name: string, level: number) => void;
}

export default function SectionLog({
  activeSection,
  hero,
  stats,
  currentHp,
  maxHp,
  glory,
  battles,
  regenTimer,
  diary,
  questProgress,
  questClaimed,
  totalSilverEarned,
  duelDifficulty,
  avatarId,
  avatarImageUrl,
  onSpendBattle,
  onDuelEnd,
  onClaimQuest,
  onDifficultyChange,
  onViewProfile,
}: SectionLogProps) {
  const getQuestProgress = (quest: QuestDef): number => {
    if (quest.type === "silver_earn") return totalSilverEarned;
    if (quest.type === "glory_earn") return glory;
    return questProgress[quest.id] || 0;
  };

  const heroForDuel = {
    ...hero,
    maxHp,
    hp: currentHp,
  };

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
          avatarId={avatarId}
          avatarImageUrl={avatarImageUrl}
          userId={
            typeof window !== "undefined"
              ? localStorage.getItem("heroes_user_id") || ""
              : ""
          }
          key="duel"
        />
      );

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
}
