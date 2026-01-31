import { useEffect, useCallback, useRef } from "react";

import { debugLog } from "@/utils/debug";

import { useBadgeChecker, BadgeCheckStats } from "./useBadgeChecker";
import { SessionStats } from "./usePlayerHand";

interface UseBadgeIntegrationParams {
  sessionStats: SessionStats;
  longestStreak: number;
  peakChips: number;
  currentChips: number;
  perfectShoes: number;
  earnedBadgeIds: string[];
  setEarnedBadgeIds: React.Dispatch<React.SetStateAction<string[]>>;
  // Milestone flags - these should be tracked in game state
  hasUsedCountingSystem?: boolean;
  // Callback when a new badge is earned (for animations)
  onBadgeEarned?: (badgeId: string) => void;
  // Loading state - don't check badges until loaded from backend
  badgesLoading?: boolean;
}

/**
 * Hook to integrate badge checking into the game flow.
 * Watches relevant game state and awards badges when conditions are met.
 */
export function useBadgeIntegration({
  sessionStats,
  longestStreak,
  peakChips,
  currentChips,
  perfectShoes,
  earnedBadgeIds,
  setEarnedBadgeIds,
  hasUsedCountingSystem = false,
  onBadgeEarned,
  badgesLoading = false,
}: UseBadgeIntegrationParams) {
  const { checkBadges } = useBadgeChecker();
  const prevStatsRef = useRef<BadgeCheckStats | null>(null);

  // Derive milestone flags from stats
  const hasWonHand = sessionStats.handsWon > 0;
  const hasGotBlackjack = sessionStats.blackjacks > 0;

  // Build current stats for badge checking
  const buildStats = useCallback((): BadgeCheckStats => {
    return {
      totalHandsPlayed: sessionStats.handsPlayed,
      totalHandsWon: sessionStats.handsWon,
      totalBlackjacks: sessionStats.blackjacks,
      currentStreak: 0, // Current streak resets, we track longestStreak
      longestStreak,
      peakChips,
      currentChips,
      perfectShoes,
      // Milestone flags
      hasWonHand,
      hasGotBlackjack,
      hasWonSplit: false, // TODO: track this
      hasWonDoubleDown: false, // TODO: track this
      hasSurvivedPitBossWarning: false, // TODO: track this
      hasWonWithInsurance: false, // TODO: track this
      hasUsedCountingSystem,
      hasComebackFromUnder100: false, // TODO: track this
      hasBustedDealer10Times: false, // TODO: track this
    };
  }, [
    sessionStats,
    longestStreak,
    peakChips,
    currentChips,
    perfectShoes,
    hasWonHand,
    hasGotBlackjack,
    hasUsedCountingSystem,
  ]);

  // Check for new badges when stats change
  useEffect(() => {
    // Don't check badges until they've been loaded from backend
    if (badgesLoading) {
      return;
    }

    const currentStats = buildStats();

    // Only check if stats have actually changed
    const prevStats = prevStatsRef.current;
    if (
      prevStats &&
      prevStats.totalHandsPlayed === currentStats.totalHandsPlayed &&
      prevStats.longestStreak === currentStats.longestStreak &&
      prevStats.peakChips === currentStats.peakChips &&
      prevStats.perfectShoes === currentStats.perfectShoes
    ) {
      return;
    }

    prevStatsRef.current = currentStats;

    // Check for newly earned badges
    const newBadges = checkBadges(currentStats, earnedBadgeIds);

    if (newBadges.length > 0) {
      setEarnedBadgeIds((prev) => [...prev, ...newBadges]);
      debugLog("badges", `New badges earned: ${newBadges.join(", ")}`);

      // Trigger badge earned animation for each new badge (with staggered delay)
      newBadges.forEach((badgeId, index) => {
        setTimeout(() => {
          onBadgeEarned?.(badgeId);
        }, index * 2500); // Stagger by 2.5 seconds to allow animation to complete
      });
    }
  }, [
    badgesLoading,
    buildStats,
    checkBadges,
    earnedBadgeIds,
    setEarnedBadgeIds,
    onBadgeEarned,
  ]);

  return {
    // Could return a function to manually check badges or trigger animations
  };
}
