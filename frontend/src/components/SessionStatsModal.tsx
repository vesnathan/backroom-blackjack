"use client";

import { useState, useEffect } from "react";
import { useGameState } from "@/contexts/GameStateContext";
import { useUIState } from "@/contexts/UIStateContext";

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

function StatBox({
  label,
  value,
  color,
  isMobile = false,
}: {
  label: string;
  value: string;
  color: string;
  isMobile?: boolean;
}) {
  return (
    <div
      style={{
        backgroundColor: "#222",
        border: `1px solid ${color}`,
        borderRadius: isMobile ? "6px" : "8px",
        padding: isMobile ? "8px" : "12px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: isMobile ? "9px" : "11px",
          color: "#AAA",
          marginBottom: "4px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: isMobile ? "16px" : "24px",
          color,
          fontWeight: "bold",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ResultItem({
  label,
  value,
  color,
  isMobile = false,
}: {
  label: string;
  value: number;
  color: string;
  isMobile?: boolean;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: isMobile ? "16px" : "24px",
          color,
          fontWeight: "bold",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: isMobile ? "9px" : "11px",
          color: "#AAA",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function SessionStatsModal() {
  const {
    sessionStats,
    sessionNetProfit,
    sessionWinRate,
    peakChips,
    longestStreak,
    playerChips,
  } = useGameState();
  const { showSessionStats, setShowSessionStats } = useUIState();
  const isMobile = useIsMobile();

  if (!showSessionStats) return null;

  const onClose = () => setShowSessionStats(false);

  // Responsive sizes
  const padding = isMobile ? "16px" : "24px";
  const headerFontSize = isMobile ? "18px" : "24px";
  const labelFontSize = isMobile ? "10px" : "11px";
  const ratingFontSize = isMobile ? "24px" : "36px";

  // Determine profit color
  const profitColor =
    sessionNetProfit > 0
      ? "#4CAF50"
      : sessionNetProfit < 0
        ? "#F44336"
        : "#FFF";

  // Determine performance rating
  const getPerformanceRating = () => {
    if (sessionStats.handsPlayed < 10) {
      return {
        label: "TOO EARLY",
        color: "#888",
        message: "Play more hands for an accurate rating",
      };
    }
    if (sessionWinRate >= 50) {
      return {
        label: "EXCELLENT",
        color: "#4CAF50",
        message: "You're beating the house edge!",
      };
    }
    if (sessionWinRate >= 45) {
      return {
        label: "GOOD",
        color: "#8BC34A",
        message: "Solid play, keep it up!",
      };
    }
    if (sessionWinRate >= 40) {
      return {
        label: "FAIR",
        color: "#FFC107",
        message: "Room for improvement",
      };
    }
    return {
      label: "NEEDS WORK",
      color: "#F44336",
      message: "Review basic strategy",
    };
  };

  const rating = getPerformanceRating();

  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          onClose();
        }
      }}
    >
      <div
        role="presentation"
        style={{
          backgroundColor: "#1a1a1a",
          border: isMobile ? "2px solid #333" : "3px solid #333",
          borderRadius: isMobile ? "10px" : "12px",
          padding,
          maxWidth: isMobile ? "400px" : "600px",
          width: "90%",
          maxHeight: "95vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: isMobile ? "12px" : "20px",
          }}
        >
          <h2 style={{ color: "#FFF", margin: 0, fontSize: headerFontSize }}>
            Session Stats
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: isMobile ? "1px solid #666" : "2px solid #666",
              color: "#FFF",
              fontSize: isMobile ? "16px" : "20px",
              cursor: "pointer",
              width: isMobile ? "28px" : "32px",
              height: isMobile ? "28px" : "32px",
              borderRadius: "4px",
            }}
          >
            X
          </button>
        </div>

        {/* Performance Rating */}
        <div
          style={{
            backgroundColor: "#222",
            border: isMobile
              ? `1px solid ${rating.color}`
              : `2px solid ${rating.color}`,
            borderRadius: isMobile ? "6px" : "8px",
            padding: isMobile ? "10px" : "16px",
            marginBottom: isMobile ? "16px" : "24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: labelFontSize,
              color: "#AAA",
              marginBottom: isMobile ? "4px" : "8px",
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            Performance
          </div>
          <div
            style={{
              fontSize: ratingFontSize,
              color: rating.color,
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            {rating.label}
          </div>
          <div
            style={{
              fontSize: isMobile ? "11px" : "14px",
              color: "#CCC",
              fontStyle: "italic",
            }}
          >
            {rating.message}
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: isMobile ? "8px" : "16px",
            marginBottom: isMobile ? "16px" : "24px",
          }}
        >
          {/* Hands Played */}
          <StatBox
            label="Hands"
            value={sessionStats.handsPlayed.toString()}
            color="#4A90E2"
            isMobile={isMobile}
          />

          {/* Win Rate */}
          <StatBox
            label="Win Rate"
            value={`${sessionWinRate.toFixed(1)}%`}
            color={sessionWinRate >= 45 ? "#4CAF50" : "#FFC107"}
            isMobile={isMobile}
          />

          {/* Net Profit */}
          <StatBox
            label="Profit"
            value={`${sessionNetProfit >= 0 ? "+" : ""}$${sessionNetProfit.toLocaleString()}`}
            color={profitColor}
            isMobile={isMobile}
          />

          {/* Current Chips */}
          <StatBox
            label="Chips"
            value={`$${playerChips.toLocaleString()}`}
            color="#FFD700"
            isMobile={isMobile}
          />

          {/* Peak Chips */}
          <StatBox
            label="Peak"
            value={`$${peakChips.toLocaleString()}`}
            color="#9C27B0"
            isMobile={isMobile}
          />

          {/* Longest Streak */}
          <StatBox
            label="Streak"
            value={longestStreak.toString()}
            color="#FF5722"
            isMobile={isMobile}
          />
        </div>

        {/* Detailed Breakdown */}
        <div
          style={{
            backgroundColor: "#222",
            border: "1px solid #444",
            borderRadius: isMobile ? "6px" : "8px",
            padding: isMobile ? "10px" : "16px",
          }}
        >
          <div
            style={{
              fontSize: isMobile ? "10px" : "12px",
              color: "#AAA",
              marginBottom: isMobile ? "8px" : "12px",
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            Breakdown
          </div>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <ResultItem
              label="Wins"
              value={sessionStats.handsWon}
              color="#4CAF50"
              isMobile={isMobile}
            />
            <ResultItem
              label="Losses"
              value={sessionStats.handsLost}
              color="#F44336"
              isMobile={isMobile}
            />
            <ResultItem
              label="Pushes"
              value={sessionStats.pushes}
              color="#9E9E9E"
              isMobile={isMobile}
            />
            <ResultItem
              label="BJ"
              value={sessionStats.blackjacks}
              color="#FFD700"
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* Visual Results Graph */}
        {sessionStats.handsPlayed > 0 && (
          <div
            style={{
              backgroundColor: "#222",
              border: "1px solid #444",
              borderRadius: "8px",
              padding: "16px",
              marginTop: "16px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#AAA",
                marginBottom: "16px",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
            >
              Results Distribution
            </div>

            {/* Horizontal bar chart */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {/* Wins bar */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div style={{ width: "70px", fontSize: "12px", color: "#AAA" }}>
                  Wins
                </div>
                <div
                  style={{
                    flex: 1,
                    height: "24px",
                    backgroundColor: "#333",
                    borderRadius: "4px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: `${(sessionStats.handsWon / sessionStats.handsPlayed) * 100}%`,
                      height: "100%",
                      backgroundColor: "#4CAF50",
                      // eslint-disable-next-line sonarjs/no-duplicate-string
                      transition: "width 0.5s ease-out",
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: "8px",
                    }}
                  >
                    <span
                      style={{
                        color: "#FFF",
                        fontSize: "11px",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {Math.round(
                        (sessionStats.handsWon / sessionStats.handsPlayed) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Losses bar */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div style={{ width: "70px", fontSize: "12px", color: "#AAA" }}>
                  Losses
                </div>
                <div
                  style={{
                    flex: 1,
                    height: "24px",
                    backgroundColor: "#333",
                    borderRadius: "4px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: `${(sessionStats.handsLost / sessionStats.handsPlayed) * 100}%`,
                      height: "100%",
                      backgroundColor: "#F44336",
                      transition: "width 0.5s ease-out",
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: "8px",
                    }}
                  >
                    <span
                      style={{
                        color: "#FFF",
                        fontSize: "11px",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {Math.round(
                        (sessionStats.handsLost / sessionStats.handsPlayed) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Pushes bar */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div style={{ width: "70px", fontSize: "12px", color: "#AAA" }}>
                  Pushes
                </div>
                <div
                  style={{
                    flex: 1,
                    height: "24px",
                    backgroundColor: "#333",
                    borderRadius: "4px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: `${(sessionStats.pushes / sessionStats.handsPlayed) * 100}%`,
                      height: "100%",
                      backgroundColor: "#9E9E9E",
                      transition: "width 0.5s ease-out",
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: "8px",
                    }}
                  >
                    <span
                      style={{
                        color: "#FFF",
                        fontSize: "11px",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {Math.round(
                        (sessionStats.pushes / sessionStats.handsPlayed) * 100,
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Blackjacks bar */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div style={{ width: "70px", fontSize: "12px", color: "#AAA" }}>
                  Blackjacks
                </div>
                <div
                  style={{
                    flex: 1,
                    height: "24px",
                    backgroundColor: "#333",
                    borderRadius: "4px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: `${(sessionStats.blackjacks / sessionStats.handsPlayed) * 100}%`,
                      height: "100%",
                      backgroundColor: "#FFD700",
                      transition: "width 0.5s ease-out",
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: "8px",
                    }}
                  >
                    <span
                      style={{
                        color: "#000",
                        fontSize: "11px",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {Math.round(
                        (sessionStats.blackjacks / sessionStats.handsPlayed) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
