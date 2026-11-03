// Four suits in a standard deck
export type Suit =
  | 'hearts'
  | 'diamonds'
  | 'clubs'
  | 'spades';

// Thirteen card ranks
export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

// Structure of one playing card
export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/**
 * Creates a standard 52-card deck.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${rank}_${suit}`, suit, rank });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle — shuffles the deck in place and returns it.
 */
export function shuffle(deck: Card[]): Card[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Draws `count` cards from the top of the deck.
 * Mutates the deck array (removes drawn cards).
 */
export function draw(deck: Card[], count: number = 1): Card[] {
  return deck.splice(0, count);
}

/**
 * Returns the numeric value of a card (Ace=1, J/Q/K=10, rest=face value).
 */
export function cardValue(card: Card): number {
  if (card.rank === 'A') return 1;
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return 10;
  return parseInt(card.rank, 10);
}

/**
 * Returns a human-readable label like "A♠" or "10♥".
 */
export function cardLabel(card: Card): string {
  const suitSymbol: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };
  return `${card.rank}${suitSymbol[card.suit]}`;
}

/**
 * Returns the color of a card's suit.
 */
export function suitColor(suit: Suit): 'red' | 'black' {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}
