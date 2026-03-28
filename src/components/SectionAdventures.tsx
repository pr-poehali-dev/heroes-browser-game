import { useState } from "react";
import { SectionId } from "@/pages/Index";

const CAMPAIGN_PRESETS = [
  { minutes: 10, label: "10 мин", silverMin: 5, silverMax: 15 },
  { minutes: 30, label: "30 мин", silverMin: 15, silverMax: 40 },
  { minutes: 60, label: "1 час", silverMin: 35, silverMax: 80 },
  { minutes: 120, label: "2 часа", silverMin: 75, silverMax: 160 },
  { minutes: 240, label: "4 часа", silverMin: 160, silverMax: 350 },
  { minutes: 480, label: "8 часов", silverMin: 350, silverMax: 700 },
];
const MAX_CAMPAIGN_MINUTES_DAY = 480;

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

interface SectionAdventuresProps {
  activeSection: "campaign" | "dungeon" | "village" | "menagerie" | "mercenaries";
  silver: number;
  campaignEnd: number | null;
  campaignTimer: number | null;
  campaignUsedMinutesToday: number;
  pets: { id: string; level: number }[];
  mineEnd: number | null;
  mineDepth: number;
  mineTimer: number | null;
  onOpenSection: (id: SectionId) => void;
  onStartCampaign: (minutes: number) => void;
  onUpgradePet: (petId: string) => void;
  onStartMine: (depth: number) => void;
  onClaimMine: () => number;
}

export default function SectionAdventures({
  activeSection,
  silver,
  campaignEnd,
  campaignTimer,
  campaignUsedMinutesToday,
  pets,
  mineEnd,
  mineDepth,
  mineTimer,
  onOpenSection,
  onStartCampaign,
  onUpgradePet,
  onStartMine,
  onClaimMine,
}: SectionAdventuresProps) {
  const [campaignSlider, setCampaignSlider] = useState(0);
  const [mineLocalDepth, setMineLocalDepth] = useState(1);

  const selectedPreset = CAMPAIGN_PRESETS[campaignSlider];
  const remainCampaignMinutes =
    MAX_CAMPAIGN_MINUTES_DAY - campaignUsedMinutesToday;

  switch (activeSection) {
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

    case "mercenaries": {
      const MERCENARY_TYPES = [
        {
          id: "scout",
          name: "Лазутчик",
          icon: "🗡️",
          desc: "Быстрый и незаметный боец. Отличный разведчик.",
          cost: 200,
          bonus: "Разведка +15%",
        },
        {
          id: "knight",
          name: "Рыцарь",
          icon: "🛡️",
          desc: "Тяжёлый воин с высокой защитой.",
          cost: 400,
          bonus: "Защита +20%",
        },
        {
          id: "archer",
          name: "Лучник",
          icon: "🏹",
          desc: "Дальнобойный боец, атакует из укрытия.",
          cost: 300,
          bonus: "Атака +15%",
        },
        {
          id: "mage",
          name: "Маг",
          icon: "🔮",
          desc: "Владеет тайными силами. Мощные заклинания.",
          cost: 500,
          bonus: "Магия +25%",
        },
      ];
      return (
        <div className="animate-fade-in">
          <div
            style={{
              textAlign: "center",
              borderBottom: "1px solid var(--parchment-border)",
              paddingBottom: 8,
              marginBottom: 12,
            }}
          >
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-dark)",
              }}
            >
              Наёмники
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-medium)" }}>
              Нанимай бойцов для походов и битв
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {MERCENARY_TYPES.map((m, i) => {
              const canAfford = silver >= m.cost;
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "14px 12px",
                    borderBottom:
                      i < MERCENARY_TYPES.length - 1
                        ? "1px solid #e2d9bc"
                        : "none",
                    background: "#faf6e8",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 8,
                      background: "#f0e8d0",
                      border: "1px solid #d0c090",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      flexShrink: 0,
                    }}
                  >
                    {m.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#2c1a0a",
                        marginBottom: 2,
                      }}
                    >
                      {m.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#7a5c3a",
                        marginBottom: 4,
                        lineHeight: 1.4,
                      }}
                    >
                      {m.desc}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#8b6914",
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      +{m.bonus}
                    </div>
                    <button
                      disabled={!canAfford}
                      style={{
                        padding: "5px 18px",
                        borderRadius: 20,
                        fontWeight: 700,
                        fontSize: 13,
                        border: "2px solid #8b1a1a",
                        background: canAfford
                          ? "linear-gradient(180deg,#c0392b,#8b1a1a)"
                          : "#ccc",
                        color: canAfford ? "#fff" : "#999",
                        cursor: canAfford ? "pointer" : "not-allowed",
                        boxShadow: canAfford
                          ? "0 2px 4px rgba(0,0,0,0.3)"
                          : "none",
                      }}
                    >
                      Нанять ({m.cost} 🪙)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}