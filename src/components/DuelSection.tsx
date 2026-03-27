/**
 * DuelSection.tsx — Система дуэлей
 *
 * Экраны:
 * 1. "menu" — список категорий поиска (как в оригинальной игре)
 * 2. "search" — список реальных игроков / наёмников
 * 3. "fight" — бой с выбранным противником (5й скрин)
 * 4. "result" — результат боя
 *
 * Реальные игроки загружаются из бэкенда.
 * Наёмники генерируются на основе статов игрока.
 */
import { useState, useRef, useEffect } from "react";
import { HeroStats } from "@/pages/Index";
import { getAvatarEmoji, getAvatarLabel } from "@/components/SectionPage";

const DUEL_PLAYERS_URL = "https://functions.poehali.dev/221a5e8c-747d-4b2a-ad80-afccad264e7b";

export interface DuelReward {
  xp: number; gold: number; silver: number; glory: number; damageTaken: number;
}

interface Fighter {
  name: string; level: number; hp: number; maxHp: number;
  attack: number; defense: number; magic: number; speed: number;
  avatar: string; isReal?: boolean; userId?: string;
  duel_wins?: number; duel_losses?: number; glory?: number; xp?: number;
}

interface BattleLog {
  id: number; turn: number; actor: "player" | "enemy" | "system";
  type: "attack" | "magic" | "miss" | "crit" | "system";
  text: string; damage?: number;
}

