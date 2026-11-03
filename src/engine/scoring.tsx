import { RoundFourResult } from "./roundFour";

export interface PlayerScore {
  playerId: string;
  name: string;
  points: number;
}

/**
 * Creates a scoreboard with 4 players.
 */
export function createScoreboard(): PlayerScore[] {
  return Array.from({ length: 4 }, (_, index) => ({
    playerId: `player-${index + 1}`,
    name: `Player ${index + 1}`,
    points: 0,
  }));
}

/**
 * Awards +1 point for a winner in Rounds 1-3.
 */
export function awardRoundPoint(
  scores: PlayerScore[],
  winnerIndex: number | null,
): PlayerScore[] {
  if (scores.length !== 4) {
    throw new Error("Exactly 4 players are required");
  }

  if (winnerIndex === null) return scores;

  if (
    !Number.isInteger(winnerIndex) ||
    winnerIndex < 0 ||
    winnerIndex >= scores.length
  ) {
    throw new Error("Invalid winner index");
  }

  return scores.map((player, index) => ({
    ...player,
    points: index === winnerIndex ? player.points + 1 : player.points,
  }));
}

/**
 * Round 4 scoring:
 * - Four Aces: +5 points total
 * - Other four-of-a-kind: +4 points total
 * - Normal winner: +1 point
 * - FIRE: 0 points
 */
export function awardRoundFourPoints(
  scores: PlayerScore[],
  winnerIndex: number | null,
  winningHand: RoundFourResult | null,
): PlayerScore[] {
  if (scores.length !== 4) {
    throw new Error("Exactly 4 players are required");
  }

  if (winnerIndex === null || winningHand === null) {
    return scores;
  }

  if (
    !Number.isInteger(winnerIndex) ||
    winnerIndex < 0 ||
    winnerIndex >= scores.length
  ) {
    throw new Error("Invalid winner index");
  }

  let points = 1;

  if (winningHand.category === "TRAIL") {
    const isFourAces = winningHand.comparisonValues[0] === 14;

    points = isFourAces ? 5 : 4;
  }

  return scores.map((player, index) => ({
    ...player,
    points: index === winnerIndex ? player.points + points : player.points,
  }));
}

/**
 * Returns the first player who reaches 20 points.
 */
export function getGameWinner(scores: PlayerScore[]): PlayerScore | null {
  return scores.find((player) => player.points >= 20) ?? null;
}
