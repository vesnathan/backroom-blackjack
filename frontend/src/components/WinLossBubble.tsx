"use client";

import { useState } from "react";

interface WinLossBubbleProps {
  result?: "win" | "lose" | "push" | "blackjack" | "surrender";
  message?: string;
  position: { left: string; top: string };
  onComplete?: () => void;
  amount?: number; // Profit/loss amount to display
}

export default function WinLossBubble({
  result,
  message,
  position,
  onComplete,
  amount,
}: WinLossBubbleProps) {
  const [visible, setVisible] = useState(true);

  const handleAnimationEnd = () => {
    // Only hide and call onComplete for win/loss bubbles, not speech bubbles
    if (!message) {
      setVisible(false);
      onComplete?.();
    }
  };

  const getMessage = () => {
    if (message) return message;

    // Format amount string if provided
    const amountStr =
      amount !== undefined
        ? amount >= 0
          ? ` +$${amount}`
          : ` -$${Math.abs(amount)}`
        : "";

    switch (result) {
      case "win":
        return `WIN!${amountStr}`;
      case "lose":
        return `LOSE${amountStr}`;
      case "push":
        return "PUSH";
      case "blackjack":
        return `BLACKJACK!${amountStr}`;
      case "surrender":
        return `SURRENDER${amountStr}`;
      default:
        return "";
    }
  };

  const getColor = () => {
    if (message) return "#FFF";

    switch (result) {
      case "win":
      case "blackjack":
        return "#4CAF50"; // Green
      case "lose":
        return "#F44336"; // Red
      case "push":
      case "surrender":
        return "#FFC107"; // Yellow
      default:
        return "#FFF";
    }
  };

  if (!visible) return null;

  // Speech bubbles (message prop) should not fade, only win/loss bubbles should fade
  const isSpeechBubble = !!message;
  const animationName = isSpeechBubble ? "rise-only" : "rise-fade";

  return (
    <div
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
        transform: "translateX(-50%)",
        zIndex: 2000,
        animation: `${animationName} 2s ease-out forwards`,
        pointerEvents: "none",
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          color: getColor(),
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "14px",
          fontWeight: "bold",
          border: `2px solid ${getColor()}`,
          boxShadow: `0 0 10px ${getColor()}`,
          whiteSpace: "nowrap",
        }}
      >
        {getMessage()}
      </div>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        @keyframes rise-fade {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(-50%);
          }
          50% {
            opacity: 1;
            transform: translateY(-40px) translateX(-50%);
          }
          100% {
            opacity: 0;
            transform: translateY(-80px) translateX(-50%);
          }
        }
        @keyframes rise-only {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(-50%);
          }
          15% {
            opacity: 1;
            transform: translateY(-60px) translateX(-50%);
          }
          100% {
            opacity: 1;
            transform: translateY(-60px) translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
