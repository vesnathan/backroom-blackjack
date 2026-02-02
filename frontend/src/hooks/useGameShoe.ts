import { useState, useCallback, useRef } from "react";
import { Card } from "@/types/game";
import { createAndShuffleShoe, createMidShoe } from "@/lib/deck";
import { dealCard } from "@/lib/gameActions";
import { GameSettings } from "@/types/gameSettings";

/**
 * Custom hook for managing the shoe (deck) state and card dealing
 * Handles shoe creation, shuffling, card dealing, and running count tracking
 *
 * Initial load simulates "sitting down at a new table" - starts mid-shoe.
 * This prevents players from refreshing to escape bad counts.
 * The running count starts at 0 because you don't know what was played before.
 *
 * @param gameSettings - Current game settings (number of decks, counting system)
 * @returns Shoe state and card dealing functions
 */
export function useGameShoe(gameSettings: GameSettings) {
  // Initial state: mid-shoe (simulating sitting at a table already in progress)
  const [shoe, setShoe] = useState<Card[]>(() => {
    const result = createMidShoe(
      gameSettings.numberOfDecks,
      gameSettings.countingSystem,
    );
    return result.shoe;
  });
  const [cardsDealt, setCardsDealt] = useState(0); // Player's count starts at 0
  const [runningCount, setRunningCount] = useState(0); // Unknown what was played before
  const [shoesDealt, setShoesDealt] = useState(0);

  // Use ref to always have the latest shoe for dealing
  const shoeRef = useRef(shoe);
  shoeRef.current = shoe;

  /**
   * Deal a single card from the shoe
   * Updates shoe state, cards dealt counter, and running count
   * Handles automatic reshuffling when cut card is reached
   *
   * @returns The dealt card
   */
  const dealCardFromShoe = useCallback(() => {
    // Use ref to get the most current shoe, avoiding stale closure issues
    const { card, remainingShoe, reshuffled } = dealCard(
      shoeRef.current,
      gameSettings.numberOfDecks,
      gameSettings.countingSystem,
    );

    if (reshuffled) {
      // Shoe was reshuffled - reset counters
      setShoe(remainingShoe);
      setCardsDealt(1);
      setRunningCount(card.count);
      setShoesDealt((prev) => prev + 1);
    } else {
      // Normal deal - update counters
      setShoe(remainingShoe);
      setCardsDealt((prev) => prev + 1);
      setRunningCount((prev) => prev + card.count);
    }

    return card;
  }, [gameSettings.numberOfDecks, gameSettings.countingSystem]);

  /**
   * Reset the shoe to a fresh shuffled state
   * Useful for starting a new session or resetting game state
   */
  const resetShoe = useCallback(() => {
    setShoe(
      createAndShuffleShoe(
        gameSettings.numberOfDecks,
        gameSettings.countingSystem,
      ),
    );
    setCardsDealt(0);
    setRunningCount(0);
  }, [gameSettings.numberOfDecks, gameSettings.countingSystem]);

  return {
    shoe,
    setShoe,
    cardsDealt,
    setCardsDealt,
    runningCount,
    setRunningCount,
    shoesDealt,
    setShoesDealt,
    dealCardFromShoe,
    resetShoe,
  };
}
