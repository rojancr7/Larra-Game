import { describe, it, expect } from 'vitest';
import { Card } from '../deck';
import {
  evaluateThreeCardHand,
  getThreeCardSequenceRank,
  HandResult,
} from '../handEvaluator';
import { compareHands } from '../compareHands';
import { determineRoundWinner } from '../roundWinner';

describe('Rounds 1–3 Evaluation (3 Cards)', () => {
  describe('getThreeCardSequenceRank', () => {
    it('recognizes Q-K-A as the highest sequence (rank 12)', () => {
      const qka: Card[] = [
        { id: '1', suit: 'hearts', rank: 'Q' },
        { id: '2', suit: 'diamonds', rank: 'K' },
        { id: '3', suit: 'clubs', rank: 'A' },
      ];
      expect(getThreeCardSequenceRank(qka)).toBe(12);
    });

    it('recognizes A-2-3 as the second-highest sequence (rank 11)', () => {
      const a23: Card[] = [
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'diamonds', rank: '2' },
        { id: '3', suit: 'clubs', rank: '3' },
      ];
      expect(getThreeCardSequenceRank(a23)).toBe(11);
    });

    it('ranks normal sequences in ascending order from 2-3-4 (rank 1) to J-Q-K (rank 10)', () => {
      const seq234: Card[] = [
        { id: '1', suit: 'hearts', rank: '2' },
        { id: '2', suit: 'diamonds', rank: '3' },
        { id: '3', suit: 'clubs', rank: '4' },
      ];
      const seq345: Card[] = [
        { id: '1', suit: 'hearts', rank: '3' },
        { id: '2', suit: 'diamonds', rank: '4' },
        { id: '3', suit: 'clubs', rank: '5' },
      ];
      const seq10JQ: Card[] = [
        { id: '1', suit: 'hearts', rank: '10' },
        { id: '2', suit: 'diamonds', rank: 'J' },
        { id: '3', suit: 'clubs', rank: 'Q' },
      ];
      const seqJQK: Card[] = [
        { id: '1', suit: 'hearts', rank: 'J' },
        { id: '2', suit: 'diamonds', rank: 'Q' },
        { id: '3', suit: 'clubs', rank: 'K' },
      ];

      expect(getThreeCardSequenceRank(seq234)).toBe(1);
      expect(getThreeCardSequenceRank(seq345)).toBe(2);
      expect(getThreeCardSequenceRank(seq10JQ)).toBe(9);
      expect(getThreeCardSequenceRank(seqJQK)).toBe(10);
    });

    it('returns 0 for non-sequences like K-A-2 or irregular hands', () => {
      const ka2: Card[] = [
        { id: '1', suit: 'hearts', rank: 'K' },
        { id: '2', suit: 'diamonds', rank: 'A' },
        { id: '3', suit: 'clubs', rank: '2' },
      ];
      const nonSeq: Card[] = [
        { id: '1', suit: 'hearts', rank: '2' },
        { id: '2', suit: 'diamonds', rank: '4' },
        { id: '3', suit: 'clubs', rank: '6' },
      ];
      const withPair: Card[] = [
        { id: '1', suit: 'hearts', rank: '2' },
        { id: '2', suit: 'diamonds', rank: '2' },
        { id: '3', suit: 'clubs', rank: '3' },
      ];

      expect(getThreeCardSequenceRank(ka2)).toBe(0);
      expect(getThreeCardSequenceRank(nonSeq)).toBe(0);
      expect(getThreeCardSequenceRank(withPair)).toBe(0);
    });
  });

  describe('evaluateThreeCardHand categories', () => {
    it('evaluates Trail (Three of a Kind) with strength 6', () => {
      const trail: Card[] = [
        { id: '1', suit: 'hearts', rank: 'K' },
        { id: '2', suit: 'diamonds', rank: 'K' },
        { id: '3', suit: 'clubs', rank: 'K' },
      ];
      const res = evaluateThreeCardHand(trail);
      expect(res.category).toBe('TRAIL');
      expect(res.strength).toBe(6);
      expect(res.comparisonValues).toEqual([13]);
    });

    it('evaluates Pure Sequence (Straight Flush) with strength 5', () => {
      const pureA23: Card[] = [
        { id: '1', suit: 'spades', rank: 'A' },
        { id: '2', suit: 'spades', rank: '2' },
        { id: '3', suit: 'spades', rank: '3' },
      ];
      const res = evaluateThreeCardHand(pureA23);
      expect(res.category).toBe('PURE_SEQUENCE');
      expect(res.strength).toBe(5);
      expect(res.comparisonValues).toEqual([11]);
    });

    it('evaluates Sequence (Mixed Straight) with strength 4', () => {
      const mixedQKA: Card[] = [
        { id: '1', suit: 'hearts', rank: 'Q' },
        { id: '2', suit: 'spades', rank: 'K' },
        { id: '3', suit: 'clubs', rank: 'A' },
      ];
      const res = evaluateThreeCardHand(mixedQKA);
      expect(res.category).toBe('SEQUENCE');
      expect(res.strength).toBe(4);
      expect(res.comparisonValues).toEqual([12]);
    });

    it('evaluates Color (Flush) with strength 3', () => {
      const flush: Card[] = [
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'hearts', rank: '10' },
        { id: '3', suit: 'hearts', rank: '2' },
      ];
      const res = evaluateThreeCardHand(flush);
      expect(res.category).toBe('COLOR');
      expect(res.strength).toBe(3);
      expect(res.comparisonValues).toEqual([14, 10, 2]);
    });

    it('evaluates Pair with strength 2 and kicker value', () => {
      const pair: Card[] = [
        { id: '1', suit: 'hearts', rank: '9' },
        { id: '2', suit: 'spades', rank: '9' },
        { id: '3', suit: 'clubs', rank: 'K' },
      ];
      const res = evaluateThreeCardHand(pair);
      expect(res.category).toBe('PAIR');
      expect(res.strength).toBe(2);
      expect(res.comparisonValues).toEqual([9, 13]); // Pair of 9s, King kicker
    });

    it('evaluates High Card with strength 1', () => {
      const high: Card[] = [
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'spades', rank: '8' },
        { id: '3', suit: 'diamonds', rank: '3' },
      ];
      const res = evaluateThreeCardHand(high);
      expect(res.category).toBe('HIGH_CARD');
      expect(res.strength).toBe(1);
      expect(res.comparisonValues).toEqual([14, 8, 3]);
    });

    it('rejects hands that do not have exactly 3 cards or have duplicate cards', () => {
      const twoCards: Card[] = [
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'spades', rank: 'K' },
      ];
      expect(() => evaluateThreeCardHand(twoCards)).toThrow();

      const dupCards: Card[] = [
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'spades', rank: 'K' },
      ];
      expect(() => evaluateThreeCardHand(dupCards)).toThrow();
    });
  });

  describe('compareHands comparisons and tie-breaks', () => {
    it('compares category strengths correctly', () => {
      const trail = evaluateThreeCardHand([
        { id: '1', suit: 'hearts', rank: '2' },
        { id: '2', suit: 'diamonds', rank: '2' },
        { id: '3', suit: 'clubs', rank: '2' },
      ]);
      const pureSeq = evaluateThreeCardHand([
        { id: '4', suit: 'spades', rank: 'Q' },
        { id: '5', suit: 'spades', rank: 'K' },
        { id: '6', suit: 'spades', rank: 'A' },
      ]);
      const seq = evaluateThreeCardHand([
        { id: '7', suit: 'hearts', rank: 'Q' },
        { id: '8', suit: 'diamonds', rank: 'K' },
        { id: '9', suit: 'spades', rank: 'A' },
      ]);
      const color = evaluateThreeCardHand([
        { id: '10', suit: 'hearts', rank: 'A' },
        { id: '11', suit: 'hearts', rank: 'K' },
        { id: '12', suit: 'hearts', rank: 'J' },
      ]);
      const pair = evaluateThreeCardHand([
        { id: '13', suit: 'hearts', rank: 'A' },
        { id: '14', suit: 'spades', rank: 'A' },
        { id: '15', suit: 'clubs', rank: 'K' },
      ]);
      const highCard = evaluateThreeCardHand([
        { id: '16', suit: 'hearts', rank: 'A' },
        { id: '17', suit: 'diamonds', rank: 'K' },
        { id: '18', suit: 'spades', rank: 'J' },
      ]);

      expect(compareHands(trail, pureSeq)).toBe('PLAYER_1');
      expect(compareHands(pureSeq, seq)).toBe('PLAYER_1');
      expect(compareHands(seq, color)).toBe('PLAYER_1');
      expect(compareHands(color, pair)).toBe('PLAYER_1');
      expect(compareHands(pair, highCard)).toBe('PLAYER_1');
    });

    it('ranks Q-K-A > A-2-3 > J-Q-K > normal sequences', () => {
      const qka = evaluateThreeCardHand([
        { id: '1', suit: 'hearts', rank: 'Q' },
        { id: '2', suit: 'diamonds', rank: 'K' },
        { id: '3', suit: 'clubs', rank: 'A' },
      ]);
      const a23 = evaluateThreeCardHand([
        { id: '4', suit: 'hearts', rank: 'A' },
        { id: '5', suit: 'diamonds', rank: '2' },
        { id: '6', suit: 'clubs', rank: '3' },
      ]);
      const jqk = evaluateThreeCardHand([
        { id: '7', suit: 'hearts', rank: 'J' },
        { id: '8', suit: 'diamonds', rank: 'Q' },
        { id: '9', suit: 'clubs', rank: 'K' },
      ]);
      const seq234 = evaluateThreeCardHand([
        { id: '10', suit: 'hearts', rank: '2' },
        { id: '11', suit: 'diamonds', rank: '3' },
        { id: '12', suit: 'clubs', rank: '4' },
      ]);

      expect(compareHands(qka, a23)).toBe('PLAYER_1');
      expect(compareHands(a23, jqk)).toBe('PLAYER_1');
      expect(compareHands(jqk, seq234)).toBe('PLAYER_1');
    });

    it('compares pairs by pair rank first, then kicker', () => {
      const pairAA_K = evaluateThreeCardHand([
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'diamonds', rank: 'A' },
        { id: '3', suit: 'clubs', rank: 'K' },
      ]);
      const pairAA_Q = evaluateThreeCardHand([
        { id: '4', suit: 'spades', rank: 'A' },
        { id: '5', suit: 'clubs', rank: 'A' },
        { id: '6', suit: 'diamonds', rank: 'Q' },
      ]);
      const pairKK_A = evaluateThreeCardHand([
        { id: '7', suit: 'hearts', rank: 'K' },
        { id: '8', suit: 'diamonds', rank: 'K' },
        { id: '9', suit: 'clubs', rank: 'A' },
      ]);

      // AA with K kicker beats AA with Q kicker
      expect(compareHands(pairAA_K, pairAA_Q)).toBe('PLAYER_1');
      // AA with Q kicker beats KK with A kicker
      expect(compareHands(pairAA_Q, pairKK_A)).toBe('PLAYER_1');
    });

    it('returns FIRE for exactly identical comparison hands', () => {
      const hand1 = evaluateThreeCardHand([
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'diamonds', rank: 'A' },
        { id: '3', suit: 'clubs', rank: 'K' },
      ]);
      const hand2 = evaluateThreeCardHand([
        { id: '4', suit: 'spades', rank: 'A' },
        { id: '5', suit: 'clubs', rank: 'A' },
        { id: '6', suit: 'diamonds', rank: 'K' },
      ]);

      expect(compareHands(hand1, hand2)).toBe('FIRE');
    });
  });

  describe('determineRoundWinner across 4 players', () => {
    it('identifies the unique winning hand correctly', () => {
      const p0 = evaluateThreeCardHand([
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'spades', rank: 'A' },
        { id: '3', suit: 'diamonds', rank: 'K' },
      ]); // Pair of Aces
      const p1 = evaluateThreeCardHand([
        { id: '4', suit: 'hearts', rank: '2' },
        { id: '5', suit: 'spades', rank: '3' },
        { id: '6', suit: 'diamonds', rank: '4' },
      ]); // Sequence 2-3-4
      const p2 = evaluateThreeCardHand([
        { id: '7', suit: 'hearts', rank: '9' },
        { id: '8', suit: 'spades', rank: '5' },
        { id: '9', suit: 'diamonds', rank: '2' },
      ]); // High card 9
      const p3 = evaluateThreeCardHand([
        { id: '10', suit: 'hearts', rank: 'J' },
        { id: '11', suit: 'diamonds', rank: 'Q' },
        { id: '12', suit: 'spades', rank: 'K' },
      ]); // Sequence J-Q-K

      const result = determineRoundWinner([p0, p1, p2, p3]);
      expect(result).toEqual({ winnerIndex: 3, outcome: 'WIN' });
    });

    it('detects a tie for strongest hand and returns FIRE', () => {
      const p0 = evaluateThreeCardHand([
        { id: '1', suit: 'hearts', rank: 'J' },
        { id: '2', suit: 'diamonds', rank: 'Q' },
        { id: '3', suit: 'spades', rank: 'K' },
      ]); // Sequence J-Q-K
      const p1 = evaluateThreeCardHand([
        { id: '4', suit: 'clubs', rank: 'J' },
        { id: '5', suit: 'spades', rank: 'Q' },
        { id: '6', suit: 'hearts', rank: 'K' },
      ]); // Sequence J-Q-K (Tied with p0!)
      const p2 = evaluateThreeCardHand([
        { id: '7', suit: 'hearts', rank: '9' },
        { id: '8', suit: 'spades', rank: '5' },
        { id: '9', suit: 'diamonds', rank: '2' },
      ]); // High card 9
      const p3 = evaluateThreeCardHand([
        { id: '10', suit: 'hearts', rank: '8' },
        { id: '11', suit: 'spades', rank: '8' },
        { id: '12', suit: 'diamonds', rank: '2' },
      ]); // Pair 8s

      const result = determineRoundWinner([p0, p1, p2, p3]);
      expect(result).toEqual({ winnerIndex: null, outcome: 'FIRE' });
    });

    it('does not trigger FIRE if the tie is among non-winning hands', () => {
      const p0 = evaluateThreeCardHand([
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'diamonds', rank: 'A' },
        { id: '3', suit: 'clubs', rank: 'A' },
      ]); // Trail of Aces (Strongest!)
      const p1 = evaluateThreeCardHand([
        { id: '4', suit: 'clubs', rank: 'J' },
        { id: '5', suit: 'spades', rank: 'Q' },
        { id: '6', suit: 'hearts', rank: 'K' },
      ]); // Sequence J-Q-K
      const p2 = evaluateThreeCardHand([
        { id: '7', suit: 'diamonds', rank: 'J' },
        { id: '8', suit: 'hearts', rank: 'Q' },
        { id: '9', suit: 'diamonds', rank: 'K' },
      ]); // Sequence J-Q-K (Tied with p1, but both weaker than p0!)
      const p3 = evaluateThreeCardHand([
        { id: '10', suit: 'hearts', rank: '8' },
        { id: '11', suit: 'spades', rank: '8' },
        { id: '12', suit: 'diamonds', rank: '2' },
      ]);

      const result = determineRoundWinner([p0, p1, p2, p3]);
      expect(result).toEqual({ winnerIndex: 0, outcome: 'WIN' });
    });
  });
});

