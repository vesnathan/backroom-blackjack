"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Card } from "@/types/game";
import { calculateHandValue } from "@/lib/gameActions";
import PlayingCard from "@/components/PlayingCard";
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  MOBILE_CARD_WIDTH,
  MOBILE_CARD_HEIGHT,
} from "@/constants/cardLayout";

// Hook to check if we're on mobile
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerHeight < 500 || window.innerWidth < 900);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

interface PlayerActionsModalProps {
  onHit: () => void;
  onStand: () => void;
  onDouble?: () => void;
  onSplit?: () => void;
  onSurrender?: () => void;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
  playerCards?: Card[];
  dealerUpCard?: Card;
}

export default function PlayerActionsModal({
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  canDouble,
  canSplit,
  canSurrender,
  playerCards = [],
  dealerUpCard,
}: PlayerActionsModalProps) {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null,
  );
  const isMobile = useIsMobile();

  // Responsive sizes
  const padding = isMobile ? "16px" : "24px";
  const titleFontSize = isMobile ? "18px" : "24px";
  const buttonFontSize = isMobile ? "14px" : "16px";
  const largeButtonFontSize = isMobile ? "16px" : "18px";
  const buttonPadding = isMobile ? "10px 16px" : "12px 24px";
  const largeButtonPadding = isMobile ? "12px 16px" : "16px 24px";
  const modalCardWidth = isMobile ? MOBILE_CARD_WIDTH * 0.8 : CARD_WIDTH * 0.7;
  const modalCardHeight = isMobile
    ? MOBILE_CARD_HEIGHT * 0.8
    : CARD_HEIGHT * 0.7;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Only consider horizontal swipes (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      setSwipeDirection(deltaX > 0 ? "right" : "left");
    } else {
      setSwipeDirection(null);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swipeDirection === "right") {
      onHit();
    } else if (swipeDirection === "left") {
      onStand();
    }
    setSwipeDirection(null);
  }, [swipeDirection, onHit, onStand]);

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10000,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        border: isMobile ? "2px solid #FFD700" : "3px solid #FFD700",
        borderRadius: isMobile ? "12px" : "16px",
        padding,
        width: "90%",
        maxWidth: isMobile ? "340px" : "400px",
        maxHeight: "95vh",
        overflowY: "auto",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <h2
        style={{
          fontSize: titleFontSize,
          fontWeight: "bold",
          color: "#FFD700",
          marginBottom: isMobile ? "10px" : "16px",
          textAlign: "center",
        }}
      >
        Your Turn
      </h2>

      {/* Hand Display */}
      {playerCards.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: isMobile ? "16px" : "32px",
            marginBottom: isMobile ? "10px" : "16px",
            padding: isMobile ? "8px" : "12px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: isMobile ? "8px" : "12px",
          }}
        >
          {/* Dealer Up Card */}
          {dealerUpCard && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: isMobile ? "10px" : "11px",
                  color: "#888",
                  marginBottom: isMobile ? "4px" : "6px",
                }}
              >
                Dealer
              </div>
              <div
                style={{
                  width: `${modalCardWidth}px`,
                  height: `${modalCardHeight}px`,
                }}
              >
                <PlayingCard card={dealerUpCard} />
              </div>
            </div>
          )}

          {/* Player Hand */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: isMobile ? "10px" : "11px",
                color: "#888",
                marginBottom: isMobile ? "4px" : "6px",
              }}
            >
              Your Hand ({calculateHandValue(playerCards)})
            </div>
            <div
              style={{
                display: "flex",
                gap: isMobile ? "2px" : "4px",
              }}
            >
              {/* eslint-disable react/no-array-index-key -- Card type has no unique ID, list is stable */}
              {playerCards.map((card, index) => (
                <div
                  key={`${card.rank}-${card.suit}-${index}`}
                  style={{
                    width: `${modalCardWidth}px`,
                    height: `${modalCardHeight}px`,
                  }}
                >
                  <PlayingCard card={card} />
                </div>
              ))}
              {/* eslint-enable react/no-array-index-key */}
            </div>
          </div>
        </div>
      )}

      {/* Touch gesture hint */}
      <div
        style={{
          fontSize: isMobile ? "10px" : "11px",
          color: "#888",
          textAlign: "center",
          marginBottom: isMobile ? "10px" : "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? "8px" : "12px",
        }}
      >
        <span
          style={{
            opacity: swipeDirection === "left" ? 1 : 0.5,
            color: swipeDirection === "left" ? "#FFF" : "#888",
            // eslint-disable-next-line sonarjs/no-duplicate-string
            transition: "all 0.2s ease",
          }}
        >
          ← STAND
        </span>
        <span>swipe</span>
        <span
          style={{
            opacity: swipeDirection === "right" ? 1 : 0.5,
            color: swipeDirection === "right" ? "#4CAF50" : "#888",
            transition: "all 0.2s ease",
          }}
        >
          HIT →
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? "8px" : "12px",
        }}
      >
        {/* Top row: Split and Double */}
        {(canSplit || canDouble) && (
          <div style={{ display: "flex", gap: isMobile ? "8px" : "12px" }}>
            {canSplit && onSplit && (
              <button
                type="button"
                onClick={onSplit}
                style={{
                  flex: 1,
                  backgroundColor: "#FF9800",
                  color: "#FFF",
                  border: "none",
                  borderRadius: isMobile ? "6px" : "8px",
                  padding: buttonPadding,
                  fontSize: buttonFontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  // eslint-disable-next-line sonarjs/no-duplicate-string
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F57C00";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#FF9800";
                }}
              >
                SPLIT
              </button>
            )}
            {canDouble && onDouble && (
              <button
                type="button"
                onClick={onDouble}
                style={{
                  flex: 1,
                  backgroundColor: "#2196F3",
                  color: "#FFF",
                  border: "none",
                  borderRadius: isMobile ? "6px" : "8px",
                  padding: buttonPadding,
                  fontSize: buttonFontSize,
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#1976D2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#2196F3";
                }}
              >
                DOUBLE
              </button>
            )}
          </div>
        )}

        {/* Surrender button row (if available) */}
        {canSurrender && onSurrender && (
          <div style={{ display: "flex", gap: isMobile ? "8px" : "12px" }}>
            <button
              type="button"
              onClick={onSurrender}
              style={{
                width: "100%",
                backgroundColor: "#F44336",
                color: "#FFF",
                border: "none",
                borderRadius: isMobile ? "6px" : "8px",
                padding: buttonPadding,
                fontSize: buttonFontSize,
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#D32F2F";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#F44336";
              }}
            >
              {isMobile ? "SURRENDER (50%)" : "SURRENDER (Get 50% Back)"}
            </button>
          </div>
        )}

        {/* Bottom row: Stand and Hit - larger touch targets */}
        <div style={{ display: "flex", gap: isMobile ? "8px" : "12px" }}>
          <button
            type="button"
            onClick={onStand}
            style={{
              flex: 1,
              backgroundColor:
                swipeDirection === "left"
                  ? "rgba(255, 255, 255, 0.3)"
                  : "rgba(255, 255, 255, 0.1)",
              color: "#FFF",
              border: isMobile
                ? "1px solid rgba(255, 255, 255, 0.3)"
                : "2px solid rgba(255, 255, 255, 0.3)",
              borderRadius: isMobile ? "8px" : "12px",
              padding: largeButtonPadding,
              fontSize: largeButtonFontSize,
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
              minHeight: isMobile ? "48px" : "56px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.borderColor = "#FFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
            }}
          >
            STAND
          </button>

          <button
            type="button"
            onClick={onHit}
            style={{
              flex: 1,
              backgroundColor:
                swipeDirection === "right" ? "#45a049" : "#4CAF50",
              color: "#FFF",
              border: "none",
              borderRadius: isMobile ? "8px" : "12px",
              padding: largeButtonPadding,
              fontSize: largeButtonFontSize,
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
              minHeight: isMobile ? "48px" : "56px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#45a049";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#4CAF50";
            }}
          >
            HIT
          </button>
        </div>
      </div>
    </div>
  );
}
