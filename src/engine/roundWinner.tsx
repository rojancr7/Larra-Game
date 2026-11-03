import { compareHands } from "./compareHands";
import { HandResult } from "./handEvaluator";

export interface RoundResult {
  winnerIndex: number | null;
  outcome: "WIN" | "FIRE";
}

export function determineRoundWinner(hands: HandResult[]): RoundResult {
  // Exactly four players are required
  if (hands.length !== 4) {
    throw new Error("Exactly 4 players are required");
  }

  // Validate that all four hands exist
  if (hands.some((hand) => !hand)) {
    throw new Error("Invalid player hand");
  }

  // 1. Find the strongest hand
  let strongestIndex = 0;

  for (let i = 1; i < hands.length; i++) {
    const result = compareHands(hands[i], hands[strongestIndex]);

    if (result === "PLAYER_1") {
      strongestIndex = i;
    }
  }

  // 2. Check whether the strongest hand is tied
  for (let i = 0; i < hands.length; i++) {
    if (i === strongestIndex) continue;

    const result = compareHands(hands[i], hands[strongestIndex]);

    if (result === "FIRE") {
      return {
        winnerIndex: null,
        outcome: "FIRE",
      };
    }
  }

  // 3. Declare the winner
  return {
    winnerIndex: strongestIndex,
    outcome: "WIN",
  };
}
