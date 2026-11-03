import { Card, Suit, Rank } from './deck';
import { HandPartition, validatePartition } from './partition';
import { RANK_VALUES } from './handEvaluator';

export const REQUIRED_SIZES = [3, 3, 3, 4] as const;

export type CardLocation = 'hand' | 'round';

export interface SelectedCardInfo {
  cardId: string;
  location: CardLocation;
  roundIndex?: number; // 0, 1, 2, 3 if location === 'round'
  index: number; // index within hand or within round
}

export interface TablePartitionState {
  originalCards: Card[];
  handCards: Card[];
  roundGroups: HandPartition;
  selectedCardId: string | null;
  targetRound: number; // 0, 1, 2, 3
}

export function createInitialPartitionState(cards: Card[]): TablePartitionState {
  return {
    originalCards: [...cards],
    handCards: [...cards],
    roundGroups: [[], [], [], []],
    selectedCardId: null,
    targetRound: 0,
  };
}

export function getSelectedCardInfo(state: TablePartitionState): SelectedCardInfo | null {
  if (!state.selectedCardId) return null;

  const handIdx = state.handCards.findIndex((c) => c.id === state.selectedCardId);
  if (handIdx !== -1) {
    return {
      cardId: state.selectedCardId,
      location: 'hand',
      index: handIdx,
    };
  }

  for (let r = 0; r < 4; r++) {
    const rIdx = state.roundGroups[r].findIndex((c) => c.id === state.selectedCardId);
    if (rIdx !== -1) {
      return {
        cardId: state.selectedCardId,
        location: 'round',
        roundIndex: r,
        index: rIdx,
      };
    }
  }

  return null;
}

/**
 * Returns the next round index that is not yet full, starting from current.
 */
export function getNextAvailableRound(
  roundGroups: HandPartition,
  preferred: number = 0,
): number {
  if (roundGroups[preferred].length < REQUIRED_SIZES[preferred]) {
    return preferred;
  }
  for (let i = 0; i < 4; i++) {
    const idx = (preferred + i) % 4;
    if (roundGroups[idx].length < REQUIRED_SIZES[idx]) {
      return idx;
    }
  }
  return preferred;
}

/**
 * Select a card by its ID, or toggle off if toggle is true and already selected.
 */
export function selectCard(
  state: TablePartitionState,
  cardId: string,
  toggle: boolean = true,
): TablePartitionState {
  if (toggle && state.selectedCardId === cardId) {
    return { ...state, selectedCardId: null };
  }
  return { ...state, selectedCardId: cardId };
}

export function deselectCard(state: TablePartitionState): TablePartitionState {
  return { ...state, selectedCardId: null };
}

/**
 * Move the selected card UP (into target round zone).
 * If already in a round zone, transfers to next round or target round.
 */
export function moveSelectedUp(
  state: TablePartitionState,
  customTargetRound?: number,
): TablePartitionState {
  const sel = getSelectedCardInfo(state);
  if (!sel) return state;

  const destRound =
    customTargetRound !== undefined
      ? customTargetRound
      : getNextAvailableRound(state.roundGroups, state.targetRound);

  if (sel.location === 'hand') {
    const cardToMove = state.handCards[sel.index];
    if (!cardToMove) return state;

    const newHand = state.handCards.filter((c) => c.id !== sel.cardId);
    const newGroups = state.roundGroups.map((g) => [...g]) as HandPartition;

    // If destination round is already full, eject its last card back to hand
    if (newGroups[destRound].length >= REQUIRED_SIZES[destRound]) {
      const ejectedCard = newGroups[destRound].pop();
      if (ejectedCard) {
        newHand.push(ejectedCard);
      }
    }

    newGroups[destRound].push(cardToMove);

    // Auto-advance target round only if now full
    const isNowFull = newGroups[destRound].length >= REQUIRED_SIZES[destRound];
    const nextTarget = isNowFull
      ? getNextAvailableRound(newGroups, (destRound + 1) % 4)
      : destRound;

    return {
      ...state,
      handCards: newHand,
      roundGroups: newGroups,
      selectedCardId: cardToMove.id,
      targetRound: nextTarget,
    };
  }

  if (sel.location === 'round' && sel.roundIndex !== undefined) {
    // Already in a round: transfer to next round or custom target
    const target =
      customTargetRound !== undefined ? customTargetRound : (sel.roundIndex + 1) % 4;
    if (target === sel.roundIndex) return state;

    const cardToMove = state.roundGroups[sel.roundIndex][sel.index];
    if (!cardToMove) return state;

    const newHand = [...state.handCards];
    const newGroups = state.roundGroups.map((g) => [...g]) as HandPartition;

    // Remove from source round
    newGroups[sel.roundIndex] = newGroups[sel.roundIndex].filter(
      (c) => c.id !== sel.cardId,
    );

    // If target round is full, eject last card to source or hand
    if (newGroups[target].length >= REQUIRED_SIZES[target]) {
      const ejected = newGroups[target].pop();
      if (ejected) {
        newGroups[sel.roundIndex].push(ejected);
      }
    }

    newGroups[target].push(cardToMove);

    return {
      ...state,
      handCards: newHand,
      roundGroups: newGroups,
      selectedCardId: cardToMove.id,
      targetRound: target,
    };
  }

  return state;
}