interface DuelSectionProps {
  hero: {
    name: string; level: number; attack: number; defense: number;
    magic: number; speed: number; hp: number; maxHp: number;
  };
  stats: HeroStats;
  battles: number;
  maxBattles: number;
  regenTimer: number | null;
  onSpendBattle: () => boolean;
  onDuelEnd: (result: "victory" | "defeat", enemyName: string, reward: DuelReward) => void;
  difficulty: "higher" | "equal" | "lower";
  onDifficultyChange: (d: "higher" | "equal" | "lower") => void;
  playerLevel: number;
  onViewProfile?: (name: string, level: number) => void;
  avatarId?: string;
  avatarImageUrl?: string;
  userId?: string;
}

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function formatTimer(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Наёмники — генерируем относительно статов игрока
function generateMercenary(playerStats: HeroStats, playerLevel: number, index: number): Fighter {
  const MERCENARY_TYPES = [
    { name: "Лазутчик Рикс", avatar: "🗡️" },
    { name: "Страж Морван", avatar: "🛡️" },
    { name: "Лучник Тайра", avatar: "🏹" },
    { name: "Маг Зерул", avatar: "🔮" },
    { name: "Берсерк Горд", avatar: "🪓" },
    { name: "Жрица Алва", avatar: "🌸" },
  ];
  const t = MERCENARY_TYPES[index % MERCENARY_TYPES.length];
  const variance = rnd(-2, 3);
  const str = Math.max(1, playerStats.strength + variance);
  const def = Math.max(1, playerStats.defense + variance);
  const agi = Math.max(1, playerStats.agility + variance);
  const mas = Math.max(1, playerStats.mastery + variance);
  const vit = Math.max(1, playerStats.vitality + variance);
  const hp = 100 + vit * 15 + rnd(-10, 10);
  return {
    name: t.name, avatar: t.avatar,
    level: Math.max(1, playerLevel + rnd(-1, 1)),
    hp, maxHp: hp,
    attack: 12 + str * 2 + mas + rnd(-2, 2),
    defense: 8 + def * 2 + rnd(-2, 2),
    magic: 6 + mas + rnd(-1, 1),
    speed: 10 + agi + rnd(-1, 1),
    isReal: false,
  };
}

function calcDamage(atk: number, def: number, spd: number, eSPD: number): { dmg: number; isCrit: boolean; isMiss: boolean } {
  const missChance = Math.max(5, 20 - spd + eSPD);
  if (rnd(1, 100) <= missChance) return { dmg: 0, isCrit: false, isMiss: true };
  const raw = Math.max(1, atk - def * 0.5 + rnd(-3, 5));
  const isCrit = rnd(1, 100) <= 20;
  return { dmg: Math.round(isCrit ? raw * 1.8 : raw), isCrit, isMiss: false };
}

interface BattleResult {
  logs: BattleLog[];
  winner: "player" | "enemy";
  finalPHp: number;
  finalEHp: number;
  totalPlayerDmg: number;
  totalEnemyDmg: number;
}

function simulateBattle(player: Fighter, enemy: Fighter): BattleResult {
  let pHp = player.hp;
  let eHp = enemy.hp;
  let totalPlayerDmg = 0;
  let totalEnemyDmg = 0;
  const logs: BattleLog[] = [];
  let id = 0;
  const addLog = (entry: Omit<BattleLog, "id">) => { logs.push({ ...entry, id: ++id }); };
  const playerFirst = player.speed >= enemy.speed;
  addLog({ turn: 0, actor: "system", type: "system", text: `⚔️ ${player.name} против ${enemy.name}!` });
  for (let turn = 1; turn <= 20; turn++) {
    const actions: Array<"player" | "enemy"> = playerFirst ? ["player", "enemy"] : ["enemy", "player"];
    for (const actor of actions) {
      if (pHp <= 0 || eHp <= 0) break;
      if (actor === "player") {
        const useMagic = player.magic > player.attack * 0.8 && rnd(1, 100) <= 35;
        const atk = useMagic ? Math.round(player.magic * 1.5) : player.attack;
        const def = useMagic ? Math.round(enemy.defense * 0.2) : enemy.defense;
        const { dmg, isCrit, isMiss } = calcDamage(atk, def, player.speed, enemy.speed);
        if (isMiss) {
          addLog({ turn, actor: "player", type: "miss", text: `${player.name} промахнулся!` });
        } else {
          eHp = Math.max(0, eHp - dmg);
          totalPlayerDmg += dmg;
          addLog({ turn, actor: "player", type: isCrit ? "crit" : "attack", text: `🗡️ ${player.name} наносит ${dmg} урона!${isCrit ? " 💥 КРИТ!" : ""}`, damage: dmg });
          if (eHp <= 0) { addLog({ turn, actor: "system", type: "system", text: `🏆 ${player.name} побеждает!` }); break; }
        }
      } else {
        const useMagic = enemy.magic > enemy.attack * 0.7 && rnd(1, 100) <= 40;
        const atk = useMagic ? Math.round(enemy.magic * 1.5) : enemy.attack;
        const def = useMagic ? Math.round(player.defense * 0.2) : player.defense;
        const { dmg, isCrit, isMiss } = calcDamage(atk, def, enemy.speed, player.speed);
        if (isMiss) {
          addLog({ turn, actor: "enemy", type: "miss", text: `${enemy.name} промахнулся!` });
        } else {
          pHp = Math.max(0, pHp - dmg);
          totalEnemyDmg += dmg;
          addLog({ turn, actor: "enemy", type: isCrit ? "crit" : "attack", text: `${enemy.avatar} ${enemy.name} наносит ${dmg} урона!${isCrit ? " 💥 КРИТ!" : ""}`, damage: dmg });
          if (pHp <= 0) { addLog({ turn, actor: "system", type: "system", text: `💀 ${player.name} повержен...` }); break; }
        }
      }
    }
    if (pHp <= 0 || eHp <= 0) break;
  }
  return { logs, winner: pHp > eHp ? "player" : "enemy", finalPHp: pHp, finalEHp: eHp, totalPlayerDmg, totalEnemyDmg };
}

function hpBar(hp: number, maxHp: number, color = "#c0392b") {
  return (
    <div style={{ height: 8, background: "#d0c090", border: "1px solid #a08040", borderRadius: 3, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${Math.max(0, (hp / maxHp) * 100)}%`, background: color, transition: "width 0.3s" }} />
    </div>
  );
}

function logStyle(log: BattleLog): { bg: string; border: string; color: string } {
  if (log.actor === "system") return { bg: "#f0e8d0", border: "#c8a96e", color: "#5a3a1a" };
  if (log.actor === "player") {
    if (log.type === "crit") return { bg: "#fff3e0", border: "#fb8c00", color: "#6d3000" };
    if (log.type === "miss") return { bg: "#f5f5f5", border: "#bdbdbd", color: "#616161" };
    return { bg: "#fff8e1", border: "#ffca28", color: "#4a3000" };
  }
  if (log.type === "crit") return { bg: "#fce4ec", border: "#e57373", color: "#7f0000" };
  if (log.type === "miss") return { bg: "#f5f5f5", border: "#bdbdbd", color: "#616161" };
  return { bg: "#ffebee", border: "#ef9a9a", color: "#7f0000" };
}

const SEARCH_CATEGORIES = [
  { id: "equal",   label: "Ровня",     icon: "🟢", desc: "Игроки близкого уровня" },
  { id: "lower",   label: "Младшие",   icon: "🔵", desc: "Игроки ниже уровнем" },
  { id: "higher",  label: "Старшие",   icon: "🟡", desc: "Игроки выше уровнем" },
  { id: "mercenaries", label: "Наемники", icon: "⚔️", desc: "Нанятые бойцы" },
  { id: "byLevel", label: "По уровню", icon: "📊", desc: "Поиск по уровню" },
  { id: "byName",  label: "По имени",  icon: "🔍", desc: "Поиск по имени" },
];

type DuelScreen = "menu" | "search" | "fight" | "result";

export default function DuelSection({
  hero, stats, battles, maxBattles, regenTimer,
  onSpendBattle, onDuelEnd, playerLevel, onViewProfile, avatarId = "m1", avatarImageUrl, userId = "",
}: DuelSectionProps) {
  const [screen, setScreen] = useState<DuelScreen>("menu");
  const [searchCategory, setSearchCategory] = useState<string>("");
  const [players, setPlayers] = useState<Fighter[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState<Fighter | null>(null);
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [winner, setWinner] = useState<"player" | "enemy" | null>(null);
  const [reward, setReward] = useState<DuelReward>({ xp: 0, gold: 0, silver: 0, glory: 0 });
  const [battleStats, setBattleStats] = useState<{ finalPHp: number; finalEHp: number; totalPlayerDmg: number; totalEnemyDmg: number } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const player: Fighter = {
    name: hero.name, level: hero.level,
    hp: hero.hp, maxHp: hero.maxHp,
    attack: hero.attack, defense: hero.defense,
    magic: hero.magic, speed: hero.speed,
    avatar: avatarImageUrl ? "img" : getAvatarEmoji(avatarId),
  };

  const loadRealPlayers = async (category: string) => {
    setLoadingPlayers(true);
    try {
      const res = await fetch(`${DUEL_PLAYERS_URL}?limit=20`, {
        headers: { "X-User-Id": userId || localStorage.getItem("heroes_user_id") || "" },
      });
      const data = await res.json();
      let list: Fighter[] = (data.players || []).map((p: Record<string, unknown>) => {
        const str = (p.stat_strength as number) || 5;
        const def = (p.stat_defense as number) || 5;
        const agi = (p.stat_agility as number) || 5;
        const mas = (p.stat_mastery as number) || 5;
        const vit = (p.stat_vitality as number) || 5;
        const lvl = (p.level as number) || 1;
        const hp = 100 + vit * 15;
        return {
          name: p.name as string,
          level: lvl,
          avatar: p.avatar as string,
          hp, maxHp: hp,
          attack: 12 + str * 2 + mas,
          defense: 8 + def * 2,
          magic: 6 + mas,
          speed: 10 + agi,
          isReal: true,
          userId: p.user_id as string,
          duel_wins: p.duel_wins as number || 0,
          duel_losses: p.duel_losses as number || 0,
          glory: p.glory as number || 0,
          xp: p.xp as number || 0,
        };
      });
      if (category === "lower") list = list.filter(p => p.level < playerLevel).slice(0, 10);
      else if (category === "higher") list = list.filter(p => p.level > playerLevel).slice(0, 10);
      else if (category === "equal") list = list.filter(p => Math.abs(p.level - playerLevel) <= 2).slice(0, 10);
      else list = list.slice(0, 10);
      setPlayers(list);
    } catch {
      setPlayers([]);
    }
    setLoadingPlayers(false);
  };

  const loadMercenaries = () => {
    const mercs: Fighter[] = Array.from({ length: 6 }, (_, i) => generateMercenary(stats, playerLevel, i));
    setPlayers(mercs);
    setLoadingPlayers(false);
  };

  const openSearch = (category: string) => {
    setSearchCategory(category);
    setScreen("search");
    setPlayers([]);
    if (category === "mercenaries") {
      loadMercenaries();
    } else {
      loadRealPlayers(category);
    }
  };

  const selectEnemy = (enemy: Fighter) => {
    setSelectedEnemy(enemy);
    setScreen("fight");
    setLogs([]);
    setWinner(null);
  };

  const fight = () => {
    if (!selectedEnemy) return;
    if (!onSpendBattle()) return;
    const { logs: battleLogs, winner: w, finalPHp, finalEHp, totalPlayerDmg, totalEnemyDmg } = simulateBattle(player, selectedEnemy);
    setLogs(battleLogs);
    setWinner(w);
    setBattleStats({ finalPHp, finalEHp, totalPlayerDmg, totalEnemyDmg });
    setShowDetails(false);
    setScreen("result");
    if (w === "player") {
      const r: DuelReward = { xp: rnd(1, 2), gold: 0, silver: rnd(15, 50), glory: 1, damageTaken: totalEnemyDmg };
      setReward(r);
      onDuelEnd("victory", selectedEnemy.name, r);
    } else {
      const r: DuelReward = { xp: 0, gold: 0, silver: 0, glory: 0, damageTaken: totalEnemyDmg };
      setReward(r);
      onDuelEnd("defeat", selectedEnemy.name, r);
    }
  };

  const getAvatarDisplay = (f: Fighter, size = 48) => {
    const avatarEmoji = f.isReal ? (getAvatarEmoji(f.avatar) || f.avatar || "⚔️") : f.avatar;
    return (
      <div style={{
        width: size, height: size, borderRadius: 6, background: "#2a1010",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.6, border: "2px solid #c8a96e", overflow: "hidden", flexShrink: 0,
      }}>
        {avatarEmoji}
      </div>
    );
  };

  // ── ЭКРАН 1: Меню дуэли ────────────────────────────────────────────────────
  if (screen === "menu") {
    return (
      <div className="animate-fade-in">
        <div style={{ textAlign: "center", borderBottom: "1px solid var(--parchment-border)", paddingBottom: 8, marginBottom: 0 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "var(--text-dark)", marginBottom: 2 }}>
            Дуэль
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-medium)" }}>Покажи, на что ты способен!</p>
        </div>

        {/* Боевые заряды */}
        <div style={{ padding: "8px 14px", borderBottom: "1px solid #e2d9bc", background: "#f5f0e0", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-medium)" }}>Поиск</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)" }}>⚔️ {battles}/{maxBattles}</span>
          {regenTimer !== null && battles < maxBattles && (
            <span style={{ fontSize: 11, color: "var(--gold)", marginLeft: 4 }}>+1 через {formatTimer(regenTimer)}</span>
          )}
        </div>

        {/* Блокировка при низком HP */}
        {player.hp < 100 && (
          <div style={{ margin: "10px 14px", padding: "10px 12px", background: "#fff3cd", border: "1px solid #f0a500", borderRadius: 6, fontSize: 13, color: "#7a4f00", textAlign: "center" }}>
            ❤️ Слишком мало здоровья для боя. Восстановись до <b>100 HP</b> (сейчас: {player.hp}).
          </div>
        )}

        {/* Категории */}
        <div style={{ background: "#faf6e8", opacity: player.hp < 100 ? 0.45 : 1, pointerEvents: player.hp < 100 ? "none" : "auto" }}>
          {SEARCH_CATEGORIES.map((cat, i) => (
            <div
              key={cat.id}
              onClick={() => openSearch(cat.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "13px 16px",
                borderBottom: i < SEARCH_CATEGORIES.length - 1 ? "1px solid #e2d9bc" : "none",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 18, width: 22, textAlign: "center" }}>{cat.icon}</span>
              <span style={{ fontSize: 15, color: "var(--text-dark)", fontWeight: 500 }}>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── ЭКРАН 2: Список противников ───────────────────────────────────────────
  if (screen === "search") {
    const catInfo = SEARCH_CATEGORIES.find(c => c.id === searchCategory);
    return (
      <div className="animate-fade-in">
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 12px" }}>
          <button onClick={() => setScreen("menu")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--crimson)", display: "flex", alignItems: "center", gap: 3 }}>
            ← Назад
          </button>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: "var(--text-dark)" }}>
            {catInfo?.icon} {catInfo?.label}
          </span>
        </div>

        {loadingPlayers && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-medium)", fontSize: 13 }}>
            Поиск противников...
          </div>
        )}

        {!loadingPlayers && players.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-medium)", fontSize: 13 }}>
            Противников не найдено. Попробуй другую категорию.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {players.map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              onClick={() => selectEnemy(p)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderBottom: i < players.length - 1 ? "1px solid #e2d9bc" : "none",
                background: "#faf6e8", cursor: "pointer",
              }}
            >
              {getAvatarDisplay(p, 44)}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dark)" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-medium)" }}>
                  Ур. {p.level} · ⚔️ {p.attack} · 🛡️ {p.defense}
                  {p.isReal && p.duel_wins !== undefined && <> · 🏆 {p.duel_wins} побед</>}
                </div>
              </div>
              <span style={{ fontSize: 12, color: "var(--crimson)", fontWeight: 600 }}>Вызвать →</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── ЭКРАН 3: Бой (выбранный противник, картинка 5) ────────────────────────
  if (screen === "fight" && selectedEnemy) {
    const STAT_ICONS: [string, string, number, number][] = [
      ["💪", "Сила", stats.strength, selectedEnemy.attack - 12],
      ["🛡️", "Защита", stats.defense, selectedEnemy.defense - 8],
      ["🌀", "Ловкость", stats.agility, selectedEnemy.speed - 10],
      ["🤚", "Мастерство", stats.mastery, (selectedEnemy.magic - 6)],
      ["🌿", "Живучесть", stats.vitality, Math.round((selectedEnemy.maxHp - 100) / 15)],
    ];

    return (
      <div className="animate-fade-in">
        <div style={{ textAlign: "center", padding: "8px 0 12px", borderBottom: "1px solid var(--parchment-border)" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: "var(--text-dark)" }}>
            Дуэль
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dark)", fontWeight: 600 }}>
            <span style={{ textTransform: "uppercase" }}>{hero.name}</span>
            {" "}против{" "}
            <span style={{ color: "var(--crimson)" }}>{selectedEnemy.name}</span>
          </p>
        </div>

        {/* Портреты */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, padding: "16px 0 12px" }}>
          {/* Игрок */}
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 80, height: 80, borderRadius: 8, background: "#2a1010",
              border: "2px solid #c8a96e", overflow: "hidden", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 46, margin: "0 auto 4px",
            }}>
              {avatarImageUrl
                ? <img src={avatarImageUrl} alt="me" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : getAvatarEmoji(avatarId)
              }
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dark)" }}>{hero.name}</div>
          </div>
          {/* Враг */}
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 80, height: 80, borderRadius: 8, background: "#2a1010",
              border: "2px solid #c8a96e", overflow: "hidden", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 46, margin: "0 auto 4px",
            }}>
              {getAvatarEmoji(selectedEnemy.avatar) || selectedEnemy.avatar || "⚔️"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--crimson)" }}>{selectedEnemy.name}</div>
          </div>
        </div>

        {/* Сравнение параметров */}
        <div style={{ padding: "0 16px 12px" }}>
          {STAT_ICONS.map(([icon, , playerVal, enemyVal]) => (
            <div key={icon} style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", gap: 4, alignItems: "center", padding: "3px 0", fontSize: 13 }}>
              <div style={{ textAlign: "right", fontWeight: 700, color: "var(--text-dark)" }}>{playerVal}</div>
              <div style={{ textAlign: "center", fontSize: 18 }}>{icon}</div>
              <div style={{ textAlign: "left", fontWeight: 700, color: "var(--text-dark)" }}>{enemyVal}</div>
            </div>
          ))}
        </div>

        {/* Кнопка Сражаться */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <button
            onClick={fight}
            disabled={battles <= 0}
            style={{
              padding: "10px 36px", borderRadius: 20, fontWeight: 700, fontSize: 16,
              border: "2px solid #8b1a1a",
              background: battles > 0 ? "linear-gradient(180deg,#c0392b,#8b1a1a)" : "#ccc",
              color: battles > 0 ? "#fff" : "#999",
              cursor: battles > 0 ? "pointer" : "not-allowed",
              boxShadow: battles > 0 ? "0 3px 8px rgba(0,0,0,0.3)" : "none",
              fontFamily: "'Cormorant Garamond', serif",
              letterSpacing: "0.05em",
            }}
          >
            ⚔️ Сражаться
          </button>
        </div>

        {/* Доп. параметры противника */}
        {selectedEnemy.isReal && (
          <div style={{ padding: "0 4px", fontSize: 13, color: "var(--text-medium)", lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 }}>
              Другие параметры {selectedEnemy.name}:
            </div>
            <div>🏅 Уровень: {selectedEnemy.level}</div>
            <div>📈 Опыт: {selectedEnemy.xp || 0}</div>
            <div>🏆 Побед: {selectedEnemy.duel_wins || 0}</div>
            <div>⭐ Слава: {selectedEnemy.glory || 0}</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={() => setScreen("search")} style={{ flex: 1, padding: "9px", borderRadius: 4, fontWeight: 600, fontSize: 13, background: "#f5f0e0", color: "var(--text-dark)", border: "1px solid var(--parchment-border)", cursor: "pointer" }}>
            ← Следующий
          </button>
          <button onClick={() => setScreen("menu")} style={{ padding: "9px 14px", borderRadius: 4, fontWeight: 600, fontSize: 13, background: "#f5f0e0", color: "var(--text-dark)", border: "1px solid var(--parchment-border)", cursor: "pointer" }}>
            К выбору
          </button>
        </div>

        {battles === 0 && (
          <div style={{ marginTop: 8, padding: "10px", borderRadius: 4, background: "#fff5f0", border: "1px solid #fca5a5", fontSize: 12, color: "#9b1c1c", textAlign: "center" }}>
            ⏳ Боёв не осталось. Восстановление {regenTimer !== null ? `через ${formatTimer(regenTimer)}` : "скоро"}
          </div>
        )}
      </div>
    );
  }

  // ── ЭКРАН 4: Результат ────────────────────────────────────────────────────
  if (screen === "result") {
    const isWin = winner === "player";
    const rowStyle: React.CSSProperties = {
      display: "flex", justifyContent: "space-between",
      fontSize: 13, padding: "2px 0", color: "var(--text-dark)",
    };
    const labelStyle: React.CSSProperties = { color: "var(--text-medium)", marginRight: 8 };
    return (
      <div className="animate-fade-in" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        {/* Заголовок */}
        <div style={{ textAlign: "center", padding: "10px 0 12px", borderBottom: "1px solid var(--parchment-border)", marginBottom: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-dark)", margin: 0 }}>Итог боя</h2>
        </div>

        {/* Победа / Поражение */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: isWin ? "#2a6a1a" : "#9b1c1c", marginBottom: 3 }}>
            {isWin ? "Ты победил" : "Ты проиграл"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-medium)", marginBottom: isWin ? 6 : 0 }}>
            Причина — {isWin ? "Победитель нанес больше суммарного урона" : "Противник нанес больше суммарного урона"}
          </div>
          {isWin && reward && (
            <div style={{ fontSize: 13, color: "var(--text-dark)" }}>
              {reward.xp > 0 && <div style={rowStyle}><span>Опыт 🎓</span><span>{reward.xp}</span></div>}
              {reward.silver > 0 && <div style={rowStyle}><span>Серебро 💰</span><span>{reward.silver}</span></div>}
              {reward.glory > 0 && <div style={rowStyle}><span>Слава 🌟</span><span>{reward.glory}</span></div>}
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--parchment-border)", margin: "8px 0" }} />

        {/* Нанесённый урон */}
        {battleStats && (
          <>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-dark)", marginBottom: 4 }}>Нанесенный урон:</div>
              <div style={rowStyle}>
                <span style={labelStyle}>{player.name}:</span>
                <span>{battleStats.totalPlayerDmg}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>{selectedEnemy?.name}:</span>
                <span>{battleStats.totalEnemyDmg}</span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--parchment-border)", margin: "8px 0" }} />

            {/* Остаток здоровья */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-dark)", marginBottom: 4 }}>Осталось здоровья:</div>
              <div style={rowStyle}>
                <span style={labelStyle}>{player.name}:</span>
                <span style={{ color: battleStats.finalPHp > 0 ? "#2a6a1a" : "#9b1c1c" }}>{battleStats.finalPHp}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>{selectedEnemy?.name}:</span>
                <span style={{ color: battleStats.finalEHp > 0 ? "#2a6a1a" : "#9b1c1c" }}>{battleStats.finalEHp}</span>
              </div>
            </div>
          </>
        )}

        {/* Детали (логи) — сворачиваемый блок */}
        <div style={{ borderTop: "1px solid var(--parchment-border)", marginBottom: 10 }}>
          <button
            onClick={() => setShowDetails((v) => !v)}
            style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "8px 0", fontSize: 13, color: "var(--text-dark)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
          >
            <span style={{ fontSize: 12, opacity: 0.6 }}>{showDetails ? "▲" : "▼"}</span>
            Детали
          </button>
          {showDetails && (
            <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 220, overflowY: "auto", paddingBottom: 4 }}>
              {logs.map((log) => {
                const { bg, border, color } = logStyle(log);
                return (
                  <div key={log.id} style={{ fontSize: 11, padding: "3px 7px", borderRadius: 3, background: bg, border: `1px solid ${border}`, color, lineHeight: 1.4, fontFamily: "sans-serif" }}>
                    {log.turn > 0 && <span style={{ opacity: 0.5, fontSize: 10, marginRight: 4 }}>Ход {log.turn}.</span>}
                    {log.text}
                  </div>
                );
              })}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setScreen("fight"); setLogs([]); setWinner(null); setBattleStats(null); }} style={{ flex: 1, padding: "10px", borderRadius: 4, fontWeight: 700, fontSize: 14, background: "var(--crimson)", color: "var(--parchment)", border: "none", cursor: "pointer", fontFamily: "'Cormorant Garamond', serif" }}>
            ⚔️ Следующий
          </button>
          <button onClick={() => setScreen("search")} style={{ flex: 1, padding: "10px", borderRadius: 4, fontWeight: 600, fontSize: 13, background: "#f5f0e0", color: "var(--text-dark)", border: "1px solid var(--parchment-border)", cursor: "pointer", fontFamily: "'Cormorant Garamond', serif" }}>
            Другой противник
          </button>
        </div>
      </div>
    );
  }

  return null;
}