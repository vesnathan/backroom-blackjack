import { useEffect, useRef, useCallback, useState } from "react";

import { client } from "@/lib/amplify";
import { useAuth } from "@/contexts/AuthContext";
import { debugLog } from "@/utils/debug";

// Response type for GraphQL query
interface GetUserBadgesResponse {
  getUser: {
    id: string;
    earnedBadgeIds: string[] | null;
  } | null;
}

// GraphQL query to get user badges
const GET_USER_BADGES = /* GraphQL */ `
  query GetUser {
    getUser {
      id
      earnedBadgeIds
    }
  }
`;

// GraphQL mutation to save badges
const SAVE_BADGES = /* GraphQL */ `
  mutation SaveBadges($badgeIds: [String!]!) {
    saveBadges(badgeIds: $badgeIds) {
      id
      earnedBadgeIds
    }
  }
`;

interface UseBadgeSyncParams {
  earnedBadgeIds: string[];
  setEarnedBadgeIds: React.Dispatch<React.SetStateAction<string[]>>;
}

/**
 * Hook to sync badges with the backend
 * - Loads badges from backend on mount (for authenticated users)
 * - Saves badges when new ones are earned
 */
export function useBadgeSyncToBackend({
  earnedBadgeIds,
  setEarnedBadgeIds,
}: UseBadgeSyncParams) {
  const { isAuthenticated } = useAuth();
  const lastSyncedBadges = useRef<string[]>([]);
  const hasLoadedFromBackend = useRef(false);
  const [badgesLoading, setBadgesLoading] = useState(true); // Start as loading for authenticated users

  // Load badges from backend on mount
  const loadBadges = useCallback(async () => {
    if (!isAuthenticated || hasLoadedFromBackend.current) {
      return;
    }

    try {
      const response = await client.graphql({
        query: GET_USER_BADGES,
        authMode: "userPool",
      });

      const userData = (response as { data: GetUserBadgesResponse }).data
        ?.getUser;
      if (userData?.earnedBadgeIds) {
        const backendBadges = userData.earnedBadgeIds;
        debugLog(
          "badges",
          `Loaded ${backendBadges.length} badges from backend`,
        );

        // Merge backend badges with any locally earned badges
        setEarnedBadgeIds((localBadges) => {
          const merged = [...new Set([...backendBadges, ...localBadges])];
          lastSyncedBadges.current = merged;
          return merged;
        });
      }

      hasLoadedFromBackend.current = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load badges from backend:", error);
    } finally {
      setBadgesLoading(false);
    }
  }, [isAuthenticated, setEarnedBadgeIds]);

  // Save badges to backend when they change
  const saveBadges = useCallback(async () => {
    if (!isAuthenticated || earnedBadgeIds.length === 0) {
      return;
    }

    // Check if badges have changed since last sync
    const lastSorted = [...lastSyncedBadges.current].sort();
    const currentSorted = [...earnedBadgeIds].sort();

    if (
      lastSorted.length === currentSorted.length &&
      lastSorted.every((id, index) => id === currentSorted[index])
    ) {
      return; // No changes
    }

    try {
      await client.graphql({
        query: SAVE_BADGES,
        variables: {
          badgeIds: earnedBadgeIds,
        },
        authMode: "userPool",
      });

      lastSyncedBadges.current = [...earnedBadgeIds];
      debugLog("badges", `Saved ${earnedBadgeIds.length} badges to backend`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to save badges to backend:", error);
    }
  }, [isAuthenticated, earnedBadgeIds]);

  // Load badges from backend on auth change
  useEffect(() => {
    if (isAuthenticated && !hasLoadedFromBackend.current) {
      setBadgesLoading(true);
      loadBadges();
    } else if (!isAuthenticated) {
      // Not loading when not authenticated
      setBadgesLoading(false);
      hasLoadedFromBackend.current = false;
    }
  }, [isAuthenticated, loadBadges]);

  // Save badges when they change (debounced)
  useEffect(() => {
    if (!isAuthenticated || !hasLoadedFromBackend.current) {
      return undefined;
    }

    // Debounce saves to avoid excessive API calls
    const timeoutId = setTimeout(() => {
      saveBadges();
    }, 2000); // Wait 2 seconds before saving

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, earnedBadgeIds, saveBadges]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isAuthenticated || earnedBadgeIds.length === 0) {
        return;
      }
      saveBadges();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Final save when component unmounts
      saveBadges();
    };
  }, [isAuthenticated, earnedBadgeIds, saveBadges]);

  return { loadBadges, saveBadges, badgesLoading };
}
