/* eslint-disable react/no-unknown-property */

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import {
  getBadgeById,
  getRarityColor,
  getRarityGlow,
  getBadgeSkillPoints,
} from "@/data/badges";

interface BadgeEarnedAnimationProps {
  badgeId: string;
  onComplete: () => void;
}

const BADGE_BG_DARK = "rgba(0, 0, 0, 0.4)";

export default function BadgeEarnedAnimation({
  badgeId,
  onComplete,
}: BadgeEarnedAnimationProps) {
  const [phase, setPhase] = useState<"enter" | "display" | "exit">("enter");
  const badge = getBadgeById(badgeId);

  useEffect(() => {
    // Phase 1: Enter animation (0-500ms)
    const enterTimer = setTimeout(() => {
      setPhase("display");
    }, 500);

    // Phase 2: Display with fanfare (500ms - 2500ms)
    const displayTimer = setTimeout(() => {
      setPhase("exit");
    }, 2500);

    // Phase 3: Exit animation (2500ms - 3500ms)
    const exitTimer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(displayTimer);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  if (!badge) return null;

  const rarityColor = getRarityColor(badge.rarity);
  const rarityGlow = getRarityGlow(badge.rarity);
  const skillPoints = getBadgeSkillPoints(badge);

  return (
    <>
      {/* Backdrop - click to dismiss */}
      <div
        role="button"
        tabIndex={0}
        onClick={onComplete}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
            onComplete();
          }
        }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor:
            phase === "exit" ? "transparent" : "rgba(0, 0, 0, 0.5)",
          zIndex: 10002,
          cursor: "pointer",
          transition: "background-color 0.5s ease",
        }}
      />

      {/* Badge container */}
      <div
        style={{
          position: "fixed",
          top: phase === "exit" ? "calc(100% - 60px)" : "50%",
          left: "50%",
          transform:
            phase === "enter"
              ? "translate(-50%, -50%) scale(0)"
              : phase === "display"
                ? "translate(-50%, -50%) scale(1)"
                : "translate(-50%, 0) scale(0.3)",
          zIndex: 10003,
          transition:
            phase === "enter"
              ? "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
              : phase === "exit"
                ? "all 1s cubic-bezier(0.4, 0, 0.2, 1)"
                : "none",
          pointerEvents: "none",
        }}
      >
        {/* Glow burst effect */}
        {phase === "display" && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "400px",
              height: "400px",
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle, ${rarityGlow} 0%, transparent 70%)`,
              opacity: 0.6,
              animation: "badgePulse 1s ease-in-out infinite",
            }}
          />
        )}

        {/* Badge card */}
        <div
          style={{
            backgroundColor: "rgba(15, 20, 25, 0.98)",
            border: `4px solid ${rarityColor}`,
            borderRadius: "24px",
            padding: "32px",
            textAlign: "center",
            boxShadow: `0 0 60px ${rarityGlow}, 0 20px 60px rgba(0, 0, 0, 0.8)`,
            minWidth: "280px",
          }}
        >
          {/* "Badge Earned" header */}
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: rarityColor,
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "16px",
            }}
          >
            Badge Earned!
          </div>

          {/* Badge image */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            {badge.imagePath ? (
              <div
                style={{
                  width: "140px",
                  height: "140px",
                  borderRadius: "16px",
                  backgroundColor: BADGE_BG_DARK,
                  border: `3px solid ${rarityColor}`,
                  boxShadow: `0 0 20px ${rarityGlow}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px",
                  animation:
                    phase === "display" ? "badgeBounce 0.5s ease" : "none",
                }}
              >
                <Image
                  src={badge.imagePath}
                  alt={badge.name}
                  width={112}
                  height={112}
                  style={{ objectFit: "contain" }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: "140px",
                  height: "140px",
                  borderRadius: "16px",
                  backgroundColor: BADGE_BG_DARK,
                  border: `3px solid ${rarityColor}`,
                  boxShadow: `0 0 20px ${rarityGlow}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "70px",
                  animation:
                    phase === "display" ? "badgeBounce 0.5s ease" : "none",
                }}
              >
                {badge.icon}
              </div>
            )}
          </div>

          {/* Badge name */}
          <div
            style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: "#FFF",
              marginBottom: "8px",
            }}
          >
            {badge.name}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: "14px",
              color: "#AAA",
              marginBottom: "16px",
            }}
          >
            {badge.description}
          </div>

          {/* Rarity and skill points */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: rarityColor,
                textTransform: "capitalize",
                padding: "4px 12px",
                backgroundColor: `${rarityColor}20`,
                borderRadius: "12px",
              }}
            >
              {badge.rarity}
            </span>
            <span
              style={{
                fontSize: "14px",
                color: "#FFD700",
                fontWeight: "bold",
              }}
            >
              +{skillPoints} SP
            </span>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes badgePulse {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.3;
          }
        }

        @keyframes badgeBounce {
          0% {
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
