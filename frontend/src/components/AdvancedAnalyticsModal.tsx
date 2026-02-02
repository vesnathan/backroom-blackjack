"use client";

import { HandRecord } from "@/types/gameState";
import { useAnalytics, AnalyticsData } from "@/hooks/useAnalytics";

interface StatBoxProps {
  label: string;
  value: string;
  color: string;
  subtext?: string;
}

function StatBox({ label, value, color, subtext }: StatBoxProps) {
  return (
    <div
      style={{
        backgroundColor: "#222",
        border: `1px solid ${color}`,
        borderRadius: "8px",
        padding: "12px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#AAA",
          marginBottom: "4px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "24px",
          color,
          fontWeight: "bold",
        }}
      >
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: "10px", color: "#888", marginTop: "2px" }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 90) return "#4CAF50"; // Green - Excellent
  if (accuracy >= 80) return "#8BC34A"; // Light green - Good
  if (accuracy >= 70) return "#FFC107"; // Yellow - Fair
  return "#F44336"; // Red - Needs work
}

function getTrendIcon(trend: AnalyticsData["trend"]): string {
  switch (trend) {
    case "improving":
      return "↑";
    case "declining":
      return "↓";
    default:
      return "→";
  }
}

function getTrendColor(trend: AnalyticsData["trend"]): string {
  switch (trend) {
    case "improving":
      return "#4CAF50";
    case "declining":
      return "#F44336";
    default:
      return "#9E9E9E";
  }
}

interface AdvancedAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  handHistory: HandRecord[];
}

