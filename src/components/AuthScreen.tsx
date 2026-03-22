import { useState } from "react";

const HERO_AUTH_URL = "https://functions.poehali.dev/181dbb92-6f9b-4920-af86-aeb32b3b83fd";

interface AuthScreenProps {
  onAuth: (userId: string, username: string) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(HERO_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, username: username.trim(), password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("heroes_user_id", data.user_id);
        localStorage.setItem("heroes_username", data.username);
        onAuth(data.user_id, data.username);
      } else {
        setError(data.error || "Что-то пошло не так");
      }
    } catch {
      setError("Ошибка сети. Попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--parchment)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1
            className="game-title"
            style={{ fontSize: 28, letterSpacing: "0.3em", marginBottom: 8 }}
          >
            ⚜ ГЕРОИ ⚜
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-medium)" }}>
            Браузерная ролевая игра
          </p>
        </div>

        <div className="game-panel" style={{ borderRadius: 8 }}>
          <div style={{ padding: "20px 20px 0" }}>
            <div
              style={{
                display: "flex",
                borderBottom: "2px solid var(--parchment-border)",
                marginBottom: 20,
              }}
            >
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); }}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 700,
                    color: mode === m ? "var(--crimson)" : "var(--text-medium)",
                    borderBottom: mode === m ? "2px solid var(--crimson)" : "2px solid transparent",
                    marginBottom: -2,
                  }}
                >
                  {m === "login" ? "Войти" : "Регистрация"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-medium)",
                    marginBottom: 5,
                  }}
                >
                  Ник героя
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Странник"
                  maxLength={32}
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 4,
                    border: "1px solid var(--parchment-border)",
                    background: "#fffef5",
                    fontSize: 14,
                    color: "var(--text-dark)",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-medium)",
                    marginBottom: 5,
                  }}
                >
                  Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 4,
                    border: "1px solid var(--parchment-border)",
                    background: "#fffef5",
                    fontSize: 14,
                    color: "var(--text-dark)",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#b91c1c",
                    background: "#fff5f5",
                    border: "1px solid #fca5a5",
                    borderRadius: 4,
                    padding: "8px 12px",
                    marginBottom: 14,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  borderRadius: 4,
                  background: loading ? "#ccc" : "var(--crimson)",
                  color: "var(--parchment)",
                  fontWeight: 700,
                  fontSize: 15,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'Cormorant Garamond', serif",
                  letterSpacing: "0.05em",
                }}
              >
                {loading
                  ? "..."
                  : mode === "login"
                  ? "⚔️ Войти в игру"
                  : "🛡️ Создать героя"}
              </button>
            </form>
          </div>

          <div
            style={{
              padding: "14px 20px",
              textAlign: "center",
              fontSize: 11,
              color: "var(--text-medium)",
              borderTop: "1px solid var(--parchment-border)",
              marginTop: 20,
            }}
          >
            {mode === "login" ? (
              <>
                Нет героя?{" "}
                <span
                  onClick={() => { setMode("register"); setError(""); }}
                  style={{ color: "var(--crimson)", cursor: "pointer", fontWeight: 600 }}
                >
                  Зарегистрируйся
                </span>
              </>
            ) : (
              <>
                Уже есть герой?{" "}
                <span
                  onClick={() => { setMode("login"); setError(""); }}
                  style={{ color: "var(--crimson)", cursor: "pointer", fontWeight: 600 }}
                >
                  Войди
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
