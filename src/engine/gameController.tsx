import { dealCards } from "./deal";
import { Card, createDeck, shuffle } from "./deck";

import {
  awardRoundFourPoints,
  awardRoundPoint,
  createScoreboard,
  getGameWinner,
  PlayerScore,
} from "./scoring";

import { HandPartition, validatePartition } from "./partition";

import { evaluateThreeCardHand, HandResult } from "./handEvaluator";

import { determineRoundWinner, RoundResult } from "./roundWinner";

import { awardCleanSweepBonus, calculateCleanSweep } from "./cleanSweep";

import {
  evaluateRoundFour,
  getFourCardSequenceRank,
  RoundFourResult,
} from "./roundFour";

import { compareRoundFour } from "./compareRoundFour";

import { calculateInstantBonus, InstantBonus } from "./instantBonus";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  partition: HandPartition | null;
  instantBonus: InstantBonus;
}

export interface GameState {
  players: Player[];
  scores: PlayerScore[];
  currentRound: number;
  isGameOver: boolean;
  isSettled: boolean;
  roundResults: RoundResult[] | null;
  cleanSweepWinner: number | null;
  matchWinner: PlayerScore | null;
  instantVictoryWinner: number | null;
  winningRound?: number | null;
  winningEvent?: string | null;
}

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function validateGame(game: GameState): void {
  if (game.players.length !== 4) {
    throw new Error("Exactly 4 players are required");
  }

  if (game.scores.length !== 4) {
    throw new Error("Exactly 4 player scores are required");
  }
}

function dealNewCards(scores: PlayerScore[], playerNames: string[]): GameState {
  const deck = shuffle(createDeck());
  const dealtHands = dealCards(deck, 4, 13);

  const players: Player[] = dealtHands.map((cards, index) => ({
    id: `player-${index + 1}`,
    name: playerNames[index],
    cards,
    partition: null,
    instantBonus: calculateInstantBonus(cards),
  }));

  // Instant bonuses are awarded immediately after dealing.
  const updatedScores = scores.map((score, index) => ({
    ...score,
    points: score.points + players[index].instantBonus.totalPoints,
  }));

  // Check if any individual player reached 20 from instant bonuses
  let matchWinner: PlayerScore | null = null;
  let winningEvent: string | null = null;

  const qualifyingPlayers = updatedScores
    .map((s, idx) => ({ score: s, index: idx }))
    .filter((p) => p.score.points >= 20);

  if (qualifyingPlayers.length > 0) {
    if (qualifyingPlayers.length === 1) {
      matchWinner = qualifyingPlayers[0].score;
      winningEvent = 'Instant Deal Bonus';
    } else {
      // If multiple players reach 20 from instant bonuses on the same deal,
      // compare their bonus points first, then tie-breaker
      qualifyingPlayers.sort((a, b) => {
        const bonusA = players[a.index].instantBonus.totalPoints;
        const bonusB = players[b.index].instantBonus.totalPoints;
        if (bonusB !== bonusA) return bonusB - bonusA;
        return b.score.points - a.score.points;
      });
      matchWinner = qualifyingPlayers[0].score;
      winningEvent = 'Instant Deal Bonus';
    }
  }

  return {
    players,
    scores: updatedScores,
    currentRound: 1,
    isGameOver: matchWinner !== null,
    isSettled: false,
    roundResults: null,
    cleanSweepWinner: null,
    matchWinner,
    instantVictoryWinner: null,
    winningRound: null,
    winningEvent,
  };
}

// --------------------------------------------------
// 1. START NEW MATCH
// --------------------------------------------------

export function startNewGame(): GameState {
  const scores = createScoreboard();
  const names = scores.map((score) => score.name);

  return dealNewCards(scores, names);
}

// --------------------------------------------------
// 2. START NEXT DEAL
// --------------------------------------------------

export function startNextDeal(previousGame: GameState): GameState {
  validateGame(previousGame);

  if (!previousGame.isSettled) {
    throw new Error(
      "Current deal must be settled before starting another deal",
    );
  }

  if (previousGame.isGameOver) {
    throw new Error("The match is already over");
  }

  const names = previousGame.players.map((player) => player.name);

  return dealNewCards(previousGame.scores, names);
}

// --------------------------------------------------
// 3. SUBMIT PLAYER PARTITION
// --------------------------------------------------

