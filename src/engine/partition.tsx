import { Card } from './deck';

// Four sets containing exactly 13 cards
export type HandPartition = [
  Card[],
  Card[],
  Card[],
  Card[]
];

// Required number of cards in each set
const REQUIRED_SIZES = [3, 3, 3, 4];

export function validatePartition(
  originalHand: Card[],
  groups: HandPartition
): boolean {

  // Check each group's card count
  for (let i = 0; i < 4; i++) {
    if (groups[i].length !== REQUIRED_SIZES[i]) {
      return false;
    }
  }

  // Combine all four groups
  const allCards = groups.flat();

  // Check total number of cards
  if (allCards.length !== 13) {
    return false;
  }

  // Check for duplicate cards
  const uniqueIds = new Set(
    allCards.map(card => card.id)
  );

  if (uniqueIds.size !== 13) {
    return false;
  }

  // Ensure every original card is used
  const originalIds = new Set(
    originalHand.map(card => card.id)
  );

  return allCards.every(card => originalIds.has(card.id));
}