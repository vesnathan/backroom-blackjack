"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const PURPLE_TAG_BG = "rgba(139, 92, 246, 0.3)";
const BLUE_TAG_BG = "rgba(59, 130, 246, 0.3)";
const TAG_TEXT_COLOR = "#d1d5db";

interface SubscribeBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Hook to check if we're on a small screen
function useIsSmallScreen(): boolean {
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const check = () => {
      // Small screen: height < 600px or width < 500px
      setIsSmall(window.innerHeight < 600 || window.innerWidth < 500);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isSmall;
}

/**
 * Subscribe banner modal shown after each hand for non-subscribed users.
 * Game pauses until user clicks OK.
 */
export default function SubscribeBannerModal({
  isOpen,
  onClose,
}: SubscribeBannerModalProps) {
  const isSmallScreen = useIsSmallScreen();

  if (!isOpen) return null;

  const tagStyle = {
    padding: isSmallScreen ? "3px 8px" : "4px 12px",
    borderRadius: "4px",
    fontSize: isSmallScreen ? "10px" : "12px",
    color: TAG_TEXT_COLOR,
  };

  return (
    <div
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
        zIndex: 10000,
        padding: isSmallScreen ? "10px" : "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#1a1a2e",
          borderRadius: isSmallScreen ? "12px" : "16px",
          padding: isSmallScreen ? "16px" : "32px",
          maxWidth: "500px",
          width: "100%",
          maxHeight: isSmallScreen ? "95vh" : "90vh",
          overflowY: "auto",
          border: "2px solid #FFD700",
          boxShadow: "0 0 40px rgba(255, 215, 0, 0.3)",
        }}
      >
        {/* Subscribe Ad */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(88, 28, 135, 0.3), rgba(157, 23, 77, 0.3))",
            border: "1px solid rgba(139, 92, 246, 0.5)",
            borderRadius: isSmallScreen ? "8px" : "12px",
            padding: isSmallScreen ? "12px" : "24px",
            marginBottom: isSmallScreen ? "12px" : "24px",
          }}
        >
          <h3
            style={{
              fontSize: isSmallScreen ? "16px" : "24px",
              fontWeight: "bold",
              color: "#FFF",
              marginBottom: isSmallScreen ? "6px" : "12px",
              textAlign: "center",
            }}
          >
            Support Backroom Blackjack
          </h3>
          <p
            style={{
              color: TAG_TEXT_COLOR,
              fontSize: isSmallScreen ? "11px" : "14px",
              marginBottom: isSmallScreen ? "8px" : "16px",
              textAlign: "center",
            }}
          >
            Remove these interruptions and get exclusive benefits!
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: isSmallScreen ? "4px" : "8px",
              justifyContent: "center",
              marginBottom: isSmallScreen ? "10px" : "20px",
            }}
          >
            <span style={{ ...tagStyle, backgroundColor: PURPLE_TAG_BG }}>
              No interruptions
            </span>
            <span style={{ ...tagStyle, backgroundColor: PURPLE_TAG_BG }}>
              Monthly chips
            </span>
            <span style={{ ...tagStyle, backgroundColor: PURPLE_TAG_BG }}>
              Exclusive features
            </span>
          </div>
          <div style={{ textAlign: "center" }}>
            <Link
              href="/subscribe"
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "linear-gradient(135deg, #7c3aed, #db2777)",
                color: "#FFF",
                fontWeight: "bold",
                padding: isSmallScreen ? "10px 16px" : "12px 24px",
                borderRadius: "8px",
                textDecoration: "none",
                transition: "all 0.2s",
                fontSize: isSmallScreen ? "13px" : "16px",
                minHeight: "44px",
              }}
            >
              View Plans
            </Link>
          </div>
        </div>

        {/* App Builder Studios Ad - Hidden on mobile */}
        {!isSmallScreen && (
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(30, 58, 138, 0.3), rgba(6, 95, 70, 0.3))",
              border: "1px solid rgba(59, 130, 246, 0.5)",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "12px",
                textAlign: "center",
              }}
            >
              Have an App Idea?
            </h3>
            <p
              style={{
                color: TAG_TEXT_COLOR,
                fontSize: "14px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              We build custom web and mobile apps!
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <span style={{ ...tagStyle, backgroundColor: BLUE_TAG_BG }}>
                Full-stack
              </span>
              <span style={{ ...tagStyle, backgroundColor: BLUE_TAG_BG }}>
                Cloud
              </span>
              <span style={{ ...tagStyle, backgroundColor: BLUE_TAG_BG }}>
                Mobile
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <a
                href="https://appbuilderstudios.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "linear-gradient(135deg, #2563eb, #0d9488)",
                  color: "#FFF",
                  fontWeight: "bold",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  fontSize: "16px",
                  minHeight: "44px",
                }}
              >
                Learn More
              </a>
            </div>
          </div>
        )}

        {/* OK Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            backgroundColor: "#FFD700",
            color: "#000",
            fontWeight: "bold",
            fontSize: isSmallScreen ? "14px" : "18px",
            padding: isSmallScreen ? "12px" : "16px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s",
            minHeight: "44px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#FFC107";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#FFD700";
          }}
        >
          Continue Playing
        </button>
      </div>
    </div>
  );
}
