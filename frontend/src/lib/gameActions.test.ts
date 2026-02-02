import { describe, it, expect } from "vitest";
import { Card, Rank, Suit } from "@/types/game";
import {
  calculateHandValue,
  isBlackjack,
  isBusted,
  isSoftHand,
  canSplit,
  canDouble,
} from "./gameActions";

// Helper to create a card
function createCard(rank: Rank, suit?: Suit, value?: number, count = 0): Card {
  const cardSuit = suit ?? "H";
  // Calculate value if not provided
  let cardValue = value;
  if (cardValue === undefined) {
    if (rank === "A") cardValue = 11;
    else if (["J", "Q", "K", "10"].includes(rank)) cardValue = 10;
    else cardValue = Number.parseInt(rank, 10);
  }

  return {
    rank,
    suit: cardSuit,
    value: cardValue,
    count,
  };
}

describe("gameActions.ts", () => {
  // ============================================
  // HAND VALUE CALCULATION TESTS (Section 1 - hard/soft totals)
  // ============================================
  describe("calculateHandValue", () => {
    describe("basic hand values", () => {
      it("should calculate value of two number cards", () => {
        const cards = [createCard("5"), createCard("7")];
        expect(calculateHandValue(cards)).toBe(12);
      });

      it("should calculate value with face cards as 10", () => {
        const cards = [createCard("J"), createCard("Q")];
        expect(calculateHandValue(cards)).toBe(20);
      });

      it("should calculate value with 10 card", () => {
        const cards = [createCard("10"), createCard("8")];
        expect(calculateHandValue(cards)).toBe(18);
      });

      it("should calculate value of three cards", () => {
        const cards = [createCard("3"), createCard("5"), createCard("7")];
        expect(calculateHandValue(cards)).toBe(15);
      });
    });

    describe("soft hands (Ace as 11)", () => {
      it("should count Ace as 11 when total is 21 or under", () => {
        const cards = [createCard("A"), createCard("7")];
        expect(calculateHandValue(cards)).toBe(18); // Soft 18
      });

      it("should handle Ace + 10-value = 21 (blackjack)", () => {
        const cards = [createCard("A"), createCard("K")];
        expect(calculateHandValue(cards)).toBe(21);
      });

      it("should handle Ace + 9 = soft 20", () => {
        const cards = [createCard("A"), createCard("9")];
        expect(calculateHandValue(cards)).toBe(20);
      });
    });

    describe("hard hands (Ace converted to 1)", () => {
      it("should convert Ace to 1 when 11 would bust", () => {
        // A (11) + 5 (5) + 7 (7) = 23, convert A to 1 = 13
        const cards = [createCard("A"), createCard("5"), createCard("7")];
        expect(calculateHandValue(cards)).toBe(13);
      });

      it("should convert Ace to 1 with face card and hitting", () => {
        // A (11) + 10 (10) + 5 (5) = 26, convert A to 1 = 16
        const cards = [createCard("A"), createCard("10"), createCard("5")];
        expect(calculateHandValue(cards)).toBe(16);
      });
    });

    describe("multiple Aces", () => {
      it("should handle two Aces (one as 11, one as 1)", () => {
        // A + A = 22 with both as 11, convert one to 1 = 12
        const cards = [createCard("A"), createCard("A")];
        expect(calculateHandValue(cards)).toBe(12);
      });

      it("should handle three Aces", () => {
        // A + A + A = 33 with all as 11, convert two to 1 = 13
        const cards = [createCard("A"), createCard("A"), createCard("A")];
        expect(calculateHandValue(cards)).toBe(13);
      });

      it("should handle two Aces with other cards", () => {
        // A + A + 8 = 30 with both A as 11, convert both = 20
        const cards = [createCard("A"), createCard("A"), createCard("8")];
        expect(calculateHandValue(cards)).toBe(20);
      });

      it("should handle four Aces", () => {
        // 4 Aces = 44 with all as 11, convert 3 to 1 = 14
        const cards = [
          createCard("A"),
          createCard("A"),
          createCard("A"),
          createCard("A"),
        ];
        expect(calculateHandValue(cards)).toBe(14);
      });
    });

    describe("bust scenarios", () => {
      it("should return value over 21 when busted (no Aces)", () => {
        const cards = [createCard("10"), createCard("8"), createCard("5")];
        expect(calculateHandValue(cards)).toBe(23);
      });

      it("should correctly calculate bust even with converted Ace", () => {
        // A + 6 + 9 + 8 = 34 with A as 11, convert to 1 = 24 (still bust)
        const cards = [
          createCard("A"),
          createCard("6"),
          createCard("9"),
          createCard("8"),
        ];
        expect(calculateHandValue(cards)).toBe(24);
      });
    });

    describe("edge cases", () => {
      it("should handle empty hand", () => {
        expect(calculateHandValue([])).toBe(0);
      });

      it("should handle single card", () => {
        expect(calculateHandValue([createCard("7")])).toBe(7);
        expect(calculateHandValue([createCard("A")])).toBe(11);
      });

      it("should calculate exactly 21 correctly", () => {
        const cards = [createCard("7"), createCard("7"), createCard("7")];
        expect(calculateHandValue(cards)).toBe(21);
      });
    });
  });

  // ============================================
  // BLACKJACK DETECTION TESTS (Section 1)
  // Blackjack = Ace + 10-value card in exactly 2 cards
  // ============================================
  describe("isBlackjack", () => {
    it("should detect Ace + King as blackjack", () => {
      const cards = [createCard("A"), createCard("K")];
      expect(isBlackjack(cards)).toBe(true);
    });

    it("should detect Ace + Queen as blackjack", () => {
      const cards = [createCard("A"), createCard("Q")];
      expect(isBlackjack(cards)).toBe(true);
    });

    it("should detect Ace + Jack as blackjack", () => {
      const cards = [createCard("A"), createCard("J")];
      expect(isBlackjack(cards)).toBe(true);
    });

    it("should detect Ace + 10 as blackjack", () => {
      const cards = [createCard("A"), createCard("10")];
      expect(isBlackjack(cards)).toBe(true);
    });

    it("should detect blackjack regardless of card order", () => {
      const cards = [createCard("K"), createCard("A")];
      expect(isBlackjack(cards)).toBe(true);
    });

    it("should NOT detect 21 with more than 2 cards as blackjack", () => {
      const cards = [createCard("7"), createCard("7"), createCard("7")];
      expect(isBlackjack(cards)).toBe(false);
    });

    it("should NOT detect Ace + 9 as blackjack", () => {
      const cards = [createCard("A"), createCard("9")];
      expect(isBlackjack(cards)).toBe(false);
    });

    it("should NOT detect two 10s as blackjack", () => {
      const cards = [createCard("K"), createCard("Q")];
      expect(isBlackjack(cards)).toBe(false);
    });

    it("should NOT detect two Aces as blackjack", () => {
      const cards = [createCard("A"), createCard("A")];
      expect(isBlackjack(cards)).toBe(false);
    });

    it("should NOT detect single card as blackjack", () => {
      expect(isBlackjack([createCard("A")])).toBe(false);
    });

    it("should NOT detect empty hand as blackjack", () => {
      expect(isBlackjack([])).toBe(false);
    });
  });

  // ============================================
  // BUST DETECTION TESTS (Section 1)
  // ============================================
  describe("isBusted", () => {
    it("should detect bust when over 21", () => {
      const cards = [createCard("10"), createCard("8"), createCard("5")];
      expect(isBusted(cards)).toBe(true);
    });

    it("should NOT detect bust at exactly 21", () => {
      const cards = [createCard("10"), createCard("J"), createCard("A")];
      // 10 + 10 + 11 = 31, convert A to 1 = 21
      expect(isBusted(cards)).toBe(false);
    });

    it("should NOT detect bust under 21", () => {
      const cards = [createCard("10"), createCard("8")];
      expect(isBusted(cards)).toBe(false);
    });

    it("should handle soft hands correctly", () => {
      const cards = [createCard("A"), createCard("8")];
      expect(isBusted(cards)).toBe(false);
    });
  });

  // ============================================
  // SOFT HAND DETECTION TESTS
  // A soft hand has an Ace counted as 11
  // ============================================
  describe("isSoftHand", () => {
    it("should detect soft hand with Ace + low card", () => {
      const cards = [createCard("A"), createCard("6")];
      expect(isSoftHand(cards)).toBe(true);
    });

    it("should detect soft hand with Ace + 10 (blackjack)", () => {
      const cards = [createCard("A"), createCard("K")];
      expect(isSoftHand(cards)).toBe(true);
    });

    it("should NOT detect soft hand when Ace must be 1", () => {
      // A + 6 + 8 = 25 with A as 11, must convert to 1 = 15 (hard)
      const cards = [createCard("A"), createCard("6"), createCard("8")];
      expect(isSoftHand(cards)).toBe(false);
    });

    it("should detect soft hand when total <= 21 with Ace as 11", () => {
      // A + 5 + 5 = 21 (soft 21)
      const cards = [createCard("A"), createCard("5"), createCard("5")];
      expect(isSoftHand(cards)).toBe(true);
    });

    it("should NOT detect soft hand without Ace", () => {
      const cards = [createCard("10"), createCard("7")];
      expect(isSoftHand(cards)).toBe(false);
    });

    it("should handle two Aces correctly", () => {
      // A + A = 12 (one as 11, one as 1) - this IS soft
      const cards = [createCard("A"), createCard("A")];
      expect(isSoftHand(cards)).toBe(true);
    });
  });

  // ============================================
  // SPLIT TESTS (Section 1 - pair splitting)
  // Can split when two cards have same rank
  // ============================================
  describe("canSplit", () => {
    it("should allow split with matching ranks", () => {
      const cards = [createCard("8"), createCard("8")];
      expect(canSplit(cards)).toBe(true);
    });

    it("should allow split with pair of Aces", () => {
      const cards = [createCard("A"), createCard("A")];
      expect(canSplit(cards)).toBe(true);
    });

    it("should allow split with face cards of same rank", () => {
      const cards = [createCard("K"), createCard("K")];
      expect(canSplit(cards)).toBe(true);
    });

    it("should NOT allow split with different ranks", () => {
      const cards = [createCard("8"), createCard("9")];
      expect(canSplit(cards)).toBe(false);
    });

    it("should NOT allow split with different face cards (K vs Q)", () => {
      // Even though both are worth 10, they have different ranks
      const cards = [createCard("K"), createCard("Q")];
      expect(canSplit(cards)).toBe(false);
    });

    it("should NOT allow split with more than 2 cards", () => {
      const cards = [createCard("8"), createCard("8"), createCard("5")];
      expect(canSplit(cards)).toBe(false);
    });

    it("should NOT allow split with single card", () => {
      expect(canSplit([createCard("8")])).toBe(false);
    });

    it("should NOT allow split with empty hand", () => {
      expect(canSplit([])).toBe(false);
    });

    it("should respect maxResplits limit", () => {
      const cards = [createCard("8"), createCard("8")];
      // Already split 4 times, maxResplits is 3 (allowing 4 total hands)
      expect(canSplit(cards, 3, 4)).toBe(false);
    });

    it("should allow split when under maxResplits", () => {
      const cards = [createCard("8"), createCard("8")];
      expect(canSplit(cards, 3, 2)).toBe(true);
    });

    it("should NOT allow resplit Aces when resplitAces is false", () => {
      const cards = [createCard("A"), createCard("A")];
      // Already split once (currentSplitCount = 1), resplitAces = false
      expect(canSplit(cards, 3, 1, false)).toBe(false);
    });

    it("should allow resplit Aces when resplitAces is true", () => {
      const cards = [createCard("A"), createCard("A")];
      expect(canSplit(cards, 3, 1, true)).toBe(true);
    });
  });

  // ============================================
  // DOUBLE DOWN TESTS (Section 1)
  // ============================================
  describe("canDouble", () => {
    it("should allow double with 2 cards and enough chips", () => {
      const cards = [createCard("5"), createCard("6")];
      expect(canDouble(cards, 100, 50)).toBe(true);
    });

    it("should allow double with exactly enough chips", () => {
      const cards = [createCard("5"), createCard("6")];
      expect(canDouble(cards, 50, 50)).toBe(true);
    });

    it("should NOT allow double without enough chips", () => {
      const cards = [createCard("5"), createCard("6")];
      expect(canDouble(cards, 40, 50)).toBe(false);
    });

    it("should NOT allow double with more than 2 cards", () => {
      const cards = [createCard("3"), createCard("4"), createCard("4")];
      expect(canDouble(cards, 100, 50)).toBe(false);
    });

    it("should NOT allow double with single card", () => {
      expect(canDouble([createCard("5")], 100, 50)).toBe(false);
    });

    it("should allow double on any two cards", () => {
      // Should be able to double on any total
      expect(canDouble([createCard("A"), createCard("A")], 100, 50)).toBe(true);
      expect(canDouble([createCard("10"), createCard("10")], 100, 50)).toBe(
        true,
      );
    });
  });
});
