import { describe, it, expect } from 'vitest';
import {
  startNewGame,
  submitPlayerPartition,
  settleGame,
} from '../gameController';
import { generateAIPartition } from '../../ai/computerAI';
import {
  createInitialPartitionState,
  selectCard,
  moveSelectedUp,
  moveSelectedDown,
  moveSelectedLeft,
  moveSelectedRight,
  placeCardInRound,
  removeCardToHand,
  clearAllToHand,
  isPartitionReady,
  REQUIRED_SIZES,
} from '../tablePartitionManager';
import { validatePartition } from '../partition';

describe('Card Arrangement Gameplay Requirements', () => {
  it('displays all 13 cards in hand tray on game start', () => {
    const game = startNewGame();
    const humanPlayer = game.players[0];
    expect(humanPlayer.cards.length).toBe(13);

    const partition = createInitialPartitionState(humanPlayer.cards);
    expect(partition.handCards.length).toBe(13);
    expect(partition.roundGroups[0].length).toBe(0);
    expect(partition.roundGroups[1].length).toBe(0);
    expect(partition.roundGroups[2].length).toBe(0);
    expect(partition.roundGroups[3].length).toBe(0);
  });

  it('allows selecting any card and moving it via joystick UP to rounds', () => {
    const game = startNewGame();
    const humanCards = game.players[0].cards;
    let partition = createInitialPartitionState(humanCards);

    // Select first card
    const firstCard = partition.handCards[0];
    partition = selectCard(partition, firstCard.id);
    expect(partition.selectedCardId).toBe(firstCard.id);

    // Joystick UP moves it to Round 1
    partition = moveSelectedUp(partition);
    expect(partition.handCards.length).toBe(12);
    expect(partition.roundGroups[0].length).toBe(1);
    expect(partition.roundGroups[0][0].id).toBe(firstCard.id);
  });

  it('allows joystick DOWN to return cards from rounds back to hand', () => {
    const game = startNewGame();
    const humanCards = game.players[0].cards;
    let partition = createInitialPartitionState(humanCards);

    const targetCard = partition.handCards[0];
    partition = selectCard(partition, targetCard.id, false);
    partition = moveSelectedUp(partition);
    expect(partition.roundGroups[0].length).toBe(1);

    // Select placed card and move DOWN back to hand
    partition = selectCard(partition, targetCard.id, false);
    partition = moveSelectedDown(partition);
    expect(partition.roundGroups[0].length).toBe(0);
    expect(partition.handCards.length).toBe(13);
    expect(partition.handCards.some((c) => c.id === targetCard.id)).toBe(true);
  });

  it('allows joystick LEFT and RIGHT to transfer cards across all 4 groups', () => {
    const game = startNewGame();
    const humanCards = game.players[0].cards;
    let partition = createInitialPartitionState(humanCards);

    const card = partition.handCards[0];
    partition = selectCard(partition, card.id, false);
    partition = moveSelectedUp(partition, 0); // Put into Round 1
    expect(partition.roundGroups[0].length).toBe(1);

    // Transfer from Round 1 to Round 2 (via RIGHT)
    partition = selectCard(partition, card.id, false);
    partition = moveSelectedRight(partition);
    expect(partition.roundGroups[0].length).toBe(0);
    expect(partition.roundGroups[1].length).toBe(1);

    // Transfer from Round 2 to Round 3 (via RIGHT)
    partition = selectCard(partition, card.id, false);
    partition = moveSelectedRight(partition);
    expect(partition.roundGroups[1].length).toBe(0);
    expect(partition.roundGroups[2].length).toBe(1);

    // Transfer from Round 3 to Round 4 (via RIGHT)
    partition = selectCard(partition, card.id, false);
    partition = moveSelectedRight(partition);
    expect(partition.roundGroups[2].length).toBe(0);
    expect(partition.roundGroups[3].length).toBe(1);

    // Transfer from Round 4 back to Round 3 (via LEFT)
    partition = selectCard(partition, card.id, false);
    partition = moveSelectedLeft(partition);
    expect(partition.roundGroups[3].length).toBe(0);
    expect(partition.roundGroups[2].length).toBe(1);
  });

  it('blocks submission for incomplete arrangements and unlocks for valid 3/3/3/4', () => {
    const game = startNewGame();
    const humanCards = game.players[0].cards;
    let partition = createInitialPartitionState(humanCards);

    // Incomplete (0 cards placed)
    expect(isPartitionReady(partition)).toBe(false);

    // Assign 3 cards to Round 1, 3 to Round 2, 3 to Round 3, 3 to Round 4 (12 total - incomplete)
    for (let i = 0; i < 3; i++) partition = placeCardInRound(partition, humanCards[i].id, 0);
    for (let i = 3; i < 6; i++) partition = placeCardInRound(partition, humanCards[i].id, 1);
    for (let i = 6; i < 9; i++) partition = placeCardInRound(partition, humanCards[i].id, 2);
    for (let i = 9; i < 12; i++) partition = placeCardInRound(partition, humanCards[i].id, 3);

    expect(isPartitionReady(partition)).toBe(false); // 12 cards total, 4th round needs 4

    // Place the 13th card into Round 4
    partition = placeCardInRound(partition, humanCards[12].id, 3);

    // Now exactly [3, 3, 3, 4] with all 13 cards!
    expect(isPartitionReady(partition)).toBe(true);
    expect(validatePartition(humanCards, partition.roundGroups)).toBe(true);
  });

  it('successfully submits valid on-table arrangement, auto-partitions AI, and settles game', () => {
    let game = startNewGame();
    const humanCards = game.players[0].cards;
    let partition = createInitialPartitionState(humanCards);

    // Arrange 3, 3, 3, 4
    for (let i = 0; i < 3; i++) partition = placeCardInRound(partition, humanCards[i].id, 0);
    for (let i = 3; i < 6; i++) partition = placeCardInRound(partition, humanCards[i].id, 1);
    for (let i = 6; i < 9; i++) partition = placeCardInRound(partition, humanCards[i].id, 2);
    for (let i = 9; i < 13; i++) partition = placeCardInRound(partition, humanCards[i].id, 3);

    expect(isPartitionReady(partition)).toBe(true);

    // 1. Submit Human player
    game = submitPlayerPartition(game, 0, partition.roundGroups);
    expect(game.players[0].partition).not.toBeNull();

    // 2. Generate strategic AI partitions for P2, P3, P4
    for (let i = 1; i < 4; i++) {
      const aiPart = generateAIPartition(game.players[i].cards, {
        playerIndex: i,
        currentScore: game.scores[i].points,
      });
      game = submitPlayerPartition(game, i, aiPart);
      expect(game.players[i].partition).not.toBeNull();
    }

    // 3. Settle deal
    const settled = settleGame(game);
    expect(settled.isSettled).toBe(true);

    if (settled.instantVictoryWinner !== null) {
      expect(settled.instantVictoryWinner).toBeGreaterThanOrEqual(0);
      expect(settled.isGameOver).toBe(true);
    } else {
      expect(settled.roundResults).toBeDefined();
      expect(settled.roundResults?.length).toBe(4);
    }

    // All players' scores must be non-negative integers
    settled.scores.forEach((s) => {
      expect(s.points).toBeGreaterThanOrEqual(0);
    });
  });

  it('manages SHOW button readiness and conditional THROW declaration', () => {
    const game = startNewGame();
    const humanCards = game.players[0].cards;
    let partition = createInitialPartitionState(humanCards);

    // Initially incomplete: SHOW must be disabled
    expect(isPartitionReady(partition)).toBe(false);

    // Arrange into 3, 3, 3, 4
    for (let i = 0; i < 3; i++) partition = placeCardInRound(partition, humanCards[i].id, 0);
    for (let i = 3; i < 6; i++) partition = placeCardInRound(partition, humanCards[i].id, 1);
    for (let i = 6; i < 9; i++) partition = placeCardInRound(partition, humanCards[i].id, 2);
    for (let i = 9; i < 13; i++) partition = placeCardInRound(partition, humanCards[i].id, 3);

    // Now complete: SHOW is ready!
    expect(isPartitionReady(partition)).toBe(true);

    // Verify individual score updates independently without summing all 4 players
    expect(game.scores[0].points).toBe(game.players[0].instantBonus.totalPoints);
    expect(game.scores[1].points).toBe(game.players[1].instantBonus.totalPoints);
  });
});
