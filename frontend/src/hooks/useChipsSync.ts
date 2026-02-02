"use client";

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
  const [chipsLoading, setChipsLoading] = useState(true);

  // Reset refs when user logs out so we reload chips on next login
  useEffect(() => {
    if (!isAuthenticated) {
      hasLoadedRef.current = false;
      lastSavedChipsRef.current = null;
      setChipsLoading(false);
    } else if (!hasLoadedRef.current) {
      setChipsLoading(true);
    }
  }, [isAuthenticated]);

  // Load chips from backend on mount
  useEffect(() => {
    if (!isAuthenticated || hasLoadedRef.current) {
      return;
    }

    const loadChips = async () => {
      try {
        const response = await client.graphql({
          query: GET_USER_CHIPS,
          authMode: "userPool",
        });

        const chips = (
          response as {
            data?: { getUser?: { chips?: number } };
          }
        ).data?.getUser?.chips;

        if (chips !== undefined && chips !== null) {
          setPlayerChips(chips);
          lastSavedChipsRef.current = chips;
          hasLoadedRef.current = true;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
        console.error("Failed to save chips to backend:", error);
      }
    },
    [isAuthenticated],
  );

  // Save chips whenever they change (after initial load)
  useEffect(() => {
    if (!isAuthenticated || !hasLoadedRef.current) {
      return;
    }

    if (lastSavedChipsRef.current === null) {
      return;
    }

    if (playerChips === lastSavedChipsRef.current) {
      return;
    }

    lastSavedChipsRef.current = playerChips;
    saveChips(playerChips);
  }, [isAuthenticated, playerChips, saveChips]);

  return { saveChips, chipsLoading };
}
