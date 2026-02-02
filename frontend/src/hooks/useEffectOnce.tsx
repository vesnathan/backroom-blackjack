"use client";

import { useEffect, EffectCallback, useRef } from "react";

/**
 * Hook that runs an effect only once on mount, even in StrictMode.
 * The effectCallback is intentionally not in the dependency array
 * because we want to capture the initial callback, not react to changes.
 */
export function useEffectOnce(effectCallback: EffectCallback) {
  const calledRef = useRef(false);
  useEffect(() => {
    if (calledRef.current) {
      return undefined;
    }
    calledRef.current = true;
    return effectCallback();
    // Intentionally empty deps - this hook is designed to run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
