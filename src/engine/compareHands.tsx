import { HandResult } from "./handEvaluator";

export type HandOutcome = "PLAYER_1" | "PLAYER_2" | "FIRE";

export function compareHands(
  hand1: HandResult,
  hand2: HandResult,
): HandOutcome {
  // Validate comparison data
  if (
    !Array.isArray(hand1.comparisonValues) ||
    !Array.isArray(hand2.comparisonValues)
  ) {
    throw new Error("Invalid hand comparison values");
  }

  // 1. Compare category strength
  if (hand1.strength > hand2.strength) {
    return "PLAYER_1";
  }

  if (hand1.strength < hand2.strength) {
    return "PLAYER_2";
  }

  // 2. Compare individual values
  const values1 = hand1.comparisonValues;
  const values2 = hand2.comparisonValues;

  const maxLength = Math.max(values1.length, values2.length);

  for (let i = 0; i < maxLength; i++) {
    const value1 = values1[i] ?? 0;
    const value2 = values2[i] ?? 0;

    if (value1 > value2) {
      return "PLAYER_1";
    }

    if (value1 < value2) {
      return "PLAYER_2";
    }
  }

  // 3. Exact equality = FIRE
  return "FIRE";
}