export default function AdvancedAnalyticsModal({
  isOpen,
  onClose,
  handHistory,
}: AdvancedAnalyticsModalProps) {
  const analytics = useAnalytics(handHistory);

  if (!isOpen) return null;

  const hasEnoughData = analytics.handsAnalyzed >= 5;

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
          border: "3px solid #FFD700",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "90vh",
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
            marginBottom: "20px",
          }}
        >
          <div>
            <h2 style={{ color: "#FFD700", margin: 0, fontSize: "24px" }}>
              Advanced Analytics
            </h2>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
              Gold+ Subscriber Feature
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "2px solid #666",
              color: "#FFF",
              fontSize: "20px",
              cursor: "pointer",
              width: "32px",
              height: "32px",
              borderRadius: "4px",
            }}
          >
            X
          </button>
        </div>

        {/* Not enough data message */}
        {!hasEnoughData && (
          <div
            style={{
              backgroundColor: "#222",
              border: "2px solid #666",
              borderRadius: "8px",
              padding: "24px",
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
            <div
              style={{ color: "#FFF", fontSize: "18px", marginBottom: "8px" }}
            >
              Not Enough Data Yet
            </div>
            <div style={{ color: "#AAA", fontSize: "14px" }}>
              Play at least 5 hands to see your analytics.
              <br />
              Currently: {analytics.handsAnalyzed} hands analyzed
            </div>
          </div>
        )}

        {hasEnoughData && (
          <>
            {/* Decision Accuracy Section */}
            <div
              style={{
                backgroundColor: "#222",
                border: "1px solid #444",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#AAA",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  fontWeight: "bold",
                }}
              >
                Decision Accuracy
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px",
                }}
              >
                <StatBox
                  label="Overall"
                  value={`${analytics.overallAccuracy.toFixed(0)}%`}
                  color={getAccuracyColor(analytics.overallAccuracy)}
                  subtext={`${analytics.correctDecisions}/${analytics.totalDecisions}`}
                />
                <StatBox
                  label="Hit/Stand"
                  value={`${analytics.hitStandAccuracy.toFixed(0)}%`}
                  color={getAccuracyColor(analytics.hitStandAccuracy)}
                />
                <StatBox
                  label="Double"
                  value={
                    analytics.doubleAccuracy > 0
                      ? `${analytics.doubleAccuracy.toFixed(0)}%`
                      : "N/A"
                  }
                  color={
                    analytics.doubleAccuracy > 0
                      ? getAccuracyColor(analytics.doubleAccuracy)
                      : "#666"
                  }
                />
                <StatBox
                  label="Split"
                  value={
                    analytics.splitAccuracy > 0
                      ? `${analytics.splitAccuracy.toFixed(0)}%`
                      : "N/A"
                  }
                  color={
                    analytics.splitAccuracy > 0
                      ? getAccuracyColor(analytics.splitAccuracy)
                      : "#666"
                  }
                />
              </div>
            </div>

            {/* Most Common Mistakes */}
            {analytics.mostCommonErrors.length > 0 && (
              <div
                style={{
                  backgroundColor: "#222",
                  border: "1px solid #F44336",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#F44336",
                    marginBottom: "12px",
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                >
                  Most Common Mistakes
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {analytics.mostCommonErrors.map((error, index) => (
                    <div
                      key={error.pattern}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        backgroundColor: "#1a1a1a",
                        borderRadius: "4px",
                        border: "1px solid #333",
                      }}
                    >
                      <span style={{ color: "#FFF", fontSize: "13px" }}>
                        {index + 1}. {error.pattern}
                      </span>
                      <span
                        style={{
                          color: "#F44336",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {error.count}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Betting Analysis */}
            <div
              style={{
                backgroundColor: "#222",
                border: "1px solid #4A90E2",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#4A90E2",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  fontWeight: "bold",
                }}
              >
                Betting Analysis
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#AAA",
                      marginBottom: "4px",
                    }}
                  >
                    Avg Bet (TC ≥ 1)
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      color: "#4CAF50",
                      fontWeight: "bold",
                    }}
                  >
                    ${analytics.avgBetAtPositiveCount.toFixed(0)}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#AAA",
                      marginBottom: "4px",
                    }}
                  >
                    Avg Bet (TC ≤ 0)
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      color: "#F44336",
                      fontWeight: "bold",
                    }}
                  >
                    ${analytics.avgBetAtNegativeCount.toFixed(0)}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#AAA",
                      marginBottom: "4px",
                    }}
                  >
                    Spread Ratio
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      color:
                        analytics.betSpreadRatio >= 4 ? "#4CAF50" : "#FFC107",
                      fontWeight: "bold",
                    }}
                  >
                    {analytics.betSpreadRatio.toFixed(1)}x
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px",
                  backgroundColor: "#1a1a1a",
                  borderRadius: "4px",
                  textAlign: "center",
                  fontSize: "12px",
                  color:
                    analytics.betSpreadRatio >= 4
                      ? "#4CAF50"
                      : analytics.betSpreadRatio >= 2
                        ? "#FFC107"
                        : "#F44336",
                }}
              >
                {analytics.betSpreadRatio >= 4
                  ? "✓ Good bet spread - betting more at high counts"
                  : analytics.betSpreadRatio >= 2
                    ? "⚠ Moderate spread - try increasing bets at high counts"
                    : "✗ Low spread - not adjusting bets to count"}
              </div>
            </div>

            {/* Trend Section */}
            <div
              style={{
                backgroundColor: "#222",
                border: `1px solid ${getTrendColor(analytics.trend)}`,
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#AAA",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  fontWeight: "bold",
                }}
              >
                Performance Trend
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "32px",
                    color: getTrendColor(analytics.trend),
                  }}
                >
                  {getTrendIcon(analytics.trend)}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: "20px",
                      color: getTrendColor(analytics.trend),
                      fontWeight: "bold",
                      textTransform: "capitalize",
                    }}
                  >
                    {analytics.trend}
                  </div>
                  <div style={{ fontSize: "12px", color: "#AAA" }}>
                    Last 20 hands: {analytics.recentAccuracy.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Hands Analyzed Footer */}
            <div
              style={{
                marginTop: "16px",
                textAlign: "center",
                fontSize: "12px",
                color: "#666",
              }}
            >
              Based on {analytics.handsAnalyzed} hands analyzed
            </div>
          </>
        )}
      </div>
    </div>
  );
}
