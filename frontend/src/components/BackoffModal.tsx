"use client";

import { useState, useEffect } from "react";

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

interface BackoffModalProps {
  isOpen: boolean;
  playerChips: number;
  sessionNetProfit: number;
  onNewSession: () => void;
}

/**
 * Modal shown when player is backed off (suspicion reaches 100%)
 * Player must start a new session at a different table
 */
export default function BackoffModal({
  isOpen,
  playerChips,
  sessionNetProfit,
  onNewSession,
}: BackoffModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isOpen) {
      // Delay visibility for animation
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
    return undefined;
  }, [isOpen]);

  if (!isOpen) return null;

  const profitColor =
    sessionNetProfit > 0
      ? "#4CAF50"
      : sessionNetProfit < 0
        ? "#F44336"
        : "#FFF";

  // Responsive sizes
  const padding = isMobile ? "20px" : "32px";
  const iconSize = isMobile ? "40px" : "64px";
  const titleSize = isMobile ? "20px" : "28px";
  const bodySize = isMobile ? "13px" : "16px";
  const statValueSize = isMobile ? "18px" : "24px";
  const smallSize = isMobile ? "10px" : "12px";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20000,
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
    >
      <div
        style={{
          backgroundColor: "#1a1a1a",
          border: isMobile ? "3px solid #F44336" : "4px solid #F44336",
          borderRadius: isMobile ? "12px" : "16px",
          padding,
          maxWidth: isMobile ? "380px" : "500px",
          width: "90%",
          maxHeight: "95vh",
          overflowY: "auto",
          textAlign: "center",
          transform: isVisible ? "scale(1)" : "scale(0.9)",
          transition: "transform 0.3s ease",
        }}
      >
        {/* Warning Icon */}
        <div
          style={{
            fontSize: iconSize,
            marginBottom: isMobile ? "10px" : "16px",
          }}
        >
          🚫
        </div>

        {/* Title */}
        <h2
          style={{
            color: "#F44336",
            fontSize: titleSize,
            fontWeight: "bold",
            marginBottom: isMobile ? "10px" : "16px",
            textTransform: "uppercase",
          }}
        >
          You&apos;ve Been Backed Off
        </h2>

        {/* Description */}
        <p
          style={{
            color: "#CCC",
            fontSize: bodySize,
            lineHeight: "1.5",
            marginBottom: isMobile ? "16px" : "24px",
          }}
        >
          {isMobile
            ? "The pit boss identified you as an advantage player. You're no longer welcome here."
            : "The pit boss has identified your play style as advantage play. You are no longer welcome at this blackjack table."}
        </p>

        {/* Session Stats */}
        <div
          style={{
            backgroundColor: "#222",
            borderRadius: isMobile ? "8px" : "12px",
            padding: isMobile ? "14px" : "20px",
            marginBottom: isMobile ? "16px" : "24px",
          }}
        >
          <div
            style={{
              fontSize: smallSize,
              color: "#888",
              textTransform: "uppercase",
              marginBottom: isMobile ? "8px" : "12px",
            }}
          >
            Session Results
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              gap: isMobile ? "10px" : "16px",
            }}
          >
            <div>
              <div
                style={{ fontSize: isMobile ? "9px" : "11px", color: "#AAA" }}
              >
                FINAL CHIPS
              </div>
              <div
                style={{
                  fontSize: statValueSize,
                  fontWeight: "bold",
                  color: "#FFD700",
                }}
              >
                ${playerChips.toLocaleString()}
              </div>
            </div>
            <div>
              <div
                style={{ fontSize: isMobile ? "9px" : "11px", color: "#AAA" }}
              >
                NET PROFIT
              </div>
              <div
                style={{
                  fontSize: statValueSize,
                  fontWeight: "bold",
                  color: profitColor,
                }}
              >
                {sessionNetProfit >= 0 ? "+" : ""}$
                {sessionNetProfit.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div
          style={{
            backgroundColor: "rgba(255, 193, 7, 0.1)",
            border: "1px solid #FFC107",
            borderRadius: isMobile ? "6px" : "8px",
            padding: isMobile ? "10px" : "12px",
            marginBottom: isMobile ? "16px" : "24px",
          }}
        >
          <div
            style={{
              fontSize: isMobile ? "11px" : "13px",
              color: "#FFC107",
              fontWeight: "bold",
            }}
          >
            Pro Tip
          </div>
          <div
            style={{
              fontSize: isMobile ? "10px" : "12px",
              color: "#DDD",
              marginTop: "4px",
            }}
          >
            {isMobile
              ? "Vary your bets less and use cover plays to avoid detection."
              : 'Try varying your bets less dramatically and throwing in some "cover" plays to avoid detection next time.'}
          </div>
        </div>

        {/* New Session Button */}
        <button
          type="button"
          onClick={onNewSession}
          style={{
            backgroundColor: "#4CAF50",
            color: "#FFF",
            border: "none",
            borderRadius: isMobile ? "6px" : "8px",
            padding: isMobile ? "12px 24px" : "16px 32px",
            fontSize: isMobile ? "14px" : "18px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s ease",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#45a049";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#4CAF50";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Find a New Table
        </button>
      </div>
    </div>
  );
}
