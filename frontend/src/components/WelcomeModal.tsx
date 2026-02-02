"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Hook to check if we're on a small screen
function useIsSmallScreen(): boolean {
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsSmall(window.innerHeight < 600 || window.innerWidth < 500);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isSmall;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const isSmallScreen = useIsSmallScreen();

  if (!isOpen) return null;

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
          maxWidth: "400px",
          width: "100%",
          maxHeight: isSmallScreen ? "95vh" : "90vh",
          overflowY: "auto",
          border: "2px solid #FFD700",
          boxShadow: "0 0 40px rgba(255, 215, 0, 0.3)",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: isSmallScreen ? "12px" : "20px" }}>
          <Image
            src="/logo.webp"
            alt="Backroom Blackjack"
            width={isSmallScreen ? 60 : 100}
            height={isSmallScreen ? 60 : 100}
            style={{ margin: "0 auto" }}
            priority
          />
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: isSmallScreen ? "18px" : "24px",
            fontWeight: "bold",
            color: "#FFD700",
            marginBottom: isSmallScreen ? "12px" : "16px",
          }}
        >
          Welcome to Backroom Blackjack!
        </h2>

        {/* Description */}
        <p
          style={{
            color: "#d1d5db",
            fontSize: isSmallScreen ? "13px" : "15px",
            marginBottom: isSmallScreen ? "16px" : "24px",
            lineHeight: 1.5,
          }}
        >
          Master card counting in a realistic casino environment. Beat the
          house!
        </p>

        {/* Start Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            backgroundColor: "#FFD700",
            color: "#000",
            fontWeight: "bold",
            fontSize: isSmallScreen ? "14px" : "16px",
            padding: isSmallScreen ? "12px" : "14px",
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
          Start Playing
        </button>
      </div>
    </div>
  );
}
