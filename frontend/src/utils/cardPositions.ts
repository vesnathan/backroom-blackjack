import { AIPlayer } from "@/types/gameState";
import {
  TABLE_POSITIONS,
  MOBILE_TABLE_POSITIONS,
  MOBILE_SEAT_MAPPING,
} from "@/constants/tablePositions";
import {
  getPlayerCardPosition,
  getDealerCardPosition,
} from "@/constants/cardLayout";
import { checkIsMobile } from "@/hooks/useIsMobile";

/**
 * Calculate the position for a flying card animation
 * Returns CSS position values (left, top) for the card's destination
 *
 * @param type - Type of card position: "ai", "player", "dealer", or "shoe"
 * @param aiPlayers - Array of AI players (needed for AI player positions)
 * @param playerSeat - Player's seat number (0-7) or null if not seated
 * @param index - AI player index (for type="ai")
 * @param cardIndex - Card index in hand (for calculating grid position)
 * @returns Position object with left and top CSS values
 */
export function getCardPosition(
  type: "ai" | "player" | "dealer" | "shoe",
  aiPlayers: AIPlayer[],
  playerSeat: number | null,
  index?: number,
  cardIndex?: number,
): { left: string; top: string } {
  const isMobile = checkIsMobile();

  if (type === "shoe") {
    // Flying card animation start position - matches shoe component position
    // Desktop: Shoe at right: calc(7% + 200px), top: 20px
    // Mobile: Shoe at right: calc(5% + 80px), top: 10px
    if (isMobile) {
      return { left: "calc(95% - 80px)", top: "30px" };
    }
    return { left: "calc(93% - 200px)", top: "40px" };
  }

  if (type === "dealer") {
    return getDealerCardPosition(cardIndex ?? 0, isMobile);
  }

  if (type === "player" && playerSeat !== null) {
    // On mobile, find the mobile seat index from the desktop seat
    if (isMobile) {
      const mobileIndex = MOBILE_SEAT_MAPPING.indexOf(playerSeat);
      if (mobileIndex >= 0) {
        const [x, y] = MOBILE_TABLE_POSITIONS[mobileIndex];
        return getPlayerCardPosition(x, y, cardIndex ?? 0, true);
      }
    }
    const [x, y] = TABLE_POSITIONS[playerSeat];
    return getPlayerCardPosition(x, y, cardIndex ?? 0, false);
  }

  if (type === "ai" && index !== undefined) {
    const aiPlayer = aiPlayers[index];
    if (aiPlayer) {
      // On mobile, find the mobile seat index from the AI's desktop position
      if (isMobile) {
        const mobileIndex = MOBILE_SEAT_MAPPING.indexOf(aiPlayer.position);
        if (mobileIndex >= 0) {
          const [x, y] = MOBILE_TABLE_POSITIONS[mobileIndex];
          return getPlayerCardPosition(x, y, cardIndex ?? 0, true);
        }
        // AI player not visible on mobile - return off-screen
        return { left: "-100px", top: "-100px" };
      }
      const [x, y] = TABLE_POSITIONS[aiPlayer.position];
      return getPlayerCardPosition(x, y, cardIndex ?? 0, false);
    }
  }

  // Default fallback
  return { left: "50%", top: "50%" };
}
