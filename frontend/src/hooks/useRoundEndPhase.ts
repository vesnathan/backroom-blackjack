import { useEffect, useRef } from "react";
import {
  GamePhase,
  AIPlayer,
  ActiveConversation,
  SpeechBubble,
} from "@/types/gameState";
import { GameSettings, calculateCutCardPosition } from "@/types/gameSettings";
import { AI_CHARACTERS } from "@/data/aiCharacters";
import { CHARACTER_DIALOGUE, pick } from "@/data/dialogue";
import { createAndShuffleShoe } from "@/lib/deck";
import { Card } from "@/types/game";

interface UseRoundEndPhaseParams {
  phase: GamePhase;
  aiPlayers: AIPlayer[];
  playerSeat: number | null;
  cardsDealt: number;
  gameSettings: GameSettings;
  isSubscribed: boolean;
  showSubscribeBanner: boolean;
  activeConversation: ActiveConversation | null;
  speechBubbles: SpeechBubble[];
  registerTimeout: (callback: () => void, delay: number) => void;
  setAIPlayers: (
    players: AIPlayer[] | ((prev: AIPlayer[]) => AIPlayer[]),
  ) => void;
  setDealerCallout: (callout: string | null) => void;
  addSpeechBubble: (id: string, message: string, position: number) => void;
  setShoe: (shoe: Card[]) => void;
  setCardsDealt: (dealt: number) => void;
  setRunningCount: (count: number) => void;
  setShoesDealt: (shoes: number | ((prev: number) => number)) => void;
  setShowSubscribeBanner: (show: boolean) => void;
  nextHand: () => void;
}

/**
 * Hook to handle ROUND_END phase logic
 * - Player rotation (add/remove AI players)
 * - Table banter between rounds
 * - Shoe reshuffle when cut card is reached
 * - Progression to next hand
 */
