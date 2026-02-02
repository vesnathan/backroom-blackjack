"use client";

import { useState } from "react";
import { useGameState } from "@/contexts/GameStateContext";
import { PitBossCharacter, getPitBossImage } from "@/data/pitBossCharacters";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getLayoutConfig, getPitBossXOffset } from "@/constants/cardLayout";

interface PitBossAvatarProps {
  pitBoss: PitBossCharacter | null;
  size?: number;
}

/**
 * Circular pit boss avatar with ring indicators showing attention level.
 */
export default function PitBossAvatar({ pitBoss, size }: PitBossAvatarProps) {
  const isMobile = useIsMobile();
  const layout = getLayoutConfig(isMobile);
  const {
    avatarSize: layoutAvatarSize,
    avatarRingSize,
    avatarBorderWidth,
  } = layout;
  const avatarSize = size ?? layoutAvatarSize;
  const { suspicionLevel, pitBossDistance } = useGameState();
  const [isHovered, setIsHovered] = useState(false);

  if (!pitBoss) return null;

  // Attention level combines suspicion and inverse of distance (for rings)
  const attentionLevel = Math.min(
    100,
    suspicionLevel * 0.6 + (100 - (pitBossDistance ?? 100)) * 0.4,
  );

  // Image based on distance only (close = watching, far = gone)
  const currentImage = getPitBossImage(pitBoss, pitBossDistance ?? 100);

  // Color based on level (green -> yellow -> red)
  const getLevelColor = (level: number) => {
    if (level < 40) return "#4CAF50";
    if (level < 70) return "#FFC107";
    return "#F44336";
  };

  const suspicionColor = getLevelColor(suspicionLevel);
  const attentionColor = getLevelColor(attentionLevel);

  // Pulse speed based on attention level
  const pulseSpeed =
    attentionLevel > 70 ? "1s" : attentionLevel > 40 ? "2s" : "3s";

  // X position from layout config
  const xOffset = getPitBossXOffset(pitBossDistance ?? 100, isMobile);

  return (
    <div
      style={{
        position: "absolute",
        top: "3%",
        left: `calc(50% - ${xOffset}px)`,
        transform: "translateX(-50%)",
        zIndex: 100,
        cursor: "pointer",
        transition: "left 0.5s ease-out",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar container with rings */}
      <div
        style={{
          position: "relative",
          width: `${avatarSize}px`,
          height: `${avatarSize}px`,
        }}
      >
        {/* Suspicion ring - matches dealer ring size */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: `${avatarRingSize}px`,
            height: `${avatarRingSize}px`,
            borderRadius: "50%",
            border: `${avatarBorderWidth}px solid ${suspicionColor}`,
            opacity: 0.3 + (suspicionLevel / 100) * 0.5,
            animation:
              suspicionLevel > 40
                ? `pitboss-pulse ${pulseSpeed} ease-in-out infinite`
                : "none",
            pointerEvents: "none",
          }}
        />

        {/* Avatar circle */}
        <div
          style={{
            width: `${avatarSize}px`,
            height: `${avatarSize}px`,
            borderRadius: "50%",
            border: `${avatarBorderWidth}px solid ${attentionColor}`,
            backgroundColor: "#1a1a1a",
            overflow: "hidden",
            boxShadow:
              attentionLevel > 70
                ? `0 0 20px ${attentionColor}`
                : `0 2px 8px rgba(0, 0, 0, 0.5)`,
            transition: "all 0.3s ease",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Fallback initials - behind image */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isMobile ? "18px" : "32px",
              fontWeight: "bold",
              color: attentionColor,
              backgroundColor: "#2a2a2a",
              zIndex: 0,
            }}
          >
            {pitBoss.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element -- Need onError for fallback */}
          <img
            src={currentImage}
            alt={pitBoss.name}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 1,
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        </div>
      </div>

      {/* Hover tooltip - hidden on mobile (no hover) */}
      {isHovered && !isMobile && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            border: `2px solid ${attentionColor}`,
            borderRadius: "8px",
            padding: "12px 16px",
            zIndex: 1000,
            minWidth: "140px",
          }}
        >
          <div
            style={{
              color: "#FFD700",
              fontWeight: "bold",
              fontSize: "13px",
              marginBottom: "8px",
              textAlign: "center",
            }}
          >
            Pit Boss
          </div>
          <div style={{ color: "#FFF", fontSize: "11px", marginBottom: "4px" }}>
            Suspicion:{" "}
            <span style={{ color: suspicionColor, fontWeight: "bold" }}>
              {Math.round(suspicionLevel)}%
            </span>
          </div>
          <div style={{ color: "#FFF", fontSize: "11px", marginBottom: "4px" }}>
            Distance:{" "}
            <span style={{ color: "#4A90E2", fontWeight: "bold" }}>
              {pitBossDistance <= 30
                ? "Close"
                : pitBossDistance <= 60
                  ? "Nearby"
                  : "Far"}
            </span>
          </div>
          <div style={{ color: "#FFF", fontSize: "11px" }}>
            Attention:{" "}
            <span style={{ color: attentionColor, fontWeight: "bold" }}>
              {Math.round(attentionLevel)}%
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pitboss-pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
