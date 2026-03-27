import { SectionId } from "@/pages/Index";
import { getAvatarEmoji } from "@/components/SectionPage";

const MAX_BATTLES = 6;

function formatTimerShort(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTimer(ms: number) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface GameHeaderProps {
  hero: { name: string; level: number; gold: number; gems: number };
  currentHp: number;
  maxHp: number;
  silver: number;
  battles: number;
  regenTimer: number | null;
  campaignTimer: number | null;
  isCampaignActive: boolean;
  campaignNotice: string | null;
  onOpenSection: (id: SectionId) => void;
  saveStatus?: "idle" | "saving" | "saved";
  onLogout?: () => void;
  avatarId?: string;
  avatarImageUrl?: string;
}

export default function GameHeader({
  hero, currentHp, maxHp, silver, battles, regenTimer, campaignTimer,
  isCampaignActive, campaignNotice, onOpenSection, saveStatus = "idle", onLogout, avatarId = "m1", avatarImageUrl = "",
}: GameHeaderProps) {
  const sep = <span style={{ color: "rgba(255,220,100,0.4)", margin: "0 1px" }}></span>;

  return (
    <header className="game-header">
      {/* Название */}
      <div style={{ textAlign: "center", padding: "6px 0 4px", borderBottom: "1px solid rgba(200,150,60,0.4)" }}>
        {campaignNotice && (
          <div style={{ fontSize: 11, color: "#15803d", fontWeight: 600, marginBottom: 2, background: "#f0fdf4", padding: "2px 8px", borderRadius: 3 }}>
            {campaignNotice}
          </div>
        )}
        {saveStatus !== "idle" && (
          <div style={{ fontSize: 10, color: saveStatus === "saved" ? "#15803d" : "#b45309", marginBottom: 1 }}>
            {saveStatus === "saving" ? "💾 сохранение..." : "✓ сохранено"}
          </div>
        )}
        <h1 className="game-title" style={{ fontSize: 20, letterSpacing: "0.3em", margin: 0 }}>⚚Варвары⚚</h1>
      </div>

      {/* Одна строка со всеми параметрами */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0,
          padding: "5px 10px",
          fontSize: 13,
          fontWeight: 600,
          color: "#f5e8b0",
          lineHeight: 1.2,
          rowGap: 3,
          justifyContent: "center",
        }}
      >
        {/* Аватарка + имя */}
        <span
          onClick={() => onOpenSection("hero")}
          style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, marginRight: 4 }}
        >
          <span style={{ width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 3, flexShrink: 0 }}>
            {avatarImageUrl
              ? <img src={avatarImageUrl} alt="avatar" style={{ width: 18, height: 18, objectFit: "cover", borderRadius: 2 }} />
              : <span style={{ fontSize: 14 }}>🎓</span>
            }
          </span>
          <span style={{ color: "#ffe89a" }}>{hero.name}</span>
        </span>

        {sep}

        {/* Уровень */}
        <span style={{ margin: "0 4px" }}>🎓 {hero.level}</span>

        {sep}

        {/* HP */}
        <span style={{ margin: "0 4px" }}>❤️ {currentHp}/{maxHp}</span>

        {sep}

        {/* Серебро */}
        <span style={{ margin: "0 4px" }}>🥈 {silver}</span>

        {sep}

        {/* Золото */}
        <span style={{ margin: "0 4px" }}>🪙 {hero.gold}</span>

        {sep}

        {/* Кристаллы */}
        <span style={{ margin: "0 4px" }}>💎 {hero.gems}</span>

        {sep}

        {/* Бои + таймер */}
        <span style={{ margin: "0 4px", display: "inline-flex", alignItems: "center", gap: 3 }}>
          ⚔️ {battles}/{MAX_BATTLES}
          {regenTimer !== null && battles < MAX_BATTLES && (
            <span style={{ fontSize: 11, color: "#f0d080" }}>+{formatTimerShort(regenTimer)}</span>
          )}
        </span>

        {/* Поход */}
        {isCampaignActive && campaignTimer !== null && (
          <>
            {sep}
            <span style={{ margin: "0 4px" }}>🗺️ {formatTimer(campaignTimer)}</span>
          </>
        )}

        {/* Выйти */}
        {onLogout && (
          <>
            {sep}
            <span onClick={onLogout} style={{ cursor: "pointer", margin: "0 4px", opacity: 0.7, fontSize: 12 }} title="Выйти">
              🚪
            </span>
          </>
        )}
      </div>
    </header>
  );
}