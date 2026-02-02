import React from "react";
import { getConversationColor } from "@/utils/conversationColorManager";
import {
  MOBILE_TABLE_POSITIONS,
  MOBILE_SEAT_MAPPING,
  DEALER_POSITION,
  PIT_BOSS_POSITION,
} from "@/constants/tablePositions";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getLayoutConfig } from "@/constants/cardLayout";

interface SpeechBubbleProps {
  message: string;
  position: { left: string; top: string };
  playerId: string;
  isDealer?: boolean;
  playerPosition?: number; // Seat position (0-7 desktop index), undefined for dealer
  conversationId?: string; // Optional ID for multi-turn conversations (affects color)
}

export default function SpeechBubble({
  message,
  position,
  playerId,
  isDealer = false,
  playerPosition,
  conversationId,
}: SpeechBubbleProps) {
  const isMobile = useIsMobile();
  const layout = getLayoutConfig(isMobile);

  // Calculate actual position based on mobile mode
  const getActualPosition = (): { left: string; top: string } => {
    // Dealer or pit boss - use special positions
    if (isDealer || playerPosition === undefined || playerPosition < 0) {
      if (playerPosition === -2) {
        return {
          left: `${PIT_BOSS_POSITION[0]}%`,
          top: `${PIT_BOSS_POSITION[1]}%`,
        };
      }
      return { left: `${DEALER_POSITION[0]}%`, top: `${DEALER_POSITION[1]}%` };
    }

    // On mobile, we need to map desktop seat to mobile seat and use mobile positions
    if (isMobile) {
      const mobileIndex = MOBILE_SEAT_MAPPING.indexOf(playerPosition);
      if (mobileIndex >= 0) {
        const [x, y] = MOBILE_TABLE_POSITIONS[mobileIndex];
        return { left: `${x}%`, top: `${y}%` };
      }
      // This desktop seat isn't on mobile - shouldn't happen but fallback
      return position;
    }

    // Desktop - use original position (already calculated from TABLE_POSITIONS)
    return position;
  };

  const actualPosition = getActualPosition();

  // Determine bubble placement and arrow direction:
  // - Dealer (isDealer=true): bubble BELOW dealer, arrow at TOP of bubble pointing UP toward dealer
  // - On mobile: no bottom corners (only 5 seats), all bubbles above
  // - On desktop: Players 0 & 7 (bottom corners): bubble BELOW them
  // - Players 1-6 (sides): bubble ABOVE them
  const isBottomCorner =
    !isMobile && (playerPosition === 0 || playerPosition === 7);
  const bubbleBelow = isDealer || isBottomCorner;

  // Arrow position: if bubble is below character, arrow goes at TOP (pointing up to character)
  // if bubble is above character, arrow goes at BOTTOM (pointing down to character)
  const arrowAtTop = bubbleBelow; // Arrow at top of bubble when bubble is below character

  // Get conversation-specific colors for the bubble
  const colors = getConversationColor(conversationId);

  // Use layout config for sizes
  const avatarOffset = layout.avatarSize;
  const arrowSize = isMobile ? 10 : 14;
  const padding = isMobile ? "10px 14px" : "18px 24px";
  const fontSize = isMobile ? "12px" : "18px";
  const maxWidth = isMobile ? "180px" : "320px";
  const minWidth = isMobile ? "100px" : "160px";
  const borderRadius = isMobile ? "16px" : "24px";
  const borderWidth = layout.avatarBorderWidth;

  return (
    <div
      key={playerId}
      style={{
        position: "fixed",
        left: actualPosition.left,
        top: actualPosition.top,
        transform: isBottomCorner
          ? `translate(-50%, calc(${avatarOffset}px + ${arrowSize}px))` // Avatar + arrow = arrow tip touches avatar bottom
          : bubbleBelow
            ? `translate(-50%, ${isMobile ? "-20px" : "-40px"})` // Dealer bubble - move up
            : "translate(-50%, -100%)", // Side players - above player
        zIndex: 1000,
        animation: bubbleBelow
          ? "speechFadeInBelow 0.3s ease-out"
          : "speechFadeInAbove 0.3s ease-out",
      }}
    >
      <div
        style={{
          backgroundColor: colors.bg,
          color: "#000",
          padding,
          borderRadius,
          fontSize,
          fontWeight: "600",
          maxWidth,
          minWidth,
          textAlign: "center",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
          border: `${borderWidth}px solid ${colors.border}`,
          position: "relative",
          wordWrap: "break-word",
          lineHeight: "1.4",
        }}
      >
        {message}
        {/* Speech bubble pointer */}
        <div
          style={{
            position: "absolute",
            ...(arrowAtTop
              ? {
                  // Arrow at TOP of bubble, pointing UP toward character
                  top: `-${arrowSize}px`,
                  borderBottom: `${arrowSize}px solid ${colors.arrow}`,
                }
              : {
                  // Arrow at BOTTOM of bubble, pointing DOWN toward character
                  bottom: `-${arrowSize}px`,
                  borderTop: `${arrowSize}px solid ${colors.arrow}`,
                }),
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: `${arrowSize}px solid transparent`,
            borderRight: `${arrowSize}px solid transparent`,
          }}
        />
      </div>

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        @keyframes speechFadeInAbove {
          from {
            opacity: 0;
            transform: translate(-50%, -100%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%) scale(1);
          }
        }
        @keyframes speechFadeInBelow {
          from {
            opacity: 0;
            transform: ${isBottomCorner
              ? `translate(-50%, calc(${avatarOffset}px + ${arrowSize}px)) scale(0.8)`
              : `translate(-50%, ${isMobile ? "-20px" : "-40px"}) scale(0.8)`};
          }
          to {
            opacity: 1;
            transform: ${isBottomCorner
              ? `translate(-50%, calc(${avatarOffset}px + ${arrowSize}px)) scale(1)`
              : `translate(-50%, ${isMobile ? "-20px" : "-40px"}) scale(1)`};
          }
        }
      `}</style>
    </div>
  );
}
