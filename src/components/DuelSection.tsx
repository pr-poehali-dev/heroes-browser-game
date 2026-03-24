/**
 * DuelSection.tsx — Система дуэлей (PvE бой)
 *
 * За что отвечает:
 * - Генерация случайного противника (8 шаблонов: Громозека, Ведьмак77 и др.)
 * - Пошаговая симуляция боя (до 20 ходов)
 * - Формулы урона: base = atk - def×0.5, крит 20% (×1.8), промах = max(5%, 20% - spd + eSPD)
 * - Магические атаки (если magic > attack×0.8, шанс 35%)
 * - Лог боя с цветовой индикацией (криты, промахи, обычные атаки)
 * - Награды за победу: XP, серебро, слава
 * - Кнопки: «В бой!», «Другой противник», «Новый бой»
 * - Просмотр профиля противника
 *
 * Экспортирует:
 * - DuelReward — интерфейс награды за дуэль
 * - DuelSection — основной компонент
 */
import { useState, useRef, useEffect } from "react";
import { HeroStats } from "@/pages/Index";
import { getAvatarEmoji, getAvatarLabel } from "@/components/SectionPage";

// ── Противники ────────────────────────────────────────────────────────────────
const ENEMIES = [
  { name: "Громозека", avatar: "👹" },
  { name: "Ведьмак77", avatar: "🧙" },
  { name: "СтальнойГарт", avatar: "⚔️" },
  { name: "ТёмнаяЗвезда", avatar: "🌑" },
  { name: "Скиталец", avatar: "🗺️" },
  { name: "Варвар", avatar: "🪓" },
  { name: "Чародей", avatar: "🔮" },
  { name: "Следопыт", avatar: "🏹" },
];

interface Fighter {
  name: string; level: number; hp: number; maxHp: number;
  attack: number; defense: number; magic: number; speed: number; avatar: string;
}

interface BattleLog {
  id: number; turn: number; actor: "player" | "enemy" | "system";
  type: "attack" | "magic" | "miss" | "crit" | "system";
  text: string; damage?: number;
}

type BattlePhase = "ready" | "result";

export interface DuelReward {
  xp: number; gold: number; silver: number; glory: number;
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
}

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function formatTimer(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function generateEnemy(playerLevel: number): Fighter {
  const lvl = Math.max(1, playerLevel - rnd(0, 2));
  const hp = 80 + lvl * 20 + rnd(-10, 10);
  const idx = rnd(0, ENEMIES.length - 1);
  return {
    name: ENEMIES[idx].name,
    avatar: ENEMIES[idx].avatar,
    level: lvl, hp, maxHp: hp,
    attack: 8 + lvl * 4 + rnd(-2, 2),
    defense: 5 + lvl * 3 + rnd(-2, 2),
    magic: 4 + lvl * 2 + rnd(-2, 2),
    speed: 7 + lvl * 2 + rnd(-1, 1),
  };
}

function calcDamage(atk: number, def: number, spd: number, eSPD: number): { dmg: number; isCrit: boolean; isMiss: boolean } {
  const missChance = Math.max(5, 20 - spd + eSPD);
  if (rnd(1, 100) <= missChance) return { dmg: 0, isCrit: false, isMiss: true };
  const raw = Math.max(1, atk - def * 0.5 + rnd(-3, 5));
  const isCrit = rnd(1, 100) <= 20;
  return { dmg: Math.round(isCrit ? raw * 1.8 : raw), isCrit, isMiss: false };
}

function simulateBattle(player: Fighter, enemy: Fighter): { logs: BattleLog[]; winner: "player" | "enemy" } {
  let pHp = player.hp;
  let eHp = enemy.hp;
  const logs: BattleLog[] = [];
  let id = 0;
  const addLog = (entry: Omit<BattleLog, "id">) => { logs.push({ ...entry, id: ++id }); };

  const playerFirst = player.speed >= enemy.speed;
  addLog({ turn: 0, actor: "system", type: "system", text: `⚔️ Дуэль начата! ${player.name} vs ${enemy.name}!` });
  addLog({ turn: 0, actor: "system", type: "system", text: playerFirst ? `${player.name} действует первым (скорость ${player.speed} vs ${enemy.speed})` : `${enemy.name} действует первым (скорость ${enemy.speed} vs ${player.speed})` });

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
          const typeLabel = useMagic ? "магией" : "атакой";
          addLog({ turn, actor: "player", type: isCrit ? "crit" : "attack", text: `${player.avatar ?? "🗡️"} ${player.name} наносит ${dmg} урона ${typeLabel}!${isCrit ? " 💥 КРИТ!" : ""}`, damage: dmg });
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
          const typeLabel = useMagic ? "магией" : "атакой";
          addLog({ turn, actor: "enemy", type: isCrit ? "crit" : "attack", text: `${enemy.avatar} ${enemy.name} наносит ${dmg} урона ${typeLabel}!${isCrit ? " 💥 КРИТ!" : ""}`, damage: dmg });
          if (pHp <= 0) { addLog({ turn, actor: "system", type: "system", text: `💀 ${player.name} повержен...` }); break; }
        }
      }
    }
    if (pHp <= 0 || eHp <= 0) break;
  }

  const winner = pHp > eHp ? "player" : "enemy";
  return { logs, winner };
}

