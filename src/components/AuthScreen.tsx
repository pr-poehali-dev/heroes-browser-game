import { useState } from "react";

const HERO_AUTH_URL = "https://functions.poehali.dev/181dbb92-6f9b-4920-af86-aeb32b3b83fd";

const MALE_AVATARS = [
  { id: "m1", emoji: "⚔️", label: "Воин" },
  { id: "m2", emoji: "🗡️", label: "Разбойник" },
  { id: "m3", emoji: "🛡️", label: "Страж" },
  { id: "m4", emoji: "🏹", label: "Лучник" },
  { id: "m5", emoji: "🪓", label: "Варвар" },
  { id: "m6", emoji: "🔱", label: "Вождь" },
];

const FEMALE_AVATARS = [
  { id: "f1", emoji: "🔮", label: "Чародейка" },
  { id: "f2", emoji: "🌙", label: "Ведьма" },
  { id: "f3", emoji: "🌸", label: "Жрица" },
  { id: "f4", emoji: "⚡", label: "Буревестник" },
  { id: "f5", emoji: "🌿", label: "Друидка" },
  { id: "f6", emoji: "💫", label: "Провидица" },
];

interface AuthScreenProps {
  onAuth: (userId: string, username: string, avatar?: string) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [selectedAvatar, setSelectedAvatar] = useState("m1");

  const avatars = gender === "male" ? MALE_AVATARS : FEMALE_AVATARS;
  const currentAvatarEmoji = [...MALE_AVATARS, ...FEMALE_AVATARS].find(a => a.id === selectedAvatar)?.emoji ?? "⚔️";

  const handleGenderChange = (g: "male" | "female") => {
    setGender(g);
    setSelectedAvatar(g === "male" ? "m1" : "f1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, string> = {
        action: mode,
        username: username.trim(),
        password,
      };
      if (mode === "register") {
        body.avatar = selectedAvatar;
        body.gender = gender;
      }
      const res = await fetch(HERO_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("heroes_user_id", data.user_id);
        localStorage.setItem("heroes_username", data.username);
        if (data.avatar) localStorage.setItem("heroes_avatar", data.avatar);
        onAuth(data.user_id, data.username, data.avatar);
      } else {
        setError(data.error || "Что-то пошло не так");
      }
    } catch {
      setError("Ошибка сети. Попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 4,
    border: "1px solid var(--parchment-border)",
    background: "#fffef5",
    fontSize: 14,
    color: "var(--text-dark)",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--parchment)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 className="game-title" style={{ fontSize: 28, letterSpacing: "0.3em", marginBottom: 8 }}>⚔Викинги⚔</h1>
          <p style={{ fontSize: 13, color: "var(--text-medium)" }}>Браузерная ролевая игра</p>
        </div>

        <div className="game-panel" style={{ borderRadius: 8 }}>
          <div style={{ padding: "20px 20px 0" }}>
            <div style={{ display: "flex", borderBottom: "2px solid var(--parchment-border)", marginBottom: 20 }}>
              {(["login", "register"] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(""); }}
                  style={{ flex: 1, padding: "8px 0", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: mode === m ? "var(--crimson)" : "var(--text-medium)", borderBottom: mode === m ? "2px solid var(--crimson)" : "2px solid transparent", marginBottom: -2 }}>
                  {m === "login" ? "Войти" : "Регистрация"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {mode === "register" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-medium)", marginBottom: 8 }}>
                    Пол персонажа
                  </label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {(["male", "female"] as const).map((g) => (
                      <button key={g} type="button" onClick={() => handleGenderChange(g)}
                        style={{ flex: 1, padding: "8px", borderRadius: 4, border: `2px solid ${gender === g ? "var(--crimson)" : "var(--parchment-border)"}`, background: gender === g ? "#fff5f0" : "#faf6e8", cursor: "pointer", fontWeight: 700, fontSize: 13, color: gender === g ? "var(--crimson)" : "var(--text-dark)" }}>
                        {g === "male" ? "⚔️ Мужской" : "🔮 Женский"}
                      </button>
                    ))}
                  </div>

                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-medium)", marginBottom: 8 }}>
                    Аватарка — {currentAvatarEmoji} {[...MALE_AVATARS, ...FEMALE_AVATARS].find(a => a.id === selectedAvatar)?.label}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                    {avatars.map((av) => (
                      <button key={av.id} type="button" onClick={() => setSelectedAvatar(av.id)}
                        style={{ padding: "8px 4px", borderRadius: 6, border: `2px solid ${selectedAvatar === av.id ? "var(--crimson)" : "var(--parchment-border)"}`, background: selectedAvatar === av.id ? "#fff5f0" : "#faf6e8", cursor: "pointer", textAlign: "center", fontSize: 22, lineHeight: 1 }}
                        title={av.label}>
                        {av.emoji}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-medium)", textAlign: "center", marginTop: 4 }}>
                    {[...MALE_AVATARS, ...FEMALE_AVATARS].find(a => a.id === selectedAvatar)?.label}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-medium)", marginBottom: 5 }}>Ник героя</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Странник" maxLength={32} required style={inputStyle} />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-medium)", marginBottom: 5 }}>Пароль</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
              </div>

              {error && (
                <div style={{ fontSize: 12, color: "#b91c1c", background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: 4, padding: "8px 12px", marginBottom: 14 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "11px 0", borderRadius: 4, background: loading ? "#ccc" : "var(--crimson)", color: "var(--parchment)", fontWeight: 700, fontSize: 15, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.05em" }}>
                {loading ? "..." : mode === "login" ? "⚔️ Войти в игру" : "🛡️ Создать героя"}
              </button>
            </form>
          </div>

          <div style={{ padding: "14px 20px", textAlign: "center", fontSize: 11, color: "var(--text-medium)", borderTop: "1px solid var(--parchment-border)", marginTop: 20 }}>
            {mode === "login" ? (
              <>Нет героя? <span onClick={() => { setMode("register"); setError(""); }} style={{ color: "var(--crimson)", cursor: "pointer", fontWeight: 600 }}>Зарегистрируйся</span></>
            ) : (
              <>Уже есть герой? <span onClick={() => { setMode("login"); setError(""); }} style={{ color: "var(--crimson)", cursor: "pointer", fontWeight: 600 }}>Войди</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}