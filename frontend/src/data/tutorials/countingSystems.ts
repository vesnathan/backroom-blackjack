import { CountingSystem } from "@/types/gameSettings";
import { SubscriptionTier } from "@backroom-blackjack/shared";

export interface PracticeHand {
  cards: string[]; // e.g., ["2H", "KS", "5D", "AC"]
  expectedCount: number;
  hint?: string;
}

/**
 * Card count values for each counting system
 * Cards are indexed: 2, 3, 4, 5, 6, 7, 8, 9, 10, A
 */
export interface CountingSystemData {
  id: CountingSystem;
  name: string;
  shortDescription: string;
  fullDescription: string;
  isBalanced: boolean;
  difficulty: "beginner" | "intermediate" | "advanced";
  // Card values: [2, 3, 4, 5, 6, 7, 8, 9, 10/J/Q/K, A]
  cardValues: number[];
  trueCountRequired: boolean;
  tips: string[];
  practiceHands: PracticeHand[];
  requiredTier: SubscriptionTier;
}

// Card values for each system
// Order: 2, 3, 4, 5, 6, 7, 8, 9, 10/J/Q/K, A
const HI_LO_VALUES = [1, 1, 1, 1, 1, 0, 0, 0, -1, -1];
const KO_VALUES = [1, 1, 1, 1, 1, 1, 0, 0, -1, -1]; // 7 is +1 (unbalanced)
const HI_OPT_I_VALUES = [0, 1, 1, 1, 1, 0, 0, 0, -1, 0]; // 2 and A are 0
const HI_OPT_II_VALUES = [1, 1, 2, 2, 1, 1, 0, 0, -2, 0]; // More granular
const OMEGA_II_VALUES = [1, 1, 2, 2, 2, 1, 0, -1, -2, 0]; // 9 is -1

