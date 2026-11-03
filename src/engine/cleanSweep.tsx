import { PlayerScore } from "./scoring";

/**
 * Checks whether one player won all four rounds.
 * FIRE or different winners prevent a Clean Sweep.
 */
export function calculateCleanSweep(
  roundWinners: (number | null)[],
): number | null {
  if (roundWinners.length !== 4) {
    throw new Error("Exactly 4 round results are required");
  }

  const firstWinner = roundWinners[0];

  if (firstWinner === null) {
    return null;
  }

  if (!Number.isInteger(firstWinner) || firstWinner < 0 || firstWinner > 3) {
    throw new Error("Invalid winner index");
  }

  const isCleanSweep = roundWinners.every((winner) => winner === firstWinner);

  return isCleanSweep ? firstWinner : null;
}

/**
 * Awards +1 point for a Clean Sweep.
 */
export function awardCleanSweepBonus(
  scores: PlayerScore[],
  winnerIndex: number | null,
): PlayerScore[] {
  if (scores.length !== 4) {
    throw new Error("Exactly 4 players are required");
  }

  if (winnerIndex === null) {
    return scores;
  }

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
