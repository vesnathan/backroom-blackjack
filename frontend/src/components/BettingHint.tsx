"use client";

interface BettingHintProps {
  trueCount: number;
  minBet: number;
  maxBet: number;
  playerChips: number;
  isVisible: boolean;
  suspicionLevel?: number; // For camouflage suggestions
}

/**
 * Get betting recommendation based on true count using a 1-12 spread
 * True Count | Bet Units
 * <= 0       | 1 unit (min bet)
 * +1         | 2 units
 * +2         | 4 units
 * +3         | 6 units
 * +4         | 8 units
 * +5+        | 12 units (max spread)
 */
function getBettingRecommendation(
  trueCount: number,
  minBet: number,
  maxBet: number,
  playerChips: number,
): {
  suggestedBet: number;
  confidence: "high" | "medium" | "low" | "neutral";
  message: string;
  color: string;
} {
  let multiplier = 1;
  let confidence: "high" | "medium" | "low" | "neutral" = "neutral";
  let message = "";
  let color = "#888";

  if (trueCount <= 0) {
    multiplier = 1;
    confidence = "low";
    message = "Negative/neutral count - bet minimum";
    color = "#F44336";
  } else if (trueCount === 1) {
    multiplier = 2;
    confidence = "neutral";
    message = "Slight edge - small increase";
    color = "#FFC107";
  } else if (trueCount === 2) {
    multiplier = 4;
    confidence = "medium";
    message = "Good count - increase bet";
    color = "#8BC34A";
  } else if (trueCount === 3) {
    multiplier = 6;
    confidence = "medium";
    message = "Strong count - bet aggressively";
    color = "#4CAF50";
  } else if (trueCount === 4) {
    multiplier = 8;
    confidence = "high";
    message = "Very strong - near max bet";
    color = "#4CAF50";
  } else {
    multiplier = 12;
    confidence = "high";
    message = "Excellent count - max spread!";
    color = "#4CAF50";
  }

  // Calculate suggested bet
  let suggestedBet = minBet * multiplier;

  // Cap at max bet and player chips
  suggestedBet = Math.min(suggestedBet, maxBet, playerChips);

  // Round to nearest chip value
  const chipValues = [5, 10, 25, 50, 100, 500];
  suggestedBet = chipValues.reduce((prev, curr) =>
    Math.abs(curr - suggestedBet) < Math.abs(prev - suggestedBet) ? curr : prev,
  );

  // Ensure at least min bet
  suggestedBet = Math.max(suggestedBet, minBet);

  return { suggestedBet, confidence, message, color };
}

/**
 * Get camouflage suggestion based on suspicion level
 */
function getCamouflageSuggestion(
  suspicionLevel: number,
  trueCount: number,
  suggestedBet: number,
  minBet: number,
): {
  show: boolean;
  message: string;
  adjustedBet?: number;
} {
  if (suspicionLevel < 40) {
    return { show: false, message: "" };
  }

  if (suspicionLevel >= 70) {
    // Critical heat - suggest flat betting
    return {
      show: true,
      message: "CRITICAL HEAT: Bet flat at minimum to cool off!",
      adjustedBet: minBet,
    };
  }

  if (suspicionLevel >= 50) {
    // High heat - suggest reducing spread
    if (trueCount >= 3) {
      const reducedBet = Math.max(minBet, Math.floor(suggestedBet * 0.5));
      return {
        show: true,
        message: "HIGH HEAT: Reduce your spread - bet less aggressively",
        adjustedBet: reducedBet,
      };
    }
    return {
      show: true,
      message: "HIGH HEAT: Keep bets consistent for a few hands",
    };
  }

  // Medium heat (40-50)
  if (trueCount >= 4) {
    return {
      show: true,
      message: "Pit boss watching - consider a smaller jump",
    };
  }

  return { show: false, message: "" };
}

export default function BettingHint({
  trueCount,
  minBet,
  maxBet,
  playerChips,
  isVisible,
  suspicionLevel = 0,
}: BettingHintProps) {
  if (!isVisible) return null;

  const { suggestedBet, confidence, message, color } = getBettingRecommendation(
    trueCount,
    minBet,
    maxBet,
    playerChips,
  );

  const camouflage = getCamouflageSuggestion(
    suspicionLevel,
    trueCount,
    suggestedBet,
    minBet,
  );

  return (
    <div
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        border: `2px solid ${color}`,
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "16px",
        textAlign: "center",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: "12px",
          color: "#AAA",
          textTransform: "uppercase",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        <span>💡</span>
        <span>Betting Hint</span>
      </div>

      {/* True Count Display */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            padding: "8px 16px",
          }}
        >
          <div style={{ fontSize: "10px", color: "#888" }}>TRUE COUNT</div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color,
            }}
          >
            {trueCount >= 0 ? `+${trueCount}` : trueCount}
          </div>
        </div>

        <div style={{ fontSize: "24px", color: "#666" }}>→</div>

        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            padding: "8px 16px",
          }}
        >
          <div style={{ fontSize: "10px", color: "#888" }}>SUGGESTED BET</div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#FFD700",
            }}
          >
            ${suggestedBet}
          </div>
        </div>
      </div>

      {/* Message */}
      <div
        style={{
          fontSize: "13px",
          color,
          fontStyle: "italic",
        }}
      >
        {message}
      </div>

      {/* Camouflage Suggestion */}
      {camouflage.show && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px",
            backgroundColor: "rgba(244, 67, 54, 0.15)",
            border: "1px solid #F44336",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#F44336",
              fontWeight: "bold",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>🔥</span>
            <span>CAMOUFLAGE TIP</span>
          </div>
          <div style={{ fontSize: "12px", color: "#FFC107" }}>
            {camouflage.message}
          </div>
          {camouflage.adjustedBet && (
            <div
              style={{
                marginTop: "6px",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#FFF",
              }}
            >
              Safer bet: ${camouflage.adjustedBet}
            </div>
          )}
        </div>
      )}

      {/* Confidence indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "4px",
          marginTop: "8px",
        }}
      >
        {["low", "neutral", "medium", "high"].map((level, idx) => (
          <div
            key={level}
            style={{
              width: "20px",
              height: "4px",
              borderRadius: "2px",
              backgroundColor:
                (confidence === "low" && idx === 0) ||
                (confidence === "neutral" && idx <= 1) ||
                (confidence === "medium" && idx <= 2) ||
                (confidence === "high" && idx <= 3)
                  ? color
                  : "rgba(255, 255, 255, 0.2)",
              transition: "background-color 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
