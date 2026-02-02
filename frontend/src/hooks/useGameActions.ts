import { useCallback } from "react";
import {
  AIPlayer,
  PlayerHand,
  GamePhase,
  FlyingCardData,
  SpeechBubble,
} from "@/types/gameState";
import { Card as GameCard } from "@/types/game";
import {
  dealCard,
  calculateHandValue,
  isBlackjack,
  canSplit,
} from "@/lib/gameActions";
import { getBasicStrategyAction } from "@/lib/basicStrategy";
import {
  CARD_ANIMATION_DURATION,
  CARD_DEAL_GAP,
  SPLIT_SEPARATION_DELAY,
  SPLIT_CARD_DEAL_DELAY,
} from "@/constants/animations";
import { GameSettings } from "@/types/gameSettings";
import { getInitialHandReaction } from "@/data/dialogue";
import { debugLog } from "@/utils/debug";
import { TestScenario } from "@/types/testScenarios";
import { createCardFromScenario } from "@/lib/testScenarioHelpers";

// Module-level counter for unique card IDs
let cardIdCounter = 0;

// Module-level flag to prevent double dealing (can happen with React Strict Mode or race conditions)
let dealingInProgress = false;

// Debug message constant
const AI_TURNS_TRANSITION_MSG =
  "Moving to AI_TURNS phase (to check for remaining AI players)";

interface UseGameActionsParams {
  // State
  phase: GamePhase;
  playerSeat: number | null;
  playerHand: PlayerHand;
  dealerHand: PlayerHand;
  aiPlayers: AIPlayer[];
  shoe: GameCard[];
  cardsDealt: number;
  runningCount: number;
  shoesDealt: number;
  gameSettings: GameSettings;
  playerChips: number;
  selectedTestScenario: TestScenario | null;

  // Setters
  setPhase: (phase: GamePhase) => void;
  setCurrentBet: (bet: number) => void;
  setDealerRevealed: (revealed: boolean) => void;
  setPlayerHand: (
    hand: PlayerHand | ((prev: PlayerHand) => PlayerHand),
  ) => void;
  setDealerHand: (
    hand: PlayerHand | ((prev: PlayerHand) => PlayerHand),
  ) => void;
  setSpeechBubbles: (
    bubbles: SpeechBubble[] | ((prev: SpeechBubble[]) => SpeechBubble[]),
  ) => void;
  setAIPlayers: (
    players: AIPlayer[] | ((prev: AIPlayer[]) => AIPlayer[]),
  ) => void;
  setFlyingCards: (
    cards: FlyingCardData[] | ((prev: FlyingCardData[]) => FlyingCardData[]),
  ) => void;
  setPlayerActions: (
    actions:
      | Map<number, "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK">
      | ((
          prev: Map<
            number,
            "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK"
          >,
        ) => Map<
          number,
          "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK"
        >),
  ) => void;
  setShoe: (shoe: GameCard[]) => void;
  setCardsDealt: (cards: number) => void;
  setRunningCount: (count: number | ((prev: number) => number)) => void;
  setShoesDealt: (shoes: number) => void;
  setInsuranceOffered: (offered: boolean) => void;
  setActivePlayerIndex: (index: number | null) => void;
  setPlayerFinished: (finished: boolean) => void;
  setPlayerChips: (chips: number | ((prev: number) => number)) => void;

  // Functions
  dealCardFromShoe: () => GameCard;
  registerTimeout: (callback: () => void, delay: number) => void;
  getCardPosition: (
    type: "ai" | "player" | "dealer" | "shoe",
    aiPlayers: AIPlayer[],
    playerSeat: number | null,
    index?: number,
    cardIndex?: number,
  ) => { left: string; top: string };
  addSpeechBubble: (
    playerId: string,
    message: string,
    position: number,
  ) => void;
  showEndOfHandReactions: () => void;
  addDecision: (action: string, correctAction: string) => void;
}

// Return type for useGameActions
export interface GameActionsReturn {
  startNewRound: () => void;
  dealInitialCards: (playerBetAmount?: number) => void;
  hit: () => void;
  stand: () => void;
  doubleDown: () => void;
  split: () => void;
  surrender: () => void;
}

