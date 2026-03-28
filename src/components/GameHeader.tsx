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

interface OrcRaid {
  ends_at: string;
  current_orc_hp: number;
  total_orc_hp: number;
}

interface GameHeaderProps {
  hero: { name: string; level: number; gold: number; gems: number };
  currentHp: number;
  maxHp: number;
  silver: number;
  battles: number;
  regenTimer: number | null;
  regenQueue?: number[];
  campaignTimer: number | null;
  isCampaignActive: boolean;
  campaignNotice: string | null;
  onOpenSection: (id: SectionId) => void;
  saveStatus?: "idle" | "saving" | "saved";
  onLogout?: () => void;
  avatarId?: string;
  avatarImageUrl?: string;
  activeRaid?: OrcRaid | null;
}

function formatRaidTimer(endsAt: string): string {
  const left = new Date(endsAt).getTime() - Date.now();
  if (left <= 0) return "00:00";
  const total = Math.ceil(left / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}ч ${m.toString().padStart(2, "0")}мин`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function GameHeader({
  hero, currentHp, maxHp, silver, battles, regenTimer, regenQueue = [], campaignTimer,
  isCampaignActive, campaignNotice, onOpenSection, saveStatus = "idle", onLogout,
  avatarId = "m1", avatarImageUrl = "", activeRaid,
}: GameHeaderProps) {
  const sep = <span style={{ color: "rgba(255,220,100,0.4)", margin: "0 1px" }}></span>;

  return (
    <header className="game-header">
      {/* Баннер нападения орков — над шапкой */}
      {activeRaid && new Date(activeRaid.ends_at).getTime() > Date.now() && (
        <div
          style={{
            background: "linear-gradient(90deg, #7f1d1d 0%, #b91c1c 50%, #7f1d1d 100%)",
            color: "#fef2f2",
            textAlign: "center",
            padding: "5px 12px",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.05em",
            borderBottom: "2px solid #fca5a5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
          }}
          onClick={() => onOpenSection("orcs")}
        >
          <span style={{ fontSize: 16 }}>👹</span>
          <span>ОРДЫ ОРКОВ НАПАЛИ НА ПОСЕЛОК!</span>
          <span style={{ color: "#fca5a5", fontSize: 12 }}>
            ⏱ {formatRaidTimer(activeRaid.ends_at)}
          </span>
          <span style={{ color: "#fca5a5", fontSize: 12 }}>
            ❤️ {activeRaid.current_orc_hp}/{activeRaid.total_orc_hp}
          </span>
        </div>
      )}

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
              : <span style={{ fontSize: 14 }}>{getAvatarEmoji(avatarId)}</span>
            }
          </span>
          <span style={{ color: "#ffe89a" }}>{hero.name}</span>
        </span>

        {sep}

        {/* Уровень */}
        <span style={{ margin: "0 4px" }}>🎓 {hero.level}</span>

        {sep}

        {/* HP — единое число */}
        <span style={{ margin: "0 4px" }}>❤️ {currentHp}</span>

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

        {/* Бои + таймер — кликабельно, ведёт в дуэль */}
        <span
          onClick={() => onOpenSection("duel")}
          style={{ margin: "0 4px", display: "inline-flex", alignItems: "center", gap: 3, cursor: "pointer", borderBottom: "1px dashed rgba(255,220,100,0.5)" }}
          title="Перейти в Дуэль"
        >
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
