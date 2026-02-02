"use client";

import { useEffect, useState } from "react";

/**
 * Overlay that appears on mobile devices in portrait mode,
 * prompting the user to rotate their device to landscape.
 */
export function RotateDeviceOverlay() {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Check if we're on mobile and in portrait
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowOverlay(isMobile && isPortrait);
    };

    // Check on mount
    checkOrientation();

    // Listen for orientation changes and resize
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  if (!showOverlay) return null;

  return (
    <div className="rotate-device-overlay">
      {/* Rotating phone icon */}
      <div className="rotate-device-icon">📱</div>

      <h2 className="rotate-device-title">Please Rotate Your Device</h2>

      <p className="rotate-device-message">
        Backroom Blackjack is best played in landscape mode. Please rotate your
        device horizontally for the optimal experience.
      </p>

      {/* Rotation arrow animation */}
      <div className="rotate-device-arrow">↻</div>
    </div>
  );
}
