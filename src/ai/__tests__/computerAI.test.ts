import { describe, it, expect } from "vitest";
import { Card, createDeck, shuffle, Suit, Rank } from "../../engine/deck";
import { dealCards } from "../../engine/deal";
import { validatePartition, HandPartition } from "../../engine/partition";
import { evaluateThreeCardHand } from "../../engine/handEvaluator";
import {
  evaluateRoundFour,
  getFourCardSequenceRank,
} from "../../engine/roundFour";
import {
  startNewGame,
  submitPlayerPartition,
  settleGame,
} from "../../engine/gameController";
import { generateAIPartition, computeAIPartition } from "../computerAI";

function createCard(rank: Rank, suit: Suit): Card {
  return { id: `${rank}_${suit}`, rank, suit };
}

describe("Computer AI Partitioning", () => {
  // -------------------------------------------------------------------------
  // 1. Basic Structure & Validity
  // -------------------------------------------------------------------------
  describe("Basic Structure & Validity", () => {
    it("produces groups of exactly [3, 3, 3, 4] for a dealt hand", () => {
      const deck = shuffle(createDeck());
      const [hand] = dealCards(deck, 4, 13);
      const partition = generateAIPartition(hand);

      expect(partition).toHaveLength(4);
      expect(partition[0]).toHaveLength(3);
      expect(partition[1]).toHaveLength(3);
      expect(partition[2]).toHaveLength(3);
      expect(partition[3]).toHaveLength(4);
    });

    it("uses all 13 original cards exactly once with no duplicates", () => {
      const deck = shuffle(createDeck());
      const [hand] = dealCards(deck, 4, 13);
      const partition = generateAIPartition(hand);

      const allCards = partition.flat();
      expect(allCards).toHaveLength(13);

      const uniqueIds = new Set(allCards.map((c) => c.id));
      expect(uniqueIds.size).toBe(13);

      const originalIds = new Set(hand.map((c) => c.id));
      for (const card of allCards) {
        expect(originalIds.has(card.id)).toBe(true);
      }
    });

    it("passes engine validatePartition() check", () => {
      const deck = shuffle(createDeck());
      const [hand] = dealCards(deck, 4, 13);
      const partition = generateAIPartition(hand);

      expect(validatePartition(hand, partition)).toBe(true);
    });

    it("exports computeAIPartition as alias for generateAIPartition", () => {
      expect(computeAIPartition).toBe(generateAIPartition);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Validation on 100 Random Hands
  // -------------------------------------------------------------------------
  describe("Random Hands Stress Test (100 Deals)", () => {
    it("consistently generates valid partitions for at least 100 random hands", () => {
      for (let dealIdx = 0; dealIdx < 100; dealIdx++) {
        const deck = shuffle(createDeck());
        // Each deal produces 4 hands of 13 cards; test one hand per deal
        const [hand] = dealCards(deck, 4, 13);
        const partition = generateAIPartition(hand);

        // Check sizes
        expect(partition[0].length).toBe(3);
        expect(partition[1].length).toBe(3);
        expect(partition[2].length).toBe(3);
        expect(partition[3].length).toBe(4);

        // Check uniqueness and original card matching
        const flattened = partition.flat();
        expect(flattened.length).toBe(13);
        const idSet = new Set(flattened.map((c) => c.id));
        expect(idSet.size).toBe(13);

        // Must validate with engine
        expect(validatePartition(hand, partition)).toBe(true);
      }
    });
  });

  // -------------------------------------------------------------------------
  // 3. Challenging Strategic Hands
  // -------------------------------------------------------------------------
  describe("Strategic Optimization on Challenging Hands", () => {
    it("places an Instant Victory 4-card sequence (A-2-3-4) into Round 4", () => {
      // Hand contains A-2-3-4 of hearts (qualifies for instant victory in Round 4)
      const hand: Card[] = [
        createCard("A", "hearts"),
        createCard("2", "hearts"),
        createCard("3", "hearts"),
        createCard("4", "hearts"),
        // Other 9 cards
        createCard("7", "clubs"),
        createCard("8", "diamonds"),
        createCard("9", "spades"),
        createCard("10", "hearts"),
        createCard("J", "clubs"),
        createCard("Q", "diamonds"),
        createCard("K", "spades"),
        createCard("5", "clubs"),
        createCard("6", "diamonds"),
      ];

      const partition = generateAIPartition(hand);
      expect(validatePartition(hand, partition)).toBe(true);

      const r4 = partition[3];
      const seqRank = getFourCardSequenceRank(r4);
      // Round 4 must contain a sequence that qualifies for instant victory (seqRank >= 10)
      expect(seqRank).toBeGreaterThanOrEqual(10);
    });

    it("places an Instant Victory 4-card sequence (J-Q-K-A) into Round 4", () => {
      // Hand contains J-Q-K-A of clubs
      const hand: Card[] = [
        createCard("J", "clubs"),
        createCard("Q", "clubs"),
        createCard("K", "clubs"),
        createCard("A", "clubs"),
        // Other 9 cards
        createCard("2", "hearts"),
        createCard("5", "diamonds"),
        createCard("7", "spades"),
        createCard("8", "hearts"),
        createCard("9", "diamonds"),
        createCard("10", "spades"),
        createCard("3", "clubs"),
        createCard("4", "hearts"),
        createCard("6", "diamonds"),
      ];

      const partition = generateAIPartition(hand);
      expect(validatePartition(hand, partition)).toBe(true);

      const r4 = partition[3];
      const seqRank = getFourCardSequenceRank(r4);
      expect(seqRank).toBe(11); // J-Q-K-A is sequenceRank 11
    });

    it("places a 4-of-a-kind (Trail) into Round 4 for maximum bonus points", () => {
      // Four Kings in the hand
      const hand: Card[] = [
        createCard("K", "hearts"),
        createCard("K", "diamonds"),
        createCard("K", "clubs"),
        createCard("K", "spades"),
        // Other 9 cards
        createCard("2", "hearts"),
        createCard("3", "hearts"),
        createCard("4", "hearts"),
        createCard("7", "diamonds"),
        createCard("8", "diamonds"),
        createCard("9", "diamonds"),
        createCard("10", "clubs"),
        createCard("J", "clubs"),
        createCard("Q", "clubs"),
      ];

      const partition = generateAIPartition(hand);
      expect(validatePartition(hand, partition)).toBe(true);

      const r4 = partition[3];
      const eval4 = evaluateRoundFour(r4);
      expect(eval4.category).toBe("TRAIL");
    });

    it("preserves 3-card Trails in Rounds 1–3 rather than breaking them into Round 4", () => {
      // Three Aces, Three Kings, Three Queens, and four arbitrary cards
      const hand: Card[] = [
        createCard("A", "hearts"),
        createCard("A", "diamonds"),
        createCard("A", "clubs"),
        createCard("K", "hearts"),
        createCard("K", "diamonds"),
        createCard("K", "clubs"),
        createCard("Q", "hearts"),
        createCard("Q", "diamonds"),
        createCard("Q", "clubs"),
        createCard("2", "spades"),
        createCard("4", "spades"),
        createCard("6", "spades"),
        createCard("8", "spades"),
      ];

      const partition = generateAIPartition(hand);
      expect(validatePartition(hand, partition)).toBe(true);

      // The 3-card groups should be TRAILS
      const g1Eval = evaluateThreeCardHand(partition[0]);
      const g2Eval = evaluateThreeCardHand(partition[1]);
      const g3Eval = evaluateThreeCardHand(partition[2]);

      expect(g1Eval.category).toBe("TRAIL");
      expect(g2Eval.category).toBe("TRAIL");
      expect(g3Eval.category).toBe("TRAIL");
    });

    it("sorts Rounds 1–3 in descending strategic strength when in aggressive mode", () => {
      const deck = shuffle(createDeck());
      const [hand] = dealCards(deck, 4, 13);
      const partition = generateAIPartition(hand, { strategy: 'aggressive' });

      const eval1 = evaluateThreeCardHand(partition[0]);
      const eval2 = evaluateThreeCardHand(partition[1]);
      const eval3 = evaluateThreeCardHand(partition[2]);

      expect(eval1.strength).toBeGreaterThanOrEqual(eval2.strength);
      expect(eval2.strength).toBeGreaterThanOrEqual(eval3.strength);
    });

    it("can sacrifice Round 1 to bait opponents and preserve peak strength for Rounds 2 & 3", () => {
      // Hand with diverse strengths
      const hand: Card[] = [
        createCard("A", "hearts"),
        createCard("A", "diamonds"),
        createCard("A", "clubs"), // Trail of Aces
        createCard("K", "hearts"),
        createCard("K", "diamonds"),
        createCard("2", "clubs"), // Pair of Kings
        createCard("3", "spades"),
        createCard("5", "hearts"),
        createCard("7", "diamonds"), // High card
        createCard("10", "clubs"),
        createCard("J", "diamonds"),
        createCard("Q", "spades"),
        createCard("4", "clubs"),
      ];

      const partition = generateAIPartition(hand, { strategy: 'ambush_sacrifice' });
      expect(validatePartition(hand, partition)).toBe(true);

      const r1Eval = evaluateThreeCardHand(partition[0]);
      const r2Eval = evaluateThreeCardHand(partition[1]);

      // In ambush sacrifice, Round 2 (strongest) is strictly higher or equal to Round 1 (sacrificed)
      expect(r2Eval.strength).toBeGreaterThanOrEqual(r1Eval.strength);
    });

    it("can reserve the strongest hand for Round 3 in late anchor mode", () => {
      const hand: Card[] = [
        createCard("A", "hearts"),
        createCard("A", "diamonds"),
        createCard("A", "clubs"), // Trail of Aces
        createCard("K", "hearts"),
        createCard("K", "diamonds"),
        createCard("2", "clubs"), // Pair of Kings
        createCard("3", "spades"),
        createCard("5", "hearts"),
        createCard("7", "diamonds"), // High card
        createCard("10", "clubs"),
        createCard("J", "diamonds"),
        createCard("Q", "spades"),
        createCard("4", "clubs"),
      ];

      const partition = generateAIPartition(hand, { strategy: 'late_anchor' });
      expect(validatePartition(hand, partition)).toBe(true);

      const r1Eval = evaluateThreeCardHand(partition[0]);
      const r3Eval = evaluateThreeCardHand(partition[2]);

      // Round 3 contains the peak hand (Trail of Aces)
      expect(r3Eval.strength).toBeGreaterThanOrEqual(r1Eval.strength);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Input Validation & Error Handling
  // -------------------------------------------------------------------------
  describe("Input Validation & Error Handling", () => {
    it("throws an error if input is not an array", () => {
      expect(() => generateAIPartition(null as unknown as Card[])).toThrow(
        /hand must be an array/i,
      );
      expect(() => generateAIPartition(undefined as unknown as Card[])).toThrow(
        /hand must be an array/i,
      );
      expect(() => generateAIPartition({} as unknown as Card[])).toThrow(
        /hand must be an array/i,
      );
    });

    it("throws an error if hand contains fewer than 13 cards", () => {
      const deck = shuffle(createDeck());
      const shortHand = deck.slice(0, 12);
      expect(() => generateAIPartition(shortHand)).toThrow(
        /expected exactly 13 cards, received 12/i,
      );
    });

    it("throws an error if hand contains more than 13 cards", () => {
      const deck = shuffle(createDeck());
      const longHand = deck.slice(0, 14);
      expect(() => generateAIPartition(longHand)).toThrow(
        /expected exactly 13 cards, received 14/i,
      );
    });

    it("throws an error if hand contains duplicate cards", () => {
      const deck = shuffle(createDeck());
      const hand = deck.slice(0, 13);
      // Replace last card with first card (creating duplicate)
      hand[12] = { ...hand[0] };

      expect(() => generateAIPartition(hand)).toThrow(/duplicate card/i);
    });

    it("throws an error if hand contains invalid card objects", () => {
      const deck = shuffle(createDeck());
      const hand = deck.slice(0, 13) as any[];
      hand[5] = { id: "", rank: null, suit: undefined };

      expect(() => generateAIPartition(hand)).toThrow(/invalid card/i);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Game Controller Integration (Players 2–4)
  // -------------------------------------------------------------------------
  describe("Game Controller Integration (Players 2–4)", () => {
    it("correctly partitions Players 2–4 and settles the match", () => {
      const game = startNewGame();

      // Player 1 (human / index 0) submits their partition
      const p1Cards = game.players[0].cards;
      const p1Partition: HandPartition = [
        p1Cards.slice(0, 3),
        p1Cards.slice(3, 6),
        p1Cards.slice(6, 9),
        p1Cards.slice(9, 13),
      ];

      let updated = submitPlayerPartition(game, 0, p1Partition);
      expect(updated.players[0].partition).toEqual(p1Partition);

      // Players 2, 3, 4 (indices 1, 2, 3) use generateAIPartition()
      for (let i = 1; i < 4; i++) {
        expect(updated.players[i].partition).toBeNull();
        const aiPartition = generateAIPartition(updated.players[i].cards);
        expect(validatePartition(updated.players[i].cards, aiPartition)).toBe(
          true,
        );
        updated = submitPlayerPartition(updated, i, aiPartition);
        expect(updated.players[i].partition).toEqual(aiPartition);
      }

      // Human player's partition must remain preserved
      expect(updated.players[0].partition).toEqual(p1Partition);

      // All 4 players now have valid partitions
      for (let i = 0; i < 4; i++) {
        expect(updated.players[i].partition).not.toBeNull();
      }

      // Settle the game without error
      const settled = settleGame(updated);
      expect(settled.isSettled).toBe(true);
      if (settled.instantVictoryWinner !== null) {
        expect(settled.isGameOver).toBe(true);
        expect(settled.matchWinner).not.toBeNull();
      } else {
        expect(settled.roundResults).toHaveLength(4);
      }
      expect(settled.scores).toHaveLength(4);
    });

    it("prevents modifying Player 1 partition during AI processing", () => {
      const game = startNewGame();
      const p1Original = generateAIPartition(game.players[0].cards);
      let state = submitPlayerPartition(game, 0, p1Original);

      // Process AI players
      for (let i = 1; i < 4; i++) {
        const aiPart = generateAIPartition(state.players[i].cards);
        state = submitPlayerPartition(state, i, aiPart);
      }

      // Ensure Player 1 is completely identical
      expect(state.players[0].partition).toEqual(p1Original);
    });
  });

  // -------------------------------------------------------------------------
  // 9. Difficulty Modes: Easy, Medium, Hard
  // -------------------------------------------------------------------------
  describe("Difficulty Modes (Easy, Medium, Hard)", () => {
    it("generates valid partitions for Easy, Medium, and Hard modes", () => {
      const deck = shuffle(createDeck());
      const [hand] = dealCards(deck, 4, 13);

      const easyPart = generateAIPartition(hand, { difficulty: "easy" });
      const medPart = generateAIPartition(hand, { difficulty: "med" });
      const hardPart = generateAIPartition(hand, { difficulty: "hard" });

      expect(validatePartition(hand, easyPart)).toBe(true);
      expect(validatePartition(hand, medPart)).toBe(true);
      expect(validatePartition(hand, hardPart)).toBe(true);

      expect(easyPart[0]).toHaveLength(3);
      expect(easyPart[1]).toHaveLength(3);
      expect(easyPart[2]).toHaveLength(3);
      expect(easyPart[3]).toHaveLength(4);

      expect(medPart[0]).toHaveLength(3);
      expect(medPart[1]).toHaveLength(3);
      expect(medPart[2]).toHaveLength(3);
      expect(medPart[3]).toHaveLength(4);

      expect(hardPart[0]).toHaveLength(3);
      expect(hardPart[1]).toHaveLength(3);
      expect(hardPart[2]).toHaveLength(3);
      expect(hardPart[3]).toHaveLength(4);
    });

    it("consistently partitions random deals under all 3 difficulties", () => {
      for (let deal = 0; deal < 10; deal++) {
        const deck = shuffle(createDeck());
        const hands = dealCards(deck, 4, 13);
        for (const hand of hands) {
          const easy = generateAIPartition(hand, { difficulty: "easy" });
          const med = generateAIPartition(hand, { difficulty: "med" });
          const hard = generateAIPartition(hand, { difficulty: "hard" });

          expect(validatePartition(hand, easy)).toBe(true);
          expect(validatePartition(hand, med)).toBe(true);
          expect(validatePartition(hand, hard)).toBe(true);
        }
      }
    });
  });
});
