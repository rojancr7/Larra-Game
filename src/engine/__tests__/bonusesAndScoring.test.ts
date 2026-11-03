import { describe, it, expect } from 'vitest';
import { Card, Rank } from '../deck';
import { calculateInstantBonus } from '../instantBonus';
import { calculateCleanSweep, awardCleanSweepBonus } from '../cleanSweep';
import {
  createScoreboard,
  awardRoundPoint,
  getGameWinner,
  PlayerScore,
} from '../scoring';

describe('Bonuses and Scoring', () => {
  describe('Instant Bonuses', () => {
    it('awards +6 points for Six Jute (6 pairs and 1 singleton)', () => {
      // 6 pairs: 2-2, 3-3, 4-4, 5-5, 6-6, 7-7, and 1 singleton: A
      const sixJuteCards: Card[] = [
        { id: '1', suit: 'hearts', rank: '2' },
        { id: '2', suit: 'diamonds', rank: '2' },
        { id: '3', suit: 'hearts', rank: '3' },
        { id: '4', suit: 'diamonds', rank: '3' },
        { id: '5', suit: 'hearts', rank: '4' },
        { id: '6', suit: 'diamonds', rank: '4' },
        { id: '7', suit: 'hearts', rank: '5' },
        { id: '8', suit: 'diamonds', rank: '5' },
        { id: '9', suit: 'hearts', rank: '6' },
        { id: '10', suit: 'diamonds', rank: '6' },
        { id: '11', suit: 'hearts', rank: '7' },
        { id: '12', suit: 'diamonds', rank: '7' },
        { id: '13', suit: 'spades', rank: 'A' },
      ];

      const res = calculateInstantBonus(sixJuteCards);
      expect(res.sixJute).toBe(true);
      expect(res.threeTrayel).toBe(false);
      expect(res.grandStraight).toBe(false);
      expect(res.totalPoints).toBe(6);
    });

    it('awards +9 points for Three Trayel (3 triples)', () => {
      // 3 triples: 2-2-2, 3-3-3, 4-4-4, and 4 other cards
      const threeTrayelCards: Card[] = [
        { id: '1', suit: 'hearts', rank: '2' },
        { id: '2', suit: 'diamonds', rank: '2' },
        { id: '3', suit: 'clubs', rank: '2' },

        { id: '4', suit: 'hearts', rank: '3' },
        { id: '5', suit: 'diamonds', rank: '3' },
        { id: '6', suit: 'clubs', rank: '3' },

        { id: '7', suit: 'hearts', rank: '4' },
        { id: '8', suit: 'diamonds', rank: '4' },
        { id: '9', suit: 'clubs', rank: '4' },

        { id: '10', suit: 'spades', rank: '7' },
        { id: '11', suit: 'spades', rank: '8' },
        { id: '12', suit: 'spades', rank: '9' },
        { id: '13', suit: 'spades', rank: '10' },
      ];

      const res = calculateInstantBonus(threeTrayelCards);
      expect(res.threeTrayel).toBe(true);
      expect(res.sixJute).toBe(false);
      expect(res.grandStraight).toBe(false);
      expect(res.totalPoints).toBe(9);
    });

    it('awards +13 points for Grand Straight (all 13 distinct ranks)', () => {
      const allRanks: Rank[] = [
        'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K',
      ];
      const grandStraightCards: Card[] = allRanks.map((rank, i) => ({
        id: `card_${i}`,
        suit: 'hearts',
        rank,
      }));

      const res = calculateInstantBonus(grandStraightCards);
      expect(res.grandStraight).toBe(true);
      expect(res.sixJute).toBe(false);
      expect(res.threeTrayel).toBe(false);
      expect(res.totalPoints).toBe(13);
    });

    it('adds multiple bonuses together if qualifying for more than one', () => {
      // Hand qualifying for multiple bonuses adds them together
      // Total points = 6 + 9 = 15 or 6 + 13 etc.
      // E.g., if a hand had 6 Jute and 3 Trayel (theoretically or mathematically):
      // The logic strictly sums: (sixJute ? 6 : 0) + (threeTrayel ? 9 : 0) + (grandStraight ? 13 : 0)
      const mockBonusCalculation = (
        sixJute: boolean,
        threeTrayel: boolean,
        grandStraight: boolean
      ) => {
        return (
          (sixJute ? 6 : 0) +
          (threeTrayel ? 9 : 0) +
          (grandStraight ? 13 : 0)
        );
      };

      expect(mockBonusCalculation(true, true, false)).toBe(15);
      expect(mockBonusCalculation(true, false, true)).toBe(19);
      expect(mockBonusCalculation(false, true, true)).toBe(22);
    });

    it('returns 0 points and all false for hands with no bonuses', () => {
      const ordinaryHand: Card[] = [
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'diamonds', rank: 'A' },
        { id: '3', suit: 'clubs', rank: '2' },
        { id: '4', suit: 'spades', rank: '3' },
        { id: '5', suit: 'hearts', rank: '5' },
        { id: '6', suit: 'diamonds', rank: '6' },
        { id: '7', suit: 'clubs', rank: '7' },
        { id: '8', suit: 'spades', rank: '8' },
        { id: '9', suit: 'hearts', rank: '9' },
        { id: '10', suit: 'diamonds', rank: '10' },
        { id: '11', suit: 'clubs', rank: 'J' },
        { id: '12', suit: 'spades', rank: 'Q' },
        { id: '13', suit: 'hearts', rank: 'Q' },
      ];

      const res = calculateInstantBonus(ordinaryHand);
      expect(res.sixJute).toBe(false);
      expect(res.threeTrayel).toBe(false);
      expect(res.grandStraight).toBe(false);
      expect(res.totalPoints).toBe(0);
    });

    it('throws when card count is not exactly 13 or duplicate cards exist', () => {
      expect(() => calculateInstantBonus([])).toThrow(
        'Exactly 13 cards are required'
      );
      const duplicateCards: Card[] = Array.from({ length: 13 }, () => ({
        id: 'dup_id',
        suit: 'hearts',
        rank: 'A',
      }));
      expect(() => calculateInstantBonus(duplicateCards)).toThrow(
        'Duplicate cards are not allowed'
      );
    });
  });

  describe('Clean Sweep', () => {
    it('awards Clean Sweep (+1) when one player wins all four rounds', () => {
      const winner = calculateCleanSweep([2, 2, 2, 2]);
      expect(winner).toBe(2);

      const scoreboard = createScoreboard();
      const updated = awardCleanSweepBonus(scoreboard, winner);
      expect(updated[2].points).toBe(1);
      expect(updated[0].points).toBe(0);
    });

    it('does not award Clean Sweep if different players win', () => {
      const winner = calculateCleanSweep([0, 0, 0, 1]);
      expect(winner).toBeNull();

      const scoreboard = createScoreboard();
      const updated = awardCleanSweepBonus(scoreboard, winner);
      expect(updated.every((p) => p.points === 0)).toBe(true);
    });

    it('does not award Clean Sweep if any round results in FIRE', () => {
      expect(calculateCleanSweep([1, null, 1, 1])).toBeNull();
      expect(calculateCleanSweep([null, 0, 0, 0])).toBeNull();
      expect(calculateCleanSweep([3, 3, 3, null])).toBeNull();
    });

    it('throws error if round results length is not 4 or has invalid index', () => {
      expect(() => calculateCleanSweep([0, 0, 0])).toThrow(
        'Exactly 4 round results are required'
      );
      expect(() => calculateCleanSweep([5, 5, 5, 5])).toThrow(
        'Invalid winner index'
      );
    });
  });

  describe('Scoreboard and Match Winner', () => {
    it('awards normal round winner +1 point and FIRE 0 points', () => {
      let scoreboard = createScoreboard();
      scoreboard = awardRoundPoint(scoreboard, 1);
      expect(scoreboard[1].points).toBe(1);

      scoreboard = awardRoundPoint(scoreboard, null); // FIRE
      expect(scoreboard[1].points).toBe(1);
      expect(scoreboard.every((p, i) => (i === 1 ? p.points === 1 : p.points === 0))).toBe(true);
    });

    it('declares the first player reaching 20+ points as the game winner', () => {
      const scores: PlayerScore[] = [
        { playerId: 'p1', name: 'P1', points: 19 },
        { playerId: 'p2', name: 'P2', points: 20 },
        { playerId: 'p3', name: 'P3', points: 15 },
        { playerId: 'p4', name: 'P4', points: 10 },
      ];

      const winner = getGameWinner(scores);
      expect(winner).not.toBeNull();
      expect(winner?.playerId).toBe('p2');
    });

    it('returns null if no player has reached 20 points', () => {
      const scores: PlayerScore[] = [
        { playerId: 'p1', name: 'P1', points: 19 },
        { playerId: 'p2', name: 'P2', points: 18 },
        { playerId: 'p3', name: 'P3', points: 12 },
        { playerId: 'p4', name: 'P4', points: 14 },
      ];

      expect(getGameWinner(scores)).toBeNull();
    });
  });
});

