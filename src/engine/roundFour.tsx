import { Card, Rank } from "./deck";
import { RANK_VALUES } from "./handEvaluator";

export type RoundFourCategory =
  | "TRAIL"
  | "REAL_LARRA"
  | "PURE_SEQUENCE"
  | "SEQUENCE"
  | "COLOR"
  | "TWO_PAIR"
  | "ONE_PAIR"
  | "HIGH_CARD";

export interface RoundFourResult {
  category: RoundFourCategory;
  strength: number;
  comparisonValues: number[];
}

// Four-card sequence ranking:
//
// 1  = 2-3-4-5 (lowest)
// 2  = 3-4-5-6
// ...
// 9  = 10-J-Q-K
// 10 = A-2-3-4 (second highest)
// 11 = J-Q-K-A (highest)
// 0  = Not a sequence

export function getFourCardSequenceRank(cards: Card[]): number {
  if (cards.length !== 4) return 0;

  const ranks = cards.map((card) => card.rank);

  if (new Set(ranks).size !== 4) return 0;

  // Highest: J-Q-K-A
  if (["J", "Q", "K", "A"].every((rank) => ranks.includes(rank as Rank))) {
    return 11;
  }

  // Second highest: A-2-3-4
  if (["A", "2", "3", "4"].every((rank) => ranks.includes(rank as Rank))) {
    return 10;
  }

  // Normal sequences
  const values = ranks.map((rank) => RANK_VALUES[rank]).sort((a, b) => a - b);

  const isNormalSequence =
    values[1] === values[0] + 1 &&
    values[2] === values[1] + 1 &&
    values[3] === values[2] + 1;

  return isNormalSequence ? values[0] - 1 : 0;
}

export function evaluateRoundFour(cards: Card[]): RoundFourResult {
  if (cards.length !== 4) {
    throw new Error("Exactly 4 cards are required");
  }

  const uniqueIds = new Set(cards.map((card) => card.id));

  if (uniqueIds.size !== 4) {
    throw new Error("Duplicate cards are not allowed");
  }

  const values = cards
    .map((card) => RANK_VALUES[card.rank])
    .sort((a, b) => b - a);

  // Count cards of each rank
  const rankCounts = new Map<number, number>();

  for (const value of values) {
    rankCounts.set(value, (rankCounts.get(value) ?? 0) + 1);
  }

  const groups = Array.from(rankCounts.entries()).sort(
    (a, b) => b[1] - a[1] || b[0] - a[0],
  );

  const sameSuit = cards.every((card) => card.suit === cards[0].suit);

  const sequenceRank = getFourCardSequenceRank(cards);
  const isSequence = sequenceRank > 0;

  // 1. TRAIL: Four cards of the same rank
  if (groups[0][1] === 4) {
    return {
      category: "TRAIL",
      strength: 7,
      comparisonValues: [groups[0][0]],
    };
  }

  // 2. PURE SEQUENCE: Four consecutive cards, same suit
  if (sameSuit && isSequence) {
    return {
      category: "PURE_SEQUENCE",
      strength: 5,
      comparisonValues: [sequenceRank],
    };
  }

  // 3. SEQUENCE: Four consecutive cards, mixed suits
  if (isSequence) {
    return {
      category: "SEQUENCE",
      strength: 4,
      comparisonValues: [sequenceRank],
    };
  }

  // 4. REAL LARRA: All four same suit, not consecutive
  if (sameSuit) {
    return {
      category: "REAL_LARRA",
      strength: 6,
      comparisonValues: values,
    };
  }

  // 5. COLOR: Three cards same suit + one different suit
  const suitCounts = new Map<string, number>();

  for (const card of cards) {
    suitCounts.set(card.suit, (suitCounts.get(card.suit) ?? 0) + 1);
  }

  const maxSuitCount = Math.max(...suitCounts.values());

  if (maxSuitCount === 3) {
    const dominantSuit = Array.from(suitCounts.entries()).find(
      ([_, count]) => count === 3,
    )![0];

    const suitedValues = cards
      .filter((card) => card.suit === dominantSuit)
      .map((card) => RANK_VALUES[card.rank])
      .sort((a, b) => b - a);

    const kicker = cards.find((card) => card.suit !== dominantSuit)!;

    return {
      category: "COLOR",
      strength: 3,
      comparisonValues: [...suitedValues, RANK_VALUES[kicker.rank]],
    };
  }

  // 6. TWO PAIR
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    return {
      category: "TWO_PAIR",
      strength: 2,
      comparisonValues: [groups[0][0], groups[1][0]],
    };
  }

  // 7. ONE PAIR
  if (groups[0][1] === 2) {
    const pairRank = groups[0][0];

    const kickers = values.filter((value) => value !== pairRank);

    return {
      category: "ONE_PAIR",
      strength: 1,
      comparisonValues: [pairRank, ...kickers],
    };
  }

  // 8. HIGH CARD
  return {
    category: "HIGH_CARD",
    strength: 0,
    comparisonValues: values,
  };
}
