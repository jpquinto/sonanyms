interface AvatarEmblemProps {
  rank: "gold" | "silver" | "bronze" | "diamond" | "master" | "champion";
  profile_picture: string;
  size?: "sm" | "md" | "lg";
  championRank?: number; // Optional: 1-100 for top 100 champions
}

export const AvatarEmblem = ({
  rank,
  profile_picture,
  size = "md",
  championRank,
}: AvatarEmblemProps) => {
  // Size configurations
  const sizeClasses = {
    sm: {
      container: "w-12 h-12",
      emblem: "w-12 h-12",
      rankText: "text-xs",
    },
    md: {
      container: "w-20 h-20",
      emblem: "w-16 h-20",
      rankText: "text-sm",
    },
    lg: {
      container: "w-32 h-32",
      emblem: "w-22 h-22",
      rankText: "text-base",
    },
  };

  // Rank-specific border and glow effects
  const rankStyles = {
    bronze: {
      border: "border-4 border-amber-700",
      shadow: "shadow-[0_0_20px_rgba(180,83,9,0.6)]",
    },
    silver: {
      border: "border-4 border-gray-300",
      shadow: "shadow-[0_0_20px_rgba(192,192,192,0.6)]",
    },
    gold: {
      border: "border-4 border-yellow-400",
      shadow: "shadow-[0_0_20px_rgba(250,204,21,0.6)]",
    },
    diamond: {
      border: "border-4 border-cyan-300",
      shadow: "shadow-[0_0_20px_rgba(103,232,249,0.6)]",
    },
    master: {
      border: "border-4 border-purple-800",
      shadow: "shadow-[0_0_20px_rgba(107,33,168,0.6)]",
    },
    champion: {
      border: "border-4 border-green-400",
      shadow: "shadow-[0_0_20px_rgba(74,222,128,0.6)]",
    },
  };

  const currentSize = sizeClasses[size];
  const currentRankStyle = rankStyles[rank];
  const emblemPath = `/emblems/${rank}.png`;

  const showChampionRank =
    rank === "champion" &&
    championRank &&
    championRank >= 1 &&
    championRank <= 100;

  return (
    <div className={`relative ${currentSize.container} flex flex-col`}>
      {/* Profile Picture */}
      <img
        src={profile_picture}
        alt="Profile"
        className={`w-full h-full rounded-full object-cover ${currentRankStyle.border} ${currentRankStyle.shadow}`}
      />

      {/* Rank Emblem Overlay - Centered at Bottom */}
      <div className="mx-auto -translate-y-1/2 z-10">
        <img
          src={emblemPath}
          alt={`${rank} rank`}
          className={`${currentSize.emblem} drop-shadow-lg object-cover`}
        />
        {showChampionRank && (
          <div
            className={`${currentRankStyle.shadow} bg-green-500/50 text-white font-bold px-2 py-0.5 rounded-full ${currentSize.rankText} -mt-2 text-center`}
          >
            #{championRank}
          </div>
        )}
      </div>
    </div>
  );
};
