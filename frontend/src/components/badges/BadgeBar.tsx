/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/no-unknown-property */

"use client";

import { useState } from "react";
import Image from "next/image";

import {
  getBadgesToDisplay,
  getRarityColor,
  getRarityGlow,
  getBadgeSkillPoints,
  type Badge,
} from "@/data/badges";

interface BadgeBarProps {
  earnedBadgeIds: string[];
  isAuthenticated?: boolean;
  onBadgeClick?: (badge: Badge) => void;
}

interface BadgeTooltipProps {
  badge: Badge;
  position: { x: number; y: number };
}

function BadgeTooltip({ badge, position }: BadgeTooltipProps) {
  const rarityColor = getRarityColor(badge.rarity);
  const skillPoints = getBadgeSkillPoints(badge);

  return (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y - 10,
        transform: "translate(-50%, -100%)",
        backgroundColor: "rgba(15, 20, 25, 0.95)",
        border: `2px solid ${rarityColor}`,
        borderRadius: "16px",
        padding: "20px 24px",
        zIndex: 10001,
        minWidth: "220px",
        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.5), 0 0 10px ${getRarityGlow(badge.rarity)}`,
        pointerEvents: "none",
      }}
    >
      {/* Large badge image */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        {badge.imagePath ? (
          <div
            style={{
              width: "160px",
              height: "160px",
              borderRadius: "16px",
              backgroundColor: BADGE_BG_DARK,
              border: `3px solid ${rarityColor}`,
              boxShadow: `0 0 20px ${getRarityGlow(badge.rarity)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px",
            }}
          >
            <Image
              src={badge.imagePath}
              alt={badge.name}
              width={128}
              height={128}
              style={{ objectFit: "contain" }}
            />
          </div>
        ) : (
          <div
            style={{
              width: "160px",
              height: "160px",
              borderRadius: "16px",
              backgroundColor: BADGE_BG_DARK,
              border: `3px solid ${rarityColor}`,
              boxShadow: `0 0 20px ${getRarityGlow(badge.rarity)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "80px",
            }}
          >
            {badge.icon}
          </div>
        )}
      </div>
      {/* Badge name */}
      <div
        style={{
          fontSize: "16px",
          fontWeight: "bold",
          color: "#FFF",
          marginBottom: "6px",
          textAlign: "center",
        }}
      >
        {badge.name}
      </div>
      {/* Description */}
      <div
        style={{
          fontSize: "12px",
          color: "#AAA",
          marginBottom: "10px",
          textAlign: "center",
        }}
      >
        {badge.description}
      </div>
      {/* Rarity and skill points */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          paddingTop: "8px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            color: rarityColor,
            textTransform: "capitalize",
          }}
        >
          {badge.rarity}
        </span>
        <span
          style={{
            fontSize: "12px",
            color: "#FFD700",
            fontWeight: "bold",
          }}
        >
          +{skillPoints} SP
        </span>
      </div>
    </div>
  );
}

const BADGE_BAR_BORDER = "2px solid rgba(74, 144, 226, 0.3)";
const BADGE_BG_DARK = "rgba(0, 0, 0, 0.4)";

export default function BadgeBar({
  earnedBadgeIds,
  isAuthenticated = false,
  onBadgeClick,
}: BadgeBarProps) {
  const [hoveredBadge, setHoveredBadge] = useState<Badge | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
    setHoveredBadge(null); // Hide tooltip when modal opens
    onBadgeClick?.(badge);
  };

  const closeModal = () => {
    setSelectedBadge(null);
  };

  // Get badges to display (respects showHighestOnly for progressive groups)
  const displayBadges = getBadgesToDisplay(earnedBadgeIds);

  // Don't show badge bar for non-authenticated users
  if (!isAuthenticated) {
    return null;
  }

  const handleMouseEnter = (
    badge: Badge,
    e: React.MouseEvent | React.FocusEvent,
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setHoveredBadge(badge);
  };

  const handleMouseLeave = () => {
    setHoveredBadge(null);
  };

  return (
    <>
      {/* Expand/Collapse Tab */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          position: "fixed",
          bottom: isExpanded ? "50px" : 0,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(15, 20, 25, 0.9)",
          border: BADGE_BAR_BORDER,
          borderBottom: isExpanded ? "none" : BADGE_BAR_BORDER,
          borderRadius: "8px 8px 0 0",
          padding: "4px 16px",
          color: "#FFD700",
          fontSize: "12px",
          cursor: "pointer",
          zIndex: 101,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "bottom 0.3s ease",
        }}
      >
        <span>Badges ({displayBadges.length})</span>
        <span style={{ fontSize: "10px" }}>{isExpanded ? "▼" : "▲"}</span>
      </button>

      {/* Badge Bar */}
      <div
        style={{
          position: "fixed",
          bottom: isExpanded ? 0 : "-60px",
          left: 0,
          right: 0,
          backgroundColor: "rgba(15, 20, 25, 0.9)",
          borderTop: BADGE_BAR_BORDER,
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          zIndex: 100,
          backdropFilter: "blur(4px)",
          transition: "bottom 0.3s ease",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: "#888",
            marginRight: "8px",
          }}
        >
          Badges:
        </span>
        {displayBadges.length === 0 ? (
          <span
            style={{ fontSize: "12px", color: "#666", fontStyle: "italic" }}
          >
            Play to earn badges!
          </span>
        ) : (
          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {displayBadges.map((badge) => (
              <div
                key={badge.id}
                role="button"
                tabIndex={0}
                onClick={() => handleBadgeClick(badge)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleBadgeClick(badge);
                  }
                }}
                onMouseEnter={(e) => handleMouseEnter(badge, e)}
                onMouseLeave={handleMouseLeave}
                onFocus={(e) => handleMouseEnter(badge, e)}
                onBlur={handleMouseLeave}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  backgroundColor: BADGE_BG_DARK,
                  border: `2px solid ${getRarityColor(badge.rarity)}`,
                  boxShadow: `0 0 8px ${getRarityGlow(badge.rarity)}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "scale(1.15)";
                  e.currentTarget.style.boxShadow = `0 0 12px ${getRarityGlow(badge.rarity)}`;
                }}
                onFocusCapture={(e) => {
                  e.currentTarget.style.transform = "scale(1.15)";
                  e.currentTarget.style.boxShadow = `0 0 12px ${getRarityGlow(badge.rarity)}`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = `0 0 8px ${getRarityGlow(badge.rarity)}`;
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = `0 0 8px ${getRarityGlow(badge.rarity)}`;
                }}
              >
                {badge.imagePath ? (
                  <Image
                    src={badge.imagePath}
                    alt={badge.name}
                    width={28}
                    height={28}
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  badge.icon
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {hoveredBadge && !selectedBadge && (
        <BadgeTooltip badge={hoveredBadge} position={tooltipPosition} />
      )}

      {/* Badge Modal - shown when badge is clicked */}
      {selectedBadge && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={closeModal}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeModal();
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="document"
            style={{
              position: "relative",
              backgroundColor: "rgba(15, 20, 25, 0.98)",
              border: `3px solid ${getRarityColor(selectedBadge.rarity)}`,
              borderRadius: "20px",
              padding: "32px 40px",
              minWidth: "320px",
              maxWidth: "400px",
              boxShadow: `0 8px 40px rgba(0, 0, 0, 0.8), 0 0 30px ${getRarityGlow(selectedBadge.rarity)}`,
              animation: "badgeModalAppear 0.3s ease-out",
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                backgroundColor: "transparent",
                border: "none",
                color: "#888",
                fontSize: "24px",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "4px",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = "#FFF";
              }}
              onFocus={(e) => {
                e.currentTarget.style.color = "#FFF";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = "#888";
              }}
              onBlur={(e) => {
                e.currentTarget.style.color = "#888";
              }}
            >
              &times;
            </button>

            {/* Large badge image */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "24px",
              }}
            >
              {selectedBadge.imagePath ? (
                <div
                  style={{
                    width: "200px",
                    height: "200px",
                    borderRadius: "20px",
                    backgroundColor: BADGE_BG_DARK,
                    border: `4px solid ${getRarityColor(selectedBadge.rarity)}`,
                    boxShadow: `0 0 30px ${getRarityGlow(selectedBadge.rarity)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "16px",
                  }}
                >
                  <Image
                    src={selectedBadge.imagePath}
                    alt={selectedBadge.name}
                    width={160}
                    height={160}
                    style={{ objectFit: "contain" }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: "200px",
                    height: "200px",
                    borderRadius: "20px",
                    backgroundColor: BADGE_BG_DARK,
                    border: `4px solid ${getRarityColor(selectedBadge.rarity)}`,
                    boxShadow: `0 0 30px ${getRarityGlow(selectedBadge.rarity)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "100px",
                  }}
                >
                  {selectedBadge.icon}
                </div>
              )}
            </div>

            {/* Badge name */}
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "8px",
                textAlign: "center",
              }}
            >
              {selectedBadge.name}
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: "14px",
                color: "#AAA",
                marginBottom: "20px",
                textAlign: "center",
                lineHeight: "1.5",
              }}
            >
              {selectedBadge.description}
            </p>

            {/* Rarity and skill points */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: "16px",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: getRarityColor(selectedBadge.rarity),
                  textTransform: "capitalize",
                }}
              >
                {selectedBadge.rarity}
              </span>
              <span
                style={{
                  fontSize: "16px",
                  color: "#FFD700",
                  fontWeight: "bold",
                }}
              >
                +{getBadgeSkillPoints(selectedBadge)} Skill Points
              </span>
            </div>

            {/* Close button at bottom */}
            <button
              type="button"
              onClick={closeModal}
              style={{
                width: "100%",
                marginTop: "20px",
                padding: "12px",
                backgroundColor: getRarityColor(selectedBadge.rarity),
                color: "#000",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "opacity 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = "0.8";
              }}
              onFocus={(e) => {
                e.currentTarget.style.opacity = "0.8";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
              onBlur={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* CSS Animation for badge modal */}
      <style jsx global>{`
        @keyframes badgeModalAppear {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
