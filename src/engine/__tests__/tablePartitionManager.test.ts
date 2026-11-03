import { describe, it, expect } from 'vitest';
import { createDeck, shuffle } from '../deck';
import {
  createInitialPartitionState,
  selectCard,
  moveSelectedUp,
  moveSelectedDown,
  moveSelectedLeft,
  moveSelectedRight,
  swapCards,
  placeCardInRound,
  removeCardToHand,
  clearAllToHand,
  isPartitionReady,
  REQUIRED_SIZES,
} from '../tablePartitionManager';

describe('Table Partition Manager (Direct On-Table Movement)', () => {
  const deck = shuffle(createDeck());
  const initialCards = deck.slice(0, 13);

  it('initializes with all 13 cards in hand and empty rounds', () => {
    const state = createInitialPartitionState(initialCards);
    expect(state.handCards.length).toBe(13);
    expect(state.roundGroups[0].length).toBe(0);
    expect(state.roundGroups[1].length).toBe(0);
    expect(state.roundGroups[2].length).toBe(0);
    expect(state.roundGroups[3].length).toBe(0);
    expect(state.selectedCardId).toBeNull();
    expect(isPartitionReady(state)).toBe(false);
  });

  it('selects and deselects a card', () => {
    let state = createInitialPartitionState(initialCards);
    const cardId = initialCards[0].id;

    state = selectCard(state, cardId);
    expect(state.selectedCardId).toBe(cardId);

    // Toggle off
    state = selectCard(state, cardId);
    expect(state.selectedCardId).toBeNull();
  });

  it('moves selected card UP into target round', () => {
    let state = createInitialPartitionState(initialCards);
    const card0 = initialCards[0];

    state = selectCard(state, card0.id);
    state = moveSelectedUp(state);

    expect(state.handCards.length).toBe(12);
    expect(state.roundGroups[0].length).toBe(1);
    expect(state.roundGroups[0][0].id).toBe(card0.id);
  });

  it('auto-advances target round when round becomes full', () => {
    let state = createInitialPartitionState(initialCards);

    // Fill round 1 (3 cards)
    for (let i = 0; i < 3; i++) {
      state = selectCard(state, state.handCards[0].id);
      state = moveSelectedUp(state);
    }

    expect(state.roundGroups[0].length).toBe(3);
    expect(state.targetRound).toBe(1); // Auto-advanced to Round 2!

    // Next card goes to Round 2
    state = selectCard(state, state.handCards[0].id);
    state = moveSelectedUp(state);

    expect(state.roundGroups[1].length).toBe(1);
  });

  it('moves card DOWN back to hand tray', () => {
    let state = createInitialPartitionState(initialCards);
    const card0 = initialCards[0];

    // Place in round
    state = placeCardInRound(state, card0.id, 0);
    expect(state.roundGroups[0].length).toBe(1);
    expect(state.handCards.length).toBe(12);

    // Move DOWN back to hand
    state = selectCard(state, card0.id);
    state = moveSelectedDown(state);

    expect(state.roundGroups[0].length).toBe(0);
    expect(state.handCards.length).toBe(13);
    expect(state.handCards.some((c) => c.id === card0.id)).toBe(true);
  });

  it('shifts cards left and right in hand tray', () => {
    let state = createInitialPartitionState(initialCards);
    const firstId = state.handCards[0].id;
    const secondId = state.handCards[1].id;

    // Select first card, move right
    state = selectCard(state, firstId);
    state = moveSelectedRight(state);

    expect(state.handCards[0].id).toBe(secondId);
    expect(state.handCards[1].id).toBe(firstId);

    // Move left back
    state = moveSelectedLeft(state);
    expect(state.handCards[0].id).toBe(firstId);
    expect(state.handCards[1].id).toBe(secondId);
  });

  it('transfers cards between rounds using UP or LEFT/RIGHT', () => {
    let state = createInitialPartitionState(initialCards);
    const card0 = initialCards[0];

    state = placeCardInRound(state, card0.id, 0); // Put in Round 1
    expect(state.roundGroups[0].length).toBe(1);

    // Select card in Round 1, move UP (transfer to next round)
    state = selectCard(state, card0.id);
    state = moveSelectedUp(state, 1); // Transfer to Round 2

    expect(state.roundGroups[0].length).toBe(0);
    expect(state.roundGroups[1].length).toBe(1);
    expect(state.roundGroups[1][0].id).toBe(card0.id);
  });

  it('swaps any two cards seamlessly', () => {
    let state = createInitialPartitionState(initialCards);
    const cardA = initialCards[0];
    const cardB = initialCards[1];

    state = placeCardInRound(state, cardA.id, 0); // in round 0
    // cardB is in hand

    state = swapCards(state, cardA.id, cardB.id);

    expect(state.roundGroups[0][0].id).toBe(cardB.id);
    expect(state.handCards.some((c) => c.id === cardA.id)).toBe(true);
    expect(state.handCards.some((c) => c.id === cardB.id)).toBe(false);
  });

  it('maintains exactly 13 cards at all times (no duplicates, no dropped cards)', () => {
    let state = createInitialPartitionState(initialCards);

    // Perform random operations
    for (let i = 0; i < 20; i++) {
      const allAvailable = [...state.handCards, ...state.roundGroups.flat()];
      const randomCard = allAvailable[Math.floor(Math.random() * allAvailable.length)];
      state = selectCard(state, randomCard.id);

      const op = Math.floor(Math.random() * 4);
      if (op === 0) state = moveSelectedUp(state);
      else if (op === 1) state = moveSelectedDown(state);
      else if (op === 2) state = moveSelectedLeft(state);
      else state = moveSelectedRight(state);

      const combined = [...state.handCards, ...state.roundGroups.flat()];
      expect(combined.length).toBe(13);
      const unique = new Set(combined.map((c) => c.id));
      expect(unique.size).toBe(13);
    }
  });

  it('recognizes when a 3, 3, 3, 4 partition is valid', () => {
    let state = createInitialPartitionState(initialCards);

    // Place 3 in round 1
    state = placeCardInRound(state, initialCards[0].id, 0);
    state = placeCardInRound(state, initialCards[1].id, 0);
    state = placeCardInRound(state, initialCards[2].id, 0);

    // Place 3 in round 2
    state = placeCardInRound(state, initialCards[3].id, 1);
    state = placeCardInRound(state, initialCards[4].id, 1);
    state = placeCardInRound(state, initialCards[5].id, 1);

    // Place 3 in round 3
    state = placeCardInRound(state, initialCards[6].id, 2);
    state = placeCardInRound(state, initialCards[7].id, 2);
    state = placeCardInRound(state, initialCards[8].id, 2);

    // Place 4 in round 4
    state = placeCardInRound(state, initialCards[9].id, 3);
    state = placeCardInRound(state, initialCards[10].id, 3);
    state = placeCardInRound(state, initialCards[11].id, 3);
    state = placeCardInRound(state, initialCards[12].id, 3);

    expect(state.handCards.length).toBe(0);
    expect(isPartitionReady(state)).toBe(true);
  });
});
