/**
 * MainPage.tsx — Главное меню игры (стиль списка как в оригинале)
 */
import { SectionId } from "@/pages/Index";

const BANNER_URL =
  "https://cdn.poehali.dev/projects/e03d01dd-c207-488c-aa14-9e40184b6c24/files/840de9ee-8516-4aab-88ca-92499cb030ec.jpg";

const SECTIONS = [
  { id: "diary",     label: "Дневник",          icon: "⭐" },
  { id: "training",  label: "Тренировочный лагерь", icon: "🏋️" },
  { id: "duel",      label: "Дуэль",             icon: "⚔️" },
  { id: "campaign",  label: "Путешествие",        icon: "🌍" },
  { id: "village",   label: "Поселок",            icon: "🏘️" },
  { id: "march",     label: "Поход",              icon: "🏕️" },
  { id: "dungeon",   label: "Подземелье",          icon: "🗡️" },
  { id: "dragon",    label: "Дракон",             icon: "🐉" },
  { id: "orcs",      label: "Орки",               icon: "👹" },
  { id: "order",     label: "Орден",              icon: "🛡️" },
  { id: "guild",     label: "Дружина",            icon: "👥" },
  { id: "menagerie", label: "Зверинец",           icon: "🐾" },
  { id: "top",       label: "Лучшие",             icon: "🏆" },
  { id: "invite",    label: "Пригласить",          icon: "📨" },
];

const BOTTOM_NAV = [
  { id: "main", label: "Главная", icon: "🏠" },
  { id: "hero", label: "Герой",   icon: "🧙" },
];

interface MainPageProps {
  hero: { name: string; level: number };
  isCampaignActive: boolean;
  onOpenSection: (id: SectionId) => void;
}

export default function MainPage({ hero, isCampaignActive, onOpenSection }: MainPageProps) {
  return (
    <div style={{ background: "var(--parchment)", minHeight: "100vh" }}>
      {/* Баннер */}
      <div style={{ height: 130, background: "#1a0a0a", overflow: "hidden", position: "relative" }}>
        <img
          src={BANNER_URL}
          alt="Баннер"
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(245,240,224,0.85) 100%)" }} />
      </div>

      {/* Приветствие */}
      <div style={{ textAlign: "center", padding: "10px 16px 6px", borderBottom: "2px solid #c8a96e", background: "linear-gradient(180deg,#fffef5 0%,#faf4dc 100%)" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "var(--text-dark)" }}>
          Добро пожаловать!
        </h2>
      </div>

      {/* Список разделов */}
      <div style={{ background: "#faf6e8" }}>
        {SECTIONS.map((s, i) => {
          const blocked = isCampaignActive && s.id === "duel";
          const isLast = i === SECTIONS.length - 1;
          return (
            <div
              key={s.id}
              onClick={() => !blocked && onOpenSection(s.id as SectionId)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 16px",
                borderBottom: isLast ? "none" : "1px solid #e2d9bc",
                background: blocked ? "#f0ead4" : "#faf6e8",
                cursor: blocked ? "not-allowed" : "pointer",
                opacity: blocked ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{s.icon}</span>
              <span style={{ fontSize: 15, color: "var(--text-dark)", fontWeight: 500 }}>{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Нижняя навигация */}
      <div style={{ borderTop: "2px solid #c8a96e", background: "linear-gradient(180deg,#faf4dc 0%,#f5ecc8 100%)" }}>
        {BOTTOM_NAV.map((n, i) => (
          <div
            key={n.id}
            onClick={() => onOpenSection(n.id as SectionId)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 16px",
              borderBottom: i < BOTTOM_NAV.length - 1 ? "1px solid #e2d9bc" : "none",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{n.icon}</span>
            <span style={{ fontSize: 15, color: "var(--text-dark)", fontWeight: 600 }}>{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
