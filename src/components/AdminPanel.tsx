import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const ADMIN_URL = "https://functions.poehali.dev/67ad34f4-2637-4cec-9dc8-6d7176a5d83f";

interface Player {
  user_id: string;
  username: string;
  name: string;
  level: number;
  xp: number;
  hp: number;
  max_hp: number;
  gold: number;
  silver: number;
  gems: number;
  glory: number;
  attack: number;
  defense: number;
  magic: number;
  speed: number;
  stat_strength: number;
  stat_defense: number;
  stat_agility: number;
  stat_mastery: number;
  stat_vitality: number;
  battles: number;
  total_silver_earned: number;
  updated_at: string;
}

const FIELDS: { key: keyof Player; label: string; group: string }[] = [
  { key: "name", label: "Имя", group: "Основное" },
  { key: "level", label: "Уровень", group: "Основное" },
  { key: "xp", label: "Опыт", group: "Основное" },
  { key: "hp", label: "HP", group: "Основное" },
  { key: "max_hp", label: "HP макс.", group: "Основное" },
  { key: "silver", label: "Серебро", group: "Ресурсы" },
  { key: "gold", label: "Золото", group: "Ресурсы" },
  { key: "gems", label: "Кристаллы 💎", group: "Ресурсы" },
  { key: "glory", label: "Слава ⭐", group: "Ресурсы" },
  { key: "total_silver_earned", label: "Серебра заработано", group: "Ресурсы" },
  { key: "battles", label: "Бои (заряды)", group: "Бой" },
  { key: "attack", label: "Атака", group: "Бой" },
  { key: "defense", label: "Защита", group: "Бой" },
  { key: "magic", label: "Магия", group: "Бой" },
  { key: "speed", label: "Скорость", group: "Бой" },
  { key: "stat_strength", label: "Сила 💪", group: "Статы" },
  { key: "stat_defense", label: "Защита 🛡️", group: "Статы" },
  { key: "stat_agility", label: "Ловкость 🏃", group: "Статы" },
  { key: "stat_mastery", label: "Мастерство ⚔️", group: "Статы" },
  { key: "stat_vitality", label: "Живучесть ❤️", group: "Статы" },
];

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(
    sessionStorage.getItem("admin_token")
  );
  const [authError, setAuthError] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Player | null>(null);
  const [editValues, setEditValues] = useState<Partial<Player>>({});
  const [saveMsg, setSaveMsg] = useState("");
  const [search, setSearch] = useState("");

  const fetchPlayers = async (tok: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_URL}?action=list`, {
        headers: { "X-Admin-Token": tok },
      });
      const data = await res.json();
      if (data.players) {
        setPlayers(data.players);
      } else {
        setToken(null);
        sessionStorage.removeItem("admin_token");
        setAuthError("Неверный пароль");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPlayers(token);
  }, [token]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    sessionStorage.setItem("admin_token", password);
    setToken(password);
  };

  const handleSelect = (p: Player) => {
    setSelected(p);
    setEditValues({ ...p });
    setSaveMsg("");
  };

  const handleSave = async () => {
    if (!selected || !token) return;
    setSaveMsg("Сохраняю...");
    const res = await fetch(`${ADMIN_URL}?action=update`, {
      method: "POST",
      headers: { "X-Admin-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: selected.user_id, ...editValues }),
    });
    const data = await res.json();
    if (data.saved) {
      setSaveMsg("✓ Сохранено!");
      setPlayers((prev) =>
        prev.map((p) =>
          p.user_id === selected.user_id ? { ...p, ...editValues } : p
        )
      );
      setSelected({ ...selected, ...editValues } as Player);
    } else {
      setSaveMsg("Ошибка: " + (data.error || "неизвестно"));
    }
  };

  const filtered = players.filter(
    (p) =>
      !search ||
      (p.username || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // Auth screen
  if (!token) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div
          className="game-panel"
          style={{ width: 320, borderRadius: 8, padding: 24 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "var(--crimson)" }}>
              🔐 Панель администратора
            </h2>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>×</button>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введи пароль..."
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 4,
                border: "1px solid var(--parchment-border)",
                background: "#fffef5",
                fontSize: 14,
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />
            {authError && (
              <div style={{ color: "#b91c1c", fontSize: 12, marginBottom: 8 }}>{authError}</div>
            )}
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "10px 0",
                background: "var(--crimson)",
                color: "var(--parchment)",
                border: "none",
                borderRadius: 4,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#1a0a0a",
          borderBottom: "2px solid var(--crimson)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: "var(--gold)", flex: 1 }}>
          🔐 Панель администратора
        </h2>
        <button
          onClick={() => fetchPlayers(token)}
          style={{ background: "none", border: "1px solid var(--gold)", color: "var(--gold)", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}
        >
          ↻ Обновить
        </button>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 22, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Players list */}
        <div
          style={{
            width: 220,
            flexShrink: 0,
            background: "#faf6e8",
            borderRight: "1px solid var(--parchment-border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--parchment-border)" }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по нику..."
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid var(--parchment-border)",
                fontSize: 12,
                boxSizing: "border-box",
                background: "#fff",
              }}
            />
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && (
              <div style={{ padding: 16, textAlign: "center", fontSize: 13, color: "var(--text-medium)" }}>
                Загрузка...
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: "var(--text-medium)" }}>
                Игроков нет
              </div>
            )}
            {filtered.map((p) => (
              <div
                key={p.user_id}
                onClick={() => handleSelect(p)}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--parchment-border)",
                  background: selected?.user_id === p.user_id ? "#f0e8d0" : "transparent",
                  borderLeft: selected?.user_id === p.user_id ? "3px solid var(--crimson)" : "3px solid transparent",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-dark)" }}>
                  {p.username || p.name || "—"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-medium)", marginTop: 2 }}>
                  Ур.{p.level} · 🥈{p.silver} · ⭐{p.glory}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "6px 10px", borderTop: "1px solid var(--parchment-border)", fontSize: 11, color: "var(--text-medium)", textAlign: "center" }}>
            Игроков: {filtered.length}
          </div>
        </div>

        {/* Edit panel */}
        <div style={{ flex: 1, overflowY: "auto", background: "#fffef5", padding: 16 }}>
          {!selected ? (
            <div style={{ textAlign: "center", paddingTop: 60, color: "var(--text-medium)", fontSize: 14 }}>
              Выбери игрока из списка слева
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "var(--crimson)" }}>
                    {selected.username || selected.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-medium)" }}>
                    ID: {selected.user_id}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {saveMsg && (
                    <span style={{ fontSize: 12, color: saveMsg.startsWith("✓") ? "#15803d" : "#b91c1c" }}>
                      {saveMsg}
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    style={{
                      padding: "8px 20px",
                      background: "var(--crimson)",
                      color: "var(--parchment)",
                      border: "none",
                      borderRadius: 4,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    💾 Сохранить
                  </button>
                </div>
              </div>

              {["Основное", "Ресурсы", "Бой", "Статы"].map((group) => {
                const groupFields = FIELDS.filter((f) => f.group === group);
                return (
                  <div key={group} style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--text-medium)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 8,
                        paddingBottom: 4,
                        borderBottom: "1px solid var(--parchment-border)",
                      }}
                    >
                      {group}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: 8,
                      }}
                    >
                      {groupFields.map((f) => (
                        <div key={f.key}>
                          <label style={{ fontSize: 11, color: "var(--text-medium)", display: "block", marginBottom: 3 }}>
                            {f.label}
                          </label>
                          <input
                            type={f.key === "name" ? "text" : "number"}
                            value={editValues[f.key] as string | number ?? ""}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [f.key]: f.key === "name" ? e.target.value : Number(e.target.value),
                              }))
                            }
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              borderRadius: 4,
                              border: "1px solid var(--parchment-border)",
                              background: "#fff",
                              fontSize: 13,
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
