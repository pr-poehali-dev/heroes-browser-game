import { useState } from "react";
import Icon from "@/components/ui/icon";
import DuelSection from "@/components/DuelSection";

const BANNER_URL =
  "https://cdn.poehali.dev/projects/e03d01dd-c207-488c-aa14-9e40184b6c24/files/840de9ee-8516-4aab-88ca-92499cb030ec.jpg";

const HERO = {
  name: "Странник",
  level: 1,
  hp: 80,
  maxHp: 100,
  mana: 45,
  maxMana: 60,
  xp: 120,
  xpNext: 300,
  gold: 250,
  gems: 5,
  attack: 12,
  defense: 8,
  magic: 6,
  speed: 10,
  location: "Поселок",
};

const SECTIONS = [
  { id: "diary", label: "Дневник", icon: "📖", desc: "Записи о приключениях" },
  { id: "quests", label: "Задания", icon: "📜", desc: "Доступные квесты" },
  { id: "duel", label: "Дуэль", icon: "⚔️", desc: "Сразись с героем" },
  { id: "village", label: "Поселок", icon: "🏘️", desc: "Твоя деревня" },
  { id: "campaign", label: "Поход", icon: "🗺️", desc: "Исследуй мир" },
  { id: "dungeon", label: "Подземелье", icon: "🕳️", desc: "Тёмные глубины" },
  { id: "dragon", label: "Дракон", icon: "🐉", desc: "Логово дракона" },
  { id: "orcs", label: "Орки", icon: "👹", desc: "Земли орков" },
  { id: "order", label: "Орден", icon: "🛡️", desc: "Рыцарский орден" },
  { id: "guild", label: "Дружина", icon: "🤝", desc: "Союз героев" },
  { id: "menagerie", label: "Зверинец", icon: "🦁", desc: "Твои существа" },
  { id: "top", label: "Лучшие", icon: "🏆", desc: "Рейтинг героев" },
];

const DIARY_ENTRIES = [
  { date: "19 марта", text: "Прибыл в Поселок. Кузнец дал первое задание — добыть 5 шкур волков." },
  { date: "18 марта", text: "Победил Тёмного Стражника у восточных ворот. Получил 50 опыта." },
  { date: "17 марта", text: "Вступил в ряды Ордена. Теперь я — Рыцарь третьего круга." },
];

const QUESTS = [
  { id: 1, title: "Волчьи шкуры", desc: "Принеси 5 шкур серых волков кузнецу", reward: "100 XP + 50 золота", status: "active", progress: 2, total: 5 },
  { id: 2, title: "Древний артефакт", desc: "Найди артефакт в Подземелье третьего уровня", reward: "300 XP + Магический меч", status: "available", progress: 0, total: 1 },
  { id: 3, title: "Орочий вожак", desc: "Победи вождя орков на восточных землях", reward: "500 XP + 200 золота", status: "available", progress: 0, total: 1 },
];

const TOP_HEROES = [
  { rank: 1, name: "Громозека", level: 47, guild: "Орден Огня", power: 18450 },
  { rank: 2, name: "Ведьмак77", level: 44, guild: "Серые Волки", power: 16200 },
  { rank: 3, name: "Стальной", level: 43, guild: "Орден Огня", power: 15800 },
  { rank: 4, name: "ТёмнаяЗвезда", level: 41, guild: "Одиночки", power: 14100 },
  { rank: 5, name: "Скиталец", level: 38, guild: "Серые Волки", power: 12900 },
];

type SectionId = typeof SECTIONS[number]["id"] | "main";