export function submitPlayerPartition(
  game: GameState,
  playerIndex: number,
  groups: HandPartition,
): GameState {
  validateGame(game);

  if (game.isGameOver) {
    throw new Error("Game is already over");
  }

  if (game.isSettled) {
    throw new Error("This deal has already been settled");
  }

  if (
    !Number.isInteger(playerIndex) ||
    playerIndex < 0 ||
    playerIndex >= game.players.length
  ) {
    throw new Error("Invalid player index");
  }

  const player = game.players[playerIndex];

  if (!validatePartition(player.cards, groups)) {
    throw new Error("Invalid card partition");
  }

  const updatedPlayers = game.players.map((currentPlayer, index) =>
    index === playerIndex
      ? { ...currentPlayer, partition: groups }
      : currentPlayer,
  );

  return {
    ...game,
    players: updatedPlayers,
  };
}

// --------------------------------------------------
// 4. EVALUATE ROUNDS 1-3
// --------------------------------------------------

export function evaluatePlayerRounds(game: GameState): HandResult[][] {
  validateGame(game);

  return game.players.map((player) => {
    if (!player.partition) {
      throw new Error(`${player.name} has not submitted their partition`);
    }

    return player.partition
      .slice(0, 3)
      .map((group) => evaluateThreeCardHand(group));
  });
}

// --------------------------------------------------
// 5. DETERMINE WINNERS OF ROUNDS 1-3
// --------------------------------------------------

export function determineAllRoundWinners(game: GameState): RoundResult[] {
  const evaluatedHands = evaluatePlayerRounds(game);

  const results: RoundResult[] = [];

  for (let round = 0; round < 3; round++) {
    const hands = evaluatedHands.map((playerHands) => playerHands[round]);

    results.push(determineRoundWinner(hands));
  }

  return results;
}

// --------------------------------------------------
// 6. DETERMINE ROUND 4 WINNER
// --------------------------------------------------

export function determineRoundFourWinner(game: GameState): RoundResult {
  validateGame(game);

  const roundFourHands: RoundFourResult[] = game.players.map((player) => {
    if (!player.partition) {
      throw new Error(`${player.name} has not submitted their partition`);
    }

    return evaluateRoundFour(player.partition[3]);
  });

  let strongestIndex = 0;

  for (let i = 1; i < roundFourHands.length; i++) {
    const result = compareRoundFour(
      roundFourHands[i],
      roundFourHands[strongestIndex],
    );

    if (result === "PLAYER_1") {
      strongestIndex = i;
    }
  }

  // Check whether another player has an equal strongest hand.
  for (let i = 0; i < roundFourHands.length; i++) {
    if (i === strongestIndex) continue;

    const result = compareRoundFour(
      roundFourHands[i],
      roundFourHands[strongestIndex],
    );

    if (result === "FIRE") {
      return {
        winnerIndex: null,
        outcome: "FIRE",
      };
    }
  }

  return {
    winnerIndex: strongestIndex,
    outcome: "WIN",
  };
}

// --------------------------------------------------
// 7. DETERMINE ALL FOUR ROUND WINNERS
// --------------------------------------------------

export function determineAllFourRoundWinners(game: GameState): RoundResult[] {
  const firstThree = determineAllRoundWinners(game);
  const fourth = determineRoundFourWinner(game);

  return [...firstThree, fourth];
}

// --------------------------------------------------
// 8. CHECK ROUND 4 INSTANT VICTORY
// --------------------------------------------------

export function determineRoundFourInstantVictory(
  game: GameState,
): number | null {
  validateGame(game);

  const qualifyingPlayers: number[] = [];

  for (let i = 0; i < game.players.length; i++) {
    const player = game.players[i];

    if (!player.partition) {
      throw new Error(`${player.name} has not submitted their partition`);
    }

    const hand = player.partition[3];
    const sequenceRank = getFourCardSequenceRank(hand);

    // Assumption: A-2-3-4 or J-Q-K-A qualifies.
    if (sequenceRank >= 10) {
      qualifyingPlayers.push(i);
    }
  }

  if (qualifyingPlayers.length === 0) {
    return null;
  }

  // Compare qualifying hands; strongest hand wins.
  let strongestIndex = qualifyingPlayers[0];

  for (let i = 1; i < qualifyingPlayers.length; i++) {
    const candidateIndex = qualifyingPlayers[i];

    const candidateHand = evaluateRoundFour(
      game.players[candidateIndex].partition![3],
    );

    const strongestHand = evaluateRoundFour(
      game.players[strongestIndex].partition![3],
    );

    if (compareRoundFour(candidateHand, strongestHand) === "PLAYER_1") {
      strongestIndex = candidateIndex;
    }
  }

  // Equal strongest qualifying hands result in no instant victory.
  for (const index of qualifyingPlayers) {
    if (index === strongestIndex) continue;

    const candidateHand = evaluateRoundFour(game.players[index].partition![3]);

    const strongestHand = evaluateRoundFour(
      game.players[strongestIndex].partition![3],
    );

    if (compareRoundFour(candidateHand, strongestHand) === "FIRE") {
      return null;
    }
  }

  return strongestIndex;
}

