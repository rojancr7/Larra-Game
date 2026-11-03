import { Card, Rank } from "./deck";

export type HandCategory =
  | "TRAIL"
  | "PURE_SEQUENCE"
  | "SEQUENCE"
  | "COLOR"
  | "PAIR"
  | "HIGH_CARD";

export interface HandResult {
  category: HandCategory;
  strength: number;
  comparisonValues: number[];
}

export const RANK_VALUES: Record<Rank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export function getThreeCardSequenceRank(cards: Card[]): number {
  if (cards.length !== 3) return 0;

  const ranks = cards.map((card) => card.rank);

  if (new Set(ranks).size !== 3) return 0;

  // Highest: Q-K-A
  if (["Q", "K", "A"].every((rank) => ranks.includes(rank as Rank))) {
    return 12;
  }

  // Second highest: A-2-3
  if (["A", "2", "3"].every((rank) => ranks.includes(rank as Rank))) {
    return 11;
  }

  const values = ranks.map((rank) => RANK_VALUES[rank]).sort((a, b) => a - b);

  const isNormalSequence =
    values[1] === values[0] + 1 && values[2] === values[1] + 1;

  return isNormalSequence ? values[0] - 1 : 0;
}

export function evaluateThreeCardHand(cards: Card[]): HandResult {
  if (cards.length !== 3) {
    throw new Error("A hand must contain exactly 3 cards");
  }

  const uniqueIds = new Set(cards.map((card) => card.id));

  if (uniqueIds.size !== 3) {
    throw new Error("Duplicate cards are not allowed");
  }

  const values = cards
    .map((card) => RANK_VALUES[card.rank])
    .sort((a, b) => b - a);

  const sameSuit = cards.every((card) => card.suit === cards[0].suit);

  const sameRank = values[0] === values[2];

  const sequenceRank = getThreeCardSequenceRank(cards);
  const isSequence = sequenceRank > 0;

  // 1. Trail
  if (sameRank) {
    return {
      category: "TRAIL",
      strength: 6,
      comparisonValues: [values[0]],
    };
  }

  // 2. Pure Sequence
  if (sameSuit && isSequence) {
    return {
      category: "PURE_SEQUENCE",
      strength: 5,
      comparisonValues: [sequenceRank],
    };
  }

  // 3. Sequence
  if (isSequence) {
    return {
      category: "SEQUENCE",
      strength: 4,
      comparisonValues: [sequenceRank],
    };
  }

  // 4. Color
  if (sameSuit) {
    return {
      category: "COLOR",
      strength: 3,
      comparisonValues: values,
    };
  }

  // 5. Pair
  if (values[0] === values[1] || values[1] === values[2]) {
    const pairRank = values[0] === values[1] ? values[0] : values[1];

    const kicker = values.find((value) => value !== pairRank)!;

    return {
      category: "PAIR",
      strength: 2,
      comparisonValues: [pairRank, kicker],
    };
  }

  // 6. High Card
  return {
    category: "HIGH_CARD",
    strength: 1,
    comparisonValues: values,
  };
}
