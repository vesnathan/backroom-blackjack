"use client";

interface PokerChipProps {
  size?: number;
  color?: string;
  value?: number | string;
  className?: string;
}

/**
 * SVG Poker Chip component
 * Creates a realistic casino chip with edge notches and inner ring
 */
export default function PokerChip({
  size = 50,
  color = "#1a1a1a",
  value,
  className,
}: PokerChipProps) {
  // Calculate dimensions based on size
  const center = size / 2;
  const outerRadius = size / 2 - 2;
  const innerRingRadius = outerRadius * 0.7;
  const notchCount = 8;
  const notchWidth = 4; // Reduced from 8
  const notchDepth = 4; // Reduced from 6

  // Generate edge notches
  const notches = [];
  for (let i = 0; i < notchCount; i += 1) {
    const angle = (i * 360) / notchCount;
    notches.push(
      <rect
        key={i}
        x={center - notchWidth / 2}
        y={1}
        width={notchWidth}
        height={notchDepth}
        fill="rgba(255,255,255,0.8)"
        transform={`rotate(${angle} ${center} ${center})`}
      />,
    );
  }

  // Determine text color based on chip color brightness
  const textColor = "white";
  const fontSize =
    value && String(value).length > 2 ? size * 0.28 : size * 0.36;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ display: "block" }}
    >
      {/* Drop shadow */}
      <defs>
        <filter
          id={`shadow-${size}`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Main chip body */}
      <circle
        cx={center}
        cy={center}
        r={outerRadius}
        fill={color}
        stroke="#333"
        strokeWidth="1"
        filter={`url(#shadow-${size})`}
      />

      {/* Edge notches (white rectangles around the edge) */}
      {notches}

      {/* Outer white ring */}
      <circle
        cx={center}
        cy={center}
        r={outerRadius - notchDepth - 1}
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.5"
      />

      {/* Inner colored circle */}
      <circle
        cx={center}
        cy={center}
        r={innerRingRadius}
        fill={color}
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1"
      />

      {/* Value text */}
      {value !== undefined && (
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fill={textColor}
          fontSize={fontSize}
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
          style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
        >
          {typeof value === "number" && value >= 1000
            ? `${value / 1000}K`
            : value}
        </text>
      )}
    </svg>
  );
}

// Standard chip colors by value
export const CHIP_COLORS: Record<number, string> = {
  1: "#FFFFFF", // White
  5: "#E31837", // Red
  10: "#1E90FF", // Blue
  25: "#228B22", // Green
  50: "#FF8C00", // Orange
  100: "#1a1a1a", // Black
  500: "#800080", // Purple
  1000: "#FFD700", // Gold
};