export function useRoundEndPhase({
  phase,
  aiPlayers,
  playerSeat,
  cardsDealt,
  gameSettings,
  isSubscribed,
  showSubscribeBanner,
  activeConversation,
  speechBubbles,
  registerTimeout,
  setAIPlayers,
  setDealerCallout,
  addSpeechBubble,
  setShoe,
  setCardsDealt,
  setRunningCount,
  setShoesDealt,
  setShowSubscribeBanner,
  nextHand,
}: UseRoundEndPhaseParams) {
  // Use ref to always get latest playerSeat value in timeout callbacks
  // This prevents stale closure issues where AI could be placed in player's seat
  const playerSeatRef = useRef(playerSeat);
  useEffect(() => {
    playerSeatRef.current = playerSeat;
  }, [playerSeat]);

  // Track banner state: "pending" -> "shown" -> "dismissed"
  const bannerStateRef = useRef<"pending" | "shown" | "dismissed">("pending");

  // Reset banner tracking when phase changes away from ROUND_END
  useEffect(() => {
    if (phase !== "ROUND_END") {
      bannerStateRef.current = "pending";
    }
  }, [phase]);

  // Show subscribe banner for non-subscribed users after a short delay
  useEffect(() => {
    if (
      phase === "ROUND_END" &&
      !isSubscribed &&
      bannerStateRef.current === "pending"
    ) {
      // Show banner after 2 seconds to let user see results first
      registerTimeout(() => {
        bannerStateRef.current = "shown";
        setShowSubscribeBanner(true);
      }, 2000);
    }
  }, [phase, isSubscribed, registerTimeout, setShowSubscribeBanner]);

  // Track when banner is dismissed
  useEffect(() => {
    if (bannerStateRef.current === "shown" && !showSubscribeBanner) {
      bannerStateRef.current = "dismissed";
    }
  }, [showSubscribeBanner]);

  // Continue to next hand when banner is dismissed (or immediately for subscribers)
  // eslint-disable-next-line sonarjs/cognitive-complexity
  useEffect(() => {
    // For subscribers: proceed after 4 seconds
    // For non-subscribers: wait for banner to be dismissed
    const bannerDismissed = bannerStateRef.current === "dismissed";

    if (phase === "ROUND_END" && (isSubscribed || bannerDismissed)) {
      const delay = isSubscribed ? 4000 : 500; // Short delay after banner dismiss
      registerTimeout(() => {
        // Frequently add or remove players (35% chance per hand)
        const playerChangeChance = Math.random();

        if (playerChangeChance < 0.35) {
          const currentAICount = aiPlayers.length;
          const occupiedSeats = new Set(aiPlayers.map((p) => p.position));
          // Use ref to get latest playerSeat value (avoids stale closure)
          if (playerSeatRef.current !== null)
            occupiedSeats.add(playerSeatRef.current);

          // 50/50 chance to add or remove (if possible)
          const shouldAdd = Math.random() < 0.5;

          if (shouldAdd && currentAICount < 7 && occupiedSeats.size < 8) {
            // Add a new player
            const availableSeats = [0, 1, 2, 3, 4, 5, 6, 7].filter(
              (seat) => !occupiedSeats.has(seat),
            );

            if (availableSeats.length > 0) {
              // Pick random available seat
              const newSeat =
                availableSeats[
                  Math.floor(Math.random() * availableSeats.length)
                ];

              // Pick random character not already at table
              const usedCharacterIds = new Set(
                aiPlayers.map((p) => p.character.id),
              );
              const availableCharacters = AI_CHARACTERS.filter(
                (char) => !usedCharacterIds.has(char.id),
              );

              if (availableCharacters.length > 0) {
                const newCharacter =
                  availableCharacters[
                    Math.floor(Math.random() * availableCharacters.length)
                  ];

                const newPlayer: AIPlayer = {
                  character: newCharacter,
                  hand: { cards: [], bet: 50 },
                  chips: 1000,
                  position: newSeat,
                };

                setAIPlayers((prev) => [...prev, newPlayer]);

                // Show dealer speech bubble
                addSpeechBubble(
                  "dealer-join",
                  `${newCharacter.name} joins the table!`,
                  -1,
                );
              }
            }
          } else if (!shouldAdd && currentAICount > 2) {
            // Remove a random player (keep at least 2 AI players for atmosphere)
            // But don't remove players who are in a conversation or have visible speech bubbles

            // Get IDs of players currently speaking or in active conversation
            const speakingPlayerIds = speechBubbles
              .filter((bubble) => bubble.visible)
              .map((bubble) => bubble.playerId);
            const playersInConversation = new Set<string>(speakingPlayerIds);

            // Check active conversation (player is being asked a question by an AI)
            if (activeConversation) {
              playersInConversation.add(activeConversation.speakerId);
            }

            // Find eligible players to remove (not in conversation)
            const eligibleForRemoval = aiPlayers.filter(
              (ai) => !playersInConversation.has(ai.character.id),
            );

            if (eligibleForRemoval.length > 0) {
              const removeIndex = Math.floor(
                Math.random() * eligibleForRemoval.length,
              );
              const removedPlayer = eligibleForRemoval[removeIndex];

              setAIPlayers((prev) =>
                prev.filter(
                  (ai) => ai.character.id !== removedPlayer.character.id,
                ),
              );

              // Show dealer speech bubble
              addSpeechBubble(
                "dealer-leave",
                `${removedPlayer.character.name} leaves the table.`,
                -1,
              );
            }
            // If all players are in conversations, skip removal this round
          }
        }

        // Check if we need to reshuffle (cut card reached)
        const totalCards = gameSettings.numberOfDecks * 52;
        const cutCardPosition = calculateCutCardPosition(
          gameSettings.numberOfDecks,
          gameSettings.deckPenetration,
        );
        const cardsUntilCutCard = totalCards - cutCardPosition;

        // 25% chance to show random table banter between AI players
        if (Math.random() < 0.25 && aiPlayers.length >= 2) {
          // Pick a random AI player to speak
          const speakerIndex = Math.floor(Math.random() * aiPlayers.length);
          const speaker = aiPlayers[speakerIndex];

          // Get their banter lines
          const characterDialogue = CHARACTER_DIALOGUE[speaker.character.id];
          const banterLines = characterDialogue?.banterWithPlayer;

          if (banterLines && banterLines.length > 0) {
            const randomBanter = pick(banterLines);
            addSpeechBubble(
              `ai-banter-${Date.now()}`,
              randomBanter.text,
              speaker.position,
            );
          }
        }

        if (cardsDealt >= cardsUntilCutCard) {
          // Reshuffle the shoe
          const newShoe = createAndShuffleShoe(
            gameSettings.numberOfDecks,
            gameSettings.countingSystem,
          );
          setShoe(newShoe);
          setCardsDealt(0);
          setRunningCount(0);
          setShoesDealt((prev) => prev + 1);

          // Show reshuffle message in speech bubble
          addSpeechBubble("dealer-shuffle", "Shuffling new shoe...", -1);
          registerTimeout(() => {
            nextHand();
          }, 3000);
        } else {
          // No reshuffle needed, just continue to next hand
          nextHand();
        }
      }, delay);
    }
  }, [
    phase,
    cardsDealt,
    gameSettings.numberOfDecks,
    gameSettings.deckPenetration,
    gameSettings.countingSystem,
    isSubscribed,
    showSubscribeBanner,
    activeConversation,
    speechBubbles,
    nextHand,
    registerTimeout,
    aiPlayers,
    playerSeat,
    addSpeechBubble,
    setAIPlayers,
    setDealerCallout,
    setShoe,
    setCardsDealt,
    setRunningCount,
    setShoesDealt,
  ]);
}