/**
 * Checks if any player achieved a Round 4 Four-of-a-Kind (Trail).
 * If multiple players have Four-of-a-Kind, selects the highest rank.
 */
export function determineRoundFourFourOfAKind(game: GameState): {
  winnerIndex: number;
  isFourAces: boolean;
  points: number;
} | null {
  const trailPlayers: { index: number; hand: RoundFourResult }[] = [];

  game.players.forEach((player, idx) => {
    if (player.partition && player.partition[3].length === 4) {
      const evalRes = evaluateRoundFour(player.partition[3]);
      if (evalRes.category === "TRAIL") {
        trailPlayers.push({ index: idx, hand: evalRes });
      }
    }
  });

  if (trailPlayers.length === 0) return null;

  if (trailPlayers.length === 1) {
    const winner = trailPlayers[0];
    const isFourAces = winner.hand.comparisonValues[0] === 14;
    return {
      winnerIndex: winner.index,
      isFourAces,
      points: isFourAces ? 5 : 4,
    };
  }

  let strongest = trailPlayers[0];
  for (let i = 1; i < trailPlayers.length; i++) {
    if (compareRoundFour(trailPlayers[i].hand, strongest.hand) === "PLAYER_1") {
      strongest = trailPlayers[i];
    }
  }

  const isFourAces = strongest.hand.comparisonValues[0] === 14;
  return {
    winnerIndex: strongest.index,
    isFourAces,
    points: isFourAces ? 5 : 4,
  };
}

// --------------------------------------------------
// 9. SETTLE THE DEAL
// --------------------------------------------------

