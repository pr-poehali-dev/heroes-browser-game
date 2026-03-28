import Icon from "@/components/ui/icon";
import { type DuelReward } from "@/components/DuelSection";
import { DiaryEntry, HeroStats, SectionId } from "@/pages/Index";
import SectionHeroProfile from "@/components/SectionHeroProfile";
import SectionAdventures from "@/components/SectionAdventures";
import SectionLog from "@/components/SectionLog";

export const MALE_AVATARS = [
  { id: "m1", emoji: "⚔️", label: "Воин" },
  { id: "m2", emoji: "🗡️", label: "Разбойник" },
  { id: "m3", emoji: "🛡️", label: "Страж" },
  { id: "m4", emoji: "🏹", label: "Лучник" },
  { id: "m5", emoji: "🪓", label: "Варвар" },
  { id: "m6", emoji: "🔱", label: "Вождь" },
];
export const FEMALE_AVATARS = [
  { id: "f1", emoji: "🔮", label: "Чародейка" },
  { id: "f2", emoji: "🌙", label: "Ведьма" },
  { id: "f3", emoji: "🌸", label: "Жрица" },
  { id: "f4", emoji: "⚡", label: "Буревестник" },
  { id: "f5", emoji: "🌿", label: "Друидка" },
  { id: "f6", emoji: "💫", label: "Провидица" },
];
export const ALL_AVATARS = [...MALE_AVATARS, ...FEMALE_AVATARS];
export const getAvatarEmoji = (id: string) =>
  ALL_AVATARS.find((a) => a.id === id)?.emoji ?? "⚔️";
export const getAvatarLabel = (id: string) =>
  ALL_AVATARS.find((a) => a.id === id)?.label ?? "Герой";

const HERO_SECTIONS: SectionId[] = ["hero", "profile", "training", "params"];
const ADVENTURE_SECTIONS: SectionId[] = ["campaign", "dungeon", "village", "menagerie", "mercenaries"];

interface SectionPageProps {
  activeSection: SectionId;
  hero: {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    gold: number;
    gems: number;
  };
  silver: number;
  glory: number;
  userId?: string;
  username?: string;
  stats: HeroStats;
  currentHp: number;
  maxHp: number;
  regenPerHour: number;
  battles: number;
  regenTimer: number | null;
  diary: DiaryEntry[];
  campaignEnd: number | null;
  campaignTimer: number | null;
  campaignUsedMinutesToday: number;
  questProgress: Record<number, number>;
  questClaimed: Record<number, boolean>;
  totalSilverEarned: number;
  duelDifficulty: "higher" | "equal" | "lower";
  profileView: { name: string; level: number } | null;
  avatarId: string;
  duelWins: number;
  duelLosses: number;
  campaignCount: number;
  campaignMinutesTotal: number;
  pets: { id: string; level: number }[];
  mineEnd: number | null;
  mineDepth: number;
  mineTimer: number | null;
  onOpenSection: (id: SectionId) => void;
  onSpendBattle: () => boolean;
  onDuelEnd: (
    result: "victory" | "defeat",
    enemyName: string,
    reward: DuelReward,
  ) => void;
  onUpgradeStat: (key: keyof HeroStats) => void;
  onStartCampaign: (minutes: number) => void;
  onClaimQuest: (quest: { id: number; title: string; desc: string; reward: string; target: number; type: "duel_wins" | "campaign_count" | "upgrade_stat" | "silver_earn" | "glory_earn" }) => void;
  onDifficultyChange: (d: "higher" | "equal" | "lower") => void;
  onViewProfile: (name: string, level: number) => void;
  onChangeAvatar: (id: string) => void;
  onUpgradePet: (petId: string) => void;
  onStartMine: (depth: number) => void;
  onClaimMine: () => number;
  onChangeAvatarImage?: (url: string) => void;
  avatarImageUrl?: string;
  onBattleSpentForOrcs?: () => void;
}

export default function SectionPage(props: SectionPageProps) {
  const {
    activeSection,
    onOpenSection,
  } = props;

  const renderContent = () => {
    if (HERO_SECTIONS.includes(activeSection)) {
      return (
        <SectionHeroProfile
          activeSection={activeSection as "hero" | "profile" | "training" | "params"}
          hero={props.hero}
          silver={props.silver}
          stats={props.stats}
          currentHp={props.currentHp}
          maxHp={props.maxHp}
          profileView={props.profileView}
          avatarId={props.avatarId}
          avatarImageUrl={props.avatarImageUrl}
          onOpenSection={props.onOpenSection}
          onUpgradeStat={props.onUpgradeStat}
          onViewProfile={props.onViewProfile}
          onChangeAvatar={props.onChangeAvatar}
          onChangeAvatarImage={props.onChangeAvatarImage}
        />
      );
    }

    if (ADVENTURE_SECTIONS.includes(activeSection)) {
      return (
        <SectionAdventures
          activeSection={activeSection as "campaign" | "dungeon" | "village" | "menagerie" | "mercenaries"}
          silver={props.silver}
          campaignEnd={props.campaignEnd}
          campaignTimer={props.campaignTimer}
          campaignUsedMinutesToday={props.campaignUsedMinutesToday}
          pets={props.pets}
          mineEnd={props.mineEnd}
          mineDepth={props.mineDepth}
          mineTimer={props.mineTimer}
          onOpenSection={props.onOpenSection}
          onStartCampaign={props.onStartCampaign}
          onUpgradePet={props.onUpgradePet}
          onStartMine={props.onStartMine}
          onClaimMine={props.onClaimMine}
        />
      );
    }

    return (
      <SectionLog
        activeSection={activeSection}
        hero={props.hero}
        stats={props.stats}
        currentHp={props.currentHp}
        maxHp={props.maxHp}
        glory={props.glory}
        battles={props.battles}
        regenTimer={props.regenTimer}
        diary={props.diary}
        questProgress={props.questProgress}
        questClaimed={props.questClaimed}
        totalSilverEarned={props.totalSilverEarned}
        duelDifficulty={props.duelDifficulty}
        avatarId={props.avatarId}
        avatarImageUrl={props.avatarImageUrl}
        userId={props.userId}
        username={props.username}
        onSpendBattle={props.onSpendBattle}
        onDuelEnd={props.onDuelEnd}
        onClaimQuest={props.onClaimQuest}
        onDifficultyChange={props.onDifficultyChange}
        onViewProfile={props.onViewProfile}
        onBattleSpentForOrcs={props.onBattleSpentForOrcs}
      />
    );
  };

  return (
    <div className="game-panel" style={{ marginTop: 0 }}>
      <div style={{ padding: "14px 16px", background: "#faf6e8" }}>
        <button
          onClick={() => onOpenSection("main")}
          style={{
            fontSize: 12,
            color: "var(--crimson)",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon name="ChevronLeft" size={13} />
          На главную
        </button>
        {renderContent()}
      </div>

      <div
        className="bottom-nav"
        style={{
          padding: "8px 16px",
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 16px",
        }}
      >
        <a onClick={() => onOpenSection("main")}>🏠 Главная</a>
        <a onClick={() => onOpenSection("hero")}>🧙 Герой</a>
        <a>💬 Чат</a>
        <a>📬 Почта</a>
      </div>
    </div>
  );
}