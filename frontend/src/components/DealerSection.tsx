import React from "react";
import Image from "next/image";
import { getDealerAvatarPath } from "@/data/dealerCharacters";
import TurnIndicator from "@/components/TurnIndicator";
import PlayingCard from "@/components/PlayingCard";
import { useGameState } from "@/contexts/GameStateContext";
import { useUIState } from "@/contexts/UIStateContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getLayoutConfig } from "@/constants/cardLayout";

export default function DealerSection() {
  const {
    currentDealer,
    dealerCallout,
    phase,
    dealerHand,
    dealerRevealed,
    dealerSuspicion,
  } = useGameState();
  const { setShowDealerInfo } = useUIState();

  // Ring color based on dealer suspicion
  const getRingColor = (level: number) => {
    if (level < 30) return "#FFD700"; // Gold - normal
    if (level < 60) return "#FFC107"; // Yellow - watching
    return "#F44336"; // Red - suspicious
  };

  const ringColor = getRingColor(dealerSuspicion);
  const pulseSpeed =
    dealerSuspicion > 60 ? "1s" : dealerSuspicion > 30 ? "2s" : "3s";

  const isMobile = useIsMobile();
  const layout = getLayoutConfig(isMobile);

  // Use layout config for all sizes
  const {
    avatarSize,
    avatarRingSize,
    avatarBorderWidth,
    cardWidth,
    cardHeight,
    dealerCardSpacing,
    dealerContainerWidth,
    dealerContainerHeight,
  } = layout;

  return (
    <div
      style={{
        position: "absolute",
        top: "3%", // Moved up from 8% (approximately 50px higher on typical screens)
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
        zIndex: 100,
        pointerEvents: "auto",
      }}
    >
      {/* Dealer Avatar - Clickable with Turn Indicator */}
      {currentDealer && (
        <div
          style={{
            position: "relative",
            width: `${avatarSize}px`,
            height: `${avatarSize}px`,
            margin: isMobile ? "0 auto 6px" : "0 auto 12px",
          }}
        >
          {/* Suspicion ring - single ring that changes with suspicion */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: `${avatarRingSize}px`,
              height: `${avatarRingSize}px`,
              borderRadius: "50%",
              border: `${avatarBorderWidth}px solid ${ringColor}`,
              opacity: 0.3 + (dealerSuspicion / 100) * 0.5,
              animation:
                dealerSuspicion > 30
                  ? `dealer-pulse ${pulseSpeed} ease-in-out infinite`
                  : "none",
              pointerEvents: "none",
            }}
          />

          {/* Turn Indicator - active during DEALER_TURN phase */}
          <TurnIndicator isActive={phase === "DEALER_TURN"} />

          {/* Dealer Callout - appears below avatar */}
          {dealerCallout && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                border: "2px solid #FFD700",
                borderRadius: "8px",
                padding: isMobile ? "6px 12px" : "10px 20px",
                color: "#FFD700",
                fontSize: isMobile ? "12px" : "18px",
                fontWeight: "bold",
                textAlign: "center",
                zIndex: 2000,
                boxShadow: "0 4px 16px rgba(255, 215, 0, 0.5)",
                whiteSpace: "nowrap",
                animation: "fadeInScale 0.3s ease-out",
              }}
            >
              {dealerCallout}
            </div>
          )}

          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowDealerInfo(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setShowDealerInfo(true);
              }
            }}
            style={{
              width: `${avatarSize}px`,
              height: `${avatarSize}px`,
              borderRadius: "50%",
              border: `${avatarBorderWidth}px solid ${ringColor}`,
              overflow: "hidden",
              backgroundColor: "#333",
              cursor: "pointer",
              transition: "all 0.3s ease",
              position: "relative",
              zIndex: 100,
              pointerEvents: "auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 0 20px rgba(255, 215, 0, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Image
              src={getDealerAvatarPath(currentDealer)}
              alt={currentDealer.name}
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
      )}
      {/* Dealer Cards - Fixed height container */}
      <div
        style={{
          minHeight: `${dealerContainerHeight}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {dealerHand.cards.length > 0 && (
          <div
            style={{
              position: "relative",
              width: `${dealerContainerWidth}px`,
              height: `${cardHeight}px`,
              marginBottom: isMobile ? "2px" : "4px",
            }}
          >
            {dealerHand.cards.map((card, idx) => (
              <div
                // eslint-disable-next-line react/no-array-index-key -- Cards can be duplicates
                key={`${card.rank}${card.suit}-${idx}`}
                style={{
                  position: "absolute",
                  left: `${idx * dealerCardSpacing}px`,
                  top: 0,
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  zIndex: 10,
                }}
              >
                <PlayingCard
                  card={card}
                  faceDown={!dealerRevealed && idx === 1}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes dealer-pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
