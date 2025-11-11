const MIN_WIN_ELO = 25;
const MAX_WIN_ELO = 40;
const MIN_LOSS_ELO = -40;
const MAX_LOSS_ELO = -25;

type Winner = "player1" | "player2";

interface MultiplayerEloResult {
  player1: {
    newElo: number;
    eloChange: number;
  };
  player2: {
    newElo: number;
    eloChange: number;
  };
}

/**
 * Calculate expected score for a player using ELO formula
 * Returns a value between 0 and 1 representing win probability
 */
function calculateExpectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

/**
 * Calculate score margin factor
 * Larger victories earn more ELO
 * Returns a multiplier between 0.85 and 1.25
 */
function calculateScoreMarginFactor(
  winnerScore: number,
  loserScore: number
): number {
  if (winnerScore === 0 && loserScore === 0) return 1.0;
  
  const totalScore = winnerScore + loserScore;
  if (totalScore === 0) return 1.0;
  
  const marginRatio = winnerScore / totalScore;
  
  // Map margin ratio (0.5 to 1.0) to factor (0.85 to 1.25)
  // Close game (0.5 ratio) = 0.85x multiplier
  // Dominant victory (1.0 ratio) = 1.25x multiplier
  const factor = 0.45 + (marginRatio * 0.8);
  
  return Math.max(0.85, Math.min(1.25, factor));
}

/**
 * Adjust multiplayer ELO ratings for both players
 *
 * @param player1Elo - Player 1's current ELO rating
 * @param player2Elo - Player 2's current ELO rating
 * @param winner - Which player won ("player1" or "player2")
 * @param player1Score - Player 1's score
 * @param player2Score - Player 2's score
 * @returns Object with new ELO ratings and changes for both players
 */
export function adjust1v1Elo(
  player1Elo: number,
  player2Elo: number,
  winner: Winner,
  player1Score: number,
  player2Score: number
): MultiplayerEloResult {
  // Calculate expected scores (win probabilities)
  const player1Expected = calculateExpectedScore(player1Elo, player2Elo);
  const player2Expected = calculateExpectedScore(player2Elo, player1Elo);

  // Determine actual scores (1 for win, 0 for loss)
  const player1Actual = winner === "player1" ? 1 : 0;
  const player2Actual = winner === "player2" ? 1 : 0;

  // Dynamic K-factor based on ELO difference
  // Larger upsets should have bigger swings
  const eloDiff = Math.abs(player1Elo - player2Elo);
  const baseKFactor = 40; // Increased from 32
  
  // Scale K-factor up for larger rating gaps (more dramatic for upsets)
  const kFactorMultiplier = 1 + (eloDiff / 2000); // Increases with rating gap
  const kFactor = Math.min(baseKFactor * kFactorMultiplier, 60); // Cap at 60

  // Calculate base ELO changes
  const player1BaseChange = kFactor * (player1Actual - player1Expected);
  const player2BaseChange = kFactor * (player2Actual - player2Expected);

  // Calculate score margin factor
  const winnerScore = winner === "player1" ? player1Score : player2Score;
  const loserScore = winner === "player1" ? player2Score : player1Score;
  const marginFactor = calculateScoreMarginFactor(winnerScore, loserScore);

  // Apply margin factor to changes
  let player1Change = player1BaseChange * marginFactor;
  let player2Change = player2BaseChange * marginFactor;

  // Apply bounds based on win/loss
  if (winner === "player1") {
    // Player 1 won
    player1Change = Math.max(MIN_WIN_ELO, Math.min(MAX_WIN_ELO, player1Change));
    player2Change = Math.max(MIN_LOSS_ELO, Math.min(MAX_LOSS_ELO, player2Change));
  } else {
    // Player 2 won
    player1Change = Math.max(MIN_LOSS_ELO, Math.min(MAX_LOSS_ELO, player1Change));
    player2Change = Math.max(MIN_WIN_ELO, Math.min(MAX_WIN_ELO, player2Change));
  }

  // Round to nearest integer
  player1Change = Math.round(player1Change);
  player2Change = Math.round(player2Change);

  // Calculate new ELO ratings (cannot go below 0)
  const player1NewElo = Math.max(0, player1Elo + player1Change);
  const player2NewElo = Math.max(0, player2Elo + player2Change);

  return {
    player1: {
      newElo: player1NewElo,
      eloChange: player1Change,
    },
    player2: {
      newElo: player2NewElo,
      eloChange: player2Change,
    },
  };
}

