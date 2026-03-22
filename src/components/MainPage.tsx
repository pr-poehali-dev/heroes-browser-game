import { SectionId } from "@/pages/Index";

const BANNER_URL =
  "https://cdn.poehali.dev/projects/e03d01dd-c207-488c-aa14-9e40184b6c24/files/840de9ee-8516-4aab-88ca-92499cb030ec.jpg";

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

interface MainPageProps {
  hero: { name: string; level: number };
  isCampaignActive: boolean;
  onOpenSection: (id: SectionId) => void;
}

export default function MainPage({
  hero,
  isCampaignActive,
  onOpenSection,
}: MainPageProps) {
  return (
    <>
      <div
        style={{
          height: 140,
          background: "#1a0a0a",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <img
          src={BANNER_URL}
          alt="Герои"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, transparent 40%, rgba(245,240,224,0.85) 100%)",
          }}
        />
      </div>

      <div className="game-panel">
        <div
          className="animate-fade-in"
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--parchment-border)",
            background: "linear-gradient(180deg, #fffef5 0%, #faf4dc 100%)",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 6,
              color: "var(--text-dark)",
            }}
          >
            Добро пожаловать!
          </h2>
          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "var(--text-medium)",
              lineHeight: 1.6,
            }}
          >
            Герой <strong>{hero.name}</strong>, уровень{" "}
            <strong>{hero.level}</strong>.
          </p>
        </div>

        <div style={{ padding: "12px 16px", background: "#faf6e8" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {SECTIONS.map((s) => {
              const blocked =
                isCampaignActive &&
                s.id !== "campaign" &&
                s.id !== "diary";
              return (
                <button
                  key={s.id}
                  onClick={() =>
                    !blocked && onOpenSection(s.id as SectionId)
                  }
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 4px",
                    borderRadius: 6,
                    background: blocked ? "#e8e0c8" : "#faf6e8",
                    border: "1px solid var(--parchment-border)",
                    cursor: blocked ? "not-allowed" : "pointer",
                    opacity: blocked ? 0.5 : 1,
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 24 }}>{s.icon}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-dark)",
                    }}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
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
    </>
  );
}