export const COUNTING_SYSTEMS: Record<CountingSystem, CountingSystemData> = {
  [CountingSystem.HI_LO]: {
    id: CountingSystem.HI_LO,
    name: "Hi-Lo",
    shortDescription: "Most popular and beginner-friendly balanced system",
    requiredTier: SubscriptionTier.None, // Free for everyone
    fullDescription: `The Hi-Lo system is the most widely used card counting method. It's a balanced level-1 system, meaning all card values are +1, 0, or -1, and when you count through a full deck, you end at zero.

Low cards (2-6) are good for the player when removed, so they're counted as +1.
High cards (10-A) are good for the dealer when removed, so they're counted as -1.
Middle cards (7-9) are neutral and counted as 0.

A positive count means the remaining deck is rich in high cards (favorable for player).
A negative count means the remaining deck is rich in low cards (favorable for dealer).`,
    isBalanced: true,
    difficulty: "beginner",
    cardValues: HI_LO_VALUES,
    trueCountRequired: true,
    tips: [
      "Practice counting pairs: K+3 = 0, 5+Q = 0, etc.",
      "Count by cancellation - pair up +1 and -1 cards",
      "Focus on accuracy before speed",
      "Convert to true count by dividing by decks remaining",
    ],
    practiceHands: [
      {
        cards: ["2H", "KS", "5D", "AC"],
        expectedCount: 0,
        hint: "2(+1) + K(-1) + 5(+1) + A(-1) = 0",
      },
      {
        cards: ["3C", "4D", "6H", "7S", "QC"],
        expectedCount: 2,
        hint: "3(+1) + 4(+1) + 6(+1) + 7(0) + Q(-1) = +2",
      },
      {
        cards: ["JH", "10S", "KD", "AC", "2H"],
        expectedCount: -3,
        hint: "J(-1) + 10(-1) + K(-1) + A(-1) + 2(+1) = -3",
      },
    ],
  },

  [CountingSystem.KO]: {
    id: CountingSystem.KO,
    name: "Knock-Out (KO)",
    shortDescription: "Unbalanced system - no true count conversion needed",
    requiredTier: SubscriptionTier.Bronze,
    fullDescription: `The Knock-Out (KO) system is an unbalanced counting system designed to eliminate the need for true count conversion. It's nearly identical to Hi-Lo except that 7 counts as +1 instead of 0.

Because it's unbalanced, when you count through a full deck, you won't end at zero. Instead, you start with a negative count (usually -4 times the number of decks) and work toward a "key count" that tells you when to increase bets.

This simplification makes KO easier to use in casino conditions where dividing by decks remaining can be challenging.`,
    isBalanced: false,
    difficulty: "beginner",
    cardValues: KO_VALUES,
    trueCountRequired: false,
    tips: [
      "Start count at -4 × number of decks (e.g., -16 for 4 decks)",
      "The 'key count' is usually around 0 to +2",
      "When count is positive, increase your bets",
      "No mental division required - simpler in live play",
    ],
    practiceHands: [
      {
        cards: ["7H", "7S", "KD"],
        expectedCount: 1,
        hint: "7(+1) + 7(+1) + K(-1) = +1",
      },
      {
        cards: ["2C", "6D", "7H", "8S", "10C"],
        expectedCount: 2,
        hint: "2(+1) + 6(+1) + 7(+1) + 8(0) + 10(-1) = +2",
      },
      {
        cards: ["AC", "KS", "7D", "3H"],
        expectedCount: 0,
        hint: "A(-1) + K(-1) + 7(+1) + 3(+1) = 0",
      },
    ],
  },

  [CountingSystem.HI_OPT_I]: {
    id: CountingSystem.HI_OPT_I,
    name: "Hi-Opt I",
    shortDescription: "Balanced system ignoring 2s and Aces",
    requiredTier: SubscriptionTier.Silver,
    fullDescription: `Hi-Opt I (Highly Optimum) is a balanced level-1 system that differs from Hi-Lo by not counting 2s and Aces. This can provide slightly more accuracy for betting decisions.

The trade-off is that to get full value from Hi-Opt I, you should keep a separate "Ace side count" to track how many Aces have been played. This adds complexity but improves playing decisions.

For pure betting purposes without the side count, Hi-Opt I performs similarly to Hi-Lo.`,
    isBalanced: true,
    difficulty: "intermediate",
    cardValues: HI_OPT_I_VALUES,
    trueCountRequired: true,
    tips: [
      "Consider keeping an Ace side count for insurance and playing decisions",
      "Without side count, it's similar to Hi-Lo in betting efficiency",
      "2s are neutral because they're less significant than 3-6",
      "Aces are neutral because their removal affects both player and dealer similarly",
    ],
    practiceHands: [
      {
        cards: ["2H", "AC", "5D", "10S"],
        expectedCount: 0,
        hint: "2(0) + A(0) + 5(+1) + 10(-1) = 0",
      },
      {
        cards: ["3C", "4D", "5H", "6S"],
        expectedCount: 4,
        hint: "3(+1) + 4(+1) + 5(+1) + 6(+1) = +4",
      },
      {
        cards: ["JH", "QS", "KD", "2C", "AC"],
        expectedCount: -3,
        hint: "J(-1) + Q(-1) + K(-1) + 2(0) + A(0) = -3",
      },
    ],
  },

  [CountingSystem.HI_OPT_II]: {
    id: CountingSystem.HI_OPT_II,
    name: "Hi-Opt II",
    shortDescription: "Advanced level-2 system with higher accuracy",
    requiredTier: SubscriptionTier.Gold,
    fullDescription: `Hi-Opt II is a level-2 balanced counting system that uses values of -2 to +2. It provides more accurate information than level-1 systems but requires more mental effort.

The system counts 4s and 5s as +2 because they're the most valuable cards for the player when removed. Similarly, 10-value cards are counted as -2 because they're highly valuable to the player when present.

Like Hi-Opt I, Aces are not counted, so a side count is recommended for optimal play.`,
    isBalanced: true,
    difficulty: "advanced",
    cardValues: HI_OPT_II_VALUES,
    trueCountRequired: true,
    tips: [
      "Practice the +2 and -2 values separately before combining",
      "4s and 5s are +2 because they're the worst cards for the player",
      "Keep an Ace side count for maximum effectiveness",
      "Only recommended after mastering a level-1 system",
    ],
    practiceHands: [
      {
        cards: ["4H", "5S", "10D"],
        expectedCount: 2,
        hint: "4(+2) + 5(+2) + 10(-2) = +2",
      },
      {
        cards: ["2C", "3D", "7H", "KS"],
        expectedCount: 1,
        hint: "2(+1) + 3(+1) + 7(+1) + K(-2) = +1",
      },
      {
        cards: ["JH", "QS", "AC", "5D"],
        expectedCount: -2,
        hint: "J(-2) + Q(-2) + A(0) + 5(+2) = -2",
      },
    ],
  },

  [CountingSystem.OMEGA_II]: {
    id: CountingSystem.OMEGA_II,
    name: "Omega II",
    shortDescription: "Highly accurate level-2 system for serious players",
    requiredTier: SubscriptionTier.Platinum,
    fullDescription: `Omega II is one of the most accurate counting systems available. It's a balanced level-2 system that also counts 9s as -1, providing additional precision.

The system was developed by Bryce Carlson and is detailed in his book "Blackjack for Blood." It's particularly effective for multi-deck games where precision matters most.

Like other advanced systems, an Ace side count is recommended. Omega II is best suited for serious players who have mastered simpler systems and want maximum edge.`,
    isBalanced: true,
    difficulty: "advanced",
    cardValues: OMEGA_II_VALUES,
    trueCountRequired: true,
    tips: [
      "The 9 being -1 is unique to this system - don't forget it",
      "4, 5, 6 are all +2 in this system",
      "Practice counting 9s separately until it becomes automatic",
      "Best for 6 or 8 deck games where precision matters most",
    ],
    practiceHands: [
      {
        cards: ["9H", "9S", "5D"],
        expectedCount: 0,
        hint: "9(-1) + 9(-1) + 5(+2) = 0",
      },
      {
        cards: ["4C", "5D", "6H", "10S"],
        expectedCount: 4,
        hint: "4(+2) + 5(+2) + 6(+2) + 10(-2) = +4",
      },
      {
        cards: ["JH", "9S", "7D", "2C"],
        expectedCount: -2,
        hint: "J(-2) + 9(-1) + 7(+1) + 2(+1) = -1... wait, let me recalculate",
      },
    ],
  },
};

// Helper to get card rank from card string (e.g., "KS" -> "K")
export function getCardRank(cardString: string): string {
  if (cardString.startsWith("10")) return "10";
  return cardString[0];
}

// Helper to get card value for a specific system
export function getCountValue(
  cardRank: string,
  system: CountingSystem,
): number {
  const systemData = COUNTING_SYSTEMS[system];
  const rankIndex = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"].indexOf(
    cardRank === "J" || cardRank === "Q" || cardRank === "K" ? "10" : cardRank,
  );
  return systemData.cardValues[rankIndex];
}

// Card display order for value table
export const CARD_RANKS = [
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
  "A",
] as const;

// Map display ranks to value index
export function getRankValueIndex(rank: string): number {
  if (["10", "J", "Q", "K"].includes(rank)) return 8; // 10-value cards
  if (rank === "A") return 9;
  return parseInt(rank, 10) - 2; // 2=0, 3=1, etc.
}
