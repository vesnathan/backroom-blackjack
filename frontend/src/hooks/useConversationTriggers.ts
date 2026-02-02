/* eslint-disable sonarjs/cognitive-complexity */
import { useEffect, useRef, useCallback } from "react";
import {
  AIPlayer,
  ActiveConversation,
  GamePhase,
  SpeechBubble,
} from "@/types/gameState";
import { DealerCharacter } from "@/data/dealerCharacters";
import {
  getDealerPlayerLine,
  getRandomAIConversation,
  getDealerActionComment,
  getDealerQuirkReaction,
} from "@/data/dialogue";
import {
  getPitBossApproach,
  getPitBossDeparture,
  getDealerPitBossGreeting,
  getDealerSuspicionReport,
  getDealerPitBossSmallTalk,
  DealerPersonality,
} from "@/data/dialogue/pitBoss";

interface UseConversationTriggersParams {
  initialized: boolean;
  playerSeat: number | null;
  activeConversation: ActiveConversation | null;
  aiPlayers: AIPlayer[];
  currentDealer: DealerCharacter | null;
  playerSociability: number;
  phase: GamePhase;
  suspicionLevel?: number;
  speechBubbles: SpeechBubble[];
  triggerConversation: (
    speakerId: string,
    speakerName: string,
    position: number,
  ) => void;
  addSpeechBubble: (
    id: string,
    message: string,
    position: number,
    conversationId?: string,
  ) => void;
  registerTimeout: (callback: () => void, delay: number) => NodeJS.Timeout;
}

/**
 * Hook to handle periodic conversation triggers and AI banter
 * Includes phase-specific conversations, dealer commentary, and pit boss interactions
 */