export function useGameActions({
  playerSeat,
  playerHand,
  dealerHand,
  aiPlayers,
  shoe,
  cardsDealt,
  runningCount,
  shoesDealt,
  gameSettings,
  playerChips,
  selectedTestScenario,
  setPhase,
  setCurrentBet,
  setDealerRevealed,
  setPlayerHand,
  setDealerHand,
  setSpeechBubbles,
  setAIPlayers,
  setFlyingCards,
  setPlayerActions,
  setShoe,
  setCardsDealt,
  setRunningCount,
  setShoesDealt,
  setInsuranceOffered,
  setActivePlayerIndex,
  setPlayerFinished,
  setPlayerChips,
  dealCardFromShoe,
  registerTimeout,
  getCardPosition,
  addSpeechBubble,
  showEndOfHandReactions,
  addDecision,
}: UseGameActionsParams) {
  const startNewRound = useCallback(() => {
    setPhase("BETTING");
    setCurrentBet(0); // Reset bet for new round
    setDealerRevealed(false);
    setPlayerHand({ cards: [], bet: 0 });
    setDealerHand({ cards: [], bet: 0 });
    setSpeechBubbles([]); // Clear any lingering speech bubbles
    setPlayerFinished(false); // Reset player finished status for new hand

    // Reset AI hands (they'll bet when player confirms)
    const updatedAI = aiPlayers.map((ai) => ({
      ...ai,
      hand: { cards: [], bet: 0 },
    }));
    setAIPlayers(updatedAI);
  }, [
    aiPlayers,
    setPhase,
    setCurrentBet,
    setDealerRevealed,
    setPlayerHand,
    setDealerHand,
    setSpeechBubbles,
    setAIPlayers,
    setPlayerFinished,
  ]);

  const dealInitialCards = useCallback(
    // eslint-disable-next-line sonarjs/cognitive-complexity
    (playerBetAmount?: number) => {
      // Prevent double dealing (can happen with React Strict Mode or race conditions)
      if (dealingInProgress) {
        debugLog(
          "gamePhases",
          "⚠️ dealInitialCards called while dealing in progress - skipping",
        );
        return;
      }
      dealingInProgress = true;

      // Use parameter if provided, otherwise fall back to playerHand.bet
      const effectivePlayerBet = playerBetAmount ?? playerHand.bet;

      debugLog("gamePhases", "=== DEALING PHASE START ===");
      debugLog("dealCards", `Shoe cards remaining: ${shoe.length}`);
      debugLog("dealCards", `Cards dealt this shoe: ${cardsDealt}`);
      debugLog("dealCards", `Running count: ${runningCount}`);
      debugLog("dealCards", `Number of AI players: ${aiPlayers.length}`);
      const playerSeatedStr =
        playerSeat !== null ? `Yes (Seat ${playerSeat})` : "No (observing)";
      debugLog("dealCards", `Player seated: ${playerSeatedStr}`);
      debugLog("dealCards", `Player bet: $${effectivePlayerBet}`);

      // Pre-deal all cards BEFORE animations to ensure uniqueness
      // We need to manually track the shoe state because React batches state updates
      const dealtCards: {
        type: string;
        index: number;
        card: GameCard;
        cardIndex: number;
      }[] = [];
      let currentShoe = [...shoe];
      let currentCardsDealt = cardsDealt;
      let currentRunningCount = runningCount;
      let currentShoesDealt = shoesDealt;

      // Track how many initial reactions have been shown (limit to 1-2)
      let reactionsShown = 0;
      const maxReactions = Math.random() < 0.6 ? 1 : 2;

      // Helper to deal from the current shoe state OR use forced cards from test scenario
      // Create maps for forced cards by type and index
      const forcedDealerCards: Map<number, GameCard> = new Map();
      const forcedPlayerCards: Map<number, GameCard> = new Map();
      const forcedAICards: Map<number, Map<number, GameCard>> = new Map(); // Map<aiIndex, Map<cardIndex, Card>>

      // Pre-create all forced cards if a test scenario is selected
      if (selectedTestScenario) {
        debugLog(
          "testScenario",
          `🧪 Test scenario selected: ${selectedTestScenario.name}`,
        );

        // Create forced dealer upcard (first card only)
        forcedDealerCards.set(
          0,
          createCardFromScenario(
            selectedTestScenario.dealerUpCard.rank,
            selectedTestScenario.dealerUpCard.suit,
            gameSettings.countingSystem,
          ),
        );

        // Create forced player cards (if player is seated)
        if (selectedTestScenario.playerHands && playerSeat !== null) {
          selectedTestScenario.playerHands.forEach((cardSpec, idx) => {
            forcedPlayerCards.set(
              idx,
              createCardFromScenario(
                cardSpec.rank,
                cardSpec.suit,
                gameSettings.countingSystem,
              ),
            );
          });
        }

        // Create forced AI cards by position
        if (selectedTestScenario.aiHands) {
          Object.entries(selectedTestScenario.aiHands).forEach(
            ([positionStr, cards]) => {
              const position = parseInt(positionStr, 10);
              // Find AI index for this position
              const aiIndex = aiPlayers.findIndex(
                (ai) => ai.position === position,
              );
              if (aiIndex !== -1) {
                const aiCardMap: Map<number, GameCard> = new Map();
                cards.forEach((cardSpec, idx) => {
                  aiCardMap.set(
                    idx,
                    createCardFromScenario(
                      cardSpec.rank,
                      cardSpec.suit,
                      gameSettings.countingSystem,
                    ),
                  );
                });
                forcedAICards.set(aiIndex, aiCardMap);
              }
            },
          );
        }
      }

      // Helper to deal card with optional forced override
      // skipCount: true for dealer hole card (face down, not counted until revealed)
      const dealFromCurrentShoe = (
        type: "dealer" | "player" | "ai",
        index: number,
        cardIndex: number,
        skipCount = false,
      ) => {
        let card: GameCard | undefined;

        // Check for forced cards based on type
        if (type === "dealer" && forcedDealerCards.has(cardIndex)) {
          card = forcedDealerCards.get(cardIndex);
          debugLog(
            "testScenario",
            `Using forced dealer card ${cardIndex}: ${card?.rank}${card?.suit}`,
          );
        } else if (type === "player" && forcedPlayerCards.has(cardIndex)) {
          card = forcedPlayerCards.get(cardIndex);
          debugLog(
            "testScenario",
            `Using forced player card ${cardIndex}: ${card?.rank}${card?.suit}`,
          );
        } else if (type === "ai" && forcedAICards.has(index)) {
          const aiCardMap = forcedAICards.get(index);
          if (aiCardMap?.has(cardIndex)) {
            card = aiCardMap.get(cardIndex);
            debugLog(
              "testScenario",
              `Using forced AI ${index} card ${cardIndex}: ${card?.rank}${card?.suit}`,
            );
          }
        }

        // If no forced card, deal from shoe
        if (!card) {
          const {
            card: dealtCard,
            remainingShoe,
            reshuffled,
          } = dealCard(
            currentShoe,
            gameSettings.numberOfDecks,
            gameSettings.countingSystem,
          );
          card = dealtCard;

          if (reshuffled) {
            currentShoe = remainingShoe;
            currentCardsDealt = 1;
            // Only count if not skipping (dealer hole card is face down)
            currentRunningCount = skipCount ? 0 : card.count;
            currentShoesDealt += 1;
          } else {
            currentShoe = remainingShoe;
            currentCardsDealt += 1;
            // Only count if not skipping (dealer hole card is face down)
            if (!skipCount) {
              currentRunningCount += card.count;
            }
          }
        } else {
          // For forced cards, still update counts (unless skipping)
          currentCardsDealt += 1;
          if (!skipCount) {
            currentRunningCount += card.count;
          }
        }

        return card;
      };

      // Build a unified dealing order: AI players + human player (if seated with bet), sorted by position
      type DealTarget =
        | { type: "ai"; position: number; aiIndex: number }
        | { type: "player"; position: number };

      const dealOrder: DealTarget[] = aiPlayers.map((ai, idx) => ({
        type: "ai" as const,
        position: ai.position,
        aiIndex: idx,
      }));

      // Include human player in deal order if seated AND has placed a bet
      const playerInHand = playerSeat !== null && effectivePlayerBet > 0;
      if (playerInHand) {
        dealOrder.push({ type: "player" as const, position: playerSeat });
      }

      // Sort by position (first base = lowest position number deals first)
      dealOrder.sort((a, b) => a.position - b.position);

      debugLog(
        "dealCards",
        "--- First card round (first base to third base) ---",
      );
      // Deal first card to everyone in position order, dealer last
      dealOrder.forEach((target) => {
        if (target.type === "ai") {
          const ai = aiPlayers[target.aiIndex];
          const card = dealFromCurrentShoe("ai", target.aiIndex, 0);
          debugLog(
            "dealCards",
            `AI Player ${target.aiIndex} (${ai.character.name}, Seat ${ai.position}): ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${currentRunningCount}`,
          );
          dealtCards.push({
            type: "ai",
            index: target.aiIndex,
            card,
            cardIndex: 0,
          });
        } else {
          const card = dealFromCurrentShoe("player", 0, 0);
          debugLog(
            "dealCards",
            `Player (Seat ${playerSeat}): ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${currentRunningCount}`,
          );
          dealtCards.push({ type: "player", index: 0, card, cardIndex: 0 });
        }
      });
      const dealerCard1 = dealFromCurrentShoe("dealer", 0, 0);
      debugLog(
        "dealCards",
        `Dealer card 1: ${dealerCard1.rank}${dealerCard1.suit} (value: ${dealerCard1.value}, count: ${dealerCard1.count}) [FACE UP] | Running count: ${currentRunningCount}`,
      );
      dealtCards.push({
        type: "dealer",
        index: 0,
        card: dealerCard1,
        cardIndex: 0,
      });

      debugLog(
        "dealCards",
        "--- Second card round (first base to third base) ---",
      );
      // Deal second card to everyone in position order, dealer last
      dealOrder.forEach((target) => {
        if (target.type === "ai") {
          const ai = aiPlayers[target.aiIndex];
          const card = dealFromCurrentShoe("ai", target.aiIndex, 1);
          debugLog(
            "dealCards",
            `AI Player ${target.aiIndex} (${ai.character.name}): ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${currentRunningCount}`,
          );
          dealtCards.push({
            type: "ai",
            index: target.aiIndex,
            card,
            cardIndex: 1,
          });
        } else {
          const card = dealFromCurrentShoe("player", 0, 1);
          debugLog(
            "dealCards",
            `Player: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${currentRunningCount}`,
          );
          dealtCards.push({ type: "player", index: 0, card, cardIndex: 1 });
        }
      });
      // Dealer hole card - skipCount=true because it's face down (will be counted when revealed)
      const dealerCard2 = dealFromCurrentShoe("dealer", 0, 1, true);
      debugLog(
        "dealCards",
        `Dealer card 2: ${dealerCard2.rank}${dealerCard2.suit} (value: ${dealerCard2.value}, count: ${dealerCard2.count}) [FACE DOWN - not counted] | Visible running count: ${currentRunningCount}`,
      );
      dealtCards.push({
        type: "dealer",
        index: 1,
        card: dealerCard2,
        cardIndex: 1,
      });

      // Update state with all pre-dealt cards (except running count - that updates as cards land)
      setShoe(currentShoe);
      setCardsDealt(currentCardsDealt);
      // Note: Running count is now updated incrementally in the animation callbacks below
      // so it updates in real-time as each card lands (visible to the player)
      setShoesDealt(currentShoesDealt);

      // Animate cards one by one
      let delay = 0;
      dealtCards.forEach((dealData) => {
        registerTimeout(() => {
          const shoePosition = getCardPosition("shoe", aiPlayers, playerSeat);

          let targetPosition: { left: string; top: string };
          if (dealData.type === "dealer") {
            targetPosition = getCardPosition(
              "dealer",
              aiPlayers,
              playerSeat,
              undefined,
              dealData.cardIndex,
            );
          } else if (dealData.type === "player") {
            targetPosition = getCardPosition(
              "player",
              aiPlayers,
              playerSeat,
              undefined,
              dealData.cardIndex,
            );
          } else {
            targetPosition = getCardPosition(
              "ai",
              aiPlayers,
              playerSeat,
              dealData.index,
              dealData.cardIndex,
            );
          }

          const flyingCard: FlyingCardData = {
            id: `deal-${dealData.type}-${dealData.index}-${Date.now()}-${(cardIdCounter += 1)}`,
            card: dealData.card,
            fromPosition: shoePosition,
            toPosition: targetPosition,
          };

          setFlyingCards((prev) => [...prev, flyingCard]);

          // Remove flying card and update hand after animation
          registerTimeout(() => {
            setFlyingCards((prev) =>
              prev.filter((fc) => fc.id !== flyingCard.id),
            );

            // Update running count as each card lands (except dealer hole card which is face down)
            // The hole card will be counted when it's revealed
            const isDealerHoleCard =
              dealData.type === "dealer" && dealData.cardIndex === 1;
            if (!isDealerHoleCard) {
              setRunningCount((prev) => prev + dealData.card.count);
            }

            if (dealData.type === "dealer") {
              setDealerHand((prev) => ({
                ...prev,
                cards: [...prev.cards, dealData.card],
              }));
            } else if (dealData.type === "player") {
              setPlayerHand((prev) => ({
                ...prev,
                cards: [...prev.cards, dealData.card],
              }));
            } else {
              setAIPlayers((prev) => {
                const updated = [...prev];
                // Safety check: Ensure the AI player still exists at this index
                if (!updated[dealData.index]) {
                  debugLog(
                    "dealCards",
                    `⚠️ AI player at index ${dealData.index} no longer exists - skipping card update`,
                  );
                  return prev; // Return unchanged if player doesn't exist
                }
                updated[dealData.index] = {
                  ...updated[dealData.index],
                  hand: {
                    ...updated[dealData.index].hand,
                    cards: [
                      ...updated[dealData.index].hand.cards,
                      dealData.card,
                    ],
                  },
                };
                return updated;
              });

              // Show initial reaction after AI receives their second card
              // Limited to 1-2 reactions with probability-based filtering
              if (dealData.cardIndex === 1 && reactionsShown < maxReactions) {
                registerTimeout(() => {
                  // Check if we've already shown enough reactions
                  if (reactionsShown >= maxReactions) {
                    return;
                  }

                  // Safety check: Ensure AI player still exists
                  const ai = aiPlayers[dealData.index];
                  if (!ai) {
                    debugLog(
                      "dealCards",
                      `⚠️ AI player at index ${dealData.index} no longer exists - skipping reaction`,
                    );
                    return;
                  }

                  // Get the two cards this AI has now
                  const firstCard = dealtCards.find(
                    (d) =>
                      d.type === "ai" &&
                      d.index === dealData.index &&
                      d.cardIndex === 0,
                  )?.card;

                  if (firstCard) {
                    const twoCards = [firstCard, dealData.card];
                    const handValue = calculateHandValue(twoCards);
                    const hasBlackjack = isBlackjack(twoCards);
                    const dealerUpCard = dealerCard1;

                    // Determine reaction chance based on hand quality
                    let reactionChance = 0.02; // Default: only 2% chance to react
                    if (hasBlackjack) {
                      reactionChance = 0.2; // 20% chance to react to blackjack
                    } else if (handValue >= 20) {
                      reactionChance = 0.08; // 8% chance to react to 20-21
                    } else if (handValue <= 12) {
                      reactionChance = 0.05; // 5% chance to react to bad hand
                    }

                    // Apply probability filter
                    if (Math.random() > reactionChance) {
                      return;
                    }

                    const reaction = getInitialHandReaction(
                      ai.character,
                      handValue,
                      hasBlackjack,
                      dealerUpCard,
                    );

                    if (reaction) {
                      reactionsShown += 1;
                      addSpeechBubble(ai.character.id, reaction, ai.position);
                    }
                  }
                }, 800); // Short delay after card arrives
              }
            }
          }, CARD_ANIMATION_DURATION);
        }, delay);

        delay += CARD_ANIMATION_DURATION + CARD_DEAL_GAP; // Stagger cards - ensures previous lands before next starts
      });

      // After all cards are dealt, check for insurance and dealer blackjack
      registerTimeout(
        () => {
          debugLog("dealCards", "All cards dealt and animations complete");

          // Reset dealing flag now that all cards are dealt
          dealingInProgress = false;

          // Define proceedAfterPeek function before using it
          function proceedAfterPeek() {
            debugLog(
              "dealCards",
              `Running count after dealing: ${currentRunningCount}`,
            );
            debugLog(
              "dealCards",
              `Shoe cards remaining: ${currentShoe.length}`,
            );
            debugLog("gamePhases", "=== DEALING PHASE END ===");

            // Determine turn order based on seat positions (first base to third base)
            debugLog("gamePhases", "=== DETERMINING TURN ORDER ===");

            // Collect all occupied seats
            const occupiedSeats: number[] = [];

            // Add AI player seats
            debugLog("gamePhases", `AI Players seated:`);
            aiPlayers.forEach((ai, idx) => {
              occupiedSeats.push(ai.position);
              debugLog(
                "gamePhases",
                `  AI ${idx} (${ai.character.name}) - Seat ${ai.position}`,
              );
            });

            // Add human player seat if seated
            if (playerSeat !== null) {
              occupiedSeats.push(playerSeat);
              debugLog("gamePhases", `Human player - Seat ${playerSeat}`);
            } else {
              debugLog("gamePhases", `Human player - NOT SEATED`);
            }

            // Sort seats in ascending order (seat 0 = first base goes first)
            occupiedSeats.sort((a, b) => a - b);

            debugLog(
              "gamePhases",
              `Turn order (by seat): ${occupiedSeats.join(" → ")}`,
            );

            if (occupiedSeats.length === 0) {
              debugLog(
                "gamePhases",
                "❌ No players seated, moving to DEALER_TURN",
              );
              setPhase("DEALER_TURN");
              return;
            }

            // Check if human player goes first
            const firstSeat = occupiedSeats[0];
            debugLog("gamePhases", `First seat to act: ${firstSeat}`);

            if (playerSeat !== null && firstSeat === playerSeat) {
              debugLog(
                "gamePhases",
                `✓ Player is in seat ${playerSeat} (FIRST TO ACT)`,
              );
              debugLog("gamePhases", "→ Transitioning to PLAYER_TURN");
              setPhase("PLAYER_TURN");
            } else {
              const firstAI = aiPlayers.find((ai) => ai.position === firstSeat);
              debugLog(
                "gamePhases",
                `✓ AI player "${firstAI?.character.name}" in seat ${firstSeat} acts first`,
              );
              if (playerSeat !== null) {
                debugLog(
                  "gamePhases",
                  `  Player in seat ${playerSeat} will act when their turn comes`,
                );
              }
              debugLog("gamePhases", "→ Transitioning to AI_TURNS");
              setPhase("AI_TURNS");
              setActivePlayerIndex(0); // Start with first AI player
            }
          }

          // Check if dealer should peek for blackjack (American rules)
          const shouldPeek = gameSettings.dealerPeekRule === "AMERICAN_PEEK";
          const dealerUpCard = dealerCard1;
          const canHaveBlackjack =
            dealerUpCard.rank === "A" || dealerUpCard.value === 10;

          // Offer insurance if enabled and dealer shows Ace
          const shouldOfferInsurance =
            gameSettings.insuranceAvailable && dealerUpCard.rank === "A";

          if (shouldOfferInsurance) {
            debugLog("insurance", "Dealer showing Ace - OFFERING INSURANCE");
            setInsuranceOffered(true);
            setPhase("INSURANCE");
            // Insurance phase hook will handle the flow
            return;
          }

          if (shouldPeek && canHaveBlackjack) {
            // Show "Peeking..." in speech bubble
            debugLog(
              "dealCards",
              `Dealer showing ${dealerUpCard.rank} - checking for blackjack...`,
            );
            addSpeechBubble("dealer", "Peeking...", -1);

            registerTimeout(() => {
              // Check for dealer blackjack (natural 21 with 2 cards)
              const dealerCards = [dealerCard1, dealerCard2];
              const dealerValue = calculateHandValue(dealerCards);
              if (dealerValue === 21) {
                debugLog(
                  "dealCards",
                  "DEALER BLACKJACK! Revealing hole card and moving to RESOLVING",
                );
                setDealerRevealed(true);
                // Count the hole card now that it's revealed
                setRunningCount((prev) => prev + dealerCard2.count);
                debugLog(
                  "dealCards",
                  `Counting revealed hole card: ${dealerCard2.rank}${dealerCard2.suit} (count: ${dealerCard2.count})`,
                );
                addSpeechBubble("dealer", "Blackjack!", -1);

                // Trigger AI player reactions to dealer blackjack
                registerTimeout(() => {
                  showEndOfHandReactions();
                }, 500);

                // Skip player turn and AI turns, go straight to resolving
                registerTimeout(() => {
                  setPhase("RESOLVING");
                }, 2000);
              } else {
                debugLog(
                  "dealCards",
                  `Dealer showing: ${dealerCard1.rank}${dealerCard1.suit}`,
                );
                debugLog(
                  "dealCards",
                  `Dealer hole card: ${dealerCard2.rank}${dealerCard2.suit} [hidden]`,
                );

                // Move to next phase after peek
                proceedAfterPeek();
              }
            }, 1500); // Peek delay
            return; // Exit early, will continue after peek
          }

          // No peek needed
          proceedAfterPeek();
        },
        delay + CARD_ANIMATION_DURATION + 500,
      );
    },
    [
      aiPlayers,
      shoe,
      cardsDealt,
      runningCount,
      shoesDealt,
      gameSettings.numberOfDecks,
      gameSettings.countingSystem,
      gameSettings.insuranceAvailable,
      gameSettings.dealerPeekRule,
      registerTimeout,
      playerSeat,
      playerHand,
      getCardPosition,
      selectedTestScenario,
      setShoe,
      setCardsDealt,
      setRunningCount,
      setShoesDealt,
      setInsuranceOffered,
      setFlyingCards,
      setDealerHand,
      setPlayerHand,
      setAIPlayers,
      setDealerRevealed,
      setPhase,
      showEndOfHandReactions,
      addSpeechBubble,
      setActivePlayerIndex,
    ],
  );

  const hit = useCallback(() => {
    debugLog("playerActions", "=== PLAYER ACTION: HIT ===");

    // Record decision accuracy (only for non-split hands with dealer card visible)
    if (
      !playerHand.isSplit &&
      dealerHand.cards.length > 0 &&
      playerHand.cards.length === 2
    ) {
      const dealerUpCard = dealerHand.cards[0];
      const canSplitHand =
        canSplit(playerHand.cards) && playerChips >= playerHand.bet;
      const canDoubleHand = playerChips >= playerHand.bet;
      const correctAction = getBasicStrategyAction(
        playerHand.cards,
        dealerUpCard,
        gameSettings,
        canSplitHand,
        canDoubleHand,
      );
      addDecision("H", correctAction);
      debugLog(
        "playerActions",
        `Decision: HIT, Correct: ${correctAction}, Match: ${correctAction === "H"}`,
      );
    }

    // Check if we're playing split hands
    if (playerHand.isSplit && playerHand.splitHands) {
      const activeIndex = playerHand.activeSplitHandIndex ?? 0;
      const activeHand = playerHand.splitHands[activeIndex];

      debugLog("playerActions", `Playing split hand ${activeIndex + 1}`);
      const currentHandStr = activeHand.cards
        .map((c) => `${c.rank}${c.suit}`)
        .join(", ");
      debugLog("playerActions", `Current hand: ${currentHandStr}`);
      debugLog(
        "playerActions",
        `Current hand value: ${calculateHandValue(activeHand.cards)}`,
      );

      const card = dealCardFromShoe();
      debugLog(
        "playerActions",
        `Dealt card: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count})`,
      );

      // Update split hand with new card
      const newSplitHands = [...playerHand.splitHands];
      newSplitHands[activeIndex] = {
        ...activeHand,
        cards: [...activeHand.cards, card],
      };

      const newHandValue = calculateHandValue(newSplitHands[activeIndex].cards);
      debugLog("playerActions", `New hand value: ${newHandValue}`);

      if (newHandValue > 21) {
        debugLog("playerActions", `Hand ${activeIndex + 1} BUSTED!`);
        // Mark this hand as busted and finished
        setPlayerHand((prev) => ({
          ...prev,
          splitHands: newSplitHands,
        }));

        // Move to next hand or finish
        registerTimeout(() => {
          if (activeIndex === 0) {
            debugLog("playerActions", "Moving to second hand");
            setPlayerHand((prev) => ({
              ...prev,
              activeSplitHandIndex: 1,
            }));
          } else {
            debugLog("playerActions", AI_TURNS_TRANSITION_MSG);
            setPlayerFinished(true);
            setPhase("AI_TURNS");
          }
        }, 1000);
      } else {
        setPlayerHand((prev) => ({
          ...prev,
          splitHands: newSplitHands,
        }));
      }
      return;
    }

    // Normal (non-split) hit logic
    const playerHandStr = playerHand.cards
      .map((c) => `${c.rank}${c.suit}`)
      .join(", ");
    debugLog("playerActions", `Current hand: ${playerHandStr}`);
    debugLog(
      "playerActions",
      `Current hand value: ${calculateHandValue(playerHand.cards)}`,
    );

    // Mark player as finished to hide the action modal immediately
    setPlayerFinished(true);

    // Add a delay before dealing the card to give a more realistic feel
    registerTimeout(() => {
      const card = dealCardFromShoe();
      debugLog(
        "playerActions",
        `Dealt card: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${runningCount + card.count}`,
      );

      // Add flying card animation
      const shoePosition = getCardPosition("shoe", aiPlayers, playerSeat);
      const playerPosition = getCardPosition(
        "player",
        aiPlayers,
        playerSeat,
        undefined,
        playerHand.cards.length,
      );

      const flyingCard: FlyingCardData = {
        id: `hit-player-${Date.now()}-${(cardIdCounter += 1)}`,
        card,
        fromPosition: shoePosition,
        toPosition: playerPosition,
      };

      setFlyingCards((prev) => [...prev, flyingCard]);

      // Add card to hand after animation completes
      registerTimeout(() => {
        // Calculate new hand with the new card
        const newCards = [...playerHand.cards, card];
        const newHandValue = calculateHandValue(newCards);

        const newHandStr = newCards.map((c) => `${c.rank}${c.suit}`).join(", ");
        debugLog("playerActions", `New hand: ${newHandStr}`);
        debugLog("playerActions", `New hand value: ${newHandValue}`);

        setPlayerHand((prev) => ({ ...prev, cards: newCards }));
        setFlyingCards((prev) => prev.filter((fc) => fc.id !== flyingCard.id));

        if (newHandValue > 21) {
          debugLog("playerActions", "PLAYER BUSTED!");
          debugLog("playerActions", "Marking player as finished");
          setPlayerFinished(true);
          // Show BUST indicator
          setPlayerActions((prev) => new Map(prev).set(-1, "BUST"));

          // Muck (clear) the cards after showing bust indicator
          registerTimeout(() => {
            setPlayerHand((prev) => ({ ...prev, cards: [] }));
            setPlayerActions((prev) => {
              const newMap = new Map(prev);
              newMap.delete(-1);
              return newMap;
            });
            // Return to AI_TURNS - the hook will check if there are remaining AI players after us
            debugLog("playerActions", AI_TURNS_TRANSITION_MSG);
            setPhase("AI_TURNS");
          }, 1500); // Show BUST for 1.5s then muck cards
        } else {
          // Player didn't bust, allow them to take another action
          setPlayerFinished(false);
        }
      }, CARD_ANIMATION_DURATION); // Match FlyingCard animation duration
    }, 500); // 500ms delay before dealing
  }, [
    playerHand,
    dealerHand,
    dealCardFromShoe,
    getCardPosition,
    runningCount,
    aiPlayers,
    playerSeat,
    playerChips,
    gameSettings,
    registerTimeout,
    setFlyingCards,
    setPlayerHand,
    setPlayerActions,
    setPhase,
    setPlayerFinished,
    addDecision,
  ]);

  const stand = useCallback(() => {
    debugLog("playerActions", "=== PLAYER ACTION: STAND ===");

    // Record decision accuracy (only for non-split hands with dealer card visible)
    if (
      !playerHand.isSplit &&
      dealerHand.cards.length > 0 &&
      playerHand.cards.length >= 2
    ) {
      const dealerUpCard = dealerHand.cards[0];
      const canSplitHand =
        playerHand.cards.length === 2 &&
        canSplit(playerHand.cards) &&
        playerChips >= playerHand.bet;
      const canDoubleHand =
        playerHand.cards.length === 2 && playerChips >= playerHand.bet;
      const correctAction = getBasicStrategyAction(
        playerHand.cards,
        dealerUpCard,
        gameSettings,
        canSplitHand,
        canDoubleHand,
      );
      addDecision("S", correctAction);
      debugLog(
        "playerActions",
        `Decision: STAND, Correct: ${correctAction}, Match: ${correctAction === "S"}`,
      );
    }

    // Check if we're playing split hands
    if (playerHand.isSplit && playerHand.splitHands) {
      const activeIndex = playerHand.activeSplitHandIndex ?? 0;
      const activeHand = playerHand.splitHands[activeIndex];

      debugLog("playerActions", `Standing on split hand ${activeIndex + 1}`);
      debugLog(
        "playerActions",
        `Final hand value: ${calculateHandValue(activeHand.cards)}`,
      );
      const finalHandStr = activeHand.cards
        .map((c) => `${c.rank}${c.suit}`)
        .join(", ");
      debugLog("playerActions", `Final hand: ${finalHandStr}`);

      if (activeIndex === 0) {
        // Move to second hand
        debugLog("playerActions", "Moving to second hand");
        setPlayerHand((prev) => ({
          ...prev,
          activeSplitHandIndex: 1,
        }));
      } else {
        // Both hands complete
        debugLog("playerActions", AI_TURNS_TRANSITION_MSG);
        setPlayerFinished(true);
        setPhase("AI_TURNS");
      }
      return;
    }

    // Normal (non-split) stand logic
    debugLog(
      "playerActions",
      `Final hand value: ${calculateHandValue(playerHand.cards)}`,
    );
    const playerFinalHandStr = playerHand.cards
      .map((c) => `${c.rank}${c.suit}`)
      .join(", ");
    debugLog("playerActions", `Final hand: ${playerFinalHandStr}`);
    debugLog("playerActions", "Marking player as finished");
    setPlayerFinished(true);
    // Return to AI_TURNS - the hook will check if there are remaining AI players after us
    debugLog("playerActions", AI_TURNS_TRANSITION_MSG);
    setPhase("AI_TURNS");
  }, [
    playerHand,
    dealerHand,
    playerChips,
    gameSettings,
    setPhase,
    setPlayerFinished,
    setPlayerHand,
    addDecision,
  ]);

  const doubleDown = useCallback(() => {
    debugLog("playerActions", "=== PLAYER ACTION: DOUBLE DOWN ===");

    // Record decision accuracy
    if (dealerHand.cards.length > 0 && playerHand.cards.length === 2) {
      const dealerUpCard = dealerHand.cards[0];
      const canSplitHand =
        canSplit(playerHand.cards) && playerChips >= playerHand.bet;
      const correctAction = getBasicStrategyAction(
        playerHand.cards,
        dealerUpCard,
        gameSettings,
        canSplitHand,
        true, // canDoubleHand - we're already doubling
      );
      addDecision("D", correctAction);
      debugLog(
        "playerActions",
        `Decision: DOUBLE, Correct: ${correctAction}, Match: ${correctAction === "D"}`,
      );
    }

    debugLog(
      "playerActions",
      `Current hand value: ${calculateHandValue(playerHand.cards)}`,
    );
    const doubleDownHandStr = playerHand.cards
      .map((c) => `${c.rank}${c.suit}`)
      .join(", ");
    debugLog("playerActions", `Current hand: ${doubleDownHandStr}`);
    debugLog("playerActions", `Current bet: $${playerHand.bet}`);
    debugLog("playerActions", `Doubling bet to: $${playerHand.bet * 2}`);

    // Mark player as finished to hide the action modal immediately
    setPlayerFinished(true);

    // Double the bet and deduct from chips
    const doubledBet = playerHand.bet * 2;
    setPlayerHand((prev) => ({ ...prev, bet: doubledBet }));
    setCurrentBet(doubledBet); // Update visual display
    setPlayerChips((prev) => prev - playerHand.bet);
    setPlayerActions((prev) => new Map(prev).set(-1, "DOUBLE"));

    // Add a delay before dealing the card
    registerTimeout(() => {
      const card = dealCardFromShoe();
      debugLog(
        "playerActions",
        `Dealt card: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${runningCount + card.count}`,
      );

      // Add flying card animation
      const shoePosition = getCardPosition("shoe", aiPlayers, playerSeat);
      const playerPosition = getCardPosition(
        "player",
        aiPlayers,
        playerSeat,
        undefined,
        playerHand.cards.length,
      );

      const flyingCard: FlyingCardData = {
        id: `double-player-${Date.now()}-${(cardIdCounter += 1)}`,
        card,
        fromPosition: shoePosition,
        toPosition: playerPosition,
      };

      setFlyingCards((prev) => [...prev, flyingCard]);

      // Add card to hand after animation completes
      registerTimeout(() => {
        const newCards = [...playerHand.cards, card];
        const newHandValue = calculateHandValue(newCards);

        debugLog("playerActions", `Final hand value: ${newHandValue}`);
        const finalCardsStr = newCards
          .map((c) => `${c.rank}${c.suit}`)
          .join(", ");
        debugLog("playerActions", `Final hand: ${finalCardsStr}`);

        setPlayerHand((prev) => ({ ...prev, cards: newCards }));
        setFlyingCards((prev) => prev.filter((fc) => fc.id !== flyingCard.id));

        if (newHandValue > 21) {
          debugLog("playerActions", "PLAYER BUSTED!");
          // Show BUST indicator
          setPlayerActions((prev) => new Map(prev).set(-1, "BUST"));

          // Muck cards after showing bust indicator
          registerTimeout(() => {
            setPlayerHand((prev) => ({ ...prev, cards: [] }));
            setPlayerActions((prev) => {
              const newMap = new Map(prev);
              newMap.delete(-1);
              return newMap;
            });
            // Return to AI_TURNS - the hook will check if there are remaining AI players after us
            debugLog("playerActions", AI_TURNS_TRANSITION_MSG);
            setPhase("AI_TURNS");
          }, 1500);
        } else {
          // Player didn't bust, automatically stand (double down only gets one card)
          debugLog("playerActions", "Player stands after double down");
          registerTimeout(() => {
            setPlayerActions((prev) => {
              const newMap = new Map(prev);
              newMap.delete(-1);
              return newMap;
            });
            // Return to AI_TURNS - the hook will check if there are remaining AI players after us
            setPhase("AI_TURNS");
          }, 500);
        }
      }, CARD_ANIMATION_DURATION);
    }, 500);
  }, [
    playerHand,
    dealerHand,
    playerChips,
    gameSettings,
    dealCardFromShoe,
    getCardPosition,
    runningCount,
    aiPlayers,
    playerSeat,
    registerTimeout,
    setFlyingCards,
    setPlayerHand,
    setPlayerChips,
    setCurrentBet,
    setPlayerActions,
    setPhase,
    setPlayerFinished,
    addDecision,
  ]);

  const split = useCallback(() => {
    debugLog("playerActions", "=== PLAYER ACTION: SPLIT ===");

    // Record decision accuracy (only for initial splits, not resplits)
    if (
      !playerHand.isSplit &&
      dealerHand.cards.length > 0 &&
      playerHand.cards.length === 2
    ) {
      const dealerUpCard = dealerHand.cards[0];
      const canDoubleHand = playerChips >= playerHand.bet * 2; // Need chips for split + potential double
      const correctAction = getBasicStrategyAction(
        playerHand.cards,
        dealerUpCard,
        gameSettings,
        true, // canSplitHand - we're already splitting
        canDoubleHand,
      );
      addDecision("SP", correctAction);
      debugLog(
        "playerActions",
        `Decision: SPLIT, Correct: ${correctAction}, Match: ${correctAction === "SP"}`,
      );
    }

    // Check if this is a resplit (already in split mode)
    const isResplit = playerHand.isSplit && playerHand.splitHands;
    const currentSplitCount = isResplit ? playerHand.splitHands!.length : 0;

    // Get the hand being split
    const handToSplit = isResplit
      ? playerHand.splitHands![playerHand.activeSplitHandIndex!]
      : playerHand;

    const splitHandStr = handToSplit.cards
      .map((c) => `${c.rank}${c.suit}`)
      .join(", ");
    debugLog("playerActions", `Current hand: ${splitHandStr}`);
    debugLog("playerActions", `Current bet: $${handToSplit.bet}`);
    debugLog(
      "playerActions",
      `Is resplit: ${isResplit}, current split count: ${currentSplitCount}`,
    );

    // Verify player has enough chips for second bet
    if (playerChips < handToSplit.bet) {
      debugLog("playerActions", "ERROR: Not enough chips to split!");
      return;
    }

    // Check resplit limits
    if (currentSplitCount >= gameSettings.maxResplits + 1) {
      debugLog(
        "playerActions",
        `ERROR: Cannot resplit - already at max splits (${gameSettings.maxResplits})`,
      );
      return;
    }

    // Check resplit aces restriction
    if (
      handToSplit.cards[0].rank === "A" &&
      currentSplitCount > 0 &&
      !gameSettings.resplitAces
    ) {
      debugLog("playerActions", "ERROR: Cannot resplit aces (not allowed)");
      return;
    }

    // Split the two cards into two hands
    const [card1, card2] = handToSplit.cards;

    debugLog(
      "playerActions",
      `Splitting ${card1.rank}${card1.suit} and ${card2.rank}${card2.suit}`,
    );
    debugLog(
      "playerActions",
      `Deducting $${handToSplit.bet} from chips for second hand`,
    );

    // Deduct chips for the second bet
    setPlayerChips((prev) => prev - handToSplit.bet);

    // Create two hands, each with one card
    const hand1: PlayerHand = {
      cards: [card1],
      bet: handToSplit.bet,
    };

    const hand2: PlayerHand = {
      cards: [card2],
      bet: handToSplit.bet,
    };

    // Step 1: Show split hands (one card each)
    if (isResplit) {
      // Resplit: Replace current hand with two new hands
      const newSplitHands = [...playerHand.splitHands!];
      const activeIndex = playerHand.activeSplitHandIndex!;

      // Replace the current hand with hand2 and insert hand1 after it
      newSplitHands.splice(activeIndex, 1, hand2, hand1);

      setPlayerHand({
        cards: [], // Clear main hand
        bet: playerHand.bet,
        isSplit: true,
        splitHands: newSplitHands,
        activeSplitHandIndex: activeIndex, // Stay on first new hand
      });

      debugLog(
        "playerActions",
        `Resplit complete - now have ${newSplitHands.length} hands, playing hand ${activeIndex + 1}`,
      );
    } else {
      // Initial split: Create split state (hand1 on left, hand2 on right)
      setPlayerHand({
        cards: [], // Clear main hand
        bet: playerHand.bet,
        isSplit: true,
        splitHands: [hand1, hand2],
        activeSplitHandIndex: 0,
      });

      debugLog("playerActions", "Split complete - starting with first hand");
    }

    // Step 2: Deal first card to hand1 after delay
    registerTimeout(() => {
      const newCard1 = dealCardFromShoe();
      debugLog(
        "playerActions",
        `Dealing to first hand: ${newCard1.rank}${newCard1.suit} (value: ${newCard1.value})`,
      );

      setPlayerHand((prev) => {
        if (!prev.splitHands) return prev;
        const updatedHands = [...prev.splitHands];
        const handIndex = isResplit ? playerHand.activeSplitHandIndex! : 0;
        updatedHands[handIndex] = {
          ...updatedHands[handIndex],
          cards: [...updatedHands[handIndex].cards, newCard1],
        };
        return { ...prev, splitHands: updatedHands };
      });

      // Step 3: Deal second card to hand2 after another delay
      registerTimeout(() => {
        const newCard2 = dealCardFromShoe();
        debugLog(
          "playerActions",
          `Dealing to second hand: ${newCard2.rank}${newCard2.suit} (value: ${newCard2.value})`,
        );

        setPlayerHand((prev) => {
          if (!prev.splitHands) return prev;
          const updatedHands = [...prev.splitHands];
          const hand2Index = isResplit
            ? playerHand.activeSplitHandIndex! + 1
            : 1;
          updatedHands[hand2Index] = {
            ...updatedHands[hand2Index],
            cards: [...updatedHands[hand2Index].cards, newCard2],
          };
          return { ...prev, splitHands: updatedHands };
        });

        // Check for split aces after all cards are dealt
        const isSplitAces = hand1.cards[0].rank === "A";
        if (isSplitAces && !gameSettings.hitSplitAces) {
          debugLog(
            "playerActions",
            "Split Aces - cannot hit, automatically standing on both hands",
          );
          setPlayerFinished(true);
          return;
        }

        // Check if first hand is 21
        const hand1Value = calculateHandValue([...hand1.cards, newCard1]);
        if (hand1Value === 21) {
          debugLog(
            "playerActions",
            "First hand has 21 - automatically standing",
          );
          setPlayerHand((prev) => {
            const nextIndex = (prev.activeSplitHandIndex || 0) + 1;
            return { ...prev, activeSplitHandIndex: nextIndex };
          });
        }
      }, SPLIT_CARD_DEAL_DELAY);
    }, SPLIT_SEPARATION_DELAY);
  }, [
    playerHand,
    dealerHand,
    playerChips,
    gameSettings,
    dealCardFromShoe,
    registerTimeout,
    setPlayerHand,
    setPlayerChips,
    setPlayerFinished,
    addDecision,
  ]);

  const surrender = useCallback(() => {
    debugLog("playerActions", "=== PLAYER ACTION: SURRENDER ===");

    // Record decision accuracy
    if (dealerHand.cards.length > 0 && playerHand.cards.length === 2) {
      const dealerUpCard = dealerHand.cards[0];
      const canSplitHand =
        canSplit(playerHand.cards) && playerChips >= playerHand.bet;
      const canDoubleHand = playerChips >= playerHand.bet;
      const correctAction = getBasicStrategyAction(
        playerHand.cards,
        dealerUpCard,
        gameSettings,
        canSplitHand,
        canDoubleHand,
      );
      addDecision("SU", correctAction);
      debugLog(
        "playerActions",
        `Decision: SURRENDER, Correct: ${correctAction}, Match: ${correctAction === "SU"}`,
      );
    }

    const handValue = calculateHandValue(playerHand.cards);
    debugLog(
      "playerActions",
      `Hand value: ${handValue}, Bet: $${playerHand.bet}`,
    );

    // Calculate refund (50% of bet, rounded down)
    const refund = Math.floor(playerHand.bet / 2);
    debugLog("playerActions", `Refunding $${refund} (50% of bet)`);

    // Mark hand as finished and surrendered
    setPlayerFinished(true);
    setPlayerHand((prev) => ({
      ...prev,
      result: "SURRENDER",
    }));

    // Refund 50% of the bet
    setPlayerChips((prev) => prev + refund);

    // Record action
    if (playerSeat !== null) {
      setPlayerActions((prev) => {
        const newActions = new Map(prev);
        newActions.set(playerSeat, "STAND"); // Treat as stand for tracking purposes
        return newActions;
      });
    }

    debugLog(
      "playerActions",
      "Surrender complete - moving to AI_TURNS phase (to check for remaining AI players)",
    );

    // Return to AI_TURNS - the hook will check if there are remaining AI players after us
    registerTimeout(() => {
      setPhase("AI_TURNS");
    }, 500);
  }, [
    playerHand,
    dealerHand,
    playerChips,
    gameSettings,
    playerSeat,
    setPlayerHand,
    setPlayerChips,
    setPlayerFinished,
    setPlayerActions,
    setPhase,
    registerTimeout,
    addDecision,
  ]);

  return {
    startNewRound,
    dealInitialCards,
    hit,
    stand,
    doubleDown,
    split,
    surrender,
  };
}
