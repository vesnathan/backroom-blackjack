import { useCallback } from "react";
import { ALL_BADGES, type Badge } from "@/data/badges";

export interface BadgeCheckStats {
  totalHandsPlayed: number;
  totalHandsWon: number;
  totalBlackjacks: number;
  currentStreak: number;
  longestStreak: number;
  peakChips: number;
  currentChips: number;
  perfectShoes: number;
  // Milestone flags
  hasWonHand: boolean;
  hasGotBlackjack: boolean;
  hasWonSplit: boolean;
  hasWonDoubleDown: boolean;
  hasSurvivedPitBossWarning: boolean;
  hasWonWithInsurance: boolean;
  hasUsedCountingSystem: boolean;
  hasComebackFromUnder100: boolean;
  hasBustedDealer10Times: boolean;
}

// Badge condition checkers by ID
// Using a lookup object instead of switch to stay under max-switch-cases limit
const BADGE_CONDITIONS: Record<string, (stats: BadgeCheckStats) => boolean> = {
  // Hands played (progressive)
  hands_100: (stats) => stats.totalHandsPlayed >= 100,
  hands_500: (stats) => stats.totalHandsPlayed >= 500,
  hands_1000: (stats) => stats.totalHandsPlayed >= 1000,
  hands_5000: (stats) => stats.totalHandsPlayed >= 5000,
  hands_10000: (stats) => stats.totalHandsPlayed >= 10000,

  // Streak (progressive)
  streak_5: (stats) => stats.longestStreak >= 5,
  streak_10: (stats) => stats.longestStreak >= 10,
  streak_20: (stats) => stats.longestStreak >= 20,
  streak_50: (stats) => stats.longestStreak >= 50,
  streak_100: (stats) => stats.longestStreak >= 100,

  // Blackjacks (progressive)
  blackjack_10: (stats) => stats.totalBlackjacks >= 10,
  blackjack_50: (stats) => stats.totalBlackjacks >= 50,
  blackjack_100: (stats) => stats.totalBlackjacks >= 100,
  blackjack_250: (stats) => stats.totalBlackjacks >= 250,
  blackjack_500: (stats) => stats.totalBlackjacks >= 500,

  // Chips (progressive)
  chips_5k: (stats) => stats.peakChips >= 5000,
  chips_25k: (stats) => stats.peakChips >= 25000,
  chips_50k: (stats) => stats.peakChips >= 50000,
  chips_100k: (stats) => stats.peakChips >= 100000,
  chips_250k: (stats) => stats.peakChips >= 250000,

  // Perfect shoes (progressive)
  perfect_1: (stats) => stats.perfectShoes >= 1,
  perfect_5: (stats) => stats.perfectShoes >= 5,
  perfect_10: (stats) => stats.perfectShoes >= 10,
  perfect_25: (stats) => stats.perfectShoes >= 25,

  // Milestones (one-off)
  first_blackjack: (stats) => stats.hasGotBlackjack,
  first_win: (stats) => stats.hasWonHand,
  first_split: (stats) => stats.hasWonSplit,
  first_double: (stats) => stats.hasWonDoubleDown,
  pit_boss_warning: (stats) => stats.hasSurvivedPitBossWarning,
  insurance_win: (stats) => stats.hasWonWithInsurance,
  card_counter: (stats) => stats.hasUsedCountingSystem,
  comeback_kid: (stats) => stats.hasComebackFromUnder100,
  bust_master: (stats) => stats.hasBustedDealer10Times,
};

/**
 * Check if a specific badge condition is met
 */
function checkBadgeCondition(badge: Badge, stats: BadgeCheckStats): boolean {
  const checker = BADGE_CONDITIONS[badge.id];
  return checker ? checker(stats) : false;
}

/**
 * Hook to check which badges should be earned based on current stats.
 * Returns a function that takes stats and returns newly earned badge IDs.
 */
export function useBadgeChecker() {
  const checkBadges = useCallback(
    (stats: BadgeCheckStats, alreadyEarnedIds: string[]): string[] => {
      return ALL_BADGES.filter(
        (badge) =>
          !alreadyEarnedIds.includes(badge.id) &&
          checkBadgeCondition(badge, stats),
      ).map((badge) => badge.id);
    },
    [],
  );

  return { checkBadges };
}
