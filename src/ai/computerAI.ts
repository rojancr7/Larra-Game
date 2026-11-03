/**
 * computerAI.ts — Strategic Mind-Game AI partitioning for the Larra card game.
 *
 * Strategic Architecture:
 * 1. Validates that the input is an array of exactly 13 unique, well-formed cards.
 * 2. Evaluates all four hands together:
 *    - All C(13, 3) = 286 3-card combinations scored via evaluateThreeCardHand().
 *    - All C(13, 4) = 715 4-card combinations scored via evaluateRoundFour() and
 *      getFourCardSequenceRank() (giving massive priority to Round 4 Instant Victory
 *      sequences A-2-3-4 / J-Q-K-A and Round 4 Four-of-a-Kind Trails).
 * 3. Evaluates overall partition strength across all 4 rounds:
 *    - Uses precomputed index mappings (715 Round 4 candidate choices × 280 canonical
 *      non-overlapping 3-group partitions of 9 cards).
 *    - Employs branch-and-bound pruning to evaluate candidate allocations in milliseconds.
 * 4. Mind Game Round Ordering:
 *    - Does NOT blindly sort cards from strongest to weakest.
 *    - Strategically evaluates sacrificing early rounds (e.g. playing a sacrificial weak hand
 *      or bait in Round 1 to absorb opponents' leads) to preserve peak strength in Rounds 2, 3,
 *      and 4.
 *    - Adapts to match context, player score, and tactical styles (Ambush, Late Anchor, Aggressive).
 * 5. Validates the final partition with validatePartition() before returning.
 */

import { Card } from "../engine/deck";
import { HandPartition, validatePartition } from "../engine/partition";
import {
  evaluateThreeCardHand,
  HandResult,
  RANK_VALUES,
} from "../engine/handEvaluator";
import {
  evaluateRoundFour,
  getFourCardSequenceRank,
  RoundFourResult,
} from "../engine/roundFour";

// ---------------------------------------------------------------------------
// Precomputed Static Combinatorial Structures
// ---------------------------------------------------------------------------

interface Combo4 {
  indices: [number, number, number, number];
  remIndices: number[]; // exactly 9 indices
}

// Generate all 715 4-card index choices from 13 cards (0..12)
const STATIC_COMBOS_4: Combo4[] = (() => {
  const list: Combo4[] = [];
  for (let a = 0; a < 10; a++) {
    for (let b = a + 1; b < 11; b++) {
      for (let c = b + 1; c < 12; c++) {
        for (let d = c + 1; d < 13; d++) {
          const s = new Set([a, b, c, d]);
          const rem: number[] = [];
          for (let i = 0; i < 13; i++) {
            if (!s.has(i)) rem.push(i);
          }
          list.push({ indices: [a, b, c, d], remIndices: rem });
        }
      }
    }
  }
  return list;
})();

// Generate all 280 canonical partitions of 9 indices (0..8) into 3 groups of 3
const STATIC_PARTITIONS_9: [number[], number[], number[]][] = (() => {
  const parts: [number[], number[], number[]][] = [];
  for (let b = 1; b < 9; b++) {
    for (let c = b + 1; c < 9; c++) {
      const g1 = [0, b, c];
      const rem1 = [1, 2, 3, 4, 5, 6, 7, 8].filter((x) => x !== b && x !== c);
      const firstRem = rem1[0];
      for (let j = 1; j < rem1.length; j++) {
        for (let k = j + 1; k < rem1.length; k++) {
          const g2 = [firstRem, rem1[j], rem1[k]];
          const g3 = rem1.filter(
            (x) => x !== firstRem && x !== rem1[j] && x !== rem1[k],
          );
          parts.push([g1, g2, g3]);
        }
      }
    }
  }
  return parts;
})();

// ---------------------------------------------------------------------------
// Scoring Helpers
// ---------------------------------------------------------------------------

export function scoreThreeCardHand(res: HandResult): number {
  let score = res.strength * 1000;
  let mult = 10;
  for (let i = 0; i < res.comparisonValues.length; i++) {
    score += res.comparisonValues[i] * mult;
    mult /= 20;
  }
  return score;
}

export function scoreFourCardHand(res: RoundFourResult, cards: Card[]): number {
  const seqRank = getFourCardSequenceRank(cards);
  if (seqRank >= 10) {
    // Instant match victory! Differentiate rank 11 (J-Q-K-A) over rank 10 (A-2-3-4)
    return 1_000_000 + seqRank * 100_000;
  }

  // Round 4 Trail bonus: 4 Aces = +5 points, other Trail = +4 points
  if (res.strength === 7) {
    const isFourAces = res.comparisonValues[0] === 14;
    return isFourAces ? 50_000 + 14 * 10 : 40_000 + res.comparisonValues[0] * 10;
  }

  let score = res.strength * 1000;
  let mult = 10;
  for (let i = 0; i < res.comparisonValues.length; i++) {
    score += res.comparisonValues[i] * mult;
    mult /= 20;
  }
  return score;
}

