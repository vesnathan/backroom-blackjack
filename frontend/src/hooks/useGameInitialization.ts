import { useEffect, useState } from "react";
import { AI_CHARACTERS } from "@/data/aiCharacters";
import { getRandomDealer, DealerCharacter } from "@/data/dealerCharacters";
import { getRandomPitBoss, PitBossCharacter } from "@/data/pitBossCharacters";
import { AIPlayer } from "@/types/gameState";

/**
 * Hook to handle game initialization on mount
 * - Randomly selects and seats AI players
 * - Assigns random dealer and pit boss
 * - Sets initialized flag
 */
export function useGameInitialization(
  setAIPlayers: (players: AIPlayer[]) => void,
  setCurrentDealer: (dealer: DealerCharacter) => void,
  setCurrentPitBoss: (pitBoss: PitBossCharacter) => void,
  setInitialized: (initialized: boolean) => void,
  devTestingMode: boolean = false,
  isMobileMode: boolean = false, // Passed from parent that has proper mobile detection
) {
  // Track if we've already initialized
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Only initialize once, and only when we have a valid isMobileMode value
    if (hasInitialized) return;

    // Use the passed isMobileMode which comes from a proper useEffect-based detection
    const isMobile = isMobileMode;

    // Mobile has 5 seats (positions 1, 2, 3, 5, 6), desktop has 8 (positions 0-7)
    const mobilePositions = [1, 2, 3, 5, 6];
    const desktopPositions = [0, 1, 2, 3, 4, 5, 6, 7];
    const availableSeats = isMobile ? mobilePositions : desktopPositions;

    // Dev mode: fill all available positions
    // Normal mode: 2-6 AI players randomly selected (realistic casino table)
    const maxPlayers = availableSeats.length;
    const numAIPlayers = devTestingMode
      ? maxPlayers
      : Math.floor(Math.random() * Math.min(5, maxPlayers - 1)) + 2; // Random between 2-6, capped by available seats

    const shuffledCharacters = [...AI_CHARACTERS].sort(
      () => Math.random() - 0.5,
    );

    // If we have fewer than needed characters, repeat them
    const selectedCharacters = [];
    for (let i = 0; i < numAIPlayers; i += 1) {
      selectedCharacters.push(
        shuffledCharacters[i % shuffledCharacters.length],
      );
    }

    // Assign table positions
    let availablePositions: number[];
    if (devTestingMode) {
      // Use all available positions for the current view mode
      availablePositions = availableSeats;
    } else {
      // Fisher-Yates shuffle for unbiased randomization
      const positionsCopy = [...availableSeats];
      for (let i = positionsCopy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [positionsCopy[i], positionsCopy[j]] = [
          positionsCopy[j],
          positionsCopy[i],
        ];
      }
      availablePositions = positionsCopy
        .slice(0, numAIPlayers)
        .sort((a, b) => a - b); // Sort positions for consistent seating order
    }

    const aiPlayersWithSeats = selectedCharacters.map((char, idx) => ({
      character: char,
      hand: { cards: [], bet: 50 },
      chips: 1000,
      position: availablePositions[idx],
    }));

    setAIPlayers(aiPlayersWithSeats);

    const initialDealer = getRandomDealer();
    setCurrentDealer(initialDealer);

    const initialPitBoss = getRandomPitBoss();
    setCurrentPitBoss(initialPitBoss);

    setInitialized(true);
    setHasInitialized(true);
  }, [
    setAIPlayers,
    setCurrentDealer,
    setCurrentPitBoss,
    setInitialized,
    devTestingMode,
    isMobileMode,
    hasInitialized,
  ]);
}
