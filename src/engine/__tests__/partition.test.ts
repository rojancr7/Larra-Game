import { describe, it, expect } from 'vitest';
import { Card, createDeck, shuffle } from '../deck';
import { dealCards } from '../deal';
import { validatePartition, HandPartition } from '../partition';

describe('Partition Validation', () => {
  const deck = shuffle(createDeck());
  const [hand] = dealCards(deck, 4, 13);

  it('accepts a valid partition with group sizes 3, 3, 3, and 4', () => {
    const valid: HandPartition = [
      hand.slice(0, 3),
      hand.slice(3, 6),
      hand.slice(6, 9),
      hand.slice(9, 13),
    ];

    expect(validatePartition(hand, valid)).toBe(true);
  });

  it('rejects partitions with incorrect group sizes', () => {
    // 4, 3, 3, 3 instead of 3, 3, 3, 4
    const invalidSizes1 = [
      hand.slice(0, 4),
      hand.slice(4, 7),
      hand.slice(7, 10),
      hand.slice(10, 13),
    ] as unknown as HandPartition;
    expect(validatePartition(hand, invalidSizes1)).toBe(false);

    // 3, 3, 3, 3 (only 12 cards)
    const invalidSizes2 = [
      hand.slice(0, 3),
      hand.slice(3, 6),
      hand.slice(6, 9),
      hand.slice(9, 12),
    ] as unknown as HandPartition;
    expect(validatePartition(hand, invalidSizes2)).toBe(false);

    // 3, 4, 3, 3
    const invalidSizes3 = [
      hand.slice(0, 3),
      hand.slice(3, 7),
      hand.slice(7, 10),
      hand.slice(10, 13),
    ] as unknown as HandPartition;
    expect(validatePartition(hand, invalidSizes3)).toBe(false);
  });

  it('rejects partitions with duplicate cards across groups', () => {
    const duplicateCard = hand[0];
    const withDuplicate: HandPartition = [
      [duplicateCard, hand[1], hand[2]],
      [duplicateCard, hand[4], hand[5]], // duplicateCard appears twice!
      hand.slice(6, 9),
      hand.slice(9, 13),
    ];

    expect(validatePartition(hand, withDuplicate)).toBe(false);
  });

  it('rejects partitions containing cards not in the original hand', () => {
    const foreignCard: Card = {
      id: 'foreign_card_x',
      suit: 'hearts',
      rank: 'A',
    };

    const withForeign: HandPartition = [
      [foreignCard, hand[1], hand[2]],
      hand.slice(3, 6),
      hand.slice(6, 9),
      hand.slice(9, 13),
    ];

    expect(validatePartition(hand, withForeign)).toBe(false);
  });

  it('rejects partitions when total cards do not equal 13', () => {
    const tooFew = [
      hand.slice(0, 3),
      hand.slice(3, 6),
      hand.slice(6, 9),
      hand.slice(9, 12), // length 3 instead of 4
    ] as unknown as HandPartition;
    expect(validatePartition(hand, tooFew)).toBe(false);
  });
});

