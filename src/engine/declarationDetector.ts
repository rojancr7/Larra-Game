import { Card, Rank } from './deck';
import { HandPartition } from './partition';
import { calculateInstantBonus } from './instantBonus';
import { getFourCardSequenceRank } from './roundFour';

export type DeclarationType =
  | 'FOUR_OF_A_KIND'
  | 'SIX_JUTE'
  | 'THREE_TRAYEL'
  | 'GRAND_STRAIGHT'
  | 'INSTANT_VICTORY'
  | 'WIN_20';

export interface EligibleDeclaration {
  type: DeclarationType;
  title: string;
  badge: string;
  points: number;
  description: string;
  cards?: Card[];
}

/**
 * Detects whether the player currently holds an eligible declaration:
 * - 20-point match win condition
 * - Round 4 Instant Victory sequence (A-2-3-4 or J-Q-K-A)
 * - Grand Straight (13-card sequence)
 * - Three Trayel (3 sets of 3-of-a-kind)
 * - Six Jute (6 pairs + 1 single)
 * - Four of a Kind (four same cards)
 */
export function detectEligibleDeclaration(
  cards: Card[],
  roundGroups: HandPartition,
  currentScore: number,
): EligibleDeclaration | null {
  // 1. 20-point match win condition
  if (currentScore >= 20) {
    return {
      type: 'WIN_20',
      title: '20-Point Match Victory',
      badge: '🏆 20 PTS',
      points: 0,
      description: 'You have reached 20 points! Claim match victory.',
    };
  }

  // 2. Round 4 Instant Victory sequence
  if (roundGroups[3].length === 4) {
    const seqRank = getFourCardSequenceRank(roundGroups[3]);
    if (seqRank >= 10) {
      return {
        type: 'INSTANT_VICTORY',
        title: 'Round 4 Instant Win',
        badge: '👑 INSTANT WIN',
        points: 20,
        description: 'Instant Victory 4-card sequence in Round 4!',
        cards: roundGroups[3],
      };
    }
  }

  // 3. Instant Hand Bonuses (Grand Straight, Three Trayel, Six Jute)
  if (cards.length === 13) {
    try {
      const bonus = calculateInstantBonus(cards);
      if (bonus.grandStraight) {
        return {
          type: 'GRAND_STRAIGHT',
          title: 'Grand Straight Declaration',
          badge: '👑 GRAND STRAIGHT',
          points: 13,
          description: 'Continuous 13-card sequence (+13 pts)!',
          cards,
        };
      }
      if (bonus.threeTrayel) {
        return {
          type: 'THREE_TRAYEL',
          title: 'Three Trayel Declaration',
          badge: '🔥 THREE TRAYEL',
          points: 9,
          description: 'Three sets of 3-of-a-kind (+9 pts)!',
          cards,
        };
      }
      if (bonus.sixJute) {
        return {
          type: 'SIX_JUTE',
          title: 'Six Jute Declaration',
          badge: '👥 SIX JUTE',
          points: 6,
          description: 'Six distinct pairs (+6 pts)!',
          cards,
        };
      }
    } catch {
      // ignore validation errors if cards not unique during transitions
    }
  }

  // 4. Four of a Kind (Four same cards of any rank)
  // Four Aces = +5 points, any other Four-of-a-Kind = +4 points
  const rankMap = new Map<Rank, Card[]>();
  for (const c of cards) {
    const list = rankMap.get(c.rank) || [];
    list.push(c);
    rankMap.set(c.rank, list);
  }
  for (const [rank, matchingCards] of rankMap.entries()) {
    if (matchingCards.length === 4) {
      const isFourAces = rank === 'A';
      return {
        type: 'FOUR_OF_A_KIND',
        title: isFourAces ? 'Four Aces (AAAA)' : `Four of a Kind (${rank}s)`,
        badge: isFourAces ? '💥 FOUR ACES (+5)' : `💥 4 OF A KIND (${rank}s) (+4)`,
        points: isFourAces ? 5 : 4,
        description: isFourAces
          ? 'Four Aces in Round 4 (+5 pts, deal stops)!'
          : `Four ${rank}s in Round 4 (+4 pts, deal stops)!`,
        cards: matchingCards,
      };
    }
  }

  return null;
}

