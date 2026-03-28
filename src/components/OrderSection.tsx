/**
 * OrderSection.tsx — Раздел "Орден"
 * Создание ордена, список орденов, вступление, управление членством
 */
import { useState, useEffect } from "react";

const ORDER_URL = "https://functions.poehali.dev/a540a07e-c67f-47e9-bb14-59ba436a93d8";

interface Order {
  id: number;
  name: string;
  description: string;
  leader_user_id: string;
  is_open: boolean;
  member_count: number;
  leader_name?: string;
}

interface Member {
  user_id: string;
  username: string;
  level: number;
  hp: number;
  max_hp: number;
}

interface OrderSectionProps {
  userId: string;
  username: string;
}

function callOrder(action: string, userId: string, body?: object) {
  const isGet = ["my_order", "list_orders", "active_raid"].includes(action);
  if (isGet) {
    return fetch(`${ORDER_URL}?action=${action}`, {
      headers: { "X-User-Id": userId },
    }).then(r => r.json());
  }
  return fetch(`${ORDER_URL}?action=${action}`, {
    method: "POST",
    headers: { "X-User-Id": userId, "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  }).then(r => r.json());
}

export default function OrderSection({ userId, username }: OrderSectionProps) {
  const [myOrder, setMyOrder] = useState<Order | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"my" | "list" | "create">("my");
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [msg, setMsg] = useState("");
  const [msgErr, setMsgErr] = useState(false);

  const loadMyOrder = async () => {
    const data = await callOrder("my_order", userId);
    setMyOrder(data.order || null);
    setMembers(data.members || []);
  };

  const loadOrders = async () => {
    const data = await callOrder("list_orders", userId);
    setOrders(data.orders || []);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadMyOrder(), loadOrders()]).finally(() => setLoading(false));
  }, [userId]);

  const showMsg = (text: string, isErr = false) => {
    setMsg(text);
    setMsgErr(isErr);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    const data = await callOrder("create_order", userId, { name: createName.trim(), description: createDesc.trim() });
    if (data.error) { showMsg(data.error, true); return; }
    showMsg("Орден создан!");
    await loadMyOrder();
    await loadOrders();
    setView("my");
  };

  const handleJoin = async (orderId: number) => {
    const data = await callOrder("join_order", userId, { order_id: orderId });
    if (data.error) { showMsg(data.error, true); return; }
    showMsg("Вы вступили в орден!");
    await loadMyOrder();
    await loadOrders();
    setView("my");
  };

  const handleLeave = async () => {
    if (!confirm("Покинуть орден?")) return;
    const data = await callOrder("leave_order", userId);
    if (data.error) { showMsg(data.error, true); return; }
    showMsg("Вы покинули орден");
    setMyOrder(null);
    setMembers([]);
    await loadOrders();
  };

  const handleToggleOpen = async () => {
    const data = await callOrder("toggle_open", userId);
    if (data.error) { showMsg(data.error, true); return; }
    setMyOrder(prev => prev ? { ...prev, is_open: data.is_open } : null);
    showMsg(data.is_open ? "Орден открыт для вступления" : "Орден закрыт для вступления");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-medium)" }}>
        Загрузка...
      </div>
    );
  }

  const panelStyle: React.CSSProperties = {
    background: "#faf6e8",
    border: "1px solid #c8a96e",
    borderRadius: 6,
    padding: "12px 14px",
    marginBottom: 10,
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        🛡️ Орден
      </h2>

      {msg && (
        <div style={{ padding: "8px 12px", borderRadius: 4, marginBottom: 10, fontSize: 13, fontWeight: 600, background: msgErr ? "#fff5f5" : "#f0fdf4", color: msgErr ? "#b91c1c" : "#15803d", border: `1px solid ${msgErr ? "#fca5a5" : "#86efac"}` }}>
          {msg}
        </div>
      )}

      {/* Вкладки */}
      {!myOrder && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {(["list", "create"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 4, border: "1px solid #c8a96e",
                background: view === v ? "var(--crimson)" : "#faf6e8",
                color: view === v ? "#fff" : "var(--text-dark)",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}
            >
              {v === "list" ? "📋 Все орденa" : "✚ Создать орден"}
            </button>
          ))}
        </div>
      )}

      {/* Мой орден */}
      {myOrder && (
        <div style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "var(--crimson)" }}>
                🛡️ {myOrder.name}
              </div>
              {myOrder.description && (
                <div style={{ fontSize: 12, color: "var(--text-medium)", marginTop: 2 }}>{myOrder.description}</div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 10, background: myOrder.is_open ? "#f0fdf4" : "#fff5f5", color: myOrder.is_open ? "#15803d" : "#b91c1c", border: `1px solid ${myOrder.is_open ? "#86efac" : "#fca5a5"}` }}>
                {myOrder.is_open ? "Открыт" : "Закрыт"}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-medium)" }}>👥 {myOrder.member_count} чел.</span>
            </div>
          </div>

          {/* Кнопки управления — только лидеру */}
          {myOrder.leader_user_id === userId && (
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button
                onClick={handleToggleOpen}
                style={{ flex: 1, padding: "7px 0", borderRadius: 4, border: "1px solid #c8a96e", background: myOrder.is_open ? "#fff5f5" : "#f0fdf4", color: myOrder.is_open ? "#b91c1c" : "#15803d", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
              >
                {myOrder.is_open ? "🔒 Закрыть орден" : "🔓 Открыть орден"}
              </button>
            </div>
          )}

          {/* Список членов */}
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dark)", marginBottom: 6 }}>Члены ордена:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {members.map(m => (
              <div key={m.user_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", background: "#fffef5", borderRadius: 4, border: "1px solid #e2d9bc", fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: myOrder.leader_user_id === m.user_id ? "var(--crimson)" : "var(--text-dark)" }}>
                  {myOrder.leader_user_id === m.user_id ? "👑 " : ""}{m.username}
                </span>
                <span style={{ color: "var(--text-medium)" }}>Ур. {m.level} | ❤️ {m.hp}/{m.max_hp}</span>
              </div>
            ))}
          </div>

          {myOrder.leader_user_id !== userId && (
            <button
              onClick={handleLeave}
              style={{ marginTop: 10, width: "100%", padding: "7px 0", borderRadius: 4, border: "1px solid #fca5a5", background: "#fff5f5", color: "#b91c1c", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
            >
              🚪 Покинуть орден
            </button>
          )}
        </div>
      )}

      {/* Список орденов */}
      {!myOrder && view === "list" && (
        <div>
          {orders.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-medium)", fontSize: 13 }}>
              Орденов пока нет. Создай первый!
            </div>
          )}
          {orders.map(o => (
            <div key={o.id} style={{ ...panelStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-dark)" }}>🛡️ {o.name}</div>
                {o.description && <div style={{ fontSize: 11, color: "var(--text-medium)", marginTop: 2 }}>{o.description}</div>}
                <div style={{ fontSize: 11, color: "var(--text-medium)", marginTop: 3 }}>
                  Лидер: {o.leader_name || "?"} · 👥 {o.member_count}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 10, background: o.is_open ? "#f0fdf4" : "#fff5f5", color: o.is_open ? "#15803d" : "#b91c1c", border: `1px solid ${o.is_open ? "#86efac" : "#fca5a5"}` }}>
                  {o.is_open ? "Открыт" : "Закрыт"}
                </span>
                {o.is_open && (
                  <button
                    onClick={() => handleJoin(o.id)}
                    style={{ padding: "5px 12px", borderRadius: 4, border: "none", background: "var(--crimson)", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                  >
                    Вступить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Создать орден */}
      {!myOrder && view === "create" && (
        <div style={panelStyle}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "var(--text-dark)" }}>✚ Создать новый орден</div>
          <input
            value={createName}
            onChange={e => setCreateName(e.target.value)}
            placeholder="Название ордена (мин. 3 символа)..."
            maxLength={48}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 4, border: "1px solid #c8a96e", background: "#fffef5", fontSize: 13, marginBottom: 8, boxSizing: "border-box" }}
          />
          <textarea
            value={createDesc}
            onChange={e => setCreateDesc(e.target.value)}
            placeholder="Описание ордена (необязательно)..."
            maxLength={200}
            rows={2}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 4, border: "1px solid #c8a96e", background: "#fffef5", fontSize: 13, marginBottom: 10, resize: "none", boxSizing: "border-box" }}
          />
          <button
            onClick={handleCreate}
            disabled={createName.trim().length < 3}
            style={{ width: "100%", padding: "9px 0", borderRadius: 4, border: "none", background: createName.trim().length >= 3 ? "var(--crimson)" : "#ccc", color: "#fff", fontWeight: 700, fontSize: 14, cursor: createName.trim().length >= 3 ? "pointer" : "not-allowed" }}
          >
            Основать орден
          </button>
        </div>
      )}
    </div>
  );
}
