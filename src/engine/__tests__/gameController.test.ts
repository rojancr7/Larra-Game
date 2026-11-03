import { describe, it, expect } from 'vitest';
import { Card } from '../deck';
import { HandPartition } from '../partition';
import {
  startNewGame,
  startNextDeal,
  submitPlayerPartition,
  settleGame,
  determineRoundFourInstantVictory,
  GameState,
} from '../gameController';

function createPartition(cards: Card[]): HandPartition {
  return [
    cards.slice(0, 3),
    cards.slice(3, 6),
    cards.slice(6, 9),
    cards.slice(9, 13),
  ];
}

describe('Game Controller', () => {
  describe('Game initialization and dealing', () => {
    it('initializes a new game with 4 players, 13 cards each, and unsettled state', () => {
      const game = startNewGame();

      expect(game.players).toHaveLength(4);
      expect(game.scores).toHaveLength(4);
      expect(game.isSettled).toBe(false);
      expect(game.roundResults).toBeNull();
      expect(game.cleanSweepWinner).toBeNull();

      game.players.forEach((player) => {
        expect(player.cards).toHaveLength(13);
        expect(player.partition).toBeNull();
        expect(player.instantBonus).toBeDefined();
      });
    });

    it('awards instant bonuses immediately upon dealing and only once', () => {
      const game = startNewGame();

      game.players.forEach((player, index) => {
        const expectedPoints = player.instantBonus.totalPoints;
        expect(game.scores[index].points).toBe(expectedPoints);
      });
    });
  });

  describe('Player partition submission', () => {
    it('accepts and records valid partitions for players', () => {
      let game = startNewGame();
      const p0Partition = createPartition(game.players[0].cards);

      game = submitPlayerPartition(game, 0, p0Partition);
      expect(game.players[0].partition).toEqual(p0Partition);
      expect(game.players[1].partition).toBeNull();
    });

    it('rejects invalid partitions or invalid player indices', () => {
      const game = startNewGame();
      const invalidPartition = [
        game.players[0].cards.slice(0, 4),
        game.players[0].cards.slice(4, 7),
        game.players[0].cards.slice(7, 10),
        game.players[0].cards.slice(10, 13),
      ] as unknown as HandPartition;

      expect(() => submitPlayerPartition(game, 0, invalidPartition)).toThrow(
        'Invalid card partition'
      );
      expect(() => submitPlayerPartition(game, 99, invalidPartition)).toThrow(
        'Invalid player index'
      );
    });

    it('rejects partition submission after the deal is already settled', () => {
      let game = startNewGame();
      for (let i = 0; i < 4; i++) {
        game = submitPlayerPartition(game, i, createPartition(game.players[i].cards));
      }

      game = settleGame(game);
      expect(game.isSettled).toBe(true);

      expect(() =>
        submitPlayerPartition(game, 0, createPartition(game.players[0].cards))
      ).toThrow('This deal has already been settled');
    });
  });

  describe('Deal settlement and duplicate prevention', () => {
    it('throws if attempting to settle before all players submit their partitions', () => {
      let game = startNewGame();
      game = submitPlayerPartition(game, 0, createPartition(game.players[0].cards));

      expect(() => settleGame(game)).toThrow(
        'has not submitted their partition'
      );
    });

    it('settles all 4 rounds and prevents duplicate settlement', () => {
      let game = startNewGame();
      for (let i = 0; i < 4; i++) {
        game = submitPlayerPartition(game, i, createPartition(game.players[i].cards));
      }

      const settled = settleGame(game);
      expect(settled.isSettled).toBe(true);
      const scoresAfterFirstSettle = settled.scores.map((s) => s.points);

      // Settle again — must return identical state and not add points again!
      const settledAgain = settleGame(settled);
      expect(settledAgain.scores.map((s) => s.points)).toEqual(
        scoresAfterFirstSettle
      );
    });
  });

  describe('Preserving scores across deals (startNextDeal)', () => {
    it('preserves cumulative scores between consecutive deals', () => {
      let game = startNewGame();
      for (let i = 0; i < 4; i++) {
        game = submitPlayerPartition(game, i, createPartition(game.players[i].cards));
      }

      game = settleGame(game);
      const scoresDeal1 = game.scores.map((s) => s.points);

      if (!game.isGameOver) {
        const nextDeal = startNextDeal(game);
        expect(nextDeal.isSettled).toBe(false);

        // Each player's score should be: previous score + new deal instant bonuses
        nextDeal.players.forEach((player, i) => {
          const expected = scoresDeal1[i] + player.instantBonus.totalPoints;
          expect(nextDeal.scores[i].points).toBe(expected);
        });
      }
    });

    it('rejects starting next deal if current deal is not settled', () => {
      const game = startNewGame();
      expect(() => startNextDeal(game)).toThrow(
        'Current deal must be settled before starting another deal'
      );
    });
  });

  describe('Round 4 Instant Victory (Existing Implementation)', () => {
    it('triggers instant victory when a player has sequenceRank >= 10 in Round 4', () => {
      let game = startNewGame();

      // Hand with J-Q-K-A (sequenceRank 11 >= 10)
      const specialRound4Cards: Card[] = [
        { id: 'jqka_1', suit: 'hearts', rank: 'J' },
        { id: 'jqka_2', suit: 'diamonds', rank: 'Q' },
        { id: 'jqka_3', suit: 'clubs', rank: 'K' },
        { id: 'jqka_4', suit: 'spades', rank: 'A' },
      ];

      // Give player 0 these cards
      game.players[0].cards = [
        ...game.players[0].cards.slice(0, 9),
        ...specialRound4Cards,
      ];

      // Normal partition for all players
      for (let i = 0; i < 4; i++) {
        game.players[i].partition = createPartition(game.players[i].cards);
      }

      const victoryWinner = determineRoundFourInstantVictory(game);
      expect(victoryWinner).toBe(0);

      const settled = settleGame(game);
      expect(settled.isGameOver).toBe(true);
      expect(settled.instantVictoryWinner).toBe(0);
      expect(settled.matchWinner?.name).toBe('Player 1');
    });

    it('does not trigger instant victory when qualifying hands tie (FIRE)', () => {
      let game = startNewGame();

      // Two players with J-Q-K-A
      const jqkaP0: Card[] = [
        { id: 'p0_1', suit: 'hearts', rank: 'J' },
        { id: 'p0_2', suit: 'diamonds', rank: 'Q' },
        { id: 'p0_3', suit: 'clubs', rank: 'K' },
        { id: 'p0_4', suit: 'spades', rank: 'A' },
      ];
      const jqkaP1: Card[] = [
        { id: 'p1_1', suit: 'clubs', rank: 'J' },
        { id: 'p1_2', suit: 'spades', rank: 'Q' },
        { id: 'p1_3', suit: 'hearts', rank: 'K' },
        { id: 'p1_4', suit: 'diamonds', rank: 'A' },
      ];

      game.players[0].cards = [
        ...game.players[0].cards.slice(0, 9),
        ...jqkaP0,
      ];
      game.players[1].cards = [
        ...game.players[1].cards.slice(0, 9),
        ...jqkaP1,
      ];

      for (let i = 0; i < 4; i++) {
        game.players[i].partition = createPartition(game.players[i].cards);
      }

      const victoryWinner = determineRoundFourInstantVictory(game);
      // Tied highest qualifying hands result in null (no instant victory)
      expect(victoryWinner).toBeNull();
    });
  });

  describe('Invalid game state validation', () => {
    it('throws error when game state has invalid player or score counts', () => {
      const invalidGame = {
        players: [],
        scores: [],
        currentRound: 1,
        isGameOver: false,
        isSettled: false,
        roundResults: null,
        cleanSweepWinner: null,
        matchWinner: null,
        instantVictoryWinner: null,
      } as unknown as GameState;

      expect(() => settleGame(invalidGame)).toThrow(
        'Exactly 4 players are required'
      );
    });
  });

  describe('Individual 20-Point Win Condition & Sequential Round Resolution', () => {
    it('does NOT declare game over when combined scores reach or exceed 20', () => {
      let game = startNewGame();
      // Set all 4 players to 5 points each (combined total = 20)
      game.scores = [
        { playerId: 'player-1', name: 'Player 1', points: 5 },
        { playerId: 'player-2', name: 'Player 2', points: 5 },
        { playerId: 'player-3', name: 'Player 3', points: 5 },
        { playerId: 'player-4', name: 'Player 4', points: 5 },
      ];

      for (let i = 0; i < 4; i++) {
        game.players[i].partition = createPartition(game.players[i].cards);
      }

      const settled = settleGame(game);
      // Combined score is > 20, but no individual has 20
      expect(settled.scores.reduce((sum, s) => sum + s.points, 0)).toBeGreaterThanOrEqual(20);
      expect(settled.isGameOver).toBe(false);
      expect(settled.matchWinner).toBeNull();
    });

    it('declares winner immediately when an individual player reaches 20 via regular round points', () => {
      let game = startNewGame();
      // Player 2 is at 19 points
      game.scores = [
        { playerId: 'player-1', name: 'Player 1', points: 10 },
        { playerId: 'player-2', name: 'Player 2', points: 19 },
        { playerId: 'player-3', name: 'Player 3', points: 12 },
        { playerId: 'player-4', name: 'Player 4', points: 8 },
      ];

      // Give Player 2 winning hands
      for (let i = 0; i < 4; i++) {
        game.players[i].partition = createPartition(game.players[i].cards);
        // Ensure Round 4 has non-instant-victory cards so test focuses on Round 1 regular points
        game.players[i].partition![3] = [
          { id: `p${i}_r4_1`, suit: 'hearts', rank: '2' },
          { id: `p${i}_r4_2`, suit: 'diamonds', rank: '4' },
          { id: `p${i}_r4_3`, suit: 'clubs', rank: '6' },
          { id: `p${i}_r4_4`, suit: 'spades', rank: '8' },
        ];
      }

      // Give Player 2 Three Aces in Round 1
      game.players[1].partition![0] = [
        { id: 'p2_a1', suit: 'hearts', rank: 'A' },
        { id: 'p2_a2', suit: 'diamonds', rank: 'A' },
        { id: 'p2_a3', suit: 'clubs', rank: 'A' },
      ];
      // Other players get weak hands
      game.players[0].partition![0] = [
        { id: 'p0_1', suit: 'hearts', rank: '2' },
        { id: 'p0_2', suit: 'diamonds', rank: '4' },
        { id: 'p0_3', suit: 'clubs', rank: '6' },
      ];
      game.players[2].partition![0] = [
        { id: 'p2_1', suit: 'hearts', rank: '2' },
        { id: 'p2_2', suit: 'diamonds', rank: '4' },
        { id: 'p2_3', suit: 'clubs', rank: '7' },
      ];
      game.players[3].partition![0] = [
        { id: 'p3_1', suit: 'hearts', rank: '2' },
        { id: 'p3_2', suit: 'diamonds', rank: '4' },
        { id: 'p3_3', suit: 'clubs', rank: '8' },
      ];

      const settled = settleGame(game);
      expect(settled.isGameOver).toBe(true);
      expect(settled.matchWinner?.playerId).toBe('player-2');
      expect(settled.matchWinner?.points).toBeGreaterThanOrEqual(20);
      expect(settled.winningRound).toBe(1);
    });

    it('enforces sequential resolution when two players start at 19 points: Round 1 winner wins match immediately', () => {
      let game = startNewGame();
      // Player 1 and Player 2 both start at 19 points
      game.scores = [
        { playerId: 'player-1', name: 'Player 1', points: 19 },
        { playerId: 'player-2', name: 'Player 2', points: 19 },
        { playerId: 'player-3', name: 'Player 3', points: 10 },
        { playerId: 'player-4', name: 'Player 4', points: 10 },
      ];

      for (let i = 0; i < 4; i++) {
        game.players[i].partition = createPartition(game.players[i].cards);
      }

      // Player 1 wins Round 1 (Trail of Kings)
      game.players[0].partition![0] = [
        { id: 'p1_k1', suit: 'hearts', rank: 'K' },
        { id: 'p1_k2', suit: 'diamonds', rank: 'K' },
        { id: 'p1_k3', suit: 'clubs', rank: 'K' },
      ];
      game.players[1].partition![0] = [
        { id: 'p2_q1', suit: 'hearts', rank: 'Q' },
        { id: 'p2_q2', suit: 'diamonds', rank: 'Q' },
        { id: 'p2_q3', suit: 'clubs', rank: 'Q' },
      ];

      // Player 2 would win Round 2 (Trail of Aces)
      game.players[0].partition![1] = [
        { id: 'p1_2', suit: 'hearts', rank: '2' },
        { id: 'p1_3', suit: 'diamonds', rank: '4' },
        { id: 'p1_4', suit: 'clubs', rank: '6' },
      ];
      game.players[1].partition![1] = [
        { id: 'p2_a1', suit: 'hearts', rank: 'A' },
        { id: 'p2_a2', suit: 'diamonds', rank: 'A' },
        { id: 'p2_a3', suit: 'clubs', rank: 'A' },
      ];

      const settled = settleGame(game);
      // Player 1 reached 20 in Round 1 and must win immediately!
      expect(settled.isGameOver).toBe(true);
      expect(settled.matchWinner?.playerId).toBe('player-1');
      expect(settled.winningRound).toBe(1);
      expect(settled.winningEvent).toContain('Round 1');
    });
  });
});