export default function Index() {
  const [activeSection, setActiveSection] = useState<SectionId>("main");
  const [hero] = useState(HERO);

  const xpPercent = Math.round((hero.xp / hero.xpNext) * 100);
  const hpPercent = Math.round((hero.hp / hero.maxHp) * 100);
  const manaPercent = Math.round((hero.mana / hero.maxMana) * 100);

  const renderContent = () => {
    switch (activeSection) {
      case "diary":
        return (
          <div className="animate-fade-in">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              📖 Дневник приключений
            </h2>
            <div className="content-stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DIARY_ENTRIES.map((e, i) => (
                <div key={i} className="game-panel-inner" style={{ borderRadius: 4, padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gold)", marginBottom: 4 }}>{e.date}</div>
                  <div style={{ fontSize: 14, color: "var(--text-dark)" }}>{e.text}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "quests":
        return (
          <div className="animate-fade-in">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              📜 Задания
            </h2>
            <div className="content-stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {QUESTS.map((q) => (
                <div key={q.id} className="game-panel-inner" style={{ borderRadius: 4, padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-dark)" }}>{q.title}</span>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 3,
                      background: q.status === "active" ? "#fef9c3" : "#f0fdf4",
                      color: q.status === "active" ? "#854d0e" : "#166534",
                      border: `1px solid ${q.status === "active" ? "#fde047" : "#86efac"}`
                    }}>
                      {q.status === "active" ? "Выполняется" : "Доступно"}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-medium)", marginBottom: 8 }}>{q.desc}</p>
                  {q.status === "active" && (
                    <div style={{ marginBottom: 6 }}>
                      <div className="xp-bar">
                        <div className="xp-fill" style={{ width: `${(q.progress / q.total) * 100}%` }} />
                      </div>
                      <div style={{ fontSize: 11, marginTop: 2, color: "var(--text-medium)" }}>{q.progress}/{q.total}</div>
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "var(--gold)" }}>🎁 {q.reward}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "duel":
        return <DuelSection hero={hero} />;

      case "top":
        return (
          <div className="animate-fade-in">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              🏆 Лучшие герои
            </h2>
            <div className="game-panel-inner" style={{ borderRadius: 4, overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--crimson)", color: "var(--parchment)" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>#</th>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Герой</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Ур.</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Сила</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_HEROES.map((h, i) => (
                    <tr key={h.rank} style={{ background: i % 2 === 0 ? "#fffbeb" : "#fff", borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 700, color: h.rank <= 3 ? "var(--gold)" : "var(--text-medium)" }}>
                        {h.rank === 1 ? "🥇" : h.rank === 2 ? "🥈" : h.rank === 3 ? "🥉" : h.rank}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-dark)" }}>{h.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-medium)" }}>{h.guild}</div>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: "var(--crimson)" }}>{h.level}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--gold)" }}>{h.power.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "village":
        return (
          <div className="animate-fade-in">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              🏘️ Поселок
            </h2>
            <div className="content-stagger" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { name: "Кузница", icon: "🔨", desc: "Улучши оружие и броню", level: 2 },
                { name: "Таверна", icon: "🍺", desc: "Отдохни и найди задания", level: 1 },
                { name: "Храм", icon: "⛪", desc: "Исцелись и получи благословение", level: 1 },
                { name: "Рынок", icon: "🛒", desc: "Купи и продай предметы", level: 3 },
                { name: "Казарма", icon: "🗡️", desc: "Найми воинов в отряд", level: 2 },
                { name: "Башня мага", icon: "🔮", desc: "Изучи заклинания", level: 1 },
              ].map((b) => (
                <div key={b.name} className="game-panel-inner" style={{ borderRadius: 4, padding: 12, cursor: "pointer" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{b.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: "var(--text-dark)" }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-medium)", marginBottom: 6 }}>{b.desc}</div>
                  <div style={{ fontSize: 11, color: "var(--gold)" }}>Уровень {b.level}</div>
                </div>
              ))}
            </div>
          </div>
        );

      default: {
        const section = SECTIONS.find((s) => s.id === activeSection);
        return (
          <div className="animate-fade-in" style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>{section?.icon}</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              {section?.label}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-medium)" }}>
              {section?.desc} — раздел в разработке
            </p>
          </div>
        );
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--parchment)" }}>
      {/* Header */}
      <header className="game-header">
        <div style={{ textAlign: "center", padding: "8px 0", borderBottom: "1px solid rgba(200,150,60,0.4)" }}>
          <h1 className="game-title" style={{ fontSize: 22, letterSpacing: "0.3em" }}>⚜ Г Е Р О И ⚜</h1>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px" }}>
          <div className="stat-badge"><span>👤</span><span style={{ fontWeight: 600 }}>{hero.name}</span></div>
          <div className="stat-badge"><span>⭐</span><span>{hero.level} ур.</span></div>
          <div className="stat-badge"><span>❤️</span><span>{hero.hp}/{hero.maxHp}</span></div>
          <div className="stat-badge"><span>💧</span><span>{hero.mana}/{hero.maxMana}</span></div>
          <div className="stat-badge"><span>🪙</span><span>{hero.gold}</span></div>
          <div className="stat-badge"><span>💎</span><span>{hero.gems}</span></div>
          <div className="stat-badge"><span>📍</span><span>{hero.location}</span></div>
        </div>

        {/* Progress bars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "0 12px 10px" }}>
          <div>
            <div style={{ fontSize: 10, color: "#f0d080", marginBottom: 3 }}>⚡ XP {hero.xp}/{hero.xpNext}</div>
            <div className="xp-bar"><div className="xp-fill" style={{ width: `${xpPercent}%` }} /></div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#f0d080", marginBottom: 3 }}>❤️ HP {hpPercent}%</div>
            <div className="xp-bar"><div className="hp-fill" style={{ width: `${hpPercent}%` }} /></div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#f0d080", marginBottom: 3 }}>💧 Мана {manaPercent}%</div>
            <div className="xp-bar"><div className="mana-fill" style={{ width: `${manaPercent}%` }} /></div>
          </div>
        </div>
      </header>

      {/* Content wrapper */}
      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        {/* Banner */}
        <div style={{ height: 140, background: "#1a0a0a", overflow: "hidden", position: "relative" }}>
          <img src={BANNER_URL} alt="Герои" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(245,240,224,0.85) 100%)" }} />
        </div>

        <div className="game-panel">
          {/* Welcome */}
          {activeSection === "main" && (
            <div className="animate-fade-in" style={{ padding: "14px 16px", borderBottom: "1px solid var(--parchment-border)", background: "linear-gradient(180deg, #fffef5 0%, #faf4dc 100%)" }}>
              <h2 style={{ textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, marginBottom: 6, color: "var(--text-dark)" }}>
                Добро пожаловать!
              </h2>
              <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-medium)", lineHeight: 1.6 }}>
                Герой <strong>{hero.name}</strong>, уровень <strong>{hero.level}</strong>.<br />
                До следующего уровня: <strong>{hero.xpNext - hero.xp} XP</strong>
              </p>

              {/* Hero stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginTop: 12 }}>
                {[
                  { label: "Атака", value: hero.attack, icon: "⚔️" },
                  { label: "Защита", value: hero.defense, icon: "🛡️" },
                  { label: "Магия", value: hero.magic, icon: "✨" },
                  { label: "Скорость", value: hero.speed, icon: "💨" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "rgba(139,26,26,0.06)", border: "1px solid var(--parchment-border)", borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, marginBottom: 2 }}>{s.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--crimson)" }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "var(--text-medium)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nav */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--parchment-border)", background: "#faf6e8" }}>
            <div className="content-stagger">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id as SectionId)}
                  className="nav-link"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "5px 8px",
                    borderRadius: 3,
                    background: activeSection === s.id ? "rgba(139,26,26,0.08)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section content */}
          {activeSection !== "main" && (
            <div style={{ padding: "14px 16px", background: "#faf6e8" }}>
              <button
                onClick={() => setActiveSection("main")}
                style={{ fontSize: 12, color: "var(--crimson)", background: "none", border: "none", cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", gap: 4 }}
              >
                <Icon name="ChevronLeft" size={13} />
                На главную
              </button>
              {renderContent()}
            </div>
          )}

          {/* Bottom nav */}
          <div className="bottom-nav" style={{ padding: "8px 16px", display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
            <a onClick={() => setActiveSection("main")}>🏠 Главная</a>
            <a>🧙 Герой</a>
            <a>💬 Чат</a>
            <a>📬 Почта</a>
            <a>🪙 Золото</a>
          </div>
        </div>

        {/* Footer */}
        <footer className="game-footer" style={{ textAlign: "center", padding: "12px 16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 16px", marginBottom: 4 }}>
            {["Форум", "Помощь", "Правила", "Настройки", "Выйти"].map((link) => (
              <a key={link} style={{ color: "#f0d080", textDecoration: "underline", cursor: "pointer", fontSize: 12 }}>{link}</a>
            ))}
          </div>
          <div style={{ color: "#c8a040", fontSize: 11 }}>© 2026 Герои</div>
        </footer>
      </div>
    </div>
  );
}