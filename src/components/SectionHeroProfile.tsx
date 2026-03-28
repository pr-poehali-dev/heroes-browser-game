import { useState, useRef } from "react";
import { HeroStats, SectionId } from "@/pages/Index";
import {
  MALE_AVATARS,
  FEMALE_AVATARS,
  getAvatarEmoji,
} from "@/components/SectionPage";

const STAT_COST_COEFFS: Record<keyof HeroStats, { a: number; n: number }> = {
  strength: { a: 0.000344, n: 4.856 },
  defense: { a: 0.000631, n: 4.378 },
  agility: { a: 0.000588, n: 4.419 },
  mastery: { a: 0.00016, n: 5.283 },
  vitality: { a: 0.000419, n: 4.705 },
};
const STAT_COST = (key: keyof HeroStats, level: number): number => {
  const c = STAT_COST_COEFFS[key];
  return Math.max(1, Math.round(c.a * Math.pow(level, c.n)));
};

const STAT_DETAILS = [
  {
    key: "strength" as const,
    label: "Сила",
    icon: "👊",
    iconBg: "#f0e0d0",
    desc: "Определяет урон наносимый противнику",
    barColor: "#c0392b",
  },
  {
    key: "defense" as const,
    label: "Защита",
    icon: "🛡️",
    iconBg: "#d0e8f0",
    desc: "Определяет какой урон ты можешь заблокировать",
    barColor: "#2980b9",
  },
  {
    key: "agility" as const,
    label: "Ловкость",
    icon: "🌀",
    iconBg: "#d0f0e0",
    desc: "Определяет вероятность уворота от удара",
    barColor: "#27ae60",
  },
  {
    key: "mastery" as const,
    label: "Мастерство",
    icon: "🤚",
    iconBg: "#fff0d0",
    desc: "Определяет вероятность нанести критический удар",
    barColor: "#e67e22",
  },
  {
    key: "vitality" as const,
    label: "Живучесть",
    icon: "🌿",
    iconBg: "#d8f0d0",
    desc: "Определяет макс. количество здоровья и скорость его восстановления",
    barColor: "#16a34a",
  },
];

interface SectionHeroProfileProps {
  activeSection: "hero" | "profile" | "training" | "params";
  hero: {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    gold: number;
    gems: number;
  };
  silver: number;
  stats: HeroStats;
  currentHp: number;
  maxHp: number;
  profileView: { name: string; level: number } | null;
  avatarId: string;
  avatarImageUrl?: string;
  onOpenSection: (id: SectionId) => void;
  onUpgradeStat: (key: keyof HeroStats) => void;
  onViewProfile: (name: string, level: number) => void;
  onChangeAvatar: (id: string) => void;
  onChangeAvatarImage?: (url: string) => void;
}

