import { useCallback, useRef } from "react";
import { client } from "@/lib/amplify";
import { useAuth } from "@/contexts/AuthContext";

// GraphQL mutation for recording a hand
const RECORD_HAND = /* GraphQL */ `
  mutation RecordHand($input: RecordHandInput!) {
    recordHand(input: $input) {
      id
      userId
      sessionId
      timestamp
      totalBet
      totalProfit
      wasCorrectPlay
    }
  }
`;

export interface RecordHandData {
  numberOfDecks: number;
  countingSystem: string;
  dealerHitsSoft17: boolean;
  blackjackPayout: string;
  trueCount: number;
  runningCount: number;
  decksRemaining: number;
  dealerUpCard: string;
  dealerFinalCards: string[];
  dealerFinalValue: number;
  playerHands: string[][];
  playerFinalValues: number[];
  results: string[];
  bets: number[];
  profits: number[];
  totalBet: number;
  totalProfit: number;
}

interface Decision {
  action: string;
  correctAction: string;
}

/**
 * Hook for recording individual hands to the backend
 * - Generates a session ID on mount that persists until page close
 * - Tracks decisions during the current hand
 * - Sends complete hand data to backend after each hand
 */
export function useHandRecording() {
  const { isAuthenticated } = useAuth();

  // Generate session ID on hook mount (persists for page lifetime)
  const sessionId = useRef<string>(crypto.randomUUID());

  // Track decisions during current hand
  const currentDecisions = useRef<Decision[]>([]);

  /**
   * Add a decision to the current hand
   * Call this when player makes a hit/stand/double/split/surrender decision
   */
  const addDecision = useCallback((action: string, correctAction: string) => {
    currentDecisions.current.push({ action, correctAction });
  }, []);

  /**
   * Reset decisions for the next hand
   */
  const resetDecisions = useCallback(() => {
    currentDecisions.current = [];
  }, []);

  /**
   * Record a completed hand to the backend
   * Automatically includes sessionId and accumulated decisions
   */
  const recordHand = useCallback(
    async (handData: RecordHandData) => {
      if (!isAuthenticated) {
        // Still reset decisions even if not authenticated
        resetDecisions();
        return;
      }

      const actions = currentDecisions.current.map((d) => d.action);
      const correctActions = currentDecisions.current.map(
        (d) => d.correctAction,
      );

      // Compute wasCorrectPlay from accumulated decisions
      const wasCorrectPlay =
        actions.length > 0 &&
        actions.every((action, i) => action === correctActions[i]);

      try {
        await client.graphql({
          query: RECORD_HAND,
          variables: {
            input: {
              sessionId: sessionId.current,
              numberOfDecks: handData.numberOfDecks,
              countingSystem: handData.countingSystem,
              dealerHitsSoft17: handData.dealerHitsSoft17,
              blackjackPayout: handData.blackjackPayout,
              trueCount: handData.trueCount,
              runningCount: handData.runningCount,
              decksRemaining: handData.decksRemaining,
              dealerUpCard: handData.dealerUpCard,
              dealerFinalCards: handData.dealerFinalCards,
              dealerFinalValue: handData.dealerFinalValue,
              playerHands: handData.playerHands,
              playerFinalValues: handData.playerFinalValues,
              results: handData.results,
              bets: handData.bets,
              profits: handData.profits,
              actions,
              correctActions,
              totalBet: handData.totalBet,
              totalProfit: handData.totalProfit,
              wasCorrectPlay,
            },
          },
          authMode: "userPool",
        });
      } catch (error) {
        console.error("Failed to record hand:", error);
      }

      // Reset decisions for next hand
      resetDecisions();
    },
    [isAuthenticated, resetDecisions],
  );

  /**
   * Get current session ID (useful for debugging/display)
   */
  const getSessionId = useCallback(() => sessionId.current, []);

  return {
    recordHand,
    addDecision,
    resetDecisions,
    getSessionId,
  };
}
