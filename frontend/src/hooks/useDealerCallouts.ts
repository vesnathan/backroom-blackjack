import { useEffect, useRef } from "react";
import { GamePhase } from "@/types/gameState";
import { DealerCharacter } from "@/data/dealerCharacters";

interface UseDealerVoiceParams {
  phase: GamePhase;
  currentDealer: DealerCharacter | null;
  playerSeat: number | null;
  addSpeechBubble: (
    playerId: string,
    message: string,
    position: number,
    conversationId?: string,
  ) => void;
}

/**
 * Hook to handle dealer voice callouts during game phases
 * - "Place your bets" when entering BETTING phase
 */
export function useDealerCallouts({
  phase,
  currentDealer,
  playerSeat,
  addSpeechBubble,
}: UseDealerVoiceParams) {
  const previousPhase = useRef<GamePhase | null>(null);
  const speechBubbleShownRef = useRef(false); // Track if we've shown speech bubble for this betting phase

  useEffect(() => {
    // Detect when we enter BETTING phase
    if (phase === "BETTING" && previousPhase.current !== "BETTING") {
      previousPhase.current = phase;

      // Show "Place your bets" speech bubble and queue audio (only once)
      // Only show if player is seated - no need to prompt when just observing
      if (
        currentDealer &&
        playerSeat !== null &&
        !speechBubbleShownRef.current
      ) {
        speechBubbleShownRef.current = true;
        const message = "Place your bets";

        // Speech bubble for dealer callout
        // Position -1 for dealer
        addSpeechBubble("dealer", message, -1);
      }
    } else if (phase !== "BETTING" && previousPhase.current === "BETTING") {
      // Exiting BETTING phase - reset flag for next betting round
      speechBubbleShownRef.current = false;
      previousPhase.current = phase;
    }
  }, [phase, playerSeat, currentDealer, addSpeechBubble]); // Trigger on phase change or player seat change
}
