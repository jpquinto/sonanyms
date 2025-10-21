// lib/elo/adjust-single-player-elo.ts

import { getBaselineScore, GameMode, Rank } from "./baseline_scores";

const MIN_ELO_CHANGE = -30;
const MAX_ELO_CHANGE = 30;

/**
 * Get rank from ELO rating
 */
function getRankFromElo(elo: number): Rank {
  if (elo >= 2500) return "champion";
  if (elo >= 2000) return "master";
  if (elo >= 1500) return "diamond";
  if (elo >= 1000) return "gold";
  if (elo >= 500) return "silver";
  return "bronze";
}

/**
 * Calculate performance ratio based on score vs baseline
 */
function calculatePerformanceRatio(
  actualScore: number,
  baselineScore: number
): number {
  if (baselineScore === 0) return 1;
  return actualScore / baselineScore;
}

/**
 * Calculate ELO adjustment with scaling factor
 * Better performance at higher ranks yields more ELO
 */
function calculateScaledEloChange(
  performanceRatio: number,
  currentElo: number
): number {
  // Base K-factor (sensitivity of ELO changes)
  const baseKFactor = 32;

  // Scale K-factor based on ELO (higher ELO = slightly lower volatility)
  const eloScaling = Math.max(0.7, 1 - currentElo / 5000);
  const kFactor = baseKFactor * eloScaling;

  // Calculate raw ELO change
  // performanceRatio > 1 means exceeded expectations (positive change)
  // performanceRatio < 1 means underperformed (negative change)
  const rawChange = (performanceRatio - 1) * kFactor;

  return rawChange;
}

/**
 * Adjust single player ELO based on game performance
 *
 * @param currentElo - Player's current ELO rating
 * @param gameMode - The game mode played
 * @param totalScore - Total score achieved in the game
 * @returns Object with new ELO and the change amount
 */
export function adjustSinglePlayerElo(
  currentElo: number,
  gameMode: GameMode,
  totalScore: number
): { newElo: number; eloChange: number } {
  // Determine current rank
  const currentRank = getRankFromElo(currentElo);

  // Get baseline score for this rank and game mode
  const baselineScore = getBaselineScore(gameMode, currentRank);

  // Calculate performance ratio
  const performanceRatio = calculatePerformanceRatio(totalScore, baselineScore);

  // Calculate scaled ELO change
  let eloChange = calculateScaledEloChange(performanceRatio, currentElo);

  // Apply min/max bounds
  eloChange = Math.max(MIN_ELO_CHANGE, Math.min(MAX_ELO_CHANGE, eloChange));

  // Round to nearest integer
  eloChange = Math.round(eloChange);

  // Calculate new ELO (cannot go below 0)
  const newElo = Math.max(0, currentElo + eloChange);

  return {
    newElo,
    eloChange,
  };
}
