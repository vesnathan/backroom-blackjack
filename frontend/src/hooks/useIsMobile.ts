import { useState, useEffect } from "react";

/**
 * Mobile detection breakpoint.
 * Mobile mode is active when height < 500px OR width < 900px.
 * This matches landscape phone orientation.
 */
export const MOBILE_HEIGHT_BREAKPOINT = 500;
export const MOBILE_WIDTH_BREAKPOINT = 900;

/**
 * Check if we're on mobile (non-reactive, for use outside React).
 * Use useIsMobile() hook for reactive updates in components.
 */
export function checkIsMobile(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.innerHeight < MOBILE_HEIGHT_BREAKPOINT ||
    window.innerWidth < MOBILE_WIDTH_BREAKPOINT
  );
}

/**
 * Hook to check if we're on mobile with reactive updates.
 * Returns true when height < 500px OR width < 900px.
 * Uses lazy initialization to get correct value on first render.
 */
export function useIsMobile(): boolean {
  // Lazy initialization: check mobile status immediately if window exists
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return checkIsMobile();
  });

  useEffect(() => {
    const check = () => {
      setIsMobile(checkIsMobile());
    };
    // Check again in case SSR value differs from client
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}