function hpBar(hp: number, maxHp: number, color = "#ee3333") {
  return (
    <div style={{ height: 8, background: "#d0c090", border: "1px solid #a08040", borderRadius: 3, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${Math.max(0, (hp / maxHp) * 100)}%`, background: `linear-gradient(90deg,${color}99,${color})`, transition: "width 0.3s" }} />
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

export default function DuelSection({
  hero, stats, battles, maxBattles, regenTimer,
  onSpendBattle, onDuelEnd, playerLevel, onViewProfile,
}: DuelSectionProps) {
  const [phase, setPhase] = useState<BattlePhase>("ready");
  const [enemy, setEnemy] = useState<Fighter>(() => generateEnemy(playerLevel));
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [winner, setWinner] = useState<"player" | "enemy" | null>(null);
  const [reward, setReward] = useState<DuelReward>({ xp: 0, gold: 0, silver: 0, glory: 0 });
  const logsEndRef = useRef<HTMLDivElement>(null);

  const player: Fighter = {
    name: hero.name,
    level: hero.level,
    hp: hero.hp,
    maxHp: hero.maxHp,
    attack: hero.attack,
    defense: hero.defense,
    magic: hero.magic,
    speed: hero.speed,
    avatar: "🗡️",
  };

  const avatarId = localStorage.getItem("heroes_avatar") ?? "m1";

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const findNewEnemy = () => {
    setEnemy(generateEnemy(playerLevel));
    setLogs([]);
    setWinner(null);
    setPhase("ready");
  };

  const fight = () => {
    if (!onSpendBattle()) return;
    const { logs: battleLogs, winner: w } = simulateBattle(player, enemy);
    setLogs(battleLogs);
    setWinner(w);
    setPhase("result");
    if (w === "player") {
      const r: DuelReward = { xp: rnd(1, 2), gold: 0, silver: rnd(15, 50), glory: 1 };
      setReward(r);
      onDuelEnd("victory", enemy.name, r);
    } else {
      const r: DuelReward = { xp: 0, gold: 0, silver: 0, glory: 0 };
      setReward(r);
      onDuelEnd("defeat", enemy.name, r);
    }
  };

  // Вычисляем финальный HP из симуляции
  const finalPlayerHpPct = winner === "player" ? 0.3 : 0; // приблизительно для отображения
  const finalEnemyHpPct = winner === "enemy" ? 0.3 : 0;

  const statRow = (icon: string, label: string, playerVal: number | string, enemyVal: number | string) => (
    <div key={label} style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 4, alignItems: "center", fontSize: 12, padding: "3px 0" }}>
      <div style={{ textAlign: "right", color: "var(--text-dark)", fontWeight: 600 }}>{playerVal}</div>
      <div style={{ textAlign: "center", color: "var(--text-medium)", fontSize: 11 }}>{icon} {label}</div>
      <div style={{ textAlign: "left", color: "var(--text-dark)", fontWeight: 600 }}>{enemyVal}</div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>⚔️ Дуэль</h2>

      {/* Счётчик боёв */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, background: "#faf6e8", border: "1px solid var(--parchment-border)", borderRadius: 4, padding: "8px 12px" }}>
        <span style={{ fontSize: 13, color: "var(--text-medium)" }}>Боевые заряды:</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)" }}>⚔️ {battles}/{maxBattles}</span>
        {regenTimer !== null && battles < maxBattles && (
          <span style={{ fontSize: 11, color: "var(--gold)", marginLeft: 4 }}>+1 через {formatTimer(regenTimer)}</span>
        )}
        {battles === 0 && (
          <span style={{ fontSize: 11, color: "#cc4444", marginLeft: 2 }}>Боёв нет!</span>
        )}
      </div>

      {/* Карточки противников */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 28px 1fr", gap: 8, alignItems: "stretch", marginBottom: 12 }}>
        {/* Игрок */}
        <div className="game-panel-inner" style={{ borderRadius: 6, padding: "12px 10px", textAlign: "center", border: "2px solid #c8a96e" }}>
          <div style={{ fontSize: 40, marginBottom: 6, lineHeight: 1 }}>{getAvatarEmoji(avatarId)}</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-dark)", marginBottom: 1 }}>{player.name}</div>
          <div style={{ fontSize: 11, color: "var(--gold)", marginBottom: 6 }}>Ур. {player.level} · {getAvatarLabel(avatarId)}</div>
          {phase === "result" ? hpBar(winner === "player" ? Math.floor(player.maxHp * 0.25 + Math.random() * player.maxHp * 0.4) : 0, player.maxHp) : hpBar(player.hp, player.maxHp)}
          <div style={{ fontSize: 10, color: "var(--text-medium)", marginTop: 3 }}>{phase === "result" ? (winner === "player" ? "Выжил" : "Повержен") : `${player.hp}/${player.maxHp} HP`}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: "var(--crimson)" }}>VS</span>
        </div>

        {/* Враг */}
        <div className="game-panel-inner" style={{ borderRadius: 6, padding: "12px 10px", textAlign: "center", border: "2px solid #e57373", cursor: "pointer" }}
          onClick={() => onViewProfile?.(enemy.name, enemy.level)}>
          <div style={{ width: 48, height: 48, borderRadius: 6, background: "#3a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 6px", border: "2px solid #e57373" }}>
            {enemy.avatar}
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-dark)", marginBottom: 1, textDecoration: "underline dotted" }}>{enemy.name}</div>
          <div style={{ fontSize: 11, color: "var(--gold)", marginBottom: 6 }}>Ур. {enemy.level}</div>
          {phase === "result" ? hpBar(winner === "enemy" ? Math.floor(enemy.maxHp * 0.15 + Math.random() * enemy.maxHp * 0.3) : 0, enemy.maxHp, "#7c3aed") : hpBar(enemy.hp, enemy.maxHp, "#7c3aed")}
          <div style={{ fontSize: 10, color: "var(--text-medium)", marginTop: 3 }}>{phase === "result" ? (winner === "enemy" ? "Выжил" : "Повержен") : `${enemy.hp}/${enemy.maxHp} HP`}</div>
        </div>
      </div>

      {/* Сравнение параметров */}
      <div className="game-panel-inner" style={{ borderRadius: 4, padding: "10px 12px", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-medium)", textAlign: "center", marginBottom: 6 }}>ХАРАКТЕРИСТИКИ</div>
        {statRow("⚔️", "Атака", player.attack, enemy.attack)}
        {statRow("🛡️", "Защита", player.defense, enemy.defense)}
        {statRow("🔮", "Магия", player.magic, enemy.magic)}
        {statRow("🏃", "Скорость", player.speed, enemy.speed)}
        {statRow("❤️", "HP", `${player.hp}/${player.maxHp}`, `${enemy.hp}/${enemy.maxHp}`)}
        {statRow("💪", "Сила", stats.strength, "?")}
        {statRow("⚔️", "Мастерство", stats.mastery, "?")}
      </div>

      {/* Лог боя */}
      {logs.length > 0 && (
        <div className="game-panel-inner" style={{ borderRadius: 4, padding: "8px 10px", marginBottom: 12, maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {logs.map((log) => {
            const { bg, border, color } = logStyle(log);
            return (
              <div key={log.id} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 3, background: bg, border: `1px solid ${border}`, color, lineHeight: 1.5 }}>
                {log.turn > 0 && <span style={{ opacity: 0.5, fontSize: 10, marginRight: 4 }}>Ход {log.turn}.</span>}
                {log.text}
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>
      )}

      {/* Результат */}
      {phase === "result" && winner === "player" && (
        <div style={{ textAlign: "center", padding: "14px", background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "2px solid #4ade80", borderRadius: 6, marginBottom: 10 }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🏆</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: "#15803d", marginBottom: 4 }}>Победа!</div>
          <div style={{ fontSize: 13, color: "#166534", marginBottom: 12 }}>
            {reward.glory > 0 && <>{reward.glory} ⭐&nbsp;·&nbsp;</>}
            {reward.xp > 0 && <>{reward.xp} опыта&nbsp;·&nbsp;</>}
            {reward.silver > 0 && <>{reward.silver} серебра</>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={findNewEnemy} style={{ flex: 1, padding: "8px", borderRadius: 4, fontWeight: 700, fontSize: 13, background: "var(--crimson)", color: "var(--parchment)", border: "none", cursor: "pointer" }}>
              Новая дуэль
            </button>
          </div>
        </div>
      )}

      {phase === "result" && winner === "enemy" && (
        <div style={{ textAlign: "center", padding: "14px", background: "linear-gradient(135deg,#fff5f5,#fce4ec)", border: "2px solid #ef9a9a", borderRadius: 6, marginBottom: 10 }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>💀</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: "#9b1c1c", marginBottom: 4 }}>Поражение...</div>
          <button onClick={findNewEnemy} style={{ padding: "8px 20px", borderRadius: 4, fontWeight: 700, fontSize: 13, background: "#7f1d1d", color: "#fef2f2", border: "none", cursor: "pointer" }}>
            Снова в бой
          </button>
        </div>
      )}

      {/* Кнопки действий */}
      {phase === "ready" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fight} disabled={battles <= 0}
            style={{ flex: 1, padding: "12px", borderRadius: 4, fontWeight: 700, fontSize: 15, background: battles > 0 ? "var(--crimson)" : "#ccc", color: battles > 0 ? "var(--parchment)" : "#999", border: "none", cursor: battles > 0 ? "pointer" : "not-allowed", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.05em" }}>
            ⚔️ Напасть
          </button>
          <button onClick={findNewEnemy}
            style={{ padding: "12px 14px", borderRadius: 4, fontWeight: 600, fontSize: 13, background: "#f5f0e0", color: "var(--text-dark)", border: "1px solid var(--parchment-border)", cursor: "pointer" }}>
            🔄
          </button>
        </div>
      )}

      {battles === 0 && phase === "ready" && (
        <div style={{ marginTop: 8, padding: "10px", borderRadius: 4, background: "#fff5f0", border: "1px solid #fca5a5", fontSize: 12, color: "#9b1c1c", textAlign: "center" }}>
          ⏳ Боёв не осталось. Восстановление {regenTimer !== null ? `через ${formatTimer(regenTimer)}` : "скоро"}
        </div>
      )}

      {/* Дуэли заблокированы в походе — проп isCampaignActive не передаём, 
          это блокируется в MainPage. Если всё же нужно — добавить флаг */}
    </div>
  );
}