/**
 * Move the selected card DOWN (return to hand tray).
 */
export function moveSelectedDown(state: TablePartitionState): TablePartitionState {
  const sel = getSelectedCardInfo(state);
  if (!sel) return state;

  if (sel.location === 'round' && sel.roundIndex !== undefined) {
    const cardToReturn = state.roundGroups[sel.roundIndex][sel.index];
    if (!cardToReturn) return state;

    const newGroups = state.roundGroups.map((g) => [...g]) as HandPartition;
    newGroups[sel.roundIndex] = newGroups[sel.roundIndex].filter(
      (c) => c.id !== sel.cardId,
    );

    const newHand = [...state.handCards, cardToReturn];

    return {
      ...state,
      handCards: newHand,
      roundGroups: newGroups,
      selectedCardId: cardToReturn.id,
      targetRound: sel.roundIndex,
    };
  }

  return state;
}

/**
 * Move the selected card LEFT.
 * - In hand: shifts card position left.
 * - In round: shifts position within round or transfers to previous round.
 */
export function moveSelectedLeft(state: TablePartitionState): TablePartitionState {
  const sel = getSelectedCardInfo(state);
  if (!sel) return state;

  if (sel.location === 'hand') {
    if (sel.index <= 0) return state;
    const newHand = [...state.handCards];
    const temp = newHand[sel.index - 1];
    newHand[sel.index - 1] = newHand[sel.index];
    newHand[sel.index] = temp;
    return { ...state, handCards: newHand };
  }

  if (sel.location === 'round' && sel.roundIndex !== undefined) {
    if (sel.index > 0) {
      // Shift left within round
      const newGroups = state.roundGroups.map((g) => [...g]) as HandPartition;
      const group = newGroups[sel.roundIndex];
      const temp = group[sel.index - 1];
      group[sel.index - 1] = group[sel.index];
      group[sel.index] = temp;
      return { ...state, roundGroups: newGroups };
    } else {
      // Transfer to previous round
      const prevRound = (sel.roundIndex - 1 + 4) % 4;
      return moveSelectedUp(state, prevRound);
    }
  }

  return state;
}

/**
 * Move the selected card RIGHT.
 * - In hand: shifts card position right.
 * - In round: shifts position within round or transfers to next round.
 */
export function moveSelectedRight(state: TablePartitionState): TablePartitionState {
  const sel = getSelectedCardInfo(state);
  if (!sel) return state;

  if (sel.location === 'hand') {
    if (sel.index >= state.handCards.length - 1) return state;
    const newHand = [...state.handCards];
    const temp = newHand[sel.index + 1];
    newHand[sel.index + 1] = newHand[sel.index];
    newHand[sel.index] = temp;
    return { ...state, handCards: newHand };
  }

  if (sel.location === 'round' && sel.roundIndex !== undefined) {
    const currentGroup = state.roundGroups[sel.roundIndex];
    if (sel.index < currentGroup.length - 1) {
      // Shift right within round
      const newGroups = state.roundGroups.map((g) => [...g]) as HandPartition;
      const group = newGroups[sel.roundIndex];
      const temp = group[sel.index + 1];
      group[sel.index + 1] = group[sel.index];
      group[sel.index] = temp;
      return { ...state, roundGroups: newGroups };
    } else {
      // Transfer to next round
      const nextRound = (sel.roundIndex + 1) % 4;
      return moveSelectedUp(state, nextRound);
    }
  }

  return state;
}

/**
 * Swap two cards anywhere (hand to hand, hand to round, round to round).
 */
