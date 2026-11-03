import { describe, it, expect } from 'vitest';
import { Card } from '../deck';
import { HandPartition } from '../partition';
import {
  startNewGame,
  submitPlayerPartition,
  settleGame,
  determineRoundFourFourOfAKind,
} from '../gameController';

function createDummyPartition(
  r1Rank: Card['rank'],
  r2Rank: Card['rank'],
  r3Rank: Card['rank'],
  r4Cards: Card[],
): HandPartition {
  return [
    [
      { id: `1_${r1Rank}`, suit: 'hearts', rank: r1Rank },
      { id: `2_${r1Rank}`, suit: 'diamonds', rank: r1Rank },
      { id: `3_${r1Rank}`, suit: 'clubs', rank: r1Rank },
    ],
    [
      { id: `1_${r2Rank}`, suit: 'hearts', rank: r2Rank },
      { id: `2_${r2Rank}`, suit: 'diamonds', rank: r2Rank },
      { id: `3_${r2Rank}`, suit: 'clubs', rank: r2Rank },
    ],
    [
      { id: `1_${r3Rank}`, suit: 'hearts', rank: r3Rank },
      { id: `2_${r3Rank}`, suit: 'diamonds', rank: r3Rank },
      { id: `3_${r3Rank}`, suit: 'clubs', rank: r3Rank },
    ],
    r4Cards,
  ];
}

