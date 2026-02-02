import { useEffect, useRef, useCallback } from "react";
import {
  getPitBossWarning,
  getRandomWarningDialogue,
} from "@/data/dialogue/pitBoss";

interface UsePitBossWarningsParams {
  suspicionLevel: number;
  playerSeat: number | null;
  initialized: boolean;
  onWarning: (message: string) => void;
  onBackoff: () => void;
}

/**
 * Hook to manage pit boss warnings at high suspicion levels
 * Triggers dialogue at 70%, 85%, 95% and backoff at 100%
 */
export function usePitBossWarnings({
  suspicionLevel,
  playerSeat,
  initialized,
  onWarning,
  onBackoff,
}: UsePitBossWarningsParams) {
  const lastWarningThreshold = useRef(0);

  // Reset when player leaves table
  const resetWarnings = useCallback(() => {
    lastWarningThreshold.current = 0;
  }, []);

  // Check for warnings when suspicion changes
  useEffect(() => {
    if (!initialized || playerSeat === null) return;

    const warning = getPitBossWarning(
      suspicionLevel,
      lastWarningThreshold.current,
    );

    if (warning) {
      lastWarningThreshold.current = warning.threshold;
      const dialogue = getRandomWarningDialogue(warning);

      if (warning.isFinal) {
        // Player is being backed off
        onBackoff();
      } else {
        // Show warning dialogue
        onWarning(dialogue);
      }
    }
  }, [suspicionLevel, initialized, playerSeat, onWarning, onBackoff]);

  // Reset warnings when player seat changes (new session)
  useEffect(() => {
    if (playerSeat === null) {
      resetWarnings();
    }
  }, [playerSeat, resetWarnings]);

  return { resetWarnings };
}
