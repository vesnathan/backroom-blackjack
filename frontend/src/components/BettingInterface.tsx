import { useState, useEffect } from "react";
import PokerChip, { CHIP_COLORS } from "./PokerChip";

interface BettingInterfaceProps {
  playerChips: number;
  currentBet: number;
  minBet: number;
  maxBet: number;
  onBetChange: (newBet: number) => void;
  onConfirmBet: () => void;
  onClearBet: () => void;
}

const CHIP_VALUES = [5, 10, 25, 50, 100, 500];
const CURSOR_POINTER = "pointer";
const CURSOR_NOT_ALLOWED = "not-allowed";
const TRANSITION_EASE = "all 0.2s ease";

// Hook to check if we're on a small screen (mobile landscape)
function useIsSmallScreen(): boolean {
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const check = () => {
      // Small screen: height < 500px (phone in landscape) or width < 700px
      setIsSmall(window.innerHeight < 500 || window.innerWidth < 700);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isSmall;
}

export default function BettingInterface({
  playerChips,
  currentBet,
  minBet,
  maxBet,
  onBetChange,
  onConfirmBet,
  onClearBet,
}: BettingInterfaceProps) {
  const [selectedChipValue, setSelectedChipValue] = useState<number>(minBet);
  const isSmallScreen = useIsSmallScreen();

  // Responsive sizes
  const chipSize = isSmallScreen ? 50 : 70;
  const containerPadding = isSmallScreen ? "16px" : "32px";
  const titleFontSize = isSmallScreen ? "20px" : "28px";
  const betFontSize = isSmallScreen ? "24px" : "32px";
  const chipGap = isSmallScreen ? "8px" : "12px";
  const buttonPadding = isSmallScreen ? "12px 20px" : "10px 24px";

  const handleChipClick = (value: number) => {
    setSelectedChipValue(value);
    const newBet = currentBet + value;
    if (newBet <= maxBet && newBet <= playerChips) {
      onBetChange(newBet);
    }
  };

  const canPlaceBet =
    currentBet >= minBet && currentBet <= maxBet && currentBet <= playerChips;
  const canAddChip = (value: number) => {
    const newBet = currentBet + value;
    return newBet <= maxBet && newBet <= playerChips;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: isSmallScreen ? "10px" : "16px",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        padding: containerPadding,
        borderRadius: "16px",
        border: "3px solid #FFD700",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
        zIndex: 10000,
        maxWidth: "95vw",
        width: isSmallScreen ? "auto" : "400px",
      }}
    >
      {/* Title */}
      <h2
        style={{
          fontSize: titleFontSize,
          fontWeight: "bold",
          color: "#FFD700",
          marginBottom: isSmallScreen ? "4px" : "8px",
          textAlign: "center",
        }}
      >
        Place Your Bet
      </h2>

      {/* Current Bet Display */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            color: "#FFF",
            fontSize: isSmallScreen ? "14px" : "18px",
            marginBottom: "4px",
          }}
        >
          Current Bet
        </div>
        <div
          style={{
            color: "#FFD700",
            fontSize: betFontSize,
            fontWeight: "bold",
          }}
        >
          ${currentBet}
        </div>
        <div
          style={{
            color: "#888",
            fontSize: isSmallScreen ? "10px" : "12px",
            marginTop: "4px",
          }}
        >
          Min: ${minBet} | Max: ${maxBet}
        </div>
      </div>

      {/* Chip Selector */}
      <div
        style={{
          display: "flex",
          gap: chipGap,
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {CHIP_VALUES.map((value) => {
          const isAffordable = canAddChip(value);
          const isSelected = selectedChipValue === value;
          const chipColor = isAffordable ? CHIP_COLORS[value] : "#333";

          return (
            <button
              type="button"
              key={value}
              onClick={() => isAffordable && handleChipClick(value)}
              disabled={!isAffordable}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: isAffordable ? CURSOR_POINTER : CURSOR_NOT_ALLOWED,
                opacity: isAffordable ? 1 : 0.4,
                transition: TRANSITION_EASE,
                transform: isSelected ? "scale(1.15)" : "scale(1)",
                filter: isSelected
                  ? "drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))"
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (isAffordable) {
                  e.currentTarget.style.transform = "scale(1.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (isAffordable) {
                  e.currentTarget.style.transform = isSelected
                    ? "scale(1.15)"
                    : "scale(1)";
                }
              }}
            >
              <PokerChip size={chipSize} color={chipColor} value={value} />
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: chipGap,
          marginTop: isSmallScreen ? "4px" : "8px",
        }}
      >
        <button
          type="button"
          onClick={onClearBet}
          disabled={currentBet === 0}
          style={{
            padding: buttonPadding,
            minHeight: "44px", // Touch-friendly minimum
            borderRadius: "8px",
            border: "2px solid #EF4444",
            backgroundColor:
              currentBet > 0
                ? "rgba(239, 68, 68, 0.2)"
                : "rgba(100, 100, 100, 0.2)",
            color: currentBet > 0 ? "#EF4444" : "#666",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: currentBet > 0 ? CURSOR_POINTER : CURSOR_NOT_ALLOWED,
            transition: TRANSITION_EASE,
          }}
          onMouseEnter={(e) => {
            if (currentBet > 0) {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentBet > 0) {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
            }
          }}
        >
          Clear Bet
        </button>

        <button
          type="button"
          onClick={onConfirmBet}
          disabled={!canPlaceBet}
          style={{
            padding: isSmallScreen ? "12px 24px" : "10px 32px",
            minHeight: "44px", // Touch-friendly minimum
            borderRadius: "8px",
            border: "2px solid #10B981",
            backgroundColor: canPlaceBet
              ? "rgba(16, 185, 129, 0.2)"
              : "rgba(100, 100, 100, 0.2)",
            color: canPlaceBet ? "#10B981" : "#666",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: canPlaceBet ? CURSOR_POINTER : CURSOR_NOT_ALLOWED,
            transition: TRANSITION_EASE,
          }}
          onMouseEnter={(e) => {
            if (canPlaceBet) {
              e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            if (canPlaceBet) {
              e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.2)";
            }
          }}
        >
          Place Bet
        </button>
      </div>

      {/* Error Messages */}
      {currentBet > 0 && currentBet < minBet && (
        <div style={{ color: "#EF4444", fontSize: "12px", marginTop: "-8px" }}>
          Minimum bet is ${minBet}
        </div>
      )}
      {currentBet > playerChips && (
        <div style={{ color: "#EF4444", fontSize: "12px", marginTop: "-8px" }}>
          Insufficient chips
        </div>
      )}
      {currentBet > maxBet && (
        <div style={{ color: "#EF4444", fontSize: "12px", marginTop: "-8px" }}>
          Maximum bet is ${maxBet}
        </div>
      )}
    </div>
  );
}
