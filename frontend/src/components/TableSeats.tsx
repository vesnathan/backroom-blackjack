/* eslint-disable sonarjs/cognitive-complexity */
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { debugLog } from "@/utils/debug";
import {
  TABLE_POSITIONS,
  MOBILE_TABLE_POSITIONS,
  MOBILE_SEAT_MAPPING,
} from "@/constants/tablePositions";
import {
  getLayoutConfig,
  SPLIT_CONTAINER_WIDTH,
  SPLIT_CARDS_PER_ROW,
} from "@/constants/cardLayout";
import PlayingCard from "@/components/PlayingCard";
import TurnIndicator from "@/components/TurnIndicator";
import ActionBubble from "@/components/ActionBubble";
import PlayerDecisionInfo from "@/components/PlayerDecisionInfo";
import AIDecisionInfo from "@/components/AIDecisionInfo";
import { getAIAvatarPath } from "@/data/aiCharacters";
import { useGameState } from "@/contexts/GameStateContext";
import { useGameActions } from "@/contexts/GameActionsContext";
import { useUIState } from "@/contexts/UIStateContext";
import { getBasicStrategyAction } from "@/lib/basicStrategy";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

// Style constants
const BUTTON_BG_DARK = "rgba(0, 0, 0, 0.7)";
const BUTTON_BORDER_GOLD = "2px solid #FFD700";
const GOLD_GLOW_SHADOW = "0 0 20px rgba(255, 215, 0, 0.5)";
const TEXT_SHADOW_DARK = "1px 1px 2px rgba(0,0,0,0.8)";
const TRANSFORM_CENTER_X = "translateX(-50%)";

// Chip colors by denomination
const CHIP_COLORS: Record<number, { bg: string; border: string }> = {
  5: { bg: "#EF4444", border: "#B91C1C" },
  10: { bg: "#3B82F6", border: "#1D4ED8" },
  25: { bg: "#10B981", border: "#047857" },
  50: { bg: "#F59E0B", border: "#B45309" },
  100: { bg: "#1F2937", border: "#000000" },
  500: { bg: "#9B59B6", border: "#6B21A8" },
};

// Break a bet amount into chip denominations (for visual display)
function getChipBreakdown(amount: number): number[] {
  const chips: number[] = [];
  const denoms = [500, 100, 50, 25, 10, 5];
  let remaining = amount;
  denoms.forEach((denom) => {
    while (remaining >= denom && chips.length < 8) {
      chips.push(denom);
      remaining -= denom;
    }
  });
  return chips;
}

interface TableSeatsProps {
  isMobileMode?: boolean;
}