export default function SectionHeroProfile({
  activeSection,
  hero,
  silver,
  stats,
  currentHp,
  maxHp,
  profileView,
  avatarId,
  avatarImageUrl,
  onOpenSection,
  onUpgradeStat,
  onChangeAvatar,
  onChangeAvatarImage,
}: SectionHeroProfileProps) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const HERO_SAVE_URL =
    "https://functions.poehali.dev/a540a07e-c67f-47e9-bb14-59ba436a93d8";

  switch (activeSection) {
    case "training": {
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
              Тренировка
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-medium)" }}>
              🪙 {silver} серебра
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STAT_DETAILS.map((s, i) => {
              const level = stats[s.key];
              const cost = STAT_COST(s.key, level);
              const canAfford = silver >= cost;
              const barPct = Math.min(100, (level / 50) * 100);
              return (
                <div
                  key={s.key}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "14px 12px",
                    borderBottom:
                      i < STAT_DETAILS.length - 1
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
                      background: s.iconBg,
                      border: "1px solid #d0c090",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      flexShrink: 0,
                    }}
                  >
                    {s.icon}
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
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#7a5c3a",
                        marginBottom: 6,
                        lineHeight: 1.4,
                      }}
                    >
                      {s.desc}
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: "#d0c090",
                        borderRadius: 3,
                        overflow: "hidden",
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${barPct}%`,
                          background: s.barColor,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#5a3a1a",
                        marginBottom: 8,
                      }}
                    >
                      Уровень: {level}&nbsp;&nbsp;·&nbsp;&nbsp;Цена улучшения:{" "}
                      {cost} серебра
                    </div>
                    <button
                      onClick={() => onUpgradeStat(s.key)}
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
                      Улучшить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case "params": {
      return (
        <div className="animate-fade-in">
          <div style={{ textAlign: "center", borderBottom: "1px solid var(--parchment-border)", paddingBottom: 8, marginBottom: 0 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "var(--text-dark)", marginBottom: 2 }}>
              Параметры
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-medium)" }}>Твои характеристики</p>
          </div>

          <div style={{ textAlign: "center", padding: "14px 0 10px" }}>
            <div style={{ width: 96, height: 96, borderRadius: 8, border: "2px solid var(--parchment-border)", background: "#2a1010", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 40, overflow: "hidden" }}>
              {avatarImageUrl
                ? <img src={avatarImageUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span>{getAvatarEmoji(avatarId)}</span>
              }
            </div>
            <div style={{ marginTop: 6, fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>{hero.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-medium)" }}>Уровень {hero.level} · ❤️ {currentHp}/{maxHp}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STAT_DETAILS.map((s, i) => {
              const level = stats[s.key];
              const barPct = Math.min(100, (level / 50) * 100);
              return (
                <div key={s.key} style={{ display: "flex", gap: 14, padding: "14px 12px", borderBottom: i < STAT_DETAILS.length - 1 ? "1px solid #e2d9bc" : "none", background: "#faf6e8", alignItems: "flex-start" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 8, background: s.iconBg, border: "1px solid #d0c090", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#2c1a0a", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "#7a5c3a", marginBottom: 6, lineHeight: 1.4 }}>{s.desc}</div>
                    <div style={{ height: 6, background: "#d0c090", borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
                      <div style={{ height: "100%", width: `${barPct}%`, background: s.barColor, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 12, color: "#5a3a1a" }}>Уровень: {level}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case "hero": {
      const HERO_ITEMS = [
        { label: "Анкета", icon: "📋", action: "" },
        { label: "Параметры", icon: "📊", action: "params" },
        {
          label: "Тренироваться",
          icon: "💪",
          action: "training",
          highlight: true,
        },
        { label: "Экипировка", icon: "🗡️", action: "" },
        { label: "Ресурсы", icon: "💰", action: "" },
        { label: "Карма", icon: "☯️", action: "" },
        { label: "Надписи", icon: "🏷️", action: "" },
        { label: "Преобразиться", icon: "✨", action: "avatar_change" },
        { label: "Изменить имя", icon: "📝", action: "" },
        { label: "Пригласить", icon: "📨", action: "" },
      ];

      return (
        <div className="animate-fade-in">
          <div
            style={{
              textAlign: "center",
              borderBottom: "1px solid var(--parchment-border)",
              paddingBottom: 8,
              marginBottom: 0,
            }}
          >
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-dark)",
                marginBottom: 2,
              }}
            ></h2>
            <p style={{ fontSize: 12, color: "var(--text-medium)" }}>
              Будь внимателен к себе!
            </p>
          </div>

          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div
              style={{
                position: "relative",
                display: "inline-block",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
              title="Нажми чтобы загрузить фото"
            >
              <div
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 8,
                  border: "3px solid var(--parchment-border)",
                  background: "#2a1010",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 54,
                  margin: "0 auto",
                  overflow: "hidden",
                }}
              >
                {avatarImageUrl ? (
                  <img
                    src={avatarImageUrl}
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span>{getAvatarEmoji(avatarId)}</span>
                )}
              </div>
              {uploadingAvatar && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  ⏳
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--crimson)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  border: "2px solid var(--parchment)",
                }}
              >
                📷
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingAvatar(true);
                const reader = new FileReader();
                reader.onload = async (ev) => {
                  const base64 = (ev.target?.result as string).split(",")[1];
                  const uid = localStorage.getItem("heroes_user_id") ?? "";
                  const res = await fetch(HERO_SAVE_URL, {
                    method: "POST",
                    headers: {
                      "X-User-Id": uid,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      avatar_image: { data: base64, mime: file.type },
                    }),
                  });
                  const data = await res.json();
                  if (data.avatar_image_url) {
                    onChangeAvatarImage?.(data.avatar_image_url);
                  }
                  setUploadingAvatar(false);
                };
                reader.readAsDataURL(file);
              }}
            />
          </div>

          <div style={{ background: "#faf6e8" }}>
            {HERO_ITEMS.map((item, i) => (
              <div
                key={item.label}
                onClick={() => {
                  if (item.action === "training")
                    onOpenSection("training" as SectionId);
                  else if (item.action === "params")
                    onOpenSection("params" as SectionId);
                  else if (item.action === "avatar_change")
                    setShowAvatarPicker(true);
                  else if (item.action === "profile_view")
                    onOpenSection("profile" as SectionId);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 16px",
                  borderBottom:
                    i < HERO_ITEMS.length - 1 ? "1px solid #e2d9bc" : "none",
                  background: item.highlight ? "#f5e8c8" : "#faf6e8",
                  cursor: item.action ? "pointer" : "default",
                  fontWeight: item.highlight ? 700 : 500,
                }}
              >
                <span
                  style={{ fontSize: 17, width: 22, textAlign: "center" }}
                >
                  {item.icon}
                </span>
                <span style={{ fontSize: 15, color: "var(--text-dark)" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {showAvatarPicker && (
            <div
              className="game-panel-inner"
              style={{
                borderRadius: 6,
                padding: "12px 14px",
                marginTop: 10,
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
        </div>
      );
    }

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

    default:
      return null;
  }
}