export type AIDifficulty = 'easy' | 'med' | 'hard';

export interface AIPartitionOptions {
  playerIndex?: number;
  currentScore?: number;
  opponentsScores?: number[];
  strategy?: 'ambush_sacrifice' | 'late_anchor' | 'aggressive' | 'balanced' | 'auto';
  difficulty?: AIDifficulty;
}

/**
 * Casual beginner partition generator for Easy mode.
 * Creates an intuitive, valid, but beatable partition.
 */
function generateEasyPartition(hand: Card[]): HandPartition {
  const sorted = [...hand].sort(
    (a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank],
  );
  // Interleave cards across rounds so AI holds casual moderate cards
  const r1 = [sorted[0], sorted[4], sorted[8]];
  const r2 = [sorted[1], sorted[5], sorted[9]];
  const r3 = [sorted[2], sorted[6], sorted[10]];
  const r4 = [sorted[3], sorted[7], sorted[11], sorted[12]];
  const partition: HandPartition = [r1, r2, r3, r4];
  if (validatePartition(hand, partition)) {
    return partition;
  }
  return [
    sorted.slice(0, 3),
    sorted.slice(3, 6),
    sorted.slice(6, 9),
    sorted.slice(9, 13),
  ];
}

// ---------------------------------------------------------------------------
// Main Strategic AI Partition Generator
// ---------------------------------------------------------------------------

/**
 * Strategically partitions 13 cards into [3, 3, 3, 4] for Rounds 1-4.
 *
 * Implements tactical mind-game awareness:
 * - Can sacrifice Round 1 to bait out opponent's best lead and secure Rounds 2, 3, and 4.
 * - Reserves peak combinations for Round 4 when high-scoring categories exist.
 * - Adapts to match situation and player personalities.
 *
 * @param hand Exactly 13 cards dealt to the player.
 * @param options Contextual match information and strategic preferences.
 * @returns A validated HandPartition [round1, round2, round3, round4].
 */
