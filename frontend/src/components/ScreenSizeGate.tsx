"use client";

import { useEffect, useState, ReactNode } from "react";

interface ScreenSizeGateProps {
  children: ReactNode;
}

/**
 * Gate component that waits until we know the screen size before rendering children.
 * Shows a brief loading state to prevent flash of wrong-sized content.
 */
export function ScreenSizeGate({ children }: ScreenSizeGateProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Screen size is known as soon as JS runs on client
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "#0c5f38", // Match felt-background color
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
        }}
      >
        <div
          style={{
            color: "#FFD700",
            fontSize: "24px",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}
