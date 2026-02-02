import { describe, it, expect } from "vitest";
import { Card, Hand, Rank, Suit } from "@/types/game";
import {
  shouldDealerHit,
  determineHandResult,
  calculatePayout,
  shouldPeekForBlackjack,
  getDealerHandDescription,
  DealerRules,
} from "./dealer";

// Helper to create a card
function createCard(rank: Rank, suit?: Suit, value?: number, count = 0): Card {
  const cardSuit = suit ?? "H";
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

// Helper to create a hand
function createHand(cards: Card[], bet = 10): Hand {
  return { cards, bet };
}

describe("dealer.ts", () => {
  // ============================================
  // DEALER HIT/STAND RULES TESTS (Section 3)
  // ============================================
  describe("shouldDealerHit", () => {
    const H17_RULES: DealerRules = {
      hitSoft17: true,
      peekForBlackjack: true,
    };

    const S17_RULES: DealerRules = {
      hitSoft17: false,
      peekForBlackjack: true,
    };

    describe("basic dealer rules", () => {
      it("should hit on 16 or less", () => {
        const hand16 = createHand([createCard("10"), createCard("6")]);
        const hand12 = createHand([createCard("5"), createCard("7")]);
        const hand4 = createHand([createCard("2"), createCard("2")]);

        expect(shouldDealerHit(hand16, H17_RULES)).toBe(true);
        expect(shouldDealerHit(hand12, H17_RULES)).toBe(true);
        expect(shouldDealerHit(hand4, H17_RULES)).toBe(true);
      });

      it("should stand on hard 17", () => {
        const hand = createHand([createCard("10"), createCard("7")]);
        expect(shouldDealerHit(hand, H17_RULES)).toBe(false);
        expect(shouldDealerHit(hand, S17_RULES)).toBe(false);
      });

      it("should stand on 18 or higher", () => {
        const hand18 = createHand([createCard("10"), createCard("8")]);
        const hand19 = createHand([createCard("10"), createCard("9")]);
        const hand20 = createHand([createCard("10"), createCard("10")]);
        const hand21 = createHand([createCard("A"), createCard("K")]);

        expect(shouldDealerHit(hand18, H17_RULES)).toBe(false);
        expect(shouldDealerHit(hand19, H17_RULES)).toBe(false);
        expect(shouldDealerHit(hand20, H17_RULES)).toBe(false);
        expect(shouldDealerHit(hand21, H17_RULES)).toBe(false);
      });
    });

    describe("soft 17 rule (H17 vs S17)", () => {
      it("should hit soft 17 with H17 rules", () => {
        // Ace + 6 = soft 17
        const hand = createHand([createCard("A"), createCard("6")]);
        expect(shouldDealerHit(hand, H17_RULES)).toBe(true);
      });

      it("should stand on soft 17 with S17 rules", () => {
        const hand = createHand([createCard("A"), createCard("6")]);
        expect(shouldDealerHit(hand, S17_RULES)).toBe(false);
      });

      it("should stand on soft 18 regardless of rules", () => {
        const hand = createHand([createCard("A"), createCard("7")]);
        expect(shouldDealerHit(hand, H17_RULES)).toBe(false);
        expect(shouldDealerHit(hand, S17_RULES)).toBe(false);
      });

      it("should correctly identify soft 17 with multiple cards", () => {
        // A + 3 + 3 = soft 17 (Ace counted as 11)
        const hand = createHand([
          createCard("A"),
          createCard("3"),
          createCard("3"),
        ]);
        expect(shouldDealerHit(hand, H17_RULES)).toBe(true);
      });
    });
  });

  // ============================================
  // HAND RESULT DETERMINATION TESTS (Section 1, 4)
  // ============================================
  describe("determineHandResult", () => {
    describe("player bust", () => {
      it("should return BUST when player busts", () => {
        const playerHand = createHand([
          createCard("10"),
          createCard("8"),
          createCard("5"),
        ]);
        const dealerHand = createHand([createCard("10"), createCard("7")]);

        expect(determineHandResult(playerHand, dealerHand)).toBe("BUST");
      });

      it("should return BUST even if dealer also would bust", () => {
        const playerHand = createHand([
          createCard("10"),
          createCard("8"),
          createCard("5"),
        ]);
        const dealerHand = createHand([
          createCard("10"),
          createCard("7"),
          createCard("6"),
        ]);

        // Player busts first, loses regardless of dealer
        expect(determineHandResult(playerHand, dealerHand)).toBe("BUST");
      });
    });

    describe("blackjack scenarios", () => {
      it("should return BLACKJACK when player has blackjack and dealer does not", () => {
        const playerHand = createHand([createCard("A"), createCard("K")]);
        const dealerHand = createHand([createCard("10"), createCard("7")]);

        expect(determineHandResult(playerHand, dealerHand)).toBe("BLACKJACK");
      });

      it("should return PUSH when both have blackjack", () => {
        const playerHand = createHand([createCard("A"), createCard("K")]);
        const dealerHand = createHand([createCard("A"), createCard("Q")]);

        expect(determineHandResult(playerHand, dealerHand)).toBe("PUSH");
      });

      it("should return LOSE when dealer has blackjack and player does not", () => {
        const playerHand = createHand([createCard("10"), createCard("10")]);
        const dealerHand = createHand([createCard("A"), createCard("J")]);

        expect(determineHandResult(playerHand, dealerHand)).toBe("LOSE");
      });

      it("should return LOSE when dealer has blackjack and player has 21 (not blackjack)", () => {
        // Player has 21 with 3 cards, dealer has natural blackjack
        const playerHand = createHand([
          createCard("7"),
          createCard("7"),
          createCard("7"),
        ]);
        const dealerHand = createHand([createCard("A"), createCard("K")]);

        expect(determineHandResult(playerHand, dealerHand)).toBe("LOSE");
      });
    });

    describe("dealer bust", () => {
      it("should return WIN when dealer busts and player does not", () => {
        const playerHand = createHand([createCard("10"), createCard("8")]);
        const dealerHand = createHand([
          createCard("10"),
          createCard("6"),
          createCard("8"),
        ]);

        expect(determineHandResult(playerHand, dealerHand)).toBe("WIN");
      });
    });

    describe("value comparison", () => {
      it("should return WIN when player has higher value", () => {
        const playerHand = createHand([createCard("10"), createCard("9")]);
        const dealerHand = createHand([createCard("10"), createCard("7")]);

        expect(determineHandResult(playerHand, dealerHand)).toBe("WIN");
      });

      it("should return LOSE when dealer has higher value", () => {
        const playerHand = createHand([createCard("10"), createCard("7")]);
        const dealerHand = createHand([createCard("10"), createCard("9")]);

        expect(determineHandResult(playerHand, dealerHand)).toBe("LOSE");
      });

      it("should return PUSH when values are equal", () => {
        const playerHand = createHand([createCard("10"), createCard("8")]);
        const dealerHand = createHand([createCard("9"), createCard("9")]);

        expect(determineHandResult(playerHand, dealerHand)).toBe("PUSH");
      });

      it("should return PUSH when both have 21 (non-blackjack)", () => {
        const playerHand = createHand([
          createCard("7"),
          createCard("7"),
          createCard("7"),
        ]);
        const dealerHand = createHand([
          createCard("5"),
          createCard("6"),
          createCard("10"),
        ]);

        expect(determineHandResult(playerHand, dealerHand)).toBe("PUSH");
      });
    });
  });

  // ============================================
  // PAYOUT CALCULATION TESTS (Section 4)
  // ============================================
  describe("calculatePayout", () => {
    describe("blackjack payout (3:2)", () => {
      it("should pay 2.5x bet for blackjack at 3:2", () => {
        const hand = createHand([createCard("A"), createCard("K")], 100);
        // 3:2 = 1.5x multiplier, so $100 bet wins $150, returns $250 total
        expect(calculatePayout(hand, "BLACKJACK", 1.5)).toBe(250);
      });

      it("should floor fractional payouts", () => {
        // $10 bet at 3:2 blackjack = $10 + $15 = $25
        const hand = createHand([createCard("A"), createCard("K")], 10);
        expect(calculatePayout(hand, "BLACKJACK", 1.5)).toBe(25);

        // $15 bet at 3:2 blackjack = $15 + $22.5 = $37.5, floored to $37
        const hand2 = createHand([createCard("A"), createCard("K")], 15);
        expect(calculatePayout(hand2, "BLACKJACK", 1.5)).toBe(37);
      });
    });

    describe("blackjack payout (6:5)", () => {
      it("should pay 2.2x bet for blackjack at 6:5", () => {
        const hand = createHand([createCard("A"), createCard("K")], 100);
        // 6:5 = 1.2x multiplier, so $100 bet wins $120, returns $220 total
        expect(calculatePayout(hand, "BLACKJACK", 1.2)).toBe(220);
      });

      it("should demonstrate 6:5 is worse than 3:2", () => {
        const hand = createHand([createCard("A"), createCard("K")], 100);
        const payout_3_2 = calculatePayout(hand, "BLACKJACK", 1.5);
        const payout_6_5 = calculatePayout(hand, "BLACKJACK", 1.2);

        expect(payout_3_2).toBeGreaterThan(payout_6_5);
        expect(payout_3_2 - payout_6_5).toBe(30); // $30 difference on $100 bet
      });
    });

    describe("regular win payout", () => {
      it("should pay 2x bet for regular win (1:1)", () => {
        const hand = createHand([createCard("10"), createCard("9")], 100);
        expect(calculatePayout(hand, "WIN")).toBe(200);
      });

      it("should pay 2x bet for win after dealer bust", () => {
        const hand = createHand([createCard("10"), createCard("8")], 50);
        expect(calculatePayout(hand, "WIN")).toBe(100);
      });
    });

    describe("push payout", () => {
      it("should return original bet on push", () => {
        const hand = createHand([createCard("10"), createCard("8")], 100);
        expect(calculatePayout(hand, "PUSH")).toBe(100);
      });
    });

    describe("lose payout", () => {
      it("should return 0 on lose", () => {
        const hand = createHand([createCard("10"), createCard("7")], 100);
        expect(calculatePayout(hand, "LOSE")).toBe(0);
      });

      it("should return 0 on bust", () => {
        const hand = createHand(
          [createCard("10"), createCard("8"), createCard("5")],
          100,
        );
        expect(calculatePayout(hand, "BUST")).toBe(0);
      });

      it("should return 0 on surrender (refund handled elsewhere)", () => {
        const hand = createHand([createCard("10"), createCard("6")], 100);
        expect(calculatePayout(hand, "SURRENDER")).toBe(0);
      });
    });

    describe("edge cases", () => {
      it("should handle 0 bet", () => {
        const hand = createHand([createCard("A"), createCard("K")], 0);
        expect(calculatePayout(hand, "BLACKJACK", 1.5)).toBe(0);
        expect(calculatePayout(hand, "WIN")).toBe(0);
      });

      it("should use default 3:2 payout for blackjack", () => {
        const hand = createHand([createCard("A"), createCard("K")], 100);
        expect(calculatePayout(hand, "BLACKJACK")).toBe(250);
      });
    });
  });

  // ============================================
  // DEALER PEEK TESTS (Section 3)
  // ============================================
  describe("shouldPeekForBlackjack", () => {
    it("should peek when dealer shows Ace", () => {
      expect(shouldPeekForBlackjack("A")).toBe(true);
    });

    it("should peek when dealer shows 10", () => {
      expect(shouldPeekForBlackjack("10")).toBe(true);
    });

    it("should peek when dealer shows face cards", () => {
      expect(shouldPeekForBlackjack("J")).toBe(true);
      expect(shouldPeekForBlackjack("Q")).toBe(true);
      expect(shouldPeekForBlackjack("K")).toBe(true);
    });

    it("should NOT peek when dealer shows 2-9", () => {
      expect(shouldPeekForBlackjack("2")).toBe(false);
      expect(shouldPeekForBlackjack("3")).toBe(false);
      expect(shouldPeekForBlackjack("4")).toBe(false);
      expect(shouldPeekForBlackjack("5")).toBe(false);
      expect(shouldPeekForBlackjack("6")).toBe(false);
      expect(shouldPeekForBlackjack("7")).toBe(false);
      expect(shouldPeekForBlackjack("8")).toBe(false);
      expect(shouldPeekForBlackjack("9")).toBe(false);
    });
  });

  // ============================================
  // DEALER HAND DESCRIPTION TESTS (UI)
  // ============================================
  describe("getDealerHandDescription", () => {
    it("should show only up card when not revealed", () => {
      const hand = createHand([createCard("K"), createCard("7")]);
      expect(getDealerHandDescription(hand, false)).toBe("K + ?");
    });

    it("should show 'Blackjack!' for dealer blackjack", () => {
      const hand = createHand([createCard("A"), createCard("K")]);
      expect(getDealerHandDescription(hand, true)).toBe("Blackjack!");
    });

    it("should show 'Bust' with value for bust", () => {
      const hand = createHand([
        createCard("10"),
        createCard("8"),
        createCard("5"),
      ]);
      expect(getDealerHandDescription(hand, true)).toBe("Bust (23)");
    });

    it("should show 'Soft X' for soft hands", () => {
      const hand = createHand([createCard("A"), createCard("6")]);
      expect(getDealerHandDescription(hand, true)).toBe("Soft 17");
    });

    it("should show just value for hard hands", () => {
      const hand = createHand([createCard("10"), createCard("7")]);
      expect(getDealerHandDescription(hand, true)).toBe("17");
    });
  });
});