export function useConversationTriggers({
  initialized,
  playerSeat,
  activeConversation,
  aiPlayers,
  currentDealer,
  playerSociability,
  phase,
  suspicionLevel = 0,
  speechBubbles,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  triggerConversation,
  addSpeechBubble,
  registerTimeout,
}: UseConversationTriggersParams) {
  // Track previous phase for phase-change triggers
  const prevPhaseRef = useRef<GamePhase | null>(null);
  // Track last pit boss conversation time to avoid spamming
  const lastPitBossConvoRef = useRef<number>(0);
  // Track suspicion threshold crossings
  const lastSuspicionThresholdRef = useRef<number>(0);
  // Track players involved in active multi-turn conversations
  // These players are "reserved" and shouldn't be picked for random banter
  const activeConversationParticipantsRef = useRef<Set<string>>(new Set());

  // Use refs for values that change frequently but shouldn't restart intervals
  const aiPlayersRef = useRef(aiPlayers);
  const addSpeechBubbleRef = useRef(addSpeechBubble);
  const currentDealerRef = useRef(currentDealer);
  const speechBubblesRef = useRef(speechBubbles);

  // Keep refs up to date
  useEffect(() => {
    aiPlayersRef.current = aiPlayers;
  }, [aiPlayers]);
  useEffect(() => {
    addSpeechBubbleRef.current = addSpeechBubble;
  }, [addSpeechBubble]);
  useEffect(() => {
    currentDealerRef.current = currentDealer;
  }, [currentDealer]);
  useEffect(() => {
    speechBubblesRef.current = speechBubbles;
  }, [speechBubbles]);

  // Helper to reserve players for a multi-turn conversation
  const reserveConversationParticipants = useCallback(
    (participantIds: string[]) => {
      participantIds.forEach((id) => {
        activeConversationParticipantsRef.current.add(id);
      });
    },
    [],
  );

  // Helper to release players after conversation ends
  const releaseConversationParticipants = useCallback(
    (participantIds: string[]) => {
      participantIds.forEach((id) => {
        activeConversationParticipantsRef.current.delete(id);
      });
    },
    [],
  );

  // Helper to get AI players who are NOT currently speaking AND not in an active conversation
  const getAvailableAIPlayers = useCallback(() => {
    const activeSpeakerIds = new Set(
      speechBubblesRef.current.filter((b) => b.visible).map((b) => b.playerId),
    );
    return aiPlayersRef.current.filter(
      (ai) =>
        !activeSpeakerIds.has(ai.character.id) &&
        !activeConversationParticipantsRef.current.has(ai.character.id),
    );
  }, []);
  // Periodic banter triggers (frequency based on player sociability)
  // Uses direct speech bubbles instead of complex conversation system
  useEffect(() => {
    if (!initialized || playerSeat === null || activeConversation) {
      return undefined;
    }

    // Reduced base chance from 0.3 to 0.15
    const baseTriggerChance = 0.15;
    const sociabilityMultiplier = playerSociability / 50;
    const triggerChance = baseTriggerChance * sociabilityMultiplier;

    // Increased base interval from 25s to 45s
    const baseInterval = 45000;
    const intervalVariation = 15000;
    const sociabilityIntervalMultiplier = Math.max(
      0.5,
      2 - playerSociability / 50,
    );

    const conversationInterval = setInterval(
      () => {
        const shouldTrigger = Math.random() < triggerChance;
        if (!shouldTrigger) return;

        const availablePlayers = getAvailableAIPlayers();

        if (Math.random() < 0.6 && availablePlayers.length > 0) {
          const randomAI =
            availablePlayers[
              Math.floor(Math.random() * availablePlayers.length)
            ];
          // Use direct speech bubble with banter line
          const message = getDealerPlayerLine(
            randomAI.character.id,
            "smallTalk",
          );
          if (message) {
            addSpeechBubbleRef.current(
              randomAI.character.id,
              message,
              randomAI.position,
            );
          }
        } else if (currentDealerRef.current) {
          // Dealer small talk - use dealer position (-1)
          const message = getDealerPlayerLine("dealer", "smallTalk");
          if (message) {
            addSpeechBubbleRef.current("dealer", message, -1);
          }
        }
      },
      (baseInterval + Math.random() * intervalVariation) *
        sociabilityIntervalMultiplier,
    );

    return () => clearInterval(conversationInterval);
  }, [
    initialized,
    playerSeat,
    activeConversation,
    playerSociability,
    getAvailableAIPlayers,
  ]);

  // AI-to-AI conversations (multi-turn exchanges)
  // Note: Uses refs to avoid restarting interval when aiPlayers hands change
  useEffect(() => {
    if (!initialized || aiPlayersRef.current.length < 2) {
      return undefined;
    }

    const conversationInterval = setInterval(
      () => {
        const currentAIPlayers = aiPlayersRef.current;
        const availablePlayers = getAvailableAIPlayers();

        // 25% chance for AI-to-AI conversation (need 2+ available players)
        // Reduced from 50% to make conversations less frequent
        if (Math.random() < 0.25 && availablePlayers.length >= 2) {
          // Only use available (not currently speaking) players for conversations
          const conversation = getRandomAIConversation(availablePlayers);

          // Only proceed if we got a valid conversation (all participants available)
          if (conversation) {
            // Get unique participant IDs and reserve them
            const participantIds = [
              ...new Set(conversation.map((t) => t.characterId)),
            ];
            reserveConversationParticipants(participantIds);

            // Generate unique conversation ID for color coding
            const convId = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            // Play out the conversation turns with timing
            const lastIndex = conversation.length - 1;
            conversation.forEach((turn, index) => {
              registerTimeout(() => {
                // Find the AI player with this characterId (use current state for position)
                const speaker = currentAIPlayers.find(
                  (ai) => ai.character.id === turn.characterId,
                );
                if (speaker) {
                  addSpeechBubbleRef.current(
                    speaker.character.id, // Use actual character ID for proper bubble display
                    turn.text,
                    speaker.position,
                    convId, // Pass conversation ID for color coding
                  );
                }

                // Release participants after the last message + display time
                if (index === lastIndex) {
                  registerTimeout(() => {
                    releaseConversationParticipants(participantIds);
                  }, 5000); // After bubble hides
                }
              }, index * 3500); // 3.5 seconds between conversation turns
            });
          }
        }
        // 10% chance for simple banter (fallback) - only if someone is available
        // Reduced from 20%
        else if (Math.random() < 0.1 && availablePlayers.length > 0) {
          const randomAI =
            availablePlayers[
              Math.floor(Math.random() * availablePlayers.length)
            ];

          const message = getDealerPlayerLine(
            randomAI.character.id,
            "smallTalk",
          );

          if (message) {
            addSpeechBubbleRef.current(
              randomAI.character.id,
              message,
              randomAI.position,
            );
          }
        }
      },
      30000 + Math.random() * 15000, // Every 30-45 seconds (increased from 12-20)
    );

    return () => clearInterval(conversationInterval);
  }, [
    initialized,
    registerTimeout,
    getAvailableAIPlayers,
    reserveConversationParticipants,
    releaseConversationParticipants,
  ]);

  // Phase-change conversation triggers
  // Only triggers on meaningful phases (BETTING, ROUND_END) to reduce noise
  useEffect(() => {
    const currentAIPlayers = aiPlayersRef.current;
    const availablePlayers = getAvailableAIPlayers();

    if (!initialized || currentAIPlayers.length < 2) {
      prevPhaseRef.current = phase;
      return undefined;
    }

    const previousPhase = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    // Skip if phase didn't change
    if (previousPhase === phase) return undefined;

    // Only trigger on meaningful phase transitions
    // BETTING = start of new hand, ROUND_END = results are in
    if (phase !== "BETTING" && phase !== "ROUND_END") return undefined;

    // 20% chance to trigger phase-specific conversation (reduced from 40%)
    if (Math.random() > 0.2) return undefined;

    // Need at least 2 available players for a conversation
    if (availablePlayers.length < 2) return undefined;

    // Get phase-appropriate conversation using only available players
    const conversation = getRandomAIConversation(availablePlayers);
    if (!conversation) return undefined;

    // Reserve participants
    const participantIds = [...new Set(conversation.map((t) => t.characterId))];
    reserveConversationParticipants(participantIds);

    // Generate conversation ID for color coding
    const convId = `phase-${phase}-${Date.now()}`;

    // Delay based on phase
    const startDelay = phase === "BETTING" ? 1500 : 1000;

    // Play conversation turns with timing
    const lastIndex = conversation.length - 1;
    conversation.forEach((turn, index) => {
      registerTimeout(
        () => {
          const speaker = currentAIPlayers.find(
            (ai) => ai.character.id === turn.characterId,
          );
          if (speaker) {
            addSpeechBubbleRef.current(
              speaker.character.id,
              turn.text,
              speaker.position,
              convId,
            );
          }

          // Release participants after last message
          if (index === lastIndex) {
            registerTimeout(() => {
              releaseConversationParticipants(participantIds);
            }, 5000);
          }
        },
        startDelay + index * 3500,
      );
    });
    return undefined;
  }, [
    initialized,
    phase,
    registerTimeout,
    getAvailableAIPlayers,
    reserveConversationParticipants,
    releaseConversationParticipants,
  ]);

  // Dealer quirk reactions to AI player behaviors
  // Triggers when AI players have distinctive traits
  useEffect(() => {
    if (
      !initialized ||
      !currentDealerRef.current ||
      aiPlayersRef.current.length === 0
    ) {
      return undefined;
    }

    // Only trigger during active gameplay phases
    if (
      phase !== "BETTING" &&
      phase !== "AI_TURNS" &&
      phase !== "PLAYER_TURN"
    ) {
      return undefined;
    }

    // 10% chance per check (reduced from 15%)
    const quirkInterval = setInterval(
      () => {
        const currentAIPlayers = aiPlayersRef.current;
        const dealer = currentDealerRef.current;

        if (Math.random() > 0.1 || !dealer || currentAIPlayers.length === 0)
          return;

        // Pick a random AI player (prefer those not in conversation)
        const availablePlayers = getAvailableAIPlayers();
        const playerPool =
          availablePlayers.length > 0 ? availablePlayers : currentAIPlayers;
        const randomAI =
          playerPool[Math.floor(Math.random() * playerPool.length)];

        const aiPersonality = randomAI.character.personality as
          | "drunk"
          | "clumsy"
          | "chatty"
          | "superstitious"
          | "cocky"
          | "nervous"
          | "lucky"
          | "unlucky";
        const dealerPersonality = dealer.personality as DealerPersonality;

        const reaction = getDealerQuirkReaction(
          dealerPersonality,
          aiPersonality,
        );
        if (reaction) {
          // Dealer speaks (position -1)
          addSpeechBubbleRef.current("dealer-quirk", reaction, -1);
        }
      },
      60000 + Math.random() * 30000,
    ); // Every 60-90 seconds (increased from 30-50)

    return () => clearInterval(quirkInterval);
  }, [initialized, phase, getAvailableAIPlayers]);

  // Pit boss conversations based on suspicion level
  // Triggers dealer-pit boss exchanges when suspicion rises
  useEffect(() => {
    const dealer = currentDealerRef.current;
    if (!initialized || !dealer) return undefined;

    const now = Date.now();
    const timeSinceLastConvo = now - lastPitBossConvoRef.current;

    // Minimum 45 seconds between pit boss conversations
    if (timeSinceLastConvo < 45000) return undefined;

    // Check if we crossed a suspicion threshold
    const thresholds = [30, 50, 70, 85];
    const currentThreshold = thresholds.find(
      (t) => suspicionLevel >= t && lastSuspicionThresholdRef.current < t,
    );

    if (!currentThreshold) return undefined;

    lastSuspicionThresholdRef.current = currentThreshold;
    lastPitBossConvoRef.current = now;

    const dealerPersonality = dealer.personality as DealerPersonality;
    const convId = `pitboss-${Date.now()}`;

    // Pit boss approaches
    registerTimeout(() => {
      addSpeechBubbleRef.current("pitboss", getPitBossApproach(), -2, convId);
    }, 500);

    // Dealer responds
    registerTimeout(() => {
      const greeting = getDealerPitBossGreeting(dealerPersonality);
      addSpeechBubbleRef.current("dealer", greeting, -1, convId);
    }, 4000);

    // If high suspicion, dealer may report or cover
    if (currentThreshold >= 50) {
      registerTimeout(() => {
        // Whether dealer covers depends on their personality (onYourSide)
        const covers = dealer.onYourSide;
        const report = getDealerSuspicionReport(dealerPersonality, covers);
        addSpeechBubbleRef.current("dealer", report, -1, convId);
      }, 7500);
    } else {
      // Low suspicion - just small talk
      registerTimeout(() => {
        const smallTalk = getDealerPitBossSmallTalk(dealerPersonality);
        addSpeechBubbleRef.current("dealer", smallTalk, -1, convId);
      }, 7500);
    }

    // Pit boss departs
    registerTimeout(() => {
      addSpeechBubbleRef.current("pitboss", getPitBossDeparture(), -2, convId);
    }, 11000);

    return undefined;
  }, [initialized, suspicionLevel, registerTimeout]);

  // Dealer action commentary on AI players
  // Exported for use in useAITurnsPhase
  return {
    /**
     * Get dealer comment for an AI player action
     */
    getDealerComment: (
      aiPersonality:
        | "drunk"
        | "clumsy"
        | "chatty"
        | "superstitious"
        | "cocky"
        | "nervous"
        | "lucky"
        | "unlucky",
      action:
        | "hit"
        | "stand"
        | "double"
        | "split"
        | "bust"
        | "blackjack"
        | "win"
        | "lose"
        | "push",
    ): string | null => {
      const dealer = currentDealerRef.current;
      if (!dealer) return null;
      const dealerPersonality = dealer.personality as DealerPersonality;
      return getDealerActionComment(dealerPersonality, aiPersonality, action);
    },
  };
}
