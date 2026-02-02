"use client";

import { useState, useCallback, useRef } from "react";
import { Card, StrategyAction } from "@/types/game";
import { GameSettings } from "@/types/gameSettings";
import { HandRecord, DecisionRecord, PlayerAction } from "@/types/gameState";
import { getBasicStrategyAction } from "@/lib/basicStrategy";
import { calculateHandValue, isSoftHand } from "@/lib/gameActions";

const MAX_HAND_HISTORY = 100;

/**
 * Convert StrategyAction to PlayerAction
 */
function strategyToPlayerAction(action: StrategyAction): PlayerAction {
  switch (action) {
    case "H":
      return "HIT";
    case "S":
      return "STAND";
    case "D":
      return "DOUBLE";
    case "SP":
      return "SPLIT";
    case "SU":
      return "HIT"; // Surrender falls back to HIT for analytics
    default:
      return "STAND";
  }
}

/**
 * Convert PlayerAction to StrategyAction for comparison
 */
function playerToStrategyAction(action: PlayerAction): StrategyAction {
  switch (action) {
    case "HIT":
      return "H";
    case "STAND":
      return "S";
    case "DOUBLE":
      return "D";
    case "SPLIT":
      return "SP";
    default:
      return "S";
  }
}

/**
 * Get card string representation (e.g., "AS" for Ace of Spades)
 */
function cardToString(card: Card): string {
  return `${card.rank}${card.suit.charAt(0).toUpperCase()}`;
}

/**
 * Get dealer upcard display string
 */
function getDealerUpcardString(card: Card): string {
  if (card.rank === "A") return "A";
  if (["J", "Q", "K"].includes(card.rank)) return "10";
  return card.rank;
}

export interface UseHandHistoryReturn {
  handHistory: HandRecord[];
  currentHandDecisions: DecisionRecord[];
  startNewHand: (
    playerCards: Card[],
    dealerUpCard: Card,
    runningCount: number,
    trueCount: number,
    betAmount: number,
  ) => void;
  recordDecision: (
    action: PlayerAction,
    playerCards: Card[],
    dealerUpCard: Card,
    settings: GameSettings,
    canSplit: boolean,
    canDouble: boolean,
  ) => void;
  completeHand: (result: HandRecord["result"], payout: number) => void;
  clearHistory: () => void;
}

export function useHandHistory(): UseHandHistoryReturn {
  const [handHistory, setHandHistory] = useState<HandRecord[]>([]);
  const [currentHandDecisions, setCurrentHandDecisions] = useState<
    DecisionRecord[]
  >([]);

  // Use ref to store current hand data to avoid stale closures
  const currentHandRef = useRef<{
    handId: number;
    timestamp: number;
    playerCards: string[];
    dealerUpcard: string;
    runningCount: number;
    trueCount: number;
    betAmount: number;
  } | null>(null);

  const handIdCounter = useRef(0);

  /**
   * Start tracking a new hand
   */
  const startNewHand = useCallback(
    (
      playerCards: Card[],
      dealerUpCard: Card,
      runningCount: number,
      trueCount: number,
      betAmount: number,
    ) => {
      handIdCounter.current += 1;
      currentHandRef.current = {
        handId: handIdCounter.current,
        timestamp: Date.now(),
        playerCards: playerCards.map(cardToString),
        dealerUpcard: getDealerUpcardString(dealerUpCard),
        runningCount,
        trueCount,
        betAmount,
      };
      setCurrentHandDecisions([]);
    },
    [],
  );

  /**
   * Record a player decision and compare to basic strategy
   */
  const recordDecision = useCallback(
    (
      action: PlayerAction,
      playerCards: Card[],
      dealerUpCard: Card,
      settings: GameSettings,
      canSplit: boolean,
      canDouble: boolean,
    ) => {
      // Get the recommended action from basic strategy
      const recommended = getBasicStrategyAction(
        playerCards,
        dealerUpCard,
        settings,
        canSplit,
        canDouble,
      );

      const recommendedAction = strategyToPlayerAction(recommended);
      const playerStrategyAction = playerToStrategyAction(action);

      // Check if the action is correct
      // Note: Some flexibility - H and D might both be acceptable in certain spots
      let isCorrect = playerStrategyAction === recommended;

      // Special case: If strategy says Double but player Hits, it's often acceptable
      // (when they couldn't double or chose not to)
      if (recommended === "D" && action === "HIT") {
        isCorrect = true; // Hitting when doubling is optimal is acceptable
      }

      const handValue = calculateHandValue(playerCards);
      const isSoft = isSoftHand(playerCards);

      const decision: DecisionRecord = {
        action,
        recommended: recommendedAction,
        isCorrect,
        playerTotal: handValue,
        isSoft,
        dealerUpcard: getDealerUpcardString(dealerUpCard),
      };

      setCurrentHandDecisions((prev) => [...prev, decision]);
    },
    [],
  );

  /**
   * Complete the current hand and add to history
   */
  const completeHand = useCallback(
    (result: HandRecord["result"], payout: number) => {
      if (!currentHandRef.current) return;

      const handRecord: HandRecord = {
        ...currentHandRef.current,
        decisions: [...currentHandDecisions],
        result,
        payout,
      };

      setHandHistory((prev) => {
        const newHistory = [...prev, handRecord];
        // Keep only the last MAX_HAND_HISTORY hands
        if (newHistory.length > MAX_HAND_HISTORY) {
          return newHistory.slice(-MAX_HAND_HISTORY);
        }
        return newHistory;
      });

      // Reset current hand
      currentHandRef.current = null;
      setCurrentHandDecisions([]);
    },
    [currentHandDecisions],
  );

  /**
   * Clear all hand history
   */
  const clearHistory = useCallback(() => {
    setHandHistory([]);
    setCurrentHandDecisions([]);
    currentHandRef.current = null;
    handIdCounter.current = 0;
  }, []);

  return {
    handHistory,
    currentHandDecisions,
    startNewHand,
    recordDecision,
    completeHand,
    clearHistory,
  };
}
