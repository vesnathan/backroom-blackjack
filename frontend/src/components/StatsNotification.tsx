"use client";

import { useState, useEffect } from "react";

interface StatsNotificationProps {
  icon: string;
  label: string;
  value: string;
  color?: string;
  onComplete?: () => void;
}

const BOUNCE_DURATION = 400; // ms
const HOLD_DURATION = 1800; // ms
const FADE_DURATION = 300; // ms

/**
 * Animated notification for stat changes
 * Bounces in, holds, then fades out
 */
export function StatsNotification({
  icon,
  label,
  value,
  color = "#FFF",
  onComplete,
}: StatsNotificationProps) {
  const [phase, setPhase] = useState<"bounce" | "hold" | "fade">("bounce");

  useEffect(() => {
    // Transition through animation phases
    const bounceTimer = setTimeout(() => {
      setPhase("hold");
    }, BOUNCE_DURATION);

    const fadeTimer = setTimeout(() => {
      setPhase("fade");
    }, BOUNCE_DURATION + HOLD_DURATION);

    const completeTimer = setTimeout(
      () => {
        onComplete?.();
      },
      BOUNCE_DURATION + HOLD_DURATION + FADE_DURATION,
    );

    return () => {
      clearTimeout(bounceTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Calculate animation styles based on phase
  const getAnimationStyle = (): React.CSSProperties => {
    if (phase === "bounce") {
      return {
        animation: `statBounceIn ${BOUNCE_DURATION}ms ease-out forwards`,
      };
    }
    if (phase === "fade") {
      return {
        animation: `statFadeOut ${FADE_DURATION}ms ease-out forwards`,
      };
    }
    return { opacity: 1 };
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        border: "2px solid #FFD700",
        borderRadius: "8px",
        padding: "10px 16px",
        minWidth: "180px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
        ...getAnimationStyle(),
      }}
    >
      <span
        style={{
          color: "#FFF",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        {icon} {label}
      </span>
      <span
        style={{
          color,
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        {value}
      </span>
    </div>
  );
}