export function generateAIPartition(
  hand: Card[],
  options?: AIPartitionOptions,
): HandPartition {
  // 1. Strict input validation
  if (!Array.isArray(hand)) {
    throw new Error("Invalid input: hand must be an array of Card objects");
  }

  if (hand.length !== 13) {
    throw new Error(
      `Invalid hand size: expected exactly 13 cards, received ${hand.length}`,
    );
  }

  const seenIds = new Set<string>();
  for (let i = 0; i < 13; i++) {
    const card = hand[i];
    if (
      !card ||
      typeof card.id !== "string" ||
      !card.rank ||
      !card.suit
    ) {
      throw new Error(`Invalid card object at index ${i}`);
    }
    if (seenIds.has(card.id)) {
      throw new Error(`Duplicate card detected: ${card.id}`);
    }
    seenIds.add(card.id);
  }

  const difficulty = options?.difficulty || 'hard';

  // Easy mode: casual, beatable partition without heavy optimization
  if (difficulty === 'easy') {
    return generateEasyPartition(hand);
  }

  // 2. Precompute 3-card hand scores for all C(13, 3) = 286 combinations
  const score3Table = new Float64Array(13 * 13 * 13);
  const eval3Table = new Map<number, HandResult>();
  const allScore3Values: number[] = [];

  for (let i = 0; i < 11; i++) {
    for (let j = i + 1; j < 12; j++) {
      for (let k = j + 1; k < 13; k++) {
        const triple = [hand[i], hand[j], hand[k]];
        const evalRes = evaluateThreeCardHand(triple);
        const score = scoreThreeCardHand(evalRes);
        const key = i * 169 + j * 13 + k;
        score3Table[key] = score;
        eval3Table.set(key, evalRes);
        allScore3Values.push(score);
      }
    }
  }

  // Theoretical maximum score possible from any three 3-card hands
  allScore3Values.sort((a, b) => b - a);
  const maxUpper3 =
    allScore3Values[0] + allScore3Values[1] + allScore3Values[2];

  // 3. Precompute Round 4 hand scores for all 715 combinations
  interface EvaluatedCombo4 {
    combo: Combo4;
    score: number;
  }

  const evaluatedR4: EvaluatedCombo4[] = [];

  for (let c = 0; c < STATIC_COMBOS_4.length; c++) {
    const combo = STATIC_COMBOS_4[c];
    const [a, b, cIdx, d] = combo.indices;
    const cards4 = [hand[a], hand[b], hand[cIdx], hand[d]];
    const evalRes = evaluateRoundFour(cards4);
    const score = scoreFourCardHand(evalRes, cards4);
    evaluatedR4.push({ combo, score });
  }

  evaluatedR4.sort((a, b) => b.score - a.score);

  // In Medium mode, evaluate top 35 candidates for solid tactical play
  const candidateLimit =
    difficulty === 'med'
      ? Math.min(35, evaluatedR4.length)
      : evaluatedR4.length;

  // 4. Strategic Partition Search with Branch-and-Bound
  let bestTotalScore = -1;
  let bestR4Indices: [number, number, number, number] | null = null;
  let bestGroupsIndices: [number[], number[], number[]] | null = null;

  for (let r = 0; r < candidateLimit; r++) {
    const { combo, score: r4Score } = evaluatedR4[r];

    if (bestTotalScore > 0 && r4Score + maxUpper3 <= bestTotalScore) {
      break;
    }

    const rem = combo.remIndices;

    for (let p = 0; p < STATIC_PARTITIONS_9.length; p++) {
      const part = STATIC_PARTITIONS_9[p];
      const g1Idx = part[0];
      const g2Idx = part[1];
      const g3Idx = part[2];

      const key1 = rem[g1Idx[0]] * 169 + rem[g1Idx[1]] * 13 + rem[g1Idx[2]];
      const key2 = rem[g2Idx[0]] * 169 + rem[g2Idx[1]] * 13 + rem[g2Idx[2]];
      const key3 = rem[g3Idx[0]] * 169 + rem[g3Idx[1]] * 13 + rem[g3Idx[2]];

      const s1 = score3Table[key1];
      const s2 = score3Table[key2];
      const s3 = score3Table[key3];

      const totalScore = r4Score + s1 + s2 + s3;

      if (totalScore > bestTotalScore) {
        bestTotalScore = totalScore;
        bestR4Indices = combo.indices;
        bestGroupsIndices = [
          [rem[g1Idx[0]], rem[g1Idx[1]], rem[g1Idx[2]]],
          [rem[g2Idx[0]], rem[g2Idx[1]], rem[g2Idx[2]]],
          [rem[g3Idx[0]], rem[g3Idx[1]], rem[g3Idx[2]]],
        ];
      }
    }
  }

  if (!bestR4Indices || !bestGroupsIndices) {
    throw new Error("Failed to compute AI partition");
  }

  // 5. Tactical Round Ordering (Mind Game Analysis)
  // Build the 3 chosen three-card groups
  const threeCardGroups = bestGroupsIndices.map((indices) =>
    indices.map((i) => hand[i]),
  );

  // Rank the three 3-card groups from strongest to weakest
  threeCardGroups.sort((groupA, groupB) => {
    const evalA = evaluateThreeCardHand(groupA);
    const evalB = evaluateThreeCardHand(groupB);
    return scoreThreeCardHand(evalB) - scoreThreeCardHand(evalA);
  });

  const [strongGroup, medGroup, weakGroup] = threeCardGroups;
  const roundFourGroup = bestR4Indices.map((i) => hand[i]);

  // Determine tactical positioning for Rounds 1, 2, and 3
  const playerIdx = options?.playerIndex ?? 0;
  const currentScore = options?.currentScore ?? 0;
  const strategyChoice = options?.strategy ?? 'auto';

  let orderedRounds: [Card[], Card[], Card[]];

  if (difficulty === 'med') {
    // Medium mode: standard competitive ordering without sacrificial traps
    orderedRounds = [strongGroup, medGroup, weakGroup];
  } else if (strategyChoice === 'ambush_sacrifice') {
    // Sacrifice Round 1 (bait with weak hand), unleash peak strength in Rounds 2 & 3
    orderedRounds = [weakGroup, strongGroup, medGroup];
  } else if (strategyChoice === 'late_anchor') {
    // Save the strongest hand for Round 3 right before Round 4
    orderedRounds = [medGroup, weakGroup, strongGroup];
  } else if (strategyChoice === 'aggressive') {
    // Lead with strongest hand to strike early
    orderedRounds = [strongGroup, medGroup, weakGroup];
  } else if (strategyChoice === 'balanced') {
    // Stepladder counter
    orderedRounds = [medGroup, strongGroup, weakGroup];
  } else {
    // 'auto' adaptive selection:
    if (currentScore >= 18) {
      // 1 or 2 points from 20: prioritize immediate win in Round 1
      orderedRounds = [strongGroup, medGroup, weakGroup];
    } else if (playerIdx === 1) {
      // Player 2 tactical persona: Ambush (sacrifice Round 1, dominate Rounds 2 & 3)
      orderedRounds = [weakGroup, strongGroup, medGroup];
    } else if (playerIdx === 2) {
      // Player 3 tactical persona: Late Anchor (reserves power for Round 3 & 4)
      orderedRounds = [medGroup, weakGroup, strongGroup];
    } else if (playerIdx === 3) {
      // Player 4 tactical persona: Stepladder Counter
      orderedRounds = [medGroup, strongGroup, weakGroup];
    } else {
      // Default: Balanced Tactical
      orderedRounds = [strongGroup, medGroup, weakGroup];
    }
  }

  const finalPartition: HandPartition = [
    orderedRounds[0],
    orderedRounds[1],
    orderedRounds[2],
    roundFourGroup,
  ];

  // 6. Validate with engine's validatePartition() before returning
  if (!validatePartition(hand, finalPartition)) {
    throw new Error("Generated partition failed engine validation");
  }

  return finalPartition;
}

/**
 * Backward compatibility alias for computeAIPartition.
 */
export const computeAIPartition = generateAIPartition;