export default function TableSeats({ isMobileMode = false }: TableSeatsProps) {
  const {
    aiPlayers,
    playerSeat,
    playerHand,
    dealerHand,
    phase,
    activePlayerIndex,
    playerActions,
    gameSettings,
    currentBet,
  } = useGameState();
  const { setPlayerSeat, registerTimeout } = useGameActions();
  const { devTestingMode, selectedTestScenario } = useUIState();
  const { isAuthenticated } = useAuth();
  const { tierName, tierColor, displayName, avatarUrl, isSubscribed } =
    useSubscription();

  // Get positions and seat count based on mode
  const positions = isMobileMode ? MOBILE_TABLE_POSITIONS : TABLE_POSITIONS;
  const seatCount = isMobileMode ? 5 : 8;

  // Get layout config from single source of truth
  const layout = getLayoutConfig(isMobileMode);
  const { avatarSize, avatarBorderWidth, cardAvatarGap } = layout;
  const {
    cardWidth,
    cardHeight,
    cardContainerWidth,
    cardContainerHeight,
    cardGridHSpacing,
    cardGridVSpacing,
    cardsPerRow,
  } = layout;

  // Map mobile seat index to desktop seat index (for AI player lookups)
  const getDesktopSeatIndex = (mobileSeatIndex: number): number => {
    if (!isMobileMode) return mobileSeatIndex;
    return MOBILE_SEAT_MAPPING[mobileSeatIndex];
  };

  // Track which positions have their split hands expanded (key: seat position or -1 for player)
  const [expandedSplitHands, setExpandedSplitHands] = useState<Set<number>>(
    new Set(),
  );

  // Reset expanded state when a new round starts (phase goes to BETTING or DEALING)
  useEffect(() => {
    if (phase === "BETTING" || phase === "DEALING") {
      setExpandedSplitHands(new Set());
    }
  }, [phase]);

  const toggleSplitHandsExpanded = (position: number) => {
    setExpandedSplitHands((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(position)) {
        newSet.delete(position);
      } else {
        newSet.add(position);
      }
      return newSet;
    });
  };

  // Determine which AI player is being tested (has forced cards in test scenario)
  const getTestedAIIndex = () => {
    if (!selectedTestScenario?.aiHands) return null;

    // Find the first AI player position that has forced cards
    const testedPositions = Object.keys(selectedTestScenario.aiHands).map(
      Number,
    );
    if (testedPositions.length === 0) return null;

    const testedPosition = testedPositions[0]; // Use first tested position
    const aiIndex = aiPlayers.findIndex((ai) => ai.position === testedPosition);
    return aiIndex >= 0 ? aiIndex : null;
  };

  const testedAIIndex = getTestedAIIndex();
  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
      }}
    >
      {Array.from({ length: seatCount }, (_, i) => i).map((mobileSeatIdx) => {
        // Map mobile seat index to desktop seat index for game logic
        const desktopSeatIndex = getDesktopSeatIndex(mobileSeatIdx);
        const [x, y] = positions[mobileSeatIdx];
        // Find if this seat is occupied by an AI player (using desktop index)
        const aiPlayer = aiPlayers.find(
          (ai) => ai.position === desktopSeatIndex,
        );
        const isPlayerSeat = playerSeat === desktopSeatIndex;
        const isEmpty = !aiPlayer && !isPlayerSeat;

        return (
          <div
            key={mobileSeatIdx}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              // eslint-disable-next-line sonarjs/no-duplicate-string
              transform: "translate(-50%, 0)",
              textAlign: "center",
            }}
          >
            {/* Empty Seat - Clickable */}
            {isEmpty && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (playerSeat === null) {
                    debugLog(
                      "gamePhases",
                      `=== PLAYER SITTING AT SEAT ${desktopSeatIndex} ===`,
                    );
                    debugLog("gamePhases", `Phase before sitting: ${phase}`);
                    setPlayerSeat(desktopSeatIndex);
                  } else {
                    debugLog(
                      "gamePhases",
                      `Cannot sit - player already seated at ${playerSeat}`,
                    );
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === " ") &&
                    playerSeat === null
                  ) {
                    setPlayerSeat(desktopSeatIndex);
                  }
                }}
                style={{
                  width: `${avatarSize}px`,
                  height: `${avatarSize}px`,
                  borderRadius: "50%",
                  border: "3px solid rgba(255, 215, 0, 0.3)",
                  backgroundColor: "rgba(26, 71, 42, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: playerSeat === null ? "pointer" : "default",
                  transition: "all 0.3s ease",
                  boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.4)",
                }}
                onMouseEnter={(e) => {
                  if (playerSeat === null) {
                    e.currentTarget.style.border =
                      "3px solid rgba(255, 215, 0, 0.9)";
                    e.currentTarget.style.backgroundColor =
                      "rgba(26, 71, 42, 0.7)";
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = GOLD_GLOW_SHADOW;
                  }
                }}
                onMouseLeave={(e) => {
                  if (playerSeat === null) {
                    e.currentTarget.style.border =
                      "3px solid rgba(255, 215, 0, 0.3)";
                    e.currentTarget.style.backgroundColor =
                      "rgba(26, 71, 42, 0.4)";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "inset 0 2px 8px rgba(0, 0, 0, 0.4)";
                  }
                }}
              >
                <span
                  style={{
                    color: "rgba(255, 215, 0, 0.6)",
                    fontSize: isMobileMode ? "9px" : "11px",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                  }}
                >
                  {playerSeat === null ? "OPEN" : ""}
                </span>
              </div>
            )}

            {/* AI Player */}
            {aiPlayer &&
              (() => {
                // Find the index of this AI player in the aiPlayers array
                const aiPlayerIndex = aiPlayers.findIndex(
                  (ai) => ai.position === desktopSeatIndex,
                );

                return (
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    {/* Cards positioned absolutely above - handle both regular and split hands */}
                    {(aiPlayer.hand.cards.length > 0 ||
                      (aiPlayer.hand.splitHands &&
                        aiPlayer.hand.splitHands.length > 0)) && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: `calc(100% + ${cardAvatarGap}px)`,
                          left: "50%",
                          transform: "translate(-50%, 0)",
                          display: "flex",
                          gap: isMobileMode ? "10px" : "20px",
                          justifyContent: "center",
                        }}
                      >
                        {/* Regular hand (not split) */}
                        {!aiPlayer.hand.splitHands &&
                          aiPlayer.hand.cards.length > 0 && (
                            <div
                              style={{
                                position: "relative",
                                width: `${cardContainerWidth}px`,
                                height: `${cardContainerHeight}px`,
                              }}
                            >
                              {/* Cards in multi-deck shoe can have identical rank+suit, index needed */}
                              {aiPlayer.hand.cards.map((card, cardIdx) => {
                                const row = Math.floor(cardIdx / cardsPerRow);
                                const col = cardIdx % cardsPerRow;
                                return (
                                  <div
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={`${card.rank}${card.suit}-${cardIdx}`}
                                    style={{
                                      position: "absolute",
                                      left: `${col * cardGridHSpacing}px`,
                                      bottom: `${row * cardGridVSpacing}px`,
                                      width: `${cardWidth}px`,
                                      height: `${cardHeight}px`,
                                      zIndex: 10,
                                    }}
                                  >
                                    <PlayingCard card={card} />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        {/* Split hands - render side by side or collapsed */}
                        {aiPlayer.hand.splitHands &&
                          (() => {
                            // Check if this AI player's split hands are done:
                            // - activeSplitHandIndex is undefined or past array length (all hands played)
                            // - OR this AI player's turn has passed (aiPlayerIndex < activePlayerIndex)
                            // - OR we're past AI_TURNS phase entirely
                            const thisPlayerTurnDone =
                              phase !== "AI_TURNS" ||
                              aiPlayerIndex < (activePlayerIndex ?? 0);
                            const allHandsDone =
                              aiPlayer.hand.activeSplitHandIndex ===
                                undefined ||
                              aiPlayer.hand.activeSplitHandIndex >=
                                aiPlayer.hand.splitHands.length ||
                              thisPlayerTurnDone;
                            const isExpanded =
                              expandedSplitHands.has(desktopSeatIndex);

                            // Show collapsed button when all hands are done and not expanded
                            if (allHandsDone && !isExpanded) {
                              return (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleSplitHandsExpanded(desktopSeatIndex)
                                  }
                                  style={{
                                    padding: "8px 16px",
                                    backgroundColor: BUTTON_BG_DARK,
                                    border: BUTTON_BORDER_GOLD,
                                    borderRadius: "8px",
                                    color: "#FFD700",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  View {aiPlayer.hand.splitHands.length} Hands
                                </button>
                              );
                            }

                            // Show full split hands
                            return (
                              <>
                                {allHandsDone && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleSplitHandsExpanded(desktopSeatIndex)
                                    }
                                    style={{
                                      position: "absolute",
                                      top: "-30px",
                                      right: "0",
                                      padding: "4px 8px",
                                      backgroundColor: BUTTON_BG_DARK,
                                      border: "1px solid #FFD700",
                                      borderRadius: "4px",
                                      color: "#FFD700",
                                      fontSize: "10px",
                                      cursor: "pointer",
                                      zIndex: 20,
                                    }}
                                  >
                                    ✕ Hide
                                  </button>
                                )}
                                {/* Render in reverse order so Hand 1 is on right, Hand 2 on left */}
                                {[...aiPlayer.hand.splitHands]
                                  .reverse()
                                  .map((splitHand, reverseIdx) => {
                                    // Calculate original index (Hand 1 = 0, Hand 2 = 1, etc.)
                                    const handIdx =
                                      aiPlayer.hand.splitHands!.length -
                                      1 -
                                      reverseIdx;
                                    return (
                                      <div
                                        // eslint-disable-next-line react/no-array-index-key
                                        key={`split-${handIdx}`}
                                        style={{
                                          position: "relative",
                                          width: `${isMobileMode ? SPLIT_CONTAINER_WIDTH * 0.55 : SPLIT_CONTAINER_WIDTH}px`,
                                          height: `${cardContainerHeight}px`,
                                          opacity:
                                            aiPlayer.hand
                                              .activeSplitHandIndex === handIdx
                                              ? 1
                                              : 0.6,
                                          border:
                                            aiPlayer.hand
                                              .activeSplitHandIndex === handIdx
                                              ? BUTTON_BORDER_GOLD
                                              : "2px solid transparent",
                                          borderRadius: "8px",
                                          padding: "4px",
                                        }}
                                      >
                                        {/* Hand number label */}
                                        <div
                                          style={{
                                            position: "absolute",
                                            top: "-20px",
                                            left: "50%",
                                            transform: TRANSFORM_CENTER_X,
                                            fontSize: isMobileMode
                                              ? "10px"
                                              : "12px",
                                            color: "#FFD700",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          Hand {handIdx + 1}
                                        </div>
                                        {splitHand.cards.map(
                                          (card, cardIdx) => {
                                            const row = Math.floor(
                                              cardIdx / SPLIT_CARDS_PER_ROW,
                                            );
                                            const col =
                                              cardIdx % SPLIT_CARDS_PER_ROW;
                                            return (
                                              <div
                                                // eslint-disable-next-line react/no-array-index-key
                                                key={`${card.rank}${card.suit}-${cardIdx}`}
                                                style={{
                                                  position: "absolute",
                                                  left: `${col * cardGridHSpacing}px`,
                                                  bottom: `${row * cardGridVSpacing}px`,
                                                  width: `${cardWidth}px`,
                                                  height: `${cardHeight}px`,
                                                  zIndex: 10,
                                                }}
                                              >
                                                <PlayingCard card={card} />
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                    );
                                  })}
                              </>
                            );
                          })()}
                      </div>
                    )}
                    {/* Avatar with indicators */}
                    <div
                      style={{
                        position: "relative",
                        width: `${avatarSize}px`,
                        height: `${avatarSize}px`,
                        marginBottom: isMobileMode ? "2px" : "6px",
                      }}
                    >
                      {/* AI Decision Info - shows decision stats in dev mode for tested AI only */}
                      {devTestingMode &&
                        phase === "AI_TURNS" &&
                        activePlayerIndex === aiPlayerIndex &&
                        aiPlayerIndex === testedAIIndex &&
                        aiPlayer.hand.cards.length >= 2 &&
                        dealerHand.cards.length > 0 &&
                        !aiPlayer.hand.splitHands && (
                          <AIDecisionInfo
                            character={aiPlayer.character}
                            playerCards={aiPlayer.hand.cards}
                            dealerUpCard={dealerHand.cards[0]}
                            basicStrategyAction={getBasicStrategyAction(
                              aiPlayer.hand.cards,
                              dealerHand.cards[0],
                              gameSettings,
                              aiPlayer.hand.cards.length === 2 &&
                                aiPlayer.hand.cards[0].rank ===
                                  aiPlayer.hand.cards[1].rank,
                              aiPlayer.hand.cards.length === 2,
                            )}
                            canSplit={
                              aiPlayer.hand.cards.length === 2 &&
                              aiPlayer.hand.cards[0].rank ===
                                aiPlayer.hand.cards[1].rank
                            }
                            canDouble={aiPlayer.hand.cards.length === 2}
                            canSurrender={gameSettings.lateSurrenderAllowed}
                          />
                        )}

                      {/* Turn Indicator */}
                      <TurnIndicator
                        isActive={activePlayerIndex === aiPlayerIndex}
                      />

                      {/* Action Bubble */}
                      {playerActions.has(aiPlayerIndex) && (
                        <ActionBubble
                          action={
                            playerActions.get(aiPlayerIndex)! as
                              | "HIT"
                              | "STAND"
                              | "DOUBLE"
                              | "SPLIT"
                              | "BUST"
                              | "BLACKJACK"
                          }
                          registerTimeout={registerTimeout}
                        />
                      )}

                      <div
                        style={{
                          width: `${avatarSize}px`,
                          height: `${avatarSize}px`,
                          borderRadius: "50%",
                          border: `${avatarBorderWidth}px solid #FFD700`,
                          overflow: "hidden",
                          backgroundColor: "#333",
                        }}
                      >
                        <Image
                          src={getAIAvatarPath(aiPlayer.character)}
                          alt={aiPlayer.character.name}
                          width={avatarSize}
                          height={avatarSize}
                          unoptimized
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    </div>
                    {/* Name */}
                    <div
                      className={
                        isMobileMode
                          ? "text-white text-sm"
                          : "text-white text-base"
                      }
                      style={{
                        fontWeight: "bold",
                        textShadow: TEXT_SHADOW_DARK,
                      }}
                    >
                      {isMobileMode
                        ? aiPlayer.character.name.split(" ")[0]
                        : aiPlayer.character.name}
                    </div>
                  </div>
                );
              })()}

            {/* Human Player */}
            {isPlayerSeat && (
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {/* Cards positioned absolutely above - handle both regular and split hands */}
                {(playerHand.cards.length > 0 ||
                  (playerHand.splitHands &&
                    playerHand.splitHands.length > 0)) && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: `calc(100% + ${cardAvatarGap}px)`,
                      left: "50%",
                      transform: "translate(-50%, 0)",
                      display: "flex",
                      gap: isMobileMode ? "10px" : "20px",
                      justifyContent: "center",
                    }}
                  >
                    {/* Regular hand (not split) */}
                    {!playerHand.splitHands && playerHand.cards.length > 0 && (
                      <div
                        style={{
                          position: "relative",
                          width: `${cardContainerWidth}px`,
                          height: `${cardContainerHeight}px`,
                        }}
                      >
                        {playerHand.cards.map((card, cardIdx) => {
                          const row = Math.floor(cardIdx / cardsPerRow);
                          const col = cardIdx % cardsPerRow;
                          return (
                            <div
                              // eslint-disable-next-line react/no-array-index-key
                              key={`${card.rank}${card.suit}-${cardIdx}`}
                              style={{
                                position: "absolute",
                                left: `${col * cardGridHSpacing}px`,
                                bottom: `${row * cardGridVSpacing}px`,
                                width: `${cardWidth}px`,
                                height: `${cardHeight}px`,
                                zIndex: 10,
                              }}
                            >
                              <PlayingCard card={card} />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Split hands - render side by side or collapsed */}
                    {playerHand.splitHands &&
                      (() => {
                        // Check if all split hands are done (no more active hand or phase moved past PLAYER_TURN)
                        const allHandsDone =
                          playerHand.activeSplitHandIndex === undefined ||
                          playerHand.activeSplitHandIndex >=
                            playerHand.splitHands.length ||
                          phase !== "PLAYER_TURN";
                        const isExpanded = expandedSplitHands.has(-1); // -1 represents human player

                        // Show collapsed button when all hands are done and not expanded
                        if (allHandsDone && !isExpanded) {
                          return (
                            <button
                              type="button"
                              onClick={() => toggleSplitHandsExpanded(-1)}
                              style={{
                                padding: "8px 16px",
                                backgroundColor: BUTTON_BG_DARK,
                                border: BUTTON_BORDER_GOLD,
                                borderRadius: "8px",
                                color: "#FFD700",
                                fontSize: "12px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              View {playerHand.splitHands.length} Hands
                            </button>
                          );
                        }

                        // Show full split hands
                        return (
                          <>
                            {allHandsDone && (
                              <button
                                type="button"
                                onClick={() => toggleSplitHandsExpanded(-1)}
                                style={{
                                  position: "absolute",
                                  top: "-30px",
                                  right: "0",
                                  padding: "4px 8px",
                                  backgroundColor: BUTTON_BG_DARK,
                                  border: "1px solid #FFD700",
                                  borderRadius: "4px",
                                  color: "#FFD700",
                                  fontSize: "10px",
                                  cursor: "pointer",
                                  zIndex: 20,
                                }}
                              >
                                ✕ Hide
                              </button>
                            )}
                            {/* Render in reverse order so Hand 1 is on right, Hand 2 on left */}
                            {[...playerHand.splitHands]
                              .reverse()
                              .map((splitHand, reverseIdx) => {
                                // Calculate original index (Hand 1 = 0, Hand 2 = 1, etc.)
                                const handIdx =
                                  playerHand.splitHands!.length -
                                  1 -
                                  reverseIdx;
                                return (
                                  <div
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={`split-${handIdx}`}
                                    style={{
                                      position: "relative",
                                      width: `${isMobileMode ? SPLIT_CONTAINER_WIDTH * 0.55 : SPLIT_CONTAINER_WIDTH}px`,
                                      height: `${cardContainerHeight}px`,
                                      opacity:
                                        playerHand.activeSplitHandIndex ===
                                        handIdx
                                          ? 1
                                          : 0.6,
                                      border:
                                        playerHand.activeSplitHandIndex ===
                                        handIdx
                                          ? BUTTON_BORDER_GOLD
                                          : "2px solid transparent",
                                      borderRadius: "8px",
                                      padding: "4px",
                                    }}
                                  >
                                    {/* Hand number label */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: "-20px",
                                        left: "50%",
                                        transform: TRANSFORM_CENTER_X,
                                        fontSize: isMobileMode
                                          ? "10px"
                                          : "12px",
                                        color: "#FFD700",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Hand {handIdx + 1}
                                    </div>
                                    {splitHand.cards.map((card, cardIdx) => {
                                      const row = Math.floor(
                                        cardIdx / SPLIT_CARDS_PER_ROW,
                                      );
                                      const col = cardIdx % SPLIT_CARDS_PER_ROW;
                                      return (
                                        <div
                                          // eslint-disable-next-line react/no-array-index-key
                                          key={`${card.rank}${card.suit}-${cardIdx}`}
                                          style={{
                                            position: "absolute",
                                            left: `${col * cardGridHSpacing}px`,
                                            bottom: `${row * cardGridVSpacing}px`,
                                            width: `${cardWidth}px`,
                                            height: `${cardHeight}px`,
                                            zIndex: 10,
                                          }}
                                        >
                                          <PlayingCard card={card} />
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                          </>
                        );
                      })()}
                  </div>
                )}
                {/* Avatar with indicators */}
                <div
                  style={{
                    position: "relative",
                    width: `${avatarSize}px`,
                    height: `${avatarSize}px`,
                    marginBottom: isMobileMode ? "2px" : "6px",
                  }}
                >
                  {/* Player Decision Info - shows basic strategy recommendation in dev mode */}
                  {devTestingMode &&
                    phase === "PLAYER_TURN" &&
                    playerHand.cards.length >= 2 &&
                    dealerHand.cards.length > 0 && (
                      <PlayerDecisionInfo
                        playerCards={playerHand.cards}
                        dealerUpCard={dealerHand.cards[0]}
                        basicStrategyAction={getBasicStrategyAction(
                          playerHand.cards,
                          dealerHand.cards[0],
                          gameSettings,
                          playerHand.cards.length === 2 &&
                            playerHand.cards[0].rank ===
                              playerHand.cards[1].rank,
                          playerHand.cards.length === 2,
                        )}
                        canSplit={
                          playerHand.cards.length === 2 &&
                          playerHand.cards[0].rank === playerHand.cards[1].rank
                        }
                        canDouble={playerHand.cards.length === 2}
                        canSurrender={gameSettings.lateSurrenderAllowed}
                      />
                    )}

                  {/* Turn Indicator - active during PLAYER_TURN phase */}
                  <TurnIndicator isActive={phase === "PLAYER_TURN"} />

                  {/* Action Bubble - shows player actions (HIT, STAND, BUST, BLACKJACK) */}
                  {playerActions.has(-1) && (
                    <ActionBubble
                      action={
                        playerActions.get(-1)! as
                          | "HIT"
                          | "STAND"
                          | "DOUBLE"
                          | "SPLIT"
                          | "BUST"
                          | "BLACKJACK"
                      }
                      registerTimeout={registerTimeout}
                    />
                  )}

                  {avatarUrl ? (
                    <div
                      style={{
                        width: `${avatarSize}px`,
                        height: `${avatarSize}px`,
                        borderRadius: "50%",
                        border: `${avatarBorderWidth}px solid #FFD700`,
                        overflow: "hidden",
                        backgroundColor: "#333",
                        boxShadow: GOLD_GLOW_SHADOW,
                      }}
                    >
                      <Image
                        src={avatarUrl}
                        alt="Your avatar"
                        width={avatarSize}
                        height={avatarSize}
                        unoptimized
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: `${avatarSize}px`,
                        height: `${avatarSize}px`,
                        borderRadius: "50%",
                        border: `${avatarBorderWidth}px solid #FFD700`,
                        backgroundColor: "#1a472a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: isMobileMode ? "20px" : "48px",
                        color: "#FFD700",
                        fontWeight: "bold",
                        boxShadow: GOLD_GLOW_SHADOW,
                      }}
                    >
                      YOU
                    </div>
                  )}
                </div>

                {/* Bet chips displayed above avatar */}
                {currentBet > 0 && phase !== "BETTING" && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 8px)",
                      left: "50%",
                      transform: TRANSFORM_CENTER_X,
                      display: "flex",
                      flexDirection: "column-reverse",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "4px",
                        fontSize: "12px",
                        color: "#FFD700",
                        fontWeight: "bold",
                        textShadow: TEXT_SHADOW_DARK,
                      }}
                    >
                      ${currentBet}
                    </div>
                    {getChipBreakdown(currentBet).map((denom, idx) => (
                      <div
                        // eslint-disable-next-line react/no-array-index-key
                        key={`bet-chip-${idx}`}
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: CHIP_COLORS[denom]?.bg || "#666",
                          border: `3px solid ${CHIP_COLORS[denom]?.border || "#333"}`,
                          marginBottom: idx > 0 ? "-30px" : "0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: denom === 100 ? "#FFD700" : "#FFF",
                          fontSize: "10px",
                          fontWeight: "bold",
                          textShadow: "1px 1px 1px rgba(0,0,0,0.5)",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        }}
                      >
                        {denom}
                      </div>
                    ))}
                  </div>
                )}

                {/* Name with optional tier badge */}
                <div
                  className="text-white text-sm"
                  style={{
                    fontWeight: "bold",
                    textShadow: TEXT_SHADOW_DARK,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {isAuthenticated && displayName ? displayName : "You"}
                  {isAuthenticated && isSubscribed && tierName !== "Free" && (
                    <span
                      className="group"
                      style={{
                        position: "relative",
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: tierColor,
                        color: "#000",
                        fontWeight: "600",
                        textShadow: "none",
                        cursor: "pointer",
                      }}
                    >
                      {tierName}
                      {/* Tooltip on hover */}
                      <span
                        className="hidden group-hover:block"
                        style={{
                          position: "absolute",
                          bottom: "calc(100% + 8px)",
                          left: "50%",
                          transform: TRANSFORM_CENTER_X,
                          backgroundColor: "rgba(0, 0, 0, 0.9)",
                          border: `2px solid ${tierColor}`,
                          borderRadius: "8px",
                          padding: "8px 12px",
                          whiteSpace: "nowrap",
                          zIndex: 50,
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: "normal",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: tierColor,
                            marginBottom: "4px",
                          }}
                        >
                          {tierName} Supporter
                        </div>
                        <div style={{ color: "#ccc" }}>
                          Thank you for supporting Backroom Blackjack!
                        </div>
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
