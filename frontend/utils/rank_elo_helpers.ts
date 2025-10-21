import { Rank } from "@/types/rank";

export function getRankFromElo(elo: number): Rank {
  if (elo >= 2500) return "champion";
  if (elo >= 2000) return "master";
  if (elo >= 1500) return "diamond";
  if (elo >= 1000) return "gold";
  if (elo >= 500) return "silver";
  return "bronze";
}

export const rankThresholds = [
  { rank: "bronze" as Rank, min: 0, max: 500 },
  { rank: "silver" as Rank, min: 500, max: 1000 },
  { rank: "gold" as Rank, min: 1000, max: 1500 },
  { rank: "diamond" as Rank, min: 1500, max: 2000 },
  { rank: "master" as Rank, min: 2000, max: 2500 },
  { rank: "champion" as Rank, min: 2500, max: Infinity },
];

export function getProgressInfo(elo: number): {
  nextRank: string;
  pointsNeeded: number;
  currentRankMin: number;
  nextRankThreshold: number;
  progressPercentage: number;
} | null {
  if (elo >= 2500) return null; // Already champion

  let currentRankMin = 0;
  let nextRankThreshold = 500;
  let nextRank = "Silver";

  if (elo >= 2000) {
    currentRankMin = 2000;
    nextRankThreshold = 2500;
    nextRank = "Champion";
  } else if (elo >= 1500) {
    currentRankMin = 1500;
    nextRankThreshold = 2000;
    nextRank = "Master";
  } else if (elo >= 1000) {
    currentRankMin = 1000;
    nextRankThreshold = 1500;
    nextRank = "Diamond";
  } else if (elo >= 500) {
    currentRankMin = 500;
    nextRankThreshold = 1000;
    nextRank = "Gold";
  }

  const pointsNeeded = nextRankThreshold - elo;
  const totalPointsInRank = nextRankThreshold - currentRankMin;
  const pointsEarnedInRank = elo - currentRankMin;
  const progressPercentage = (pointsEarnedInRank / totalPointsInRank) * 100;

  return {
    nextRank,
    pointsNeeded,
    currentRankMin,
    nextRankThreshold,
    progressPercentage,
  };
}