export function swapCards(
  state: TablePartitionState,
  idA: string,
  idB: string,
): TablePartitionState {
  if (idA === idB) return state;

  let locA: 'hand' | number = -1;
  let locB: 'hand' | number = -1;
  let idxA = state.handCards.findIndex((c) => c.id === idA);
  let idxB = state.handCards.findIndex((c) => c.id === idB);

  if (idxA !== -1) locA = 'hand';
  if (idxB !== -1) locB = 'hand';

  for (let r = 0; r < 4; r++) {
    if (locA === -1) {
      const i = state.roundGroups[r].findIndex((c) => c.id === idA);
      if (i !== -1) {
        locA = r;
        idxA = i;
      }
    }
    if (locB === -1) {
      const i = state.roundGroups[r].findIndex((c) => c.id === idB);
      if (i !== -1) {
        locB = r;
        idxB = i;
      }
    }
  }

  if (locA === -1 || locB === -1) return state;

  const cardA =
    locA === 'hand' ? state.handCards[idxA] : state.roundGroups[locA][idxA];
  const cardB =
    locB === 'hand' ? state.handCards[idxB] : state.roundGroups[locB][idxB];

  const newHand = [...state.handCards];
  const newGroups = state.roundGroups.map((g) => [...g]) as HandPartition;

  if (locA === 'hand') newHand[idxA] = cardB;
  else newGroups[locA][idxA] = cardB;

  if (locB === 'hand') newHand[idxB] = cardA;
  else newGroups[locB][idxB] = cardA;

  return {
    ...state,
    handCards: newHand,
    roundGroups: newGroups,
  };
}

/**
 * Place a card directly into a specific round zone.
 */
export function placeCardInRound(
  state: TablePartitionState,
  cardId: string,
  targetRound: number,
): TablePartitionState {
  const selectedState = { ...state, selectedCardId: cardId, targetRound };
  const next = moveSelectedUp(selectedState, targetRound);
  return { ...next, selectedCardId: null };
}

/**
 * Remove a specific card from its round zone and return it to hand.
 */
export function removeCardToHand(
  state: TablePartitionState,
  cardId: string,
): TablePartitionState {
  const selectedState = { ...state, selectedCardId: cardId };
  const next = moveSelectedDown(selectedState);
  return { ...next, selectedCardId: null };
}

/**
 * Clear all round zones and return all cards to hand.
 */
export function clearAllToHand(state: TablePartitionState): TablePartitionState {
  return {
    ...state,
    handCards: [...state.originalCards],
    roundGroups: [[], [], [], []],
    selectedCardId: null,
    targetRound: 0,
  };
}

/**
 * Sort hand cards by rank.
 */
export function sortHandByRank(state: TablePartitionState): TablePartitionState {
  const sorted = [...state.handCards].sort(
    (a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank],
  );
  return { ...state, handCards: sorted };
}

/**
 * Sort hand cards by suit.
 */
export function sortHandBySuit(state: TablePartitionState): TablePartitionState {
  const suitOrder: Record<Suit, number> = {
    hearts: 0,
    diamonds: 1,
    clubs: 2,
    spades: 3,
  };
  const sorted = [...state.handCards].sort(
    (a, b) =>
      suitOrder[a.suit] - suitOrder[b.suit] ||
      RANK_VALUES[b.rank] - RANK_VALUES[a.rank],
  );
  return { ...state, handCards: sorted };
}

/**
 * Transfer any card directly into a destination round zone (from hand or another round).
 */
export function transferCard(
  state: TablePartitionState,
  cardId: string,
  destRound: number,
): TablePartitionState {
  const card =
    state.roundGroups.flat().find((c) => c.id === cardId) ||
    state.handCards.find((c) => c.id === cardId);
  if (!card) return state;

  const newHand = state.handCards.filter((c) => c.id !== cardId);
  const newGroups = state.roundGroups.map((g) =>
    g.filter((c) => c.id !== cardId),
  ) as HandPartition;

  // If destRound is full, eject last card to hand
  if (newGroups[destRound].length >= REQUIRED_SIZES[destRound]) {
    const ejected = newGroups[destRound].pop();
    if (ejected) {
      newHand.push(ejected);
    }
  }

  newGroups[destRound].push(card);

  return {
    ...state,
    handCards: newHand,
    roundGroups: newGroups,
    selectedCardId: null,
  };
}

/**
 * Check if the partition is currently valid (3, 3, 3, 4 with all 13 cards).
 */
export function isPartitionReady(state: TablePartitionState): boolean {
  return validatePartition(state.originalCards, state.roundGroups);
}
