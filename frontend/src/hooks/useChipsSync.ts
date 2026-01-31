"use client";

/* eslint-disable no-console */
import { useEffect, useCallback, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { client } from "@/lib/amplify";

const GET_USER_CHIPS = /* GraphQL */ `
  query GetUser {
    getUser {
      chips
    }
  }
`;

const UPDATE_CHIPS = /* GraphQL */ `
  mutation UpdateChips($chips: Int!) {
    updateChips(chips: $chips) {
      chips
    }
  }
`;

interface UseChipsSyncParams {
  setPlayerChips: (chips: number | ((prev: number) => number)) => void;
  playerChips: number;
}

/**
 * Hook to sync player chips with the backend database
 * - Loads chips from backend on mount (for authenticated users)
 * - Provides a function to save chips to backend
 */
export function useChipsSync({
  setPlayerChips,
  playerChips,
}: UseChipsSyncParams) {
  const { isAuthenticated } = useAuth();
  const hasLoadedRef = useRef(false);
  const lastSavedChipsRef = useRef<number | null>(null);
  const [chipsLoading, setChipsLoading] = useState(true); // Start as loading for authenticated users

  // Debug logging for chip sync issues
  console.log(
    `[ChipsSync] Render: isAuthenticated=${isAuthenticated}, playerChips=${playerChips}, hasLoaded=${hasLoadedRef.current}, lastSaved=${lastSavedChipsRef.current}`,
  );

  // Reset refs when user logs out so we reload chips on next login
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("[ChipsSync] User logged out - resetting refs");
      hasLoadedRef.current = false;
      lastSavedChipsRef.current = null;
      setChipsLoading(false); // Not loading when not authenticated
    } else if (!hasLoadedRef.current) {
      setChipsLoading(true); // Start loading when authenticated but haven't loaded yet
    }
  }, [isAuthenticated]);

  // Load chips from backend on mount
  useEffect(() => {
    console.log(
      `[ChipsSync] Load effect: isAuthenticated=${isAuthenticated}, hasLoaded=${hasLoadedRef.current}`,
    );
    if (!isAuthenticated || hasLoadedRef.current) {
      console.log(
        "[ChipsSync] Load effect: skipping (already loaded or not auth)",
      );
      return;
    }

    const loadChips = async () => {
      console.log("[ChipsSync] loadChips() starting...");
      try {
        const response = await client.graphql({
          query: GET_USER_CHIPS,
          authMode: "userPool",
        });

        console.log(
          "[ChipsSync] loadChips() response:",
          JSON.stringify(response),
        );

        const chips = (
          response as {
            data?: { getUser?: { chips?: number } };
          }
        ).data?.getUser?.chips;

        console.log(`[ChipsSync] loadChips() extracted chips: ${chips}`);

        if (chips !== undefined && chips !== null) {
          console.log(
            `[ChipsSync] Setting playerChips to ${chips}, lastSavedChipsRef to ${chips}`,
          );
          setPlayerChips(chips);
          lastSavedChipsRef.current = chips; // Track loaded value to prevent immediate re-save
          hasLoadedRef.current = true;
        } else {
          console.log(
            "[ChipsSync] loadChips() chips was null/undefined, not setting",
          );
        }
      } catch (error) {
        console.error("[ChipsSync] Failed to load chips from backend:", error);
      } finally {
        setChipsLoading(false);
      }
    };

    loadChips();
  }, [isAuthenticated, setPlayerChips]);

  // Function to save chips to backend
  const saveChips = useCallback(
    async (chips: number) => {
      if (!isAuthenticated) return;

      try {
        await client.graphql({
          query: UPDATE_CHIPS,
          variables: { chips },
          authMode: "userPool",
        });
      } catch (error) {
        console.error("Failed to save chips to backend:", error);
      }
    },
    [isAuthenticated],
  );

  // Save chips whenever they change (after initial load)
  useEffect(() => {
    console.log(
      `[ChipsSync] Save effect: isAuthenticated=${isAuthenticated}, hasLoaded=${hasLoadedRef.current}, playerChips=${playerChips}, lastSaved=${lastSavedChipsRef.current}`,
    );

    if (!isAuthenticated || !hasLoadedRef.current) {
      console.log("[ChipsSync] Save effect: skipping (not auth or not loaded)");
      return;
    }

    // Skip if this is the first check after loading (lastSavedChipsRef will be set by load)
    if (lastSavedChipsRef.current === null) {
      console.log(
        "[ChipsSync] Save effect: skipping (lastSavedChipsRef is null)",
      );
      return;
    }

    // Only save if chips actually changed from what we last saved/loaded
    if (playerChips === lastSavedChipsRef.current) {
      console.log("[ChipsSync] Save effect: skipping (chips unchanged)");
      return;
    }

    console.log(
      `[ChipsSync] SAVING chips: ${playerChips} (was ${lastSavedChipsRef.current})`,
    );
    lastSavedChipsRef.current = playerChips;
    saveChips(playerChips);
  }, [isAuthenticated, playerChips, saveChips]);

  return { saveChips, chipsLoading };
}
