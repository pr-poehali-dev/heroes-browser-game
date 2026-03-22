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
  return `${m}:${s.toString().padStart(2, "0")}`;
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
}

export default function GameHeader({
  hero, currentHp, maxHp, silver, battles, regenTimer, campaignTimer,
  isCampaignActive, campaignNotice, onOpenSection, saveStatus = "idle", onLogout, avatarId = "m1",
}: GameHeaderProps) {
  return (
    <header className="game-header">
      <div style={{ textAlign: "center", padding: "8px 0", borderBottom: "1px solid rgba(200,150,60,0.4)" }}>
        {campaignNotice && (
          <div style={{ fontSize: 12, color: "#15803d", fontWeight: 600, marginBottom: 4, background: "#f0fdf4", padding: "4px 8px", borderRadius: 3 }}>
            {campaignNotice}
          </div>
        )}
        {saveStatus !== "idle" && (
          <div style={{ fontSize: 10, color: saveStatus === "saved" ? "#15803d" : "#b45309", marginBottom: 2 }}>
            {saveStatus === "saving" ? "💾 сохранение..." : "✓ сохранено"}
          </div>
        )}
        <h1 className="game-title text-[1.38rem] font-thin" style={{ fontSize: 22, letterSpacing: "0.3em" }}>⚔В И К И Н Г И⚔</h1>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px", justifyContent: "center" }}>
        {/* Аватарка + имя — кликабельна */}
        <div className="stat-badge" onClick={() => onOpenSection("hero")} style={{ cursor: "pointer", gap: 5 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{getAvatarEmoji(avatarId)}</span>
          <span style={{ fontWeight: 600 }}>{hero.name}</span>
        </div>
        <div className="stat-badge">
          <span>⭐</span>
          <span>{hero.level} ур.</span>
        </div>
        <div className="stat-badge" title={`${currentHp}/${maxHp} HP`}>
          <span>❤️</span>
          <span>{currentHp}/{maxHp}</span>
        </div>
        <div className="stat-badge">
          <span style={{ fontSize: 12 }}>🥈</span>
          <span>{silver}</span>
        </div>
        <div className="stat-badge">
          <span style={{ fontSize: 12 }}></span>
          <span>{hero.gold}</span>
        </div>
        <div className="stat-badge">
          <span>💎</span>
          <span>{hero.gems}</span>
        </div>
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
        {onLogout && (
          <div className="stat-badge" onClick={onLogout} style={{ cursor: "pointer", opacity: 0.7 }} title="Выйти">
            <span style={{ fontSize: 12 }}>🚪</span>
            <span style={{ fontSize: 11 }}>Выйти</span>
          </div>
        )}
      </div>
    </header>
  );
}