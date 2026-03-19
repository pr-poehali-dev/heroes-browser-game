import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import DuelSection from "@/components/DuelSection";

const BANNER_URL =
  "https://cdn.poehali.dev/projects/e03d01dd-c207-488c-aa14-9e40184b6c24/files/840de9ee-8516-4aab-88ca-92499cb030ec.jpg";

const MAX_BATTLES = 6;
const REGEN_MS = 5 * 60 * 1000; // 5 минут

export interface DiaryEntry {
  id: number;
  date: string;
  icon: string;
  text: string;
  type: "duel_win" | "duel_lose" | "system";
}

export interface HeroStats {
  strength: number;
  defense: number;
  agility: number;
  mastery: number;
  vitality: number;
}

const INITIAL_STATS: HeroStats = { strength: 5, defense: 5, agility: 5, mastery: 5, vitality: 5 };

const STAT_COST = (level: number) => level * 50; // серебро за улучшение

const HERO_BASE = {
  name: "Странник",
  level: 1,
  hp: 80,
  maxHp: 100,
  mana: 45,
  maxMana: 60,
  xp: 120,
  xpNext: 300,
  gold: 250,
  silver: 480,
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

const STAT_INFO = [
  { key: "strength" as const, label: "Сила", icon: "💪", desc: "Увеличивает урон атаки" },
  { key: "defense" as const, label: "Защита", icon: "🛡️", desc: "Снижает получаемый урон" },
  { key: "agility" as const, label: "Ловкость", icon: "🏃", desc: "Повышает шанс уклонения и скорость" },
  { key: "mastery" as const, label: "Мастерство", icon: "⚔️", desc: "Увеличивает крит и точность" },
  { key: "vitality" as const, label: "Живучесть", icon: "❤️", desc: "Увеличивает максимальное HP" },
];

type SectionId = typeof SECTIONS[number]["id"] | "main" | "hero";

function formatTimer(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Index() {
  const [activeSection, setActiveSection] = useState<SectionId>("main");
  const [hero] = useState(HERO_BASE);
  const [silver, setSilver] = useState(480);
  const [stats, setStats] = useState<HeroStats>(INITIAL_STATS);
  const [duelDifficulty, setDuelDifficulty] = useState<"higher" | "equal" | "lower">("equal");

  // HP regen
  const maxHp = hero.maxHp + stats.vitality * 15;
  const [currentHp, setCurrentHp] = useState(hero.hp);

  // HP regeneration based on vitality
  useEffect(() => {
    const regenInterval = Math.max(5, 30 - stats.vitality * 2) * 1000;
    const timer = setInterval(() => {
      setCurrentHp((prev) => {
        const max = hero.maxHp + stats.vitality * 15;
        return prev < max ? Math.min(max, prev + 1) : prev;
      });
    }, regenInterval);
    return () => clearInterval(timer);
  }, [stats.vitality, hero.maxHp]);

  // Бои
  const [battles, setBattles] = useState(MAX_BATTLES);
  // Очередь восстановления: timestamp когда добавили слот
  const regenQueue = useRef<number[]>([]);
  const [regenTimer, setRegenTimer] = useState<number | null>(null); // мс до следующего восстановления
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Дневник
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const diaryIdRef = useRef(10);

  const xpPercent = Math.round((hero.xp / hero.xpNext) * 100);
  const hpPercent = Math.round((currentHp / maxHp) * 100);

  // Тик таймера регена
  useEffect(() => {
    if (battles >= MAX_BATTLES) {
      if (timerRef.current) clearInterval(timerRef.current);
      setRegenTimer(null);
      return;
    }
    const tick = () => {
      const now = Date.now();
      const queue = regenQueue.current;
      if (queue.length === 0) return;
      const earliest = queue[0];
      const left = earliest + REGEN_MS - now;
      if (left <= 0) {
        regenQueue.current = queue.slice(1);
        setBattles((b) => {
          const next = Math.min(MAX_BATTLES, b + 1);
          if (next >= MAX_BATTLES && timerRef.current) {
            clearInterval(timerRef.current);
            setRegenTimer(null);
          }
          return next;
        });
        setRegenTimer(regenQueue.current.length > 0 ? regenQueue.current[0] + REGEN_MS - Date.now() : null);
      } else {
        setRegenTimer(left);
      }
    };
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(tick, 1000);
    tick();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [battles]);

  const spendBattle = useCallback(() => {
    if (battles <= 0) return false;
    regenQueue.current = [...regenQueue.current, Date.now()];
    setBattles((b) => b - 1);
    return true;
  }, [battles]);

  const addDiaryEntry = useCallback((entry: Omit<DiaryEntry, "id">) => {
    diaryIdRef.current += 1;
    setDiary((prev) => [{ ...entry, id: diaryIdRef.current }, ...prev]);
  }, []);

  const onDuelEnd = useCallback((result: "victory" | "defeat", enemyName: string, xp: number, gold: number, silverReward: number) => {
    setSilver(s => s + silverReward);
    const now = new Date();
    const dateStr = `${now.getDate()} марта, ${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
    if (result === "victory") {
      const parts: string[] = [];
      if (xp > 0) parts.push(`+${xp} XP`);
      if (gold > 0) parts.push(`+${gold} 🪙 золота`);
      if (silverReward > 0) parts.push(`+${silverReward} серебра`);
      addDiaryEntry({
        date: dateStr,
        icon: "🏆",
        text: `Победа над ${enemyName} в дуэли! Получено ${parts.join(", ")}.`,
        type: "duel_win",
      });
    } else {
      addDiaryEntry({
        date: dateStr,
        icon: "💀",
        text: `Поражение от ${enemyName} в дуэли. Потеряно ${Math.abs(xp)} XP и ${Math.abs(gold)} 🪙 золота.`,
        type: "duel_lose",
      });
    }
  }, [addDiaryEntry]);

  const upgradeStat = (key: keyof HeroStats) => {
    const currentLevel = stats[key];
    const cost = STAT_COST(currentLevel);
    if (silver < cost) return;
    setSilver((s) => s - cost);
    setStats((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const heroForDuel = {
    ...hero,
    attack: hero.attack + stats.strength * 2 + stats.mastery,
    defense: hero.defense + stats.defense * 2,
    magic: hero.magic + stats.mastery,
    speed: hero.speed + stats.agility,
    maxHp: maxHp,
    hp: currentHp,
  };

  const renderContent = () => {
    switch (activeSection) {
      case "diary": {
        const filteredDiary = diary.filter((e) => e.type === "duel_win" || e.type === "duel_lose");
        return (
          <div className="animate-fade-in">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              📖 Дневник приключений
            </h2>
            <div className="content-stagger" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredDiary.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, color: "var(--text-medium)" }}>
                  Записей пока нет. Сражайся в дуэлях!
                </div>
              )}
              {filteredDiary.map((e) => {
                const bg = e.type === "duel_win" ? "#f0fdf4" : "#fff5f5";
                const border = e.type === "duel_win" ? "#86efac" : "#fca5a5";
                return (
                  <div key={e.id} className="game-panel-inner" style={{ borderRadius: 4, padding: "9px 13px", background: bg, border: `1px solid ${border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 15 }}>{e.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gold)" }}>{e.date}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-dark)", lineHeight: 1.5 }}>{e.text}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

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
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 3, background: q.status === "active" ? "#fef9c3" : "#f0fdf4", color: q.status === "active" ? "#854d0e" : "#166534", border: `1px solid ${q.status === "active" ? "#fde047" : "#86efac"}` }}>
                      {q.status === "active" ? "Выполняется" : "Доступно"}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-medium)", marginBottom: 8 }}>{q.desc}</p>
                  {q.status === "active" && (
                    <div style={{ marginBottom: 6 }}>
                      <div className="xp-bar"><div className="xp-fill" style={{ width: `${(q.progress / q.total) * 100}%` }} /></div>
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
        return (
          <DuelSection
            hero={heroForDuel}
            battles={battles}
            maxBattles={MAX_BATTLES}
            regenTimer={regenTimer}
            onSpendBattle={spendBattle}
            onDuelEnd={onDuelEnd}
            difficulty={duelDifficulty}
            onDifficultyChange={setDuelDifficulty}
            playerLevel={hero.level}
          />
        );

      case "hero":
        return (
          <div className="animate-fade-in">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              🧙 Герой
            </h2>
            <div style={{ fontSize: 12, color: "var(--text-medium)", marginBottom: 14 }}>Серебро: <strong style={{ color: "var(--text-dark)" }}>🪙 {silver}</strong></div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {STAT_INFO.map((s) => {
                const level = stats[s.key];
                const cost = STAT_COST(level);
                const canAfford = silver >= cost;
                return (
                  <div key={s.key} className="game-panel-inner" style={{ borderRadius: 4, padding: "10px 13px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 24, flexShrink: 0 }}>{s.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dark)" }}>{s.label}</span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--crimson)" }}>Ур. {level}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-medium)", marginBottom: 6 }}>{s.desc}</div>
                      {/* Level dots */}
                      <div style={{ display: "flex", gap: 3 }}>
                        {Array.from({ length: Math.min(level, 10) }).map((_, i) => (
                          <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: "var(--crimson)", border: "1px solid #7a1515" }} />
                        ))}
                        {level < 10 && Array.from({ length: 10 - level }).map((_, i) => (
                          <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: "#e8dcc0", border: "1px solid #c8a96e" }} />
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => upgradeStat(s.key)}
                      disabled={!canAfford || level >= 10}
                      style={{
                        flexShrink: 0,
                        padding: "6px 10px",
                        borderRadius: 4,
                        fontWeight: 700,
                        fontSize: 11,
                        border: "none",
                        cursor: canAfford && level < 10 ? "pointer" : "not-allowed",
                        background: level >= 10 ? "#ccc" : canAfford ? "var(--crimson)" : "#e8dcc0",
                        color: level >= 10 ? "#888" : canAfford ? "var(--parchment)" : "#a08040",
                        lineHeight: 1.4,
                        textAlign: "center",
                        minWidth: 56,
                      }}
                    >
                      {level >= 10 ? "Макс." : <>+1<br /><span style={{ fontSize: 10, fontWeight: 400 }}>🪙{cost}</span></>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );

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
            <p style={{ fontSize: 13, color: "var(--text-medium)" }}>{section?.desc} — раздел в разработке</p>
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
          <div className="stat-badge" onClick={() => setActiveSection("hero")} style={{ cursor: "pointer" }}><span>👤</span><span style={{ fontWeight: 600 }}>{hero.name}</span></div>
          <div className="stat-badge"><span>⭐</span><span>{hero.level} ур.</span></div>
          <div className="stat-badge"><span>❤️</span><span>{currentHp}/{maxHp}</span></div>
          <div className="stat-badge"><span>🥈</span><span>{silver}</span></div>
          <div className="stat-badge"><span>🪙</span><span>{hero.gold}</span></div>
          <div className="stat-badge"><span>💎</span><span>{hero.gems}</span></div>
          {/* Счётчик боёв */}
          <div className="stat-badge" style={{ gap: 5, alignItems: "center" }}>
            <span title="Количество боёв">⚔️</span>
            <span style={{ fontWeight: 600 }}>{battles}/{MAX_BATTLES}</span>
            {regenTimer !== null && battles < MAX_BATTLES && (
              <span style={{ fontSize: 10, color: "#f0d080", marginLeft: 2 }}>+{formatTimer(regenTimer)}</span>
            )}
          </div>
        </div>

        {/* Progress bars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 12px 10px" }}>
          <div>
            <div style={{ fontSize: 10, color: "#f0d080", marginBottom: 3 }}>⚡ XP {hero.xp}/{hero.xpNext}</div>
            <div className="xp-bar"><div className="xp-fill" style={{ width: `${xpPercent}%` }} /></div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#f0d080", marginBottom: 3 }}>❤️ HP {hpPercent}%</div>
            <div className="xp-bar"><div className="hp-fill" style={{ width: `${hpPercent}%` }} /></div>
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
                  style={{ width: "100%", textAlign: "left", padding: "5px 8px", borderRadius: 3, background: activeSection === s.id ? "rgba(139,26,26,0.08)" : "transparent", border: "none", cursor: "pointer" }}
                >
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <span>{s.label}</span>
                  {s.id === "duel" && (
                    <span style={{ marginLeft: "auto", fontSize: 11, color: battles > 0 ? "var(--gold)" : "#aaa" }}>
                      {battles}/{MAX_BATTLES} боёв
                    </span>
                  )}
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
            <a onClick={() => setActiveSection("hero")}>🧙 Герой</a>
            <a>💬 Чат</a>
            <a>📬 Почта</a>
            <a>🪙 {hero.gold} золота</a>
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