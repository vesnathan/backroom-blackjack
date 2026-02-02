import { describe, it, expect } from "vitest";
import { CountingSystem } from "@/types/gameSettings";
import { Rank } from "@/types/game";
import {
  getCardValue,
  getHiLoCount,
  getKOCount,
  getHiOptICount,
  getHiOptIICount,
  getOmegaIICount,
  getCountValue,
  createDeck,
  createShoe,
  shuffleCards,
  calculateCutCardPosition,
  calculateDecksRemaining,
  calculateTrueCount,
} from "./deck";

describe("deck.ts", () => {
  // ============================================
  // CARD VALUE TESTS (Section 1 of TEST-PLAN.md)
  // ============================================
  describe("getCardValue", () => {
    it("should return 11 for Ace (default soft value)", () => {
      expect(getCardValue("A")).toBe(11);
    });

    it("should return 10 for face cards (J, Q, K)", () => {
      expect(getCardValue("J")).toBe(10);
      expect(getCardValue("Q")).toBe(10);
      expect(getCardValue("K")).toBe(10);
    });

    it("should return 10 for 10 card", () => {
      expect(getCardValue("10")).toBe(10);
    });

    it("should return numeric value for number cards 2-9", () => {
      expect(getCardValue("2")).toBe(2);
      expect(getCardValue("3")).toBe(3);
      expect(getCardValue("4")).toBe(4);
      expect(getCardValue("5")).toBe(5);
      expect(getCardValue("6")).toBe(6);
      expect(getCardValue("7")).toBe(7);
      expect(getCardValue("8")).toBe(8);
      expect(getCardValue("9")).toBe(9);
    });
  });

  // ============================================
  // HI-LO COUNTING SYSTEM TESTS (Section 5)
  // Hi-Lo: 2-6 = +1, 7-9 = 0, 10-A = -1
  // ============================================
  describe("getHiLoCount", () => {
    it("should return +1 for small cards (2-6)", () => {
      expect(getHiLoCount("2")).toBe(1);
      expect(getHiLoCount("3")).toBe(1);
      expect(getHiLoCount("4")).toBe(1);
      expect(getHiLoCount("5")).toBe(1);
      expect(getHiLoCount("6")).toBe(1);
    });

    it("should return 0 for neutral cards (7-9)", () => {
      expect(getHiLoCount("7")).toBe(0);
      expect(getHiLoCount("8")).toBe(0);
      expect(getHiLoCount("9")).toBe(0);
    });

    it("should return -1 for high cards (10-A)", () => {
      expect(getHiLoCount("10")).toBe(-1);
      expect(getHiLoCount("J")).toBe(-1);
      expect(getHiLoCount("Q")).toBe(-1);
      expect(getHiLoCount("K")).toBe(-1);
      expect(getHiLoCount("A")).toBe(-1);
    });
  });

  // ============================================
  // KO (KNOCK-OUT) COUNTING SYSTEM TESTS
  // KO: 2-7 = +1, 8-9 = 0, 10-A = -1
  // ============================================
  describe("getKOCount", () => {
    it("should return +1 for small cards (2-7)", () => {
      expect(getKOCount("2")).toBe(1);
      expect(getKOCount("3")).toBe(1);
      expect(getKOCount("4")).toBe(1);
      expect(getKOCount("5")).toBe(1);
      expect(getKOCount("6")).toBe(1);
      expect(getKOCount("7")).toBe(1); // KO includes 7 as +1
    });

    it("should return 0 for neutral cards (8-9)", () => {
      expect(getKOCount("8")).toBe(0);
      expect(getKOCount("9")).toBe(0);
    });

    it("should return -1 for high cards (10-A)", () => {
      expect(getKOCount("10")).toBe(-1);
      expect(getKOCount("J")).toBe(-1);
      expect(getKOCount("Q")).toBe(-1);
      expect(getKOCount("K")).toBe(-1);
      expect(getKOCount("A")).toBe(-1);
    });
  });

  // ============================================
  // HI-OPT I COUNTING SYSTEM TESTS
  // Hi-Opt I: 3-6 = +1, 2,7-9,A = 0, 10-K = -1
  // ============================================
  describe("getHiOptICount", () => {
    it("should return +1 for cards 3-6", () => {
      expect(getHiOptICount("3")).toBe(1);
      expect(getHiOptICount("4")).toBe(1);
      expect(getHiOptICount("5")).toBe(1);
      expect(getHiOptICount("6")).toBe(1);
    });

    it("should return 0 for 2, 7-9, and Ace", () => {
      expect(getHiOptICount("2")).toBe(0); // 2 is neutral in Hi-Opt I
      expect(getHiOptICount("7")).toBe(0);
      expect(getHiOptICount("8")).toBe(0);
      expect(getHiOptICount("9")).toBe(0);
      expect(getHiOptICount("A")).toBe(0); // Ace is neutral in Hi-Opt I
    });

    it("should return -1 for 10-K", () => {
      expect(getHiOptICount("10")).toBe(-1);
      expect(getHiOptICount("J")).toBe(-1);
      expect(getHiOptICount("Q")).toBe(-1);
      expect(getHiOptICount("K")).toBe(-1);
    });
  });

  // ============================================
  // HI-OPT II COUNTING SYSTEM TESTS
  // Hi-Opt II: 4-5 = +2, 2,3,6,7 = +1, 8,9,A = 0, 10-K = -2
  // ============================================
  describe("getHiOptIICount", () => {
    it("should return +2 for cards 4-5", () => {
      expect(getHiOptIICount("4")).toBe(2);
      expect(getHiOptIICount("5")).toBe(2);
    });

    it("should return +1 for 2, 3, 6, 7", () => {
      expect(getHiOptIICount("2")).toBe(1);
      expect(getHiOptIICount("3")).toBe(1);
      expect(getHiOptIICount("6")).toBe(1);
      expect(getHiOptIICount("7")).toBe(1);
    });

    it("should return 0 for 8, 9, Ace", () => {
      expect(getHiOptIICount("8")).toBe(0);
      expect(getHiOptIICount("9")).toBe(0);
      expect(getHiOptIICount("A")).toBe(0);
    });

    it("should return -2 for 10-K", () => {
      expect(getHiOptIICount("10")).toBe(-2);
      expect(getHiOptIICount("J")).toBe(-2);
      expect(getHiOptIICount("Q")).toBe(-2);
      expect(getHiOptIICount("K")).toBe(-2);
    });
  });

  // ============================================
  // OMEGA II COUNTING SYSTEM TESTS
  // Omega II: 4,5,6 = +2, 2,3,7 = +1, 8,A = 0, 9 = -1, 10-K = -2
  // ============================================
  describe("getOmegaIICount", () => {
    it("should return +2 for cards 4, 5, 6", () => {
      expect(getOmegaIICount("4")).toBe(2);
      expect(getOmegaIICount("5")).toBe(2);
      expect(getOmegaIICount("6")).toBe(2);
    });

    it("should return +1 for 2, 3, 7", () => {
      expect(getOmegaIICount("2")).toBe(1);
      expect(getOmegaIICount("3")).toBe(1);
      expect(getOmegaIICount("7")).toBe(1);
    });

    it("should return 0 for 8, Ace", () => {
      expect(getOmegaIICount("8")).toBe(0);
      expect(getOmegaIICount("A")).toBe(0);
    });

    it("should return -1 for 9", () => {
      expect(getOmegaIICount("9")).toBe(-1);
    });

    it("should return -2 for 10-K", () => {
      expect(getOmegaIICount("10")).toBe(-2);
      expect(getOmegaIICount("J")).toBe(-2);
      expect(getOmegaIICount("Q")).toBe(-2);
      expect(getOmegaIICount("K")).toBe(-2);
    });
  });

  // ============================================
  // getCountValue DISPATCH TESTS
  // ============================================
  describe("getCountValue", () => {
    it("should dispatch to correct counting system", () => {
      // Test a card that has different values in different systems
      expect(getCountValue("7", CountingSystem.HI_LO)).toBe(0);
      expect(getCountValue("7", CountingSystem.KO)).toBe(1);
      expect(getCountValue("7", CountingSystem.HI_OPT_I)).toBe(0);
      expect(getCountValue("7", CountingSystem.HI_OPT_II)).toBe(1);
      expect(getCountValue("7", CountingSystem.OMEGA_II)).toBe(1);
    });
  });

  // ============================================
  // DECK CREATION TESTS (Section 1 - 52 cards, no duplicates)
  // ============================================
  describe("createDeck", () => {
    it("should create a deck with exactly 52 cards", () => {
      const deck = createDeck();
      expect(deck.length).toBe(52);
    });

    it("should have no duplicate cards", () => {
      const deck = createDeck();
      const cardIds = deck.map((card) => `${card.rank}${card.suit}`);
      const uniqueIds = new Set(cardIds);
      expect(uniqueIds.size).toBe(52);
    });

    it("should have 4 of each rank", () => {
      const deck = createDeck();
      const ranks: Rank[] = [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
      ];

      ranks.forEach((rank) => {
        const count = deck.filter((card) => card.rank === rank).length;
        expect(count).toBe(4);
      });
    });

    it("should have 13 of each suit", () => {
      const deck = createDeck();
      const suits = ["H", "D", "C", "S"] as const;

      suits.forEach((suit) => {
        const count = deck.filter((card) => card.suit === suit).length;
        expect(count).toBe(13);
      });
    });

    it("should have correct values for all cards", () => {
      const deck = createDeck();

      deck.forEach((card) => {
        if (card.rank === "A") {
          expect(card.value).toBe(11);
        } else if (["J", "Q", "K", "10"].includes(card.rank)) {
          expect(card.value).toBe(10);
        } else {
          expect(card.value).toBe(parseInt(card.rank, 10));
        }
      });
    });

    it("should have correct Hi-Lo count values", () => {
      const deck = createDeck(CountingSystem.HI_LO);

      deck.forEach((card) => {
        expect(card.count).toBe(getHiLoCount(card.rank));
      });
    });
  });

  // ============================================
  // SHOE CREATION TESTS
  // ============================================
  describe("createShoe", () => {
    it("should create correct number of cards for various deck counts", () => {
      expect(createShoe(1).length).toBe(52);
      expect(createShoe(2).length).toBe(104);
      expect(createShoe(4).length).toBe(208);
      expect(createShoe(6).length).toBe(312);
      expect(createShoe(8).length).toBe(416);
    });

    it("should have correct distribution in multi-deck shoe", () => {
      const shoe = createShoe(6);

      // Should have 24 of each rank (4 per deck * 6 decks)
      const aceCount = shoe.filter((card) => card.rank === "A").length;
      expect(aceCount).toBe(24);

      // Should have 78 of each suit (13 per deck * 6 decks)
      const heartCount = shoe.filter((card) => card.suit === "H").length;
      expect(heartCount).toBe(78);
    });
  });

  // ============================================
  // SHUFFLE TESTS
  // ============================================
  describe("shuffleCards", () => {
    it("should return same number of cards", () => {
      const deck = createDeck();
      const shuffled = shuffleCards(deck);
      expect(shuffled.length).toBe(52);
    });

    it("should not mutate original deck", () => {
      const deck = createDeck();
      const originalFirst = deck[0];
      shuffleCards(deck);
      expect(deck[0]).toBe(originalFirst);
    });

    it("should contain all original cards", () => {
      const deck = createDeck();
      const shuffled = shuffleCards(deck);

      const originalIds = deck.map((c) => `${c.rank}${c.suit}`).sort();
      const shuffledIds = shuffled.map((c) => `${c.rank}${c.suit}`).sort();

      expect(shuffledIds).toEqual(originalIds);
    });

    it("should change card order (statistical test)", () => {
      const deck = createDeck();
      const shuffled = shuffleCards(deck);

      // Count how many cards are in different positions
      let differentPositions = 0;
      deck.forEach((card, i) => {
        const isDifferent =
          card.rank !== shuffled[i].rank || card.suit !== shuffled[i].suit;
        if (isDifferent) {
          differentPositions += 1;
        }
      });

      // With Fisher-Yates, we expect most cards to move
      // It's virtually impossible for more than a few cards to stay in place
      expect(differentPositions).toBeGreaterThan(40);
    });
  });

  // ============================================
  // CUT CARD POSITION TESTS
  // ============================================
  describe("calculateCutCardPosition", () => {
    it("should calculate correct position for 75% penetration", () => {
      // 6 decks = 312 cards, 75% penetration = 234 cards dealt
      // Cut card position = 312 - 234 = 78 cards from end
      expect(calculateCutCardPosition(6, 75)).toBe(78);
    });

    it("should calculate correct position for 50% penetration", () => {
      // 6 decks = 312 cards, 50% penetration = 156 cards dealt
      // Cut card position = 312 - 156 = 156 cards from end
      expect(calculateCutCardPosition(6, 50)).toBe(156);
    });

    it("should work with single deck", () => {
      // 1 deck = 52 cards, 60% penetration = 31 cards dealt (floor)
      // Cut card position = 52 - 31 = 21 cards from end
      expect(calculateCutCardPosition(1, 60)).toBe(21);
    });
  });

  // ============================================
  // DECKS REMAINING TESTS
  // ============================================
  describe("calculateDecksRemaining", () => {
    it("should calculate decks remaining correctly", () => {
      // 312 total cards (6 decks), 52 cards dealt = 260 remaining = 5 decks
      expect(calculateDecksRemaining(312, 52)).toBe(5);
    });

    it("should return minimum 0.5 decks to prevent division issues", () => {
      // Even if all cards dealt, should return 0.5
      expect(calculateDecksRemaining(52, 52)).toBe(0.5);
      expect(calculateDecksRemaining(52, 60)).toBe(0.5);
    });

    it("should handle fractional decks", () => {
      // 312 total, 26 dealt = 286 remaining = ~5.5 decks
      const result = calculateDecksRemaining(312, 26);
      expect(result).toBeCloseTo(5.5, 1);
    });
  });

  // ============================================
  // TRUE COUNT TESTS (Section 5 - True count calculation)
  // True Count = Running Count / Decks Remaining
  // ============================================
  describe("calculateTrueCount", () => {
    it("should calculate true count correctly", () => {
      // Running count of +6, 2 decks remaining = TC +3
      expect(calculateTrueCount(6, 2)).toBe(3);
    });

    it("should round down (floor) the true count", () => {
      // Running count of +7, 2 decks remaining = 3.5 -> floors to 3
      expect(calculateTrueCount(7, 2)).toBe(3);
    });

    it("should handle negative running count", () => {
      // Running count of -8, 4 decks remaining = TC -2
      expect(calculateTrueCount(-8, 4)).toBe(-2);
    });

    it("should handle negative with floor (toward negative infinity)", () => {
      // Running count of -5, 2 decks remaining = -2.5 -> floors to -3
      expect(calculateTrueCount(-5, 2)).toBe(-3);
    });

    it("should return 0 for running count of 0", () => {
      expect(calculateTrueCount(0, 4)).toBe(0);
    });
  });

  // ============================================
  // FULL SHOE COUNT BALANCE TEST (Hi-Lo is balanced)
  // A balanced counting system should sum to 0 for a full deck/shoe
  // ============================================
  describe("Hi-Lo Balance", () => {
    it("should have a balanced count (sum to 0) for a full deck", () => {
      const deck = createDeck(CountingSystem.HI_LO);
      const totalCount = deck.reduce((sum, card) => sum + card.count, 0);
      expect(totalCount).toBe(0);
    });

    it("should have a balanced count for a multi-deck shoe", () => {
      const shoe = createShoe(6, CountingSystem.HI_LO);
      const totalCount = shoe.reduce((sum, card) => sum + card.count, 0);
      expect(totalCount).toBe(0);
    });
  });

  // ============================================
  // KO UNBALANCED TEST (KO is unbalanced: +4 per deck)
  // ============================================
  describe("KO Balance", () => {
    it("should be unbalanced (+4 per deck) for KO system", () => {
      const deck = createDeck(CountingSystem.KO);
      const totalCount = deck.reduce((sum, card) => sum + card.count, 0);
      // KO: 2-7 = +1 (24 cards), 10-A = -1 (20 cards), 8-9 = 0 (8 cards)
      // Total = 24 - 20 = +4 per deck
      expect(totalCount).toBe(4);
    });

    it("should sum to +24 for 6 decks", () => {
      const shoe = createShoe(6, CountingSystem.KO);
      const totalCount = shoe.reduce((sum, card) => sum + card.count, 0);
      expect(totalCount).toBe(24);
    });
  });
});
