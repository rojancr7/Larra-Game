import { describe, it, expect } from 'vitest';
import {
  createDeck,
  shuffle,
  draw,
  cardValue,
  cardLabel,
  suitColor,
  Card,
  Suit,
  Rank,
} from '../deck';
import { dealCards } from '../deal';

describe('Deck and Dealing', () => {
  describe('createDeck', () => {
    it('creates a deck with exactly 52 cards', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
    });

    it('contains 52 unique card IDs', () => {
      const deck = createDeck();
      const ids = new Set(deck.map((c) => c.id));
      expect(ids.size).toBe(52);
    });

    it('contains exactly 13 cards of each suit', () => {
      const deck = createDeck();
      const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

      for (const suit of suits) {
        const count = deck.filter((c) => c.suit === suit).length;
        expect(count).toBe(13);
      }
    });

    it('contains exactly 4 cards of each rank', () => {
      const deck = createDeck();
      const ranks: Rank[] = [
        'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K',
      ];

      for (const rank of ranks) {
        const count = deck.filter((c) => c.rank === rank).length;
        expect(count).toBe(4);
      }
    });
  });

  describe('shuffle', () => {
    it('preserves all 52 cards and unique card IDs after shuffling', () => {
      const deck = createDeck();
      const shuffled = shuffle([...deck]);

      expect(shuffled).toHaveLength(52);
      const originalIds = new Set(deck.map((c) => c.id));
      const shuffledIds = new Set(shuffled.map((c) => c.id));

      expect(shuffledIds.size).toBe(52);
      expect(shuffledIds).toEqual(originalIds);
    });

    it('shuffles cards so order changes', () => {
      const deck = createDeck();
      const shuffled = shuffle([...deck]);

      // There is an infinitesimal chance (1/52!) of exact same order
      const isSameOrder = deck.every((c, i) => c.id === shuffled[i].id);
      expect(isSameOrder).toBe(false);
    });
  });

  describe('draw', () => {
    it('draws the requested number of cards and mutates the deck', () => {
      const deck = createDeck();
      const drawn = draw(deck, 5);

      expect(drawn).toHaveLength(5);
      expect(deck).toHaveLength(47);
    });

    it('defaults to drawing 1 card when count is omitted', () => {
      const deck = createDeck();
      const drawn = draw(deck);

      expect(drawn).toHaveLength(1);
      expect(deck).toHaveLength(51);
    });
  });

  describe('dealCards', () => {
    it('deals exactly 13 cards to each of the four players', () => {
      const deck = shuffle(createDeck());
      const hands = dealCards(deck, 4, 13);

      expect(hands).toHaveLength(4);
      hands.forEach((hand) => {
        expect(hand).toHaveLength(13);
      });
    });

    it('ensures no duplicate or missing cards across all dealt hands', () => {
      const deck = shuffle(createDeck());
      const originalIds = new Set(deck.map((c) => c.id));
      const hands = dealCards(deck, 4, 13);

      const allDealtCards = hands.flat();
      expect(allDealtCards).toHaveLength(52);

      const dealtIds = new Set(allDealtCards.map((c) => c.id));
      expect(dealtIds.size).toBe(52);
      expect(dealtIds).toEqual(originalIds);
    });

    it('throws an error if there are insufficient cards in the deck', () => {
      const shortDeck: Card[] = createDeck().slice(0, 51);
      expect(() => dealCards(shortDeck, 4, 13)).toThrow(
        'Not enough cards in the deck'
      );
    });
  });

  describe('Card formatting and metadata', () => {
    it('formats card labels correctly', () => {
      expect(cardLabel({ id: '1', rank: 'A', suit: 'spades' })).toBe('A♠');
      expect(cardLabel({ id: '2', rank: '10', suit: 'hearts' })).toBe('10♥');
      expect(cardLabel({ id: '3', rank: 'K', suit: 'diamonds' })).toBe('K♦');
      expect(cardLabel({ id: '4', rank: '7', suit: 'clubs' })).toBe('7♣');
    });

    it('determines suit colors accurately', () => {
      expect(suitColor('hearts')).toBe('red');
      expect(suitColor('diamonds')).toBe('red');
      expect(suitColor('spades')).toBe('black');
      expect(suitColor('clubs')).toBe('black');
    });

    it('calculates numeric card values accurately', () => {
      expect(cardValue({ id: '1', rank: 'A', suit: 'spades' })).toBe(1);
      expect(cardValue({ id: '2', rank: '2', suit: 'hearts' })).toBe(2);
      expect(cardValue({ id: '3', rank: '9', suit: 'diamonds' })).toBe(9);
      expect(cardValue({ id: '4', rank: '10', suit: 'clubs' })).toBe(10);
      expect(cardValue({ id: '5', rank: 'J', suit: 'spades' })).toBe(10);
      expect(cardValue({ id: '6', rank: 'Q', suit: 'hearts' })).toBe(10);
      expect(cardValue({ id: '7', rank: 'K', suit: 'diamonds' })).toBe(10);
    });
  });
});