export function settleGame(game: GameState): GameState {
  validateGame(game);

  if (game.isSettled) {
    return game;
  }

  if (game.isGameOver) {
    throw new Error("The match is already over");
  }

  // Every player must submit a partition.
  for (const player of game.players) {
    if (!player.partition) {
      throw new Error(`${player.name} has not submitted their partition`);
    }
  }

  // Check Round 4 instant victory first.
  const instantVictoryWinner = determineRoundFourInstantVictory(game);

  if (instantVictoryWinner !== null) {
    const winner = game.scores[instantVictoryWinner];

    const matchWinner = {
      ...winner,
      points: Math.max(20, winner.points),
    };

    return {
      ...game,
      isSettled: true,
      isGameOver: true,
      instantVictoryWinner,
      matchWinner,
      roundResults: null,
      cleanSweepWinner: null,
      winningRound: 4,
      winningEvent: 'Round 4 Instant Victory',
    };
  }

  // Check Round 4 Four-of-a-Kind special scoring rule:
  // - Four Aces (AAAA): Award exactly +5 points.
  // - Other Four-of-a-Kind (KKKK, QQQQ, 7777, 2222): Award exactly +4 points.
  // - Do not play the remaining rounds of that deal.
  // - All other players receive 0 normal points for that deal.
  // - Do not add an additional normal Round 4 winning point.
  const fourOfAKindResult = determineRoundFourFourOfAKind(game);
  if (fourOfAKindResult !== null) {
    const { winnerIndex, isFourAces, points } = fourOfAKindResult;
    const winnerPlayer = game.players[winnerIndex];
    const winningRank = winnerPlayer.partition![3][0].rank;

    const updatedScores = game.scores.map((score, idx) => ({
      ...score,
      points: idx === winnerIndex ? score.points + points : score.points,
    }));

    const matchWinner = getGameWinner(updatedScores);
    const eventLabel = isFourAces
      ? 'Round 4 Four Aces (+5)'
      : `Round 4 Four-of-a-Kind (${winningRank}s) (+4)`;

    const allRoundResults = determineAllFourRoundWinners(game);

    return {
      ...game,
      scores: updatedScores,
      roundResults: allRoundResults,
      cleanSweepWinner: null,
      isSettled: true,
      isGameOver: matchWinner !== null,
      matchWinner,
      instantVictoryWinner: null,
      winningRound: 4,
      winningEvent: eventLabel,
    };
  }

  // Determine all four round results.
  const allRoundResults = determineAllFourRoundWinners(game);
  let updatedScores = game.scores;

  // Step 1: Round 1
  if (allRoundResults[0].winnerIndex !== null) {
    updatedScores = awardRoundPoint(
      updatedScores,
      allRoundResults[0].winnerIndex,
    );
    const round1Winner = getGameWinner(updatedScores);
    if (round1Winner !== null) {
      return {
        ...game,
        scores: updatedScores,
        roundResults: allRoundResults,
        cleanSweepWinner: null,
        isSettled: true,
        isGameOver: true,
        matchWinner: round1Winner,
        instantVictoryWinner: null,
        winningRound: 1,
        winningEvent: 'Round 1 Win (+1)',
      };
    }
  }

  // Step 2: Round 2
  if (allRoundResults[1].winnerIndex !== null) {
    updatedScores = awardRoundPoint(
      updatedScores,
      allRoundResults[1].winnerIndex,
    );
    const round2Winner = getGameWinner(updatedScores);
    if (round2Winner !== null) {
      return {
        ...game,
        scores: updatedScores,
        roundResults: allRoundResults,
        cleanSweepWinner: null,
        isSettled: true,
        isGameOver: true,
        matchWinner: round2Winner,
        instantVictoryWinner: null,
        winningRound: 2,
        winningEvent: 'Round 2 Win (+1)',
      };
    }
  }

  // Step 3: Round 3
  if (allRoundResults[2].winnerIndex !== null) {
    updatedScores = awardRoundPoint(
      updatedScores,
      allRoundResults[2].winnerIndex,
    );
    const round3Winner = getGameWinner(updatedScores);
    if (round3Winner !== null) {
      return {
        ...game,
        scores: updatedScores,
        roundResults: allRoundResults,
        cleanSweepWinner: null,
        isSettled: true,
        isGameOver: true,
        matchWinner: round3Winner,
        instantVictoryWinner: null,
        winningRound: 3,
        winningEvent: 'Round 3 Win (+1)',
      };
    }
  }

  // Step 4: Round 4 (normal, Trail, or Four Aces scoring)
  const roundFourResult = allRoundResults[3];

  if (roundFourResult.winnerIndex !== null) {
    const winnerIndex = roundFourResult.winnerIndex;
    const winningPlayer = game.players[winnerIndex];
    const winningHand = evaluateRoundFour(winningPlayer.partition![3]);

    updatedScores = awardRoundFourPoints(
      updatedScores,
      winnerIndex,
      winningHand,
    );

    const round4Winner = getGameWinner(updatedScores);
    if (round4Winner !== null) {
      const eventLabel =
        winningHand.category === 'TRAIL'
          ? winningHand.comparisonValues[0] === 14
            ? 'Round 4 Four Aces (+5)'
            : 'Round 4 Trail (+4)'
          : 'Round 4 Win (+1)';

      return {
        ...game,
        scores: updatedScores,
        roundResults: allRoundResults,
        cleanSweepWinner: null,
        isSettled: true,
        isGameOver: true,
        matchWinner: round4Winner,
        instantVictoryWinner: null,
        winningRound: 4,
        winningEvent: eventLabel,
      };
    }
  }

  // Step 5: Clean Sweep (+1 point for winning all four rounds)
  const roundWinners = allRoundResults.map((result) => result.winnerIndex);
  const cleanSweepWinner = calculateCleanSweep(roundWinners);
  updatedScores = awardCleanSweepBonus(updatedScores, cleanSweepWinner);

  const finalWinner = getGameWinner(updatedScores);

  return {
    ...game,
    scores: updatedScores,
    roundResults: allRoundResults,
    cleanSweepWinner,
    isSettled: true,
    isGameOver: finalWinner !== null,
    matchWinner: finalWinner,
    instantVictoryWinner: null,
    winningRound: finalWinner !== null ? 4 : null,
    winningEvent: finalWinner !== null ? 'Clean Sweep Bonus (+1)' : null,
  };
}
