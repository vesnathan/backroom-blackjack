import { useState, useCallback, useEffect } from "react";
import { PlayerHand } from "@/types/gameState";
import { HandResult } from "@/types/game";
import { calculateStreakPoints } from "@/utils/scoreCalculation";

/**
 * Session statistics tracking
 */
export interface SessionStats {
  handsPlayed: number;
  handsWon: number;
  handsLost: number;
  pushes: number;
  blackjacks: number;
  startingChips: number;
}

/**
 * Custom hook for managing player hand, chips, betting, and scoring state
 *
 * @returns Player state and scoring functions
 */
export function usePlayerHand() {
  // Chip and betting state
  const [playerChips, setPlayerChips] = useState(1000);
  const [playerHand, setPlayerHand] = useState<PlayerHand>({
    cards: [],
    bet: 0,
  });
  const [currentBet, setCurrentBet] = useState(0); // Temporary bet being placed
  const [previousBet, setPreviousBet] = useState(10); // Track previous bet for bet spread detection
  const [minBet] = useState(5);
  const [maxBet] = useState(500);

  // Scoring state
  const [currentScore, setCurrentScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0); // Consecutive correct decisions
  const [longestStreak, setLongestStreak] = useState(0);
  const [peakChips, setPeakChips] = useState(1000);
  const [scoreMultiplier, setScoreMultiplier] = useState(1.0); // 1.0x - 2.0x based on counting accuracy

  // Session statistics
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    handsPlayed: 0,
    handsWon: 0,
    handsLost: 0,
    pushes: 0,
    blackjacks: 0,
    startingChips: 1000,
  });

  /**
   * Award points for a correct decision and update streak
   * Uses exponential scoring: 10 * 2^(streak-1)
   */
  const awardCorrectDecisionPoints = useCallback(() => {
    const newStreak = currentStreak + 1;
    const basePoints = calculateStreakPoints(newStreak);
    const pointsWithMultiplier = Math.floor(basePoints * scoreMultiplier);

    setCurrentStreak(newStreak);
    setCurrentScore((prev) => prev + pointsWithMultiplier);

    // Update longest streak
    if (newStreak > longestStreak) {
      setLongestStreak(newStreak);
    }
  }, [currentStreak, scoreMultiplier, longestStreak]);

  /**
   * Reset streak on incorrect decision
   */
  const resetStreak = useCallback(() => {
    setCurrentStreak(0);
  }, []);

  /**
   * Reset player hand and betting state for new round
   */
  const resetHand = useCallback(() => {
    setPlayerHand({ cards: [], bet: 0 });
    setCurrentBet(0);
  }, []);

  /**
   * Record the result of a hand in session statistics
   */
  const recordHandResult = useCallback((result: HandResult) => {
    setSessionStats((prev) => {
      const newStats = { ...prev, handsPlayed: prev.handsPlayed + 1 };

      switch (result) {
        case "WIN":
          newStats.handsWon = prev.handsWon + 1;
          break;
        case "BLACKJACK":
          newStats.handsWon = prev.handsWon + 1;
          newStats.blackjacks = prev.blackjacks + 1;
          break;
        case "LOSE":
        case "BUST":
          newStats.handsLost = prev.handsLost + 1;
          break;
        case "PUSH":
          newStats.pushes = prev.pushes + 1;
          break;
        default:
          // No stat change for unknown result types
          break;
      }

      return newStats;
    });
  }, []);

  /**
   * Calculate derived session statistics
   */
  const getSessionNetProfit = useCallback(() => {
    return playerChips - sessionStats.startingChips;
  }, [playerChips, sessionStats.startingChips]);

  const getSessionWinRate = useCallback(() => {
    if (sessionStats.handsPlayed === 0) return 0;
    return (sessionStats.handsWon / sessionStats.handsPlayed) * 100;
  }, [sessionStats.handsWon, sessionStats.handsPlayed]);

  // Update peak chips whenever chips change
  useEffect(() => {
    if (playerChips > peakChips) {
      setPeakChips(playerChips);
    }
  }, [playerChips, peakChips]);

  return {
    // Chip and betting
    playerChips,
    setPlayerChips,
    playerHand,
    setPlayerHand,
    currentBet,
    setCurrentBet,
    previousBet,
    setPreviousBet,
    minBet,
    maxBet,

    // Scoring
    currentScore,
    setCurrentScore,
    currentStreak,
    setCurrentStreak,
    longestStreak,
    setLongestStreak,
    peakChips,
    setPeakChips,
    scoreMultiplier,
    setScoreMultiplier,

    // Session statistics
    sessionStats,
    recordHandResult,
    getSessionNetProfit,
    getSessionWinRate,

    // Functions
    awardCorrectDecisionPoints,
    resetStreak,
    resetHand,
  };
}
