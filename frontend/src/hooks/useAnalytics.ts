"use client";

import { useMemo } from "react";
import { HandRecord, DecisionRecord } from "@/types/gameState";

export interface ErrorPattern {
  pattern: string; // e.g., "12 vs 4 - Should STAND"
  count: number;
}

export interface AnalyticsData {
  // Decision Accuracy
  overallAccuracy: number;
  hitStandAccuracy: number;
  doubleAccuracy: number;
  splitAccuracy: number;

  // Total counts
  totalDecisions: number;
  correctDecisions: number;

  // Error Patterns
  mostCommonErrors: ErrorPattern[];

  // Betting Analysis
  avgBetAtPositiveCount: number;
  avgBetAtNegativeCount: number;
  betSpreadRatio: number;

  // Trend
  recentAccuracy: number; // Last 20 hands
  trend: "improving" | "declining" | "stable";

  // Session data
  handsAnalyzed: number;
}

const EMPTY_ANALYTICS: AnalyticsData = {
  overallAccuracy: 0,
  hitStandAccuracy: 0,
  doubleAccuracy: 0,
  splitAccuracy: 0,
  totalDecisions: 0,
  correctDecisions: 0,
  mostCommonErrors: [],
  avgBetAtPositiveCount: 0,
  avgBetAtNegativeCount: 0,
  betSpreadRatio: 0,
  recentAccuracy: 0,
  trend: "stable",
  handsAnalyzed: 0,
};

/**
 * Create error pattern key from a decision
 */
function getErrorPatternKey(decision: DecisionRecord): string {
  const handType = decision.isSoft ? "Soft " : "";
  return `${handType}${decision.playerTotal} vs ${decision.dealerUpcard} - Should ${decision.recommended}`;
}

/**
 * Calculate analytics from hand history
 */
export function useAnalytics(handHistory: HandRecord[]): AnalyticsData {
  return useMemo(() => {
    if (handHistory.length === 0) {
      return EMPTY_ANALYTICS;
    }

    // Flatten all decisions
    const allDecisions = handHistory.flatMap((hand) => hand.decisions);

    if (allDecisions.length === 0) {
      return { ...EMPTY_ANALYTICS, handsAnalyzed: handHistory.length };
    }

    // Calculate overall accuracy
    const correctDecisions = allDecisions.filter((d) => d.isCorrect).length;
    const overallAccuracy = (correctDecisions / allDecisions.length) * 100;

    // Calculate accuracy by action type
    const hitStandDecisions = allDecisions.filter(
      (d) => d.action === "HIT" || d.action === "STAND",
    );
    const hitStandCorrect = hitStandDecisions.filter((d) => d.isCorrect).length;
    const hitStandAccuracy =
      hitStandDecisions.length > 0
        ? (hitStandCorrect / hitStandDecisions.length) * 100
        : 0;

    const doubleDecisions = allDecisions.filter((d) => d.action === "DOUBLE");
    const doubleCorrect = doubleDecisions.filter((d) => d.isCorrect).length;
    const doubleAccuracy =
      doubleDecisions.length > 0
        ? (doubleCorrect / doubleDecisions.length) * 100
        : 0;

    const splitDecisions = allDecisions.filter((d) => d.action === "SPLIT");
    const splitCorrect = splitDecisions.filter((d) => d.isCorrect).length;
    const splitAccuracy =
      splitDecisions.length > 0
        ? (splitCorrect / splitDecisions.length) * 100
        : 0;

    // Calculate most common errors
    const errorDecisions = allDecisions.filter((d) => !d.isCorrect);
    const errorCounts = errorDecisions.reduce(
      (acc, error) => {
        const key = getErrorPatternKey(error);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostCommonErrors: ErrorPattern[] = Object.entries(errorCounts)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate betting analysis
    const positiveCountHands = handHistory.filter((h) => h.trueCount >= 1);
    const negativeCountHands = handHistory.filter((h) => h.trueCount <= 0);

    const avgBetAtPositiveCount =
      positiveCountHands.length > 0
        ? positiveCountHands.reduce((sum, h) => sum + h.betAmount, 0) /
          positiveCountHands.length
        : 0;

    const avgBetAtNegativeCount =
      negativeCountHands.length > 0
        ? negativeCountHands.reduce((sum, h) => sum + h.betAmount, 0) /
          negativeCountHands.length
        : 0;

    const betSpreadRatio =
      avgBetAtNegativeCount > 0
        ? avgBetAtPositiveCount / avgBetAtNegativeCount
        : avgBetAtPositiveCount > 0
          ? avgBetAtPositiveCount
          : 0;

    // Calculate trend (compare last 20 hands to overall)
    const recentHands = handHistory.slice(-20);
    const recentDecisions = recentHands.flatMap((h) => h.decisions);
    const recentCorrect = recentDecisions.filter((d) => d.isCorrect).length;
    const recentAccuracy =
      recentDecisions.length > 0
        ? (recentCorrect / recentDecisions.length) * 100
        : 0;

    let trend: "improving" | "declining" | "stable" = "stable";
    if (handHistory.length >= 20) {
      const diff = recentAccuracy - overallAccuracy;
      if (diff > 5) {
        trend = "improving";
      } else if (diff < -5) {
        trend = "declining";
      }
    }

    return {
      overallAccuracy,
      hitStandAccuracy,
      doubleAccuracy,
      splitAccuracy,
      totalDecisions: allDecisions.length,
      correctDecisions,
      mostCommonErrors,
      avgBetAtPositiveCount,
      avgBetAtNegativeCount,
      betSpreadRatio,
      recentAccuracy,
      trend,
      handsAnalyzed: handHistory.length,
    };
  }, [handHistory]);
}