// ==================== TEST CASES ====================
// Uncomment to run tests locally

// console.log("=== Multiplayer ELO Test Cases ===\n");

// // Test 1: Equal ELO, close game
// console.log("Test 1: Equal ELO (1000 vs 1000), close game (55-45)");
// const test1 = adjustMultiplayerElo(1000, 1000, "player1", 55, 45);
// console.log("Player 1 (Winner):", test1.player1);
// console.log("Player 2 (Loser):", test1.player2);
// console.log("Sum of changes:", test1.player1.eloChange + test1.player2.eloChange);
// console.log();

// // Test 2: Equal ELO, dominant victory
// console.log("Test 2: Equal ELO (1000 vs 1000), dominant victory (90-30)");
// const test2 = adjustMultiplayerElo(1000, 1000, "player1", 90, 30);
// console.log("Player 1 (Winner):", test2.player1);
// console.log("Player 2 (Loser):", test2.player2);
// console.log("Sum of changes:", test2.player1.eloChange + test2.player2.eloChange);
// console.log();

// // Test 3: Lower rated player wins (upset)
// console.log("Test 3: Upset victory - Lower rated wins (1000 vs 1400)");
// const test3 = adjustMultiplayerElo(1000, 1400, "player1", 70, 55);
// console.log("Player 1 (Winner, underdog):", test3.player1);
// console.log("Player 2 (Loser, favorite):", test3.player2);
// console.log("Sum of changes:", test3.player1.eloChange + test3.player2.eloChange);
// console.log();

// // Test 4: Higher rated player wins (expected)
// console.log("Test 4: Expected victory - Higher rated wins (1400 vs 1000)");
// const test4 = adjustMultiplayerElo(1400, 1000, "player1", 75, 50);
// console.log("Player 1 (Winner, favorite):", test4.player1);
// console.log("Player 2 (Loser, underdog):", test4.player2);
// console.log("Sum of changes:", test4.player1.eloChange + test4.player2.eloChange);
// console.log();

// // Test 5: Massive ELO difference, underdog wins
// console.log("Test 5: Huge upset - 800 vs 2000");
// const test5 = adjustMultiplayerElo(800, 2000, "player1", 60, 55);
// console.log("Player 1 (Winner, huge underdog):", test5.player1);
// console.log("Player 2 (Loser, huge favorite):", test5.player2);
// console.log("Sum of changes:", test5.player1.eloChange + test5.player2.eloChange);
// console.log();

// // Test 6: Massive ELO difference, favorite wins
// console.log("Test 6: Expected stomp - 2000 vs 800");
// const test6 = adjustMultiplayerElo(2000, 800, "player1", 95, 25);
// console.log("Player 1 (Winner, huge favorite):", test6.player1);
// console.log("Player 2 (Loser, huge underdog):", test6.player2);
// console.log("Sum of changes:", test6.player1.eloChange + test6.player2.eloChange);
// console.log();

// // Test 7: Perfect shutout
// console.log("Test 7: Perfect victory (100-0)");
// const test7 = adjustMultiplayerElo(1200, 1200, "player1", 100, 0);
// console.log("Player 1 (Winner, shutout):", test7.player1);
// console.log("Player 2 (Loser, shutout):", test7.player2);
// console.log("Sum of changes:", test7.player1.eloChange + test7.player2.eloChange);
// console.log();

// // Test 8: Player 2 wins instead
// console.log("Test 8: Player 2 victory (1100 vs 1300)");
// const test8 = adjustMultiplayerElo(1100, 1300, "player2", 45, 65);
// console.log("Player 1 (Loser, underdog):", test8.player1);
// console.log("Player 2 (Winner, favorite):", test8.player2);
// console.log("Sum of changes:", test8.player1.eloChange + test8.player2.eloChange);
// console.log();