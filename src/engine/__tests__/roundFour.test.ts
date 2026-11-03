import { describe, it, expect } from 'vitest';
import { Card } from '../deck';
import {
  evaluateRoundFour,
  getFourCardSequenceRank,
  RoundFourResult,
} from '../roundFour';
import { compareRoundFour } from '../compareRoundFour';
import {
  awardRoundFourPoints,
  createScoreboard,
} from '../scoring';

describe('Round 4 Evaluation (4 Cards)', () => {
  describe('getFourCardSequenceRank', () => {
    it('recognizes J-Q-K-A as the highest sequence (rank 11)', () => {
      const jqka: Card[] = [
        { id: '1', suit: 'hearts', rank: 'J' },
        { id: '2', suit: 'diamonds', rank: 'Q' },
        { id: '3', suit: 'clubs', rank: 'K' },
        { id: '4', suit: 'spades', rank: 'A' },
      ];
      expect(getFourCardSequenceRank(jqka)).toBe(11);
    });

    it('recognizes A-2-3-4 as the second-highest sequence (rank 10)', () => {
      const a234: Card[] = [
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'diamonds', rank: '2' },
        { id: '3', suit: 'clubs', rank: '3' },
        { id: '4', suit: 'spades', rank: '4' },
      ];
      expect(getFourCardSequenceRank(a234)).toBe(10);
    });

    it('ranks normal four-card sequences in ascending order from 2-3-4-5 (rank 1) to 10-J-Q-K (rank 9)', () => {
      const seq2345: Card[] = [
        { id: '1', suit: 'hearts', rank: '2' },
        { id: '2', suit: 'diamonds', rank: '3' },
        { id: '3', suit: 'clubs', rank: '4' },
        { id: '4', suit: 'spades', rank: '5' },
      ];
      const seq10JQK: Card[] = [
        { id: '1', suit: 'hearts', rank: '10' },
        { id: '2', suit: 'diamonds', rank: 'J' },
        { id: '3', suit: 'clubs', rank: 'Q' },
        { id: '4', suit: 'spades', rank: 'K' },
      ];

      expect(getFourCardSequenceRank(seq2345)).toBe(1);
      expect(getFourCardSequenceRank(seq10JQK)).toBe(9);
    });

    it('returns 0 for non-sequences like K-A-2-3 or hands with duplicate ranks', () => {
      const nonSeq: Card[] = [
        { id: '1', suit: 'hearts', rank: 'K' },
        { id: '2', suit: 'diamonds', rank: 'A' },
        { id: '3', suit: 'clubs', rank: '2' },
        { id: '4', suit: 'spades', rank: '3' },
      ];
      const withPair: Card[] = [
        { id: '1', suit: 'hearts', rank: '2' },
        { id: '2', suit: 'diamonds', rank: '2' },
        { id: '3', suit: 'clubs', rank: '3' },
        { id: '4', suit: 'spades', rank: '4' },
      ];

      expect(getFourCardSequenceRank(nonSeq)).toBe(0);
      expect(getFourCardSequenceRank(withPair)).toBe(0);
    });
  });

  describe('evaluateRoundFour categories', () => {
    it('evaluates Four of a Kind (TRAIL) with strength 7', () => {
      const fourOfAKind: Card[] = [
        { id: '1', suit: 'hearts', rank: 'K' },
        { id: '2', suit: 'diamonds', rank: 'K' },
        { id: '3', suit: 'clubs', rank: 'K' },
        { id: '4', suit: 'spades', rank: 'K' },
      ];
      const res = evaluateRoundFour(fourOfAKind);
      expect(res.category).toBe('TRAIL');
      expect(res.strength).toBe(7);
      expect(res.comparisonValues).toEqual([13]);
    });

    it('evaluates Real Larra (all four same suit, not consecutive) with strength 6', () => {
      const realLarraCards: Card[] = [
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'hearts', rank: '10' },
        { id: '3', suit: 'hearts', rank: '5' },
        { id: '4', suit: 'hearts', rank: '2' },
      ];
      const res = evaluateRoundFour(realLarraCards);
      expect(res.category).toBe('REAL_LARRA');
      expect(res.strength).toBe(6);
      expect(res.comparisonValues).toEqual([14, 10, 5, 2]);
    });

    it('evaluates Pure Sequence (four consecutive cards, same suit) with strength 5', () => {
      const pureSeq: Card[] = [
        { id: '1', suit: 'hearts', rank: '7' },
        { id: '2', suit: 'hearts', rank: '8' },
        { id: '3', suit: 'hearts', rank: '9' },
        { id: '4', suit: 'hearts', rank: '10' },
      ];
      const res = evaluateRoundFour(pureSeq);
      expect(res.category).toBe('PURE_SEQUENCE');
      expect(res.strength).toBe(5);
      expect(res.comparisonValues).toEqual([6]); // 7-8-9-10 is rank 6
    });

    it('evaluates Sequence (four consecutive cards, mixed suits) with strength 4', () => {
      const seq: Card[] = [
        { id: '1', suit: 'hearts', rank: '7' },
        { id: '2', suit: 'diamonds', rank: '8' },
        { id: '3', suit: 'clubs', rank: '9' },
        { id: '4', suit: 'spades', rank: '10' },
      ];
      const res = evaluateRoundFour(seq);
      expect(res.category).toBe('SEQUENCE');
      expect(res.strength).toBe(4);
      expect(res.comparisonValues).toEqual([6]);
    });

    it('evaluates Color (three cards same suit + one different suit) with strength 3', () => {
      const color: Card[] = [
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'hearts', rank: '8' },
        { id: '3', suit: 'hearts', rank: '3' },
        { id: '4', suit: 'spades', rank: 'K' }, // different suit
      ];
      const res = evaluateRoundFour(color);
      expect(res.category).toBe('COLOR');
      expect(res.strength).toBe(3);
      expect(res.comparisonValues).toEqual([14, 8, 3, 13]);
    });

    it('evaluates Two Pair with strength 2', () => {
      const twoPair: Card[] = [
        { id: '1', suit: 'hearts', rank: '9' },
        { id: '2', suit: 'diamonds', rank: '9' },
        { id: '3', suit: 'clubs', rank: '4' },
        { id: '4', suit: 'spades', rank: '4' },
      ];
      const res = evaluateRoundFour(twoPair);
      expect(res.category).toBe('TWO_PAIR');
      expect(res.strength).toBe(2);
      expect(res.comparisonValues).toEqual([9, 4]);
    });

    it('evaluates One Pair with strength 1 and kickers', () => {
      const onePair: Card[] = [
        { id: '1', suit: 'hearts', rank: 'J' },
        { id: '2', suit: 'diamonds', rank: 'J' },
        { id: '3', suit: 'clubs', rank: 'A' },
        { id: '4', suit: 'spades', rank: '5' },
      ];
      const res = evaluateRoundFour(onePair);
      expect(res.category).toBe('ONE_PAIR');
      expect(res.strength).toBe(1);
      expect(res.comparisonValues).toEqual([11, 14, 5]);
    });

    it('evaluates High Card with strength 0', () => {
      const highCard: Card[] = [
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'diamonds', rank: 'J' },
        { id: '3', suit: 'clubs', rank: '8' },
        { id: '4', suit: 'spades', rank: '2' },
      ];
      const res = evaluateRoundFour(highCard);
      expect(res.category).toBe('HIGH_CARD');
      expect(res.strength).toBe(0);
      expect(res.comparisonValues).toEqual([14, 11, 8, 2]);
    });
  });

  describe('compareRoundFour and FIRE detection', () => {
    it('correctly compares higher strength against lower strength', () => {
      const fourOfAKind = evaluateRoundFour([
        { id: '1', suit: 'hearts', rank: '2' },
        { id: '2', suit: 'diamonds', rank: '2' },
        { id: '3', suit: 'clubs', rank: '2' },
        { id: '4', suit: 'spades', rank: '2' },
      ]);
      const twoPair = evaluateRoundFour([
        { id: '5', suit: 'hearts', rank: 'A' },
        { id: '6', suit: 'diamonds', rank: 'A' },
        { id: '7', suit: 'clubs', rank: 'K' },
        { id: '8', suit: 'spades', rank: 'K' },
      ]);

      expect(compareRoundFour(fourOfAKind, twoPair)).toBe('PLAYER_1');
      expect(compareRoundFour(twoPair, fourOfAKind)).toBe('PLAYER_2');
    });

    it('compares same category by comparison values', () => {
      const seqJQKA = evaluateRoundFour([
        { id: '1', suit: 'hearts', rank: 'J' },
        { id: '2', suit: 'diamonds', rank: 'Q' },
        { id: '3', suit: 'clubs', rank: 'K' },
        { id: '4', suit: 'spades', rank: 'A' },
      ]);
      const seqA234 = evaluateRoundFour([
        { id: '5', suit: 'hearts', rank: 'A' },
        { id: '6', suit: 'diamonds', rank: '2' },
        { id: '7', suit: 'clubs', rank: '3' },
        { id: '8', suit: 'spades', rank: '4' },
      ]);

      expect(compareRoundFour(seqJQKA, seqA234)).toBe('PLAYER_1');
    });

    it('returns FIRE when comparison hands are identical', () => {
      const hand1 = evaluateRoundFour([
        { id: '1', suit: 'hearts', rank: 'J' },
        { id: '2', suit: 'diamonds', rank: 'Q' },
        { id: '3', suit: 'clubs', rank: 'K' },
        { id: '4', suit: 'spades', rank: 'A' },
      ]);
      const hand2 = evaluateRoundFour([
        { id: '5', suit: 'clubs', rank: 'J' },
        { id: '6', suit: 'spades', rank: 'Q' },
        { id: '7', suit: 'hearts', rank: 'K' },
        { id: '8', suit: 'diamonds', rank: 'A' },
      ]);

      expect(compareRoundFour(hand1, hand2)).toBe('FIRE');
    });
  });

  describe('Special Round 4 Scoring', () => {
    it('awards +5 points for Four Aces (AAAA)', () => {
      const scoreboard = createScoreboard();
      const fourAces = evaluateRoundFour([
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'diamonds', rank: 'A' },
        { id: '3', suit: 'clubs', rank: 'A' },
        { id: '4', suit: 'spades', rank: 'A' },
      ]);

      const updated = awardRoundFourPoints(scoreboard, 0, fourAces);
      expect(updated[0].points).toBe(5);
      expect(updated[1].points).toBe(0);
    });

    it('awards +4 points for any other Four of a Kind (TRAIL)', () => {
      const scoreboard = createScoreboard();
      const fourKings = evaluateRoundFour([
        { id: '1', suit: 'hearts', rank: 'K' },
        { id: '2', suit: 'diamonds', rank: 'K' },
        { id: '3', suit: 'clubs', rank: 'K' },
        { id: '4', suit: 'spades', rank: 'K' },
      ]);

      const updated = awardRoundFourPoints(scoreboard, 1, fourKings);
      expect(updated[1].points).toBe(4);
      expect(updated[0].points).toBe(0);
    });

    it('awards +1 point for a normal Round 4 winner', () => {
      const scoreboard = createScoreboard();
      const normalHand = evaluateRoundFour([
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'diamonds', rank: 'K' },
        { id: '3', suit: 'clubs', rank: 'Q' },
        { id: '4', suit: 'spades', rank: '9' },
      ]);

      const updated = awardRoundFourPoints(scoreboard, 2, normalHand);
      expect(updated[2].points).toBe(1);
    });

    it('awards 0 points if Round 4 is FIRE (winner is null)', () => {
      const scoreboard = createScoreboard();
      const updated = awardRoundFourPoints(scoreboard, null, null);
      expect(updated.every((p) => p.points === 0)).toBe(true);
    });
  });
});

