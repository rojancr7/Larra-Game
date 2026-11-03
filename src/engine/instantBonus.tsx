import { Card, Rank } from "./deck";

export interface InstantBonus {
  sixJute: boolean;
  threeTrayel: boolean;
  grandStraight: boolean;
  totalPoints: number;
}

export function calculateInstantBonus(cards: Card[]): InstantBonus {
  if (cards.length !== 13) {
    throw new Error("Exactly 13 cards are required");
  }

  // Validate unique cards.
  const uniqueIds = new Set(cards.map((card) => card.id));

  if (uniqueIds.size !== 13) {
    throw new Error("Duplicate cards are not allowed");
  }

  // Count occurrences of each rank.
  const rankCounts = new Map<Rank, number>();

  for (const card of cards) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) ?? 0) + 1);
  }

  const counts = Array.from(rankCounts.values());

  // Six Jute: exactly 6 pairs and 1 singleton.
  const pairsCount = counts.filter((count) => count === 2).length;

  const singlesCount = counts.filter((count) => count === 1).length;

  const sixJute = pairsCount === 6 && singlesCount === 1;

  // Three Trayel: at least 3 different triples.
  const triplesCount = counts.filter((count) => count === 3).length;

  const threeTrayel = triplesCount >= 3;

  // Grand Straight: every rank appears exactly once.
  const grandStraight =
    rankCounts.size === 13 && counts.every((count) => count === 1);

  // Multiple bonuses can be combined.
  const totalPoints =
    (sixJute ? 6 : 0) + (threeTrayel ? 9 : 0) + (grandStraight ? 13 : 0);

  return {
    sixJute,
    threeTrayel,
    grandStraight,
    totalPoints,
  };
}
