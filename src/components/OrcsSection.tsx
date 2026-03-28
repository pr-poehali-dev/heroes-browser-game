/**
 * OrcsSection.tsx — Раздел "Орки"
 * Нападение орков на поселок, бой с орками (только для членов ордена)
 */
import { useState, useEffect } from "react";

const ORDER_URL = "https://functions.poehali.dev/a540a07e-c67f-47e9-bb14-59ba436a93d8";

interface OrcRaid {
  id: number;
  started_at: string;
  ends_at: string;
  total_orc_hp: number;
  current_orc_hp: number;
  is_active: boolean;
  result: string;
  top_damage?: { username: string; damage: number }[];
}

interface OrcsSectionProps {
  userId: string;
  battles: number;
  onBattleSpent: () => void;
}

function formatTimeLeft(endsAt: string): string {
  const left = new Date(endsAt).getTime() - Date.now();
  if (left <= 0) return "Время вышло";
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  if (h > 0) return `${h}ч ${m.toString().padStart(2, "0")}мин ${s.toString().padStart(2, "0")}с`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function OrcsSection({ userId, battles, onBattleSpent }: OrcsSectionProps) {
  const [raid, setRaid] = useState<OrcRaid | null>(null);
  const [inOrder, setInOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attacking, setAttacking] = useState(false);
  const [lastDmg, setLastDmg] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [msg, setMsg] = useState("");
  const [msgErr, setMsgErr] = useState(false);

  const loadData = async () => {
    const [raidData, orderData] = await Promise.all([
      fetch(`${ORDER_URL}?action=active_raid`, { headers: { "X-User-Id": userId } }).then(r => r.json()),
      fetch(`${ORDER_URL}?action=my_order`, { headers: { "X-User-Id": userId } }).then(r => r.json()),
    ]);
    setRaid(raidData.raid || null);
    setInOrder(!!orderData.order);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  // Таймер обратного отсчёта
  useEffect(() => {
    if (!raid) return;
    const t = setInterval(() => {
      setTimeLeft(formatTimeLeft(raid.ends_at));
    }, 1000);
    setTimeLeft(formatTimeLeft(raid.ends_at));
    return () => clearInterval(t);
  }, [raid?.ends_at]);

  const showMsg = (text: string, isErr = false) => {
    setMsg(text);
    setMsgErr(isErr);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleAttack = async () => {
    if (!inOrder) { showMsg("Вступи в орден, чтобы сражаться с орками!", true); return; }
    if (battles <= 0) { showMsg("Нет зарядов боёв!", true); return; }
    setAttacking(true);
    const data = await fetch(`${ORDER_URL}?action=attack_orcs`, {
      method: "POST",
      headers: { "X-User-Id": userId, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "attack_orcs" }),
    }).then(r => r.json());
    setAttacking(false);
    if (data.error) { showMsg(data.error, true); return; }
    setLastDmg(data.damage);
    onBattleSpent();
    if (data.victory) {
      showMsg(`Победа! Орки разгромлены! Урон: ${data.damage}`);
    } else {
      showMsg(`Удар нанесён! Урон: ${data.damage}. HP орков: ${data.orc_hp_left}`);
    }
    await loadData();
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-medium)" }}>Загрузка...</div>;
  }

  const hpPercent = raid ? Math.max(0, Math.round((raid.current_orc_hp / raid.total_orc_hp) * 100)) : 0;

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        👹 Орки
      </h2>

      {msg && (
        <div style={{ padding: "8px 12px", borderRadius: 4, marginBottom: 10, fontSize: 13, fontWeight: 600, background: msgErr ? "#fff5f5" : "#f0fdf4", color: msgErr ? "#b91c1c" : "#15803d", border: `1px solid ${msgErr ? "#fca5a5" : "#86efac"}` }}>
          {msg}
        </div>
      )}

      {!inOrder && (
        <div style={{ padding: "10px 12px", borderRadius: 4, marginBottom: 12, background: "#fffbeb", border: "1px solid #f59e0b", fontSize: 13, color: "#92400e" }}>
          ⚠️ Только члены ордена могут сражаться с орками. Вступи в орден в разделе <b>Орден</b>.
        </div>
      )}

      {!raid && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>👹</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "var(--text-dark)", fontWeight: 600 }}>
            Поселок в безопасности
          </div>
          <div style={{ fontSize: 13, color: "var(--text-medium)", marginTop: 6 }}>
            Орки не нападали. Будь начеку — они могут атаковать в любой момент!
          </div>
          <div style={{ marginTop: 20, fontSize: 28 }}>🏘️🛡️🏘️</div>
        </div>
      )}

      {raid && (
        <div>
          {/* Баннер нападения */}
          <div style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)", color: "#fff", borderRadius: 6, padding: "12px 14px", marginBottom: 12, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>👹⚔️🏘️</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              ОРДЫ ОРКОВ АТАКУЮТ ПОСЕЛОК!
            </div>
            <div style={{ fontSize: 13, color: "#fca5a5" }}>
              До конца защиты: <span style={{ fontWeight: 700, color: "#fff" }}>{timeLeft}</span>
            </div>
          </div>

          {/* HP орков общее */}
          <div style={{ background: "#faf6e8", border: "1px solid #c8a96e", borderRadius: 6, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dark)" }}>💀 Здоровье Орды</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#b91c1c" }}>
                {raid.current_orc_hp} / {raid.total_orc_hp}
              </span>
            </div>
            <div style={{ height: 10, background: "#e5e7eb", borderRadius: 5, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${hpPercent}%`, background: "linear-gradient(90deg, #dc2626, #ef4444)", borderRadius: 5, transition: "width 0.5s" }} />
            </div>
          </div>

          {/* Кнопка атаки */}
          {raid.current_orc_hp > 0 && (
            <button
              onClick={handleAttack}
              disabled={attacking || !inOrder || battles <= 0}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 5, border: "none",
                background: !inOrder || battles <= 0 ? "#9ca3af" : "linear-gradient(135deg, #b91c1c, #dc2626)",
                color: "#fff", fontWeight: 700, fontSize: 16, cursor: !inOrder || battles <= 0 ? "not-allowed" : "pointer",
                marginBottom: 10, letterSpacing: "0.05em",
              }}
            >
              {attacking ? "Атакую..." : `⚔️ Атаковать орков (${battles} боёв)`}
            </button>
          )}

          {raid.current_orc_hp <= 0 && (
            <div style={{ textAlign: "center", padding: "12px", background: "#f0fdf4", borderRadius: 6, border: "1px solid #86efac", fontWeight: 700, color: "#15803d", fontSize: 15, marginBottom: 10 }}>
              🎉 Орки разгромлены! Поселок спасён!
            </div>
          )}

          {lastDmg !== null && (
            <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-medium)", marginBottom: 8 }}>
              Последний удар: <b style={{ color: "#b91c1c" }}>-{lastDmg} HP</b>
            </div>
          )}

          {/* Топ урона */}
          {raid.top_damage && raid.top_damage.length > 0 && (
            <div style={{ background: "#faf6e8", border: "1px solid #c8a96e", borderRadius: 6, padding: "10px 14px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "var(--text-dark)" }}>🏆 Герои в битве:</div>
              {raid.top_damage.map((t, i) => (
                <div key={t.username} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12, borderBottom: i < raid.top_damage!.length - 1 ? "1px solid #e2d9bc" : "none" }}>
                  <span style={{ color: i === 0 ? "var(--crimson)" : "var(--text-dark)", fontWeight: i === 0 ? 700 : 500 }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`} {t.username}
                  </span>
                  <span style={{ color: "#b91c1c", fontWeight: 600 }}>{t.damage} урона</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
