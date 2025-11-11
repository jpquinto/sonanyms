
export type GameMode = "synonyms-solo";
export type Rank =
  | "bronze"
  | "silver"
  | "gold"
  | "diamond"
  | "master"
  | "champion";

interface BaselineScores {
  [key: string]: {
    [rank in Rank]: number;
  };
}

/**
 * Baseline scores for each game mode and rank
 * These represent the expected score for a player at each rank level
 */
export const BASELINE_SCORES: BaselineScores = {
  "synonyms-solo": {
    bronze: 10,
    silver: 20,
    gold: 40,
    diamond: 60,
    master: 80,
    champion: 100,
  },
};

/**
 * Get baseline score for a given game mode and rank
 */
export function getBaselineScore(gameMode: GameMode, rank: Rank): number {
  return BASELINE_SCORES[gameMode]?.[rank] ?? 100;
}
