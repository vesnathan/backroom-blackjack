import PokerChip from "./PokerChip";

interface BettingCircleProps {
  bet: number;
  position: { left: string; top: string };
  isPlayer?: boolean;
}

// Get chip color based on bet amount
function getChipColor(bet: number): string {
  if (bet >= 1000) return "#FFD700"; // Gold
  if (bet >= 500) return "#800080"; // Purple
  if (bet >= 100) return "#1a1a1a"; // Black
  if (bet >= 50) return "#FF8C00"; // Orange
  if (bet >= 25) return "#228B22"; // Green
  if (bet >= 10) return "#1E90FF"; // Blue
  if (bet >= 5) return "#E31837"; // Red
  return "#FFFFFF"; // White
}

export default function BettingCircle({
  bet,
  position,
  isPlayer = false,
}: BettingCircleProps) {
  if (bet === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
        transform: "translate(-50%, -50%)",
        zIndex: 10,
      }}
    >
      {/* Betting Circle */}
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          border: isPlayer ? "3px dashed #FFD700" : "3px dashed #666",
          backgroundColor: "rgba(0, 100, 0, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Chip Stack */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
          }}
        >
          {/* Poker chip SVG */}
          <PokerChip size={50} color={getChipColor(bet)} value={bet} />
        </div>
      </div>
    </div>
  );
}
