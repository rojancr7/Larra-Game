import { Card } from './deck';

export function dealCards(
  deck: Card[],
  playerCount: number = 4,
  cardsPerPlayer: number = 13
): Card[][] {

  if (deck.length < playerCount * cardsPerPlayer) {
    throw new Error('Not enough cards in the deck');
  }

  const players: Card[][] = [];

  // Create empty hands
  for (let i = 0; i < playerCount; i++) {
    players.push([]);
  }

  // Distribute cards
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let j = 0; j < playerCount; j++) {
      const card = deck.shift();

      if (card) {
        players[j].push(card);
      }
    }
  }

  return players;
}