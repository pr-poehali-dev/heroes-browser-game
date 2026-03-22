import { useState, useRef, useEffect } from "react";

interface Fighter {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  magic: number;
  speed: number;
  avatar: string;
}

interface BattleLog {
  id: number;
  turn: number;
  actor: "player" | "enemy";
  type: "attack" | "magic" | "miss" | "crit" | "defend" | "system";
  text: string;
  damage?: number;
}

const ENEMY_NAMES = ["Громозека", "Ведьмак77", "Стальной", "ТёмнаяЗвезда", "Скиталец", "Варвар", "Чародей", "Следопыт"];
const ENEMY_AVATARS = ["👹", "🧙", "⚔️", "🌑", "🗺️", "🪓", "🔮", "🏹"];

type BattlePhase = "searching" | "ready" | "fighting" | "victory" | "defeat";

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

interface HeroProps {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  magic: number;
  speed: number;
}

export interface DuelReward {
  xp: number;
  gold: number;
  silver: number;
  glory: number;
}

interface DuelSectionProps {
  hero: HeroProps;
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

function formatTimer(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function generateEnemy(playerLevel: number): Fighter {
  const enemyLevel = Math.max(1, playerLevel - rnd(1, 2));
  const idx = rnd(0, ENEMY_NAMES.length - 1);
  const hp = 80 + enemyLevel * 20 + rnd(-10, 10);
  return {
    name: ENEMY_NAMES[idx],
    level: enemyLevel,
    hp,
    maxHp: hp,
    attack: 8 + enemyLevel * 4 + rnd(-2, 2),
    defense: 5 + enemyLevel * 3 + rnd(-2, 2),
    magic: 4 + enemyLevel * 2 + rnd(-2, 2),
    speed: 7 + enemyLevel * 2 + rnd(-1, 1),
    avatar: ENEMY_AVATARS[idx],
  };
}

const AVATAR_URL =
  "https://cdn.poehali.dev/projects/e03d01dd-c207-488c-aa14-9e40184b6c24/bucket/884f7408-826e-40ed-b0c4-6d765a19bc86.jpg";

export default function DuelSection({
  hero: heroBase,
  battles,
  maxBattles,
  regenTimer,
  onSpendBattle,
  onDuelEnd,
  playerLevel,
  onViewProfile,
}: DuelSectionProps) {
  const [phase, setPhase] = useState<BattlePhase>("searching");
  const [enemy, setEnemy] = useState<Fighter | null>(null);
  const [playerHp, setPlayerHp] = useState(heroBase.hp);
  const [enemyHp, setEnemyHp] = useState(0);
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [turn, setTurn] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [playerShake, setPlayerShake] = useState(false);
  const [enemyShake, setEnemyShake] = useState(false);
  const [reward, setReward] = useState<DuelReward>({ xp: 0, gold: 0, silver: 0, glory: 0 });
  const [actionCooldown, setActionCooldown] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logId = useRef(0);

  const player: Fighter = {
    name: heroBase.name,
    level: heroBase.level,
    hp: playerHp,
    maxHp: heroBase.maxHp,
    attack: heroBase.attack,
    defense: heroBase.defense,
    magic: heroBase.magic,
    speed: heroBase.speed,
    avatar: "🗡️",
  };

  // Авто-поиск при входе на вкладку
  useEffect(() => {
    if (battles > 0) {
      const e = generateEnemy(playerLevel);
      setEnemy(e);
      setEnemyHp(e.maxHp);
      setPlayerHp(heroBase.hp);
      setPhase("ready");
    }
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (entry: Omit<BattleLog, "id">) => {
    logId.current += 1;
    setLogs((prev) => [...prev, { ...entry, id: logId.current }]);
  };

  const findNewEnemy = () => {
    const e = generateEnemy(playerLevel);
    setEnemy(e);
    setEnemyHp(e.maxHp);
    setPlayerHp(heroBase.hp);
    setLogs([]);
    setTurn(1);
    setActionCooldown(false);
    setIsAnimating(false);
    setPhase("ready");
  };

  const startBattle = () => {
    if (!onSpendBattle()) return;
    setPhase("fighting");
    addLog({ turn: 0, actor: "system", type: "system", text: `⚔️ Дуэль начата! ${player.name} против ${enemy!.name}!` });
    if (player.speed >= enemy!.speed) {
      addLog({ turn: 0, actor: "system", type: "system", text: `${player.name} действует первым (скорость ${player.speed} vs ${enemy!.speed})` });
    } else {
      addLog({ turn: 0, actor: "system", type: "system", text: `${enemy!.name} действует первым (скорость ${enemy!.speed} vs ${player.speed})` });
    }
  };

  const calcDamage = (attacker: Fighter, defender: Fighter, type: "attack" | "magic"): { dmg: number; isCrit: boolean; isMiss: boolean } => {
    const missChance = Math.max(5, 20 - attacker.speed + defender.speed);
    if (rnd(1, 100) <= missChance) return { dmg: 0, isCrit: false, isMiss: true };
    const base = type === "attack" ? attacker.attack : attacker.magic * 1.5;
    const reduction = type === "attack" ? defender.defense * 0.6 : defender.defense * 0.2;
    const raw = Math.max(1, base - reduction + rnd(-3, 4));
    const isCrit = rnd(1, 100) <= 20;
    return { dmg: Math.round(isCrit ? raw * 1.8 : raw), isCrit, isMiss: false };
  };

  const enemyTurn = (curEnemyHp: number, curPlayerHp: number, t: number) => {
    if (!enemy) return;
    const useMagic = enemy.magic > enemy.attack * 0.7 && rnd(1, 100) <= 40;
    const { dmg, isCrit, isMiss } = calcDamage(enemy, player, useMagic ? "magic" : "attack");

    if (isMiss) {
      addLog({ turn: t, actor: "enemy", type: "miss", text: `${enemy.name} промахнулся!` });
    } else {
      const typeLabel = useMagic ? "магией" : "атакой";
      const critLabel = isCrit ? " 💥 КРИТ!" : "";
      addLog({
        turn: t, actor: "enemy",
        type: isCrit ? "crit" : (useMagic ? "magic" : "attack"),
        text: `${enemy.avatar} ${enemy.name} наносит ${dmg} урона ${typeLabel}!${critLabel}`,
        damage: dmg,
      });
      const newPlayerHp = Math.max(0, curPlayerHp - dmg);
      setPlayerHp(newPlayerHp);
      setPlayerShake(true);
      setTimeout(() => setPlayerShake(false), 400);

      if (newPlayerHp <= 0) {
        addLog({ turn: t, actor: "system", type: "system", text: `💀 ${player.name} повержен...` });
        setPhase("defeat");
        setReward({ xp: 0, gold: 0, silver: 0, glory: 0 });
        onDuelEnd("defeat", enemy.name, { xp: 0, gold: 0, silver: 0, glory: 0 });
        return;
      }
    }
    setTurn(t + 1);
    setIsAnimating(false);
    setActionCooldown(false);
  };

  const playerAttack = () => {
    if (!enemy || phase !== "fighting" || isAnimating || actionCooldown) return;
    setIsAnimating(true);
    setActionCooldown(true);

    let curEnemyHp = enemyHp;
    const curPlayerHp = playerHp;
    const t = turn;

    const { dmg, isCrit, isMiss } = calcDamage(player, enemy, "attack");
    if (isMiss) {
      addLog({ turn: t, actor: "player", type: "miss", text: `${player.name} промахнулся!` });
    } else {
      const critLabel = isCrit ? " 💥 КРИТ!" : "";
      addLog({
        turn: t, actor: "player",
        type: isCrit ? "crit" : "attack",
        text: `🗡️ ${player.name} наносит ${dmg} урона!${critLabel}`,
        damage: dmg,
      });
      curEnemyHp = Math.max(0, curEnemyHp - dmg);
      setEnemyHp(curEnemyHp);
      setEnemyShake(true);
      setTimeout(() => setEnemyShake(false), 400);

      if (curEnemyHp <= 0) {
        const silverGain = rnd(15, 50);
        const gloryGain = 1;
        const xpGain = rnd(1, 2);
        const parts = [`+${gloryGain} ⭐`, `+${xpGain} опыта`, `+${silverGain} серебра`];
        addLog({ turn: t, actor: "system", type: "system", text: `🏆 Победа! ${parts.join(" · ")}` });
        setPhase("victory");
        const r = { xp: xpGain, gold: 0, silver: silverGain, glory: gloryGain };
        setReward(r);
        onDuelEnd("victory", enemy.name, r);
        setIsAnimating(false);
        setActionCooldown(false);
        return;
      }
    }

    setTimeout(() => enemyTurn(curEnemyHp, curPlayerHp, t), 700);
  };

  const hpBar = (hp: number, maxHp: number) => (
    <div style={{ height: 8, background: "#d0c090", border: "1px solid #a08040", borderRadius: 3, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${Math.max(0, (hp / maxHp) * 100)}%`, background: "linear-gradient(90deg,#aa1111,#ee3333)", transition: "width 0.4s ease" }} />
    </div>
  );

  const logColor = (log: BattleLog) => {
    if (log.type === "system") return { bg: "#f0e8d0", border: "#c8a96e", text: "#5a3a1a" };
    if (log.actor === "player") {
      if (log.type === "crit") return { bg: "#fff3e0", border: "#fb8c00", text: "#6d3000" };
      if (log.type === "miss") return { bg: "#f5f5f5", border: "#bdbdbd", text: "#616161" };
      return { bg: "#fff8e1", border: "#ffca28", text: "#4a3000" };
    }
    if (log.type === "crit") return { bg: "#fce4ec", border: "#e57373", text: "#7f0000" };
    if (log.type === "miss") return { bg: "#f5f5f5", border: "#bdbdbd", text: "#616161" };
    return { bg: "#ffebee", border: "#ef9a9a", text: "#7f0000" };
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--crimson)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        ⚔️ Дуэль
      </h2>

      {/* Счётчик боёв */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, background: "#faf6e8", border: "1px solid var(--parchment-border)", borderRadius: 4, padding: "8px 12px" }}>
        <span style={{ fontSize: 13, color: "var(--text-medium)" }}>Бои:</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)" }}>⚔️ {battles}/{maxBattles}</span>
        {regenTimer !== null && battles < maxBattles && (
          <span style={{ fontSize: 11, color: "var(--gold)", marginLeft: 4 }}>+1 через {formatTimer(regenTimer)}</span>
        )}
        {battles === 0 && regenTimer === null && (
          <span style={{ fontSize: 11, color: "#cc4444", marginLeft: 2 }}>Боёв нет!</span>
        )}
      </div>

      {/* Нет боёв */}
      {battles <= 0 && phase !== "fighting" && phase !== "victory" && phase !== "defeat" && (
        <div style={{ padding: "16px", borderRadius: 4, background: "#fff5f0", border: "1px solid #fca5a5", fontSize: 13, color: "#9b1c1c", textAlign: "center" }}>
          ⏳ Боёв не осталось. Восстановление через {regenTimer !== null ? formatTimer(regenTimer) : "—"}
        </div>
      )}

      {/* Экран готовности — аватарки напротив */}
      {(phase === "ready" || phase === "searching") && enemy && battles > 0 && (
        <div className="animate-fade-in">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 32px 1fr", gap: 8, alignItems: "center", marginBottom: 14 }}>
            {/* Игрок */}
            <div className="game-panel-inner" style={{ borderRadius: 6, padding: "12px 10px", textAlign: "center", border: "2px solid #c8a96e" }}>
              <img
                src={AVATAR_URL}
                alt="Твой герой"
                style={{ width: 64, height: 64, borderRadius: 6, objectFit: "cover", border: "2px solid var(--parchment-border)", marginBottom: 6 }}
              />
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-dark)", marginBottom: 2 }}>{player.name}</div>
              <div style={{ fontSize: 11, color: "var(--gold)", marginBottom: 6 }}>Ур. {player.level}</div>
              {hpBar(playerHp, player.maxHp)}
              <div style={{ fontSize: 10, color: "var(--text-medium)", marginTop: 3 }}>{playerHp}/{player.maxHp} HP</div>
              <div style={{ marginTop: 6, display: "flex", justifyContent: "center", gap: 8, fontSize: 11, color: "var(--text-medium)" }}>
                <span>⚔️ {player.attack}</span>
                <span>🛡️ {player.defense}</span>
                <span>🔮 {player.magic}</span>
              </div>
            </div>

            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "var(--crimson)", textAlign: "center" }}>VS</div>

            {/* Противник */}
            <div className="game-panel-inner" style={{ borderRadius: 6, padding: "12px 10px", textAlign: "center", border: "2px solid #e57373" }}>
              <div style={{ width: 64, height: 64, borderRadius: 6, background: "#3a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 6px", border: "2px solid #e57373" }}>
                {enemy.avatar}
              </div>
              <div
                style={{ fontWeight: 700, fontSize: 13, color: "var(--text-dark)", marginBottom: 2, cursor: "pointer", textDecoration: "underline dotted" }}
                onClick={() => onViewProfile?.(enemy.name, enemy.level)}
              >
                {enemy.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--gold)", marginBottom: 6 }}>Ур. {enemy.level}</div>
              {hpBar(enemyHp, enemy.maxHp)}
              <div style={{ fontSize: 10, color: "var(--text-medium)", marginTop: 3 }}>{enemyHp}/{enemy.maxHp} HP</div>
              <div style={{ marginTop: 6, display: "flex", justifyContent: "center", gap: 8, fontSize: 11, color: "var(--text-medium)" }}>
                <span>⚔️ {enemy.attack}</span>
                <span>🛡️ {enemy.defense}</span>
                <span>🔮 {enemy.magic}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={startBattle}
              disabled={battles <= 0}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 4,
                fontWeight: 700,
                fontSize: 15,
                background: battles > 0 ? "var(--crimson)" : "#ccc",
                color: "var(--parchment)",
                border: "none",
                cursor: battles > 0 ? "pointer" : "not-allowed",
                fontFamily: "'Cormorant Garamond', serif",
                letterSpacing: "0.05em",
              }}
            >
              ⚔️ Напасть
            </button>
            <button
              onClick={findNewEnemy}
              style={{ padding: "12px 14px", borderRadius: 4, fontWeight: 600, fontSize: 13, background: "#f5f0e0", color: "var(--text-dark)", border: "1px solid var(--parchment-border)", cursor: "pointer" }}
            >
              🔄
            </button>
          </div>
        </div>
      )}

      {/* Экран боя */}
      {(phase === "fighting" || phase === "victory" || phase === "defeat") && enemy && (
        <div className="animate-fade-in">
          {/* Мини-аватарки в бою */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 24px 1fr", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: "var(--text-dark)" }}>
                <span style={playerShake ? { display: "inline-block", animation: "shake 0.3s ease" } : {}}>
                  🗡️ {player.name}
                </span>
              </div>
              {hpBar(Math.max(0, playerHp), player.maxHp)}
              <div style={{ fontSize: 10, color: "var(--text-medium)", marginTop: 2 }}>{Math.max(0, playerHp)}/{player.maxHp}</div>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700, color: "var(--crimson)", textAlign: "center" }}>⚔️</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: "var(--text-dark)" }}>
                <span style={enemyShake ? { display: "inline-block", animation: "shake 0.3s ease" } : {}}>
                  {enemy.avatar} {enemy.name}
                </span>
              </div>
              {hpBar(Math.max(0, enemyHp), enemy.maxHp)}
              <div style={{ fontSize: 10, color: "var(--text-medium)", marginTop: 2 }}>{Math.max(0, enemyHp)}/{enemy.maxHp}</div>
            </div>
          </div>

          {/* Лог */}
          <div className="game-panel-inner" style={{ borderRadius: 4, padding: "8px 10px", marginBottom: 10, maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {logs.length === 0 && <div style={{ fontSize: 12, color: "var(--text-medium)", textAlign: "center", padding: "8px 0" }}>Лог боя пуст</div>}
            {logs.map((log) => {
              const c = logColor(log);
              return (
                <div key={log.id} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 3, background: c.bg, border: `1px solid ${c.border}`, color: c.text, lineHeight: 1.5 }}>
                  {log.turn > 0 && <span style={{ opacity: 0.5, fontSize: 10, marginRight: 4 }}>Ход {log.turn}.</span>}
                  {log.text}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>

          {/* Кнопка атаки */}
          {phase === "fighting" && (
            <button
              onClick={playerAttack}
              disabled={actionCooldown}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 4,
                fontWeight: 700,
                fontSize: 15,
                background: actionCooldown ? "#ddd" : "var(--crimson)",
                color: actionCooldown ? "#999" : "var(--parchment)",
                border: "none",
                cursor: actionCooldown ? "not-allowed" : "pointer",
                fontFamily: "'Cormorant Garamond', serif",
                letterSpacing: "0.05em",
              }}
            >
              ⚔️ Напасть
            </button>
          )}

          {phase === "victory" && (
            <div style={{ textAlign: "center", padding: "16px", background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "2px solid #4ade80", borderRadius: 6 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#15803d", marginBottom: 6 }}>Победа!</div>
              <div style={{ fontSize: 13, color: "#166534", marginBottom: 12 }}>
                {reward.glory > 0 && <>{reward.glory} ⭐&nbsp;·&nbsp;</>}
                {reward.xp > 0 && <>{reward.xp} опыта&nbsp;·&nbsp;</>}
                {reward.silver > 0 && <>{reward.silver} серебра</>}
              </div>
              <button onClick={findNewEnemy} style={{ padding: "8px 24px", borderRadius: 4, fontWeight: 700, fontSize: 13, background: "var(--crimson)", color: "var(--parchment)", border: "none", cursor: "pointer" }}>
                Новая дуэль
              </button>
            </div>
          )}

          {phase === "defeat" && (
            <div style={{ textAlign: "center", padding: "16px", background: "linear-gradient(135deg,#fff5f5,#fce4ec)", border: "2px solid #ef9a9a", borderRadius: 6 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💀</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#9b1c1c", marginBottom: 6 }}>Поражение...</div>
              <div style={{ fontSize: 13, color: "#7f1d1d", marginBottom: 12 }}>Попробуй снова!</div>
              <button onClick={findNewEnemy} style={{ padding: "8px 24px", borderRadius: 4, fontWeight: 700, fontSize: 13, background: "#7f1d1d", color: "#fef2f2", border: "none", cursor: "pointer" }}>
                Снова в бой
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