describe('Special Scoring Rule: Round 4 Four-of-a-Kind', () => {
  it('awards exactly +5 points for Four Aces (AAAA) in Round 4 and sets opponents normal points to 0', () => {
    let game = startNewGame();

    // Assign custom cards to test partitions
    const aaaaCards: Card[] = [
      { id: 'A_h', suit: 'hearts', rank: 'A' },
      { id: 'A_d', suit: 'diamonds', rank: 'A' },
      { id: 'A_c', suit: 'clubs', rank: 'A' },
      { id: 'A_s', suit: 'spades', rank: 'A' },
    ];
    const normalR4: Card[] = [
      { id: '9_h', suit: 'hearts', rank: '9' },
      { id: '8_d', suit: 'diamonds', rank: '8' },
      { id: '7_c', suit: 'clubs', rank: '7' },
      { id: '5_s', suit: 'spades', rank: '5' },
    ];

    // Player 1 has weak R1, R2, R3, but Four Aces in Round 4
    const p1Part = createDummyPartition('2', '3', '4', aaaaCards);
    game.players[0].cards = p1Part.flat();
    game = submitPlayerPartition(game, 0, p1Part);

    // Player 2 has strong Kings in R1, R2, R3 (would normally win R1..R3)
    const p2Part = createDummyPartition('K', 'Q', 'J', normalR4);
    game.players[1].cards = p2Part.flat();
    game = submitPlayerPartition(game, 1, p2Part);

    // Player 3 & 4 have normal hands
    const p3Part = createDummyPartition('5', '6', '7', normalR4);
    game.players[2].cards = p3Part.flat();
    game = submitPlayerPartition(game, 2, p3Part);

    const p4Part = createDummyPartition('8', '9', '10', normalR4);
    game.players[3].cards = p4Part.flat();
    game = submitPlayerPartition(game, 3, p4Part);

    // Reset initial scores to 0 to isolate this deal's points
    game.scores = game.scores.map((s) => ({ ...s, points: 0 }));

    const r4Trail = determineRoundFourFourOfAKind(game);
    expect(r4Trail).not.toBeNull();
    expect(r4Trail?.winnerIndex).toBe(0);
    expect(r4Trail?.isFourAces).toBe(true);
    expect(r4Trail?.points).toBe(5);

    // Settle deal
    const settled = settleGame(game);
    expect(settled.isSettled).toBe(true);
    expect(settled.winningEvent).toBe('Round 4 Four Aces (+5)');

    // Player 1 receives exactly +5 points (no extra +1, no double scoring)
    expect(settled.scores[0].points).toBe(5);

    // All opponents receive 0 normal points for this deal (even though P2 had winning Kings in R1..R3)
    expect(settled.scores[1].points).toBe(0);
    expect(settled.scores[2].points).toBe(0);
    expect(settled.scores[3].points).toBe(0);
  });

  it('awards exactly +4 points for Four Kings (KKKK) in Round 4 and sets opponents normal points to 0', () => {
    let game = startNewGame();

    const kkkkCards: Card[] = [
      { id: 'K_h', suit: 'hearts', rank: 'K' },
      { id: 'K_d', suit: 'diamonds', rank: 'K' },
      { id: 'K_c', suit: 'clubs', rank: 'K' },
      { id: 'K_s', suit: 'spades', rank: 'K' },
    ];
    const normalR4: Card[] = [
      { id: '9_h', suit: 'hearts', rank: '9' },
      { id: '8_d', suit: 'diamonds', rank: '8' },
      { id: '7_c', suit: 'clubs', rank: '7' },
      { id: '5_s', suit: 'spades', rank: '5' },
    ];

    // Player 2 has Four Kings in Round 4
    const p1Part = createDummyPartition('10', 'J', 'Q', normalR4);
    game.players[0].cards = p1Part.flat();
    game = submitPlayerPartition(game, 0, p1Part);

    const p2Part = createDummyPartition('2', '3', '4', kkkkCards);
    game.players[1].cards = p2Part.flat();
    game = submitPlayerPartition(game, 1, p2Part);

    const p3Part = createDummyPartition('5', '6', '7', normalR4);
    game.players[2].cards = p3Part.flat();
    game = submitPlayerPartition(game, 2, p3Part);

    const p4Part = createDummyPartition('8', '9', '10', normalR4);
    game.players[3].cards = p4Part.flat();
    game = submitPlayerPartition(game, 3, p4Part);

    game.scores = game.scores.map((s) => ({ ...s, points: 0 }));

    const settled = settleGame(game);
    expect(settled.isSettled).toBe(true);
    expect(settled.winningEvent).toBe('Round 4 Four-of-a-Kind (Ks) (+4)');

    expect(settled.scores[1].points).toBe(4);
    expect(settled.scores[0].points).toBe(0);
    expect(settled.scores[2].points).toBe(0);
    expect(settled.scores[3].points).toBe(0);
  });

  it('awards exactly +4 points for Four Sevens (7777) in Round 4', () => {
    let game = startNewGame();

    const sevensCards: Card[] = [
      { id: '7_h', suit: 'hearts', rank: '7' },
      { id: '7_d', suit: 'diamonds', rank: '7' },
      { id: '7_c', suit: 'clubs', rank: '7' },
      { id: '7_s', suit: 'spades', rank: '7' },
    ];
    const normalR4: Card[] = [
      { id: '9_h', suit: 'hearts', rank: '9' },
      { id: '8_d', suit: 'diamonds', rank: '8' },
      { id: '6_c', suit: 'clubs', rank: '6' },
      { id: '5_s', suit: 'spades', rank: '5' },
    ];

    const p1Part = createDummyPartition('2', '3', '4', sevensCards);
    game.players[0].cards = p1Part.flat();
    game = submitPlayerPartition(game, 0, p1Part);

    for (let i = 1; i < 4; i++) {
      const part = createDummyPartition('J', 'Q', 'K', normalR4);
      game.players[i].cards = part.flat();
      game = submitPlayerPartition(game, i, part);
    }

    game.scores = game.scores.map((s) => ({ ...s, points: 0 }));

    const settled = settleGame(game);
    expect(settled.scores[0].points).toBe(4);
    expect(settled.scores[1].points).toBe(0);
    expect(settled.winningEvent).toBe('Round 4 Four-of-a-Kind (7s) (+4)');
  });

  it('triggers immediate 20-point match victory if player reaches 20 via Round 4 Four-of-a-Kind', () => {
    let game = startNewGame();

    const aaaaCards: Card[] = [
      { id: 'A_h', suit: 'hearts', rank: 'A' },
      { id: 'A_d', suit: 'diamonds', rank: 'A' },
      { id: 'A_c', suit: 'clubs', rank: 'A' },
      { id: 'A_s', suit: 'spades', rank: 'A' },
    ];
    const normalR4: Card[] = [
      { id: '9_h', suit: 'hearts', rank: '9' },
      { id: '8_d', suit: 'diamonds', rank: '8' },
      { id: '7_c', suit: 'clubs', rank: '7' },
      { id: '5_s', suit: 'spades', rank: '5' },
    ];

    const p1Part = createDummyPartition('2', '3', '4', aaaaCards);
    game.players[0].cards = p1Part.flat();
    game = submitPlayerPartition(game, 0, p1Part);

    for (let i = 1; i < 4; i++) {
      const part = createDummyPartition('J', 'Q', 'K', normalR4);
      game.players[i].cards = part.flat();
      game = submitPlayerPartition(game, i, part);
    }

    // Set player 1 score to 16 before this deal
    game.scores[0].points = 16;
    game.scores[1].points = 10;
    game.scores[2].points = 5;
    game.scores[3].points = 2;

    const settled = settleGame(game);
    // 16 + 5 = 21 >= 20!
    expect(settled.scores[0].points).toBe(21);
    expect(settled.isGameOver).toBe(true);
    expect(settled.matchWinner?.playerId).toBe(game.players[0].id);
  });
});
