import { useState, useEffect, useCallback } from "react";
import { client } from "@/lib/amplify";

// GraphQL query for fetching leaderboard
const GET_LEADERBOARD = /* GraphQL */ `
  query GetLeaderboard(
    $category: LeaderboardCategory!
    $limit: Int
    $filters: LeaderboardFilters
  ) {
    getLeaderboard(category: $category, limit: $limit, filters: $filters) {
      category
      entries {
        rank
        username
        userId
        value
        subscriptionTier
        isSeedUser
      }
      userRank
      userValue
      timePeriod
      filters {
        timePeriod
        countingSystem
        numberOfDecks
      }
    }
  }
`;

export type LeaderboardCategory =
  | "CURRENT_CHIPS"
  | "PEAK_CHIPS"
  | "LONGEST_STREAK"
  | "HIGH_SCORE"
  | "PERFECT_SHOES"
  | "MONTHLY_HIGH_SCORE";

export type LeaderboardTimePeriod = "ALL_TIME" | "MONTHLY" | "WEEKLY" | "DAILY";

export type CountingSystem =
  | "HI_LO"
  | "HI_OPT_I"
  | "HI_OPT_II"
  | "KO"
  | "OMEGA_II"
  | "ZEN";

export interface LeaderboardFilters {
  timePeriod?: LeaderboardTimePeriod;
  countingSystem?: CountingSystem;
  numberOfDecks?: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  userId: string;
  value: number;
  subscriptionTier?: string;
  isSeedUser?: boolean;
}

export interface AppliedFilters {
  timePeriod?: LeaderboardTimePeriod;
  countingSystem?: CountingSystem;
  numberOfDecks?: number;
}

export interface LeaderboardData {
  category: LeaderboardCategory;
  entries: LeaderboardEntry[];
  userRank?: number;
  userValue?: number;
  timePeriod?: LeaderboardTimePeriod;
  filters?: AppliedFilters;
}

interface UseLeaderboardResult {
  data: LeaderboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch leaderboard data from the backend
 * @param category - The leaderboard category to fetch
 * @param filters - Optional filters for time period, counting system, etc.
 * @param limit - Maximum number of entries to fetch (default: 10)
 * @param isAuthenticated - Whether the user is authenticated (uses userPool auth if true, iam/guest if false)
 */
export function useLeaderboard(
  category: LeaderboardCategory,
  filters?: LeaderboardFilters,
  limit = 10,
  isAuthenticated = false,
): UseLeaderboardResult {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use userPool auth for authenticated users to avoid Identity Pool token exchange issues
      // Use iam (guest credentials) for unauthenticated users
      const response = await client.graphql({
        query: GET_LEADERBOARD,
        variables: {
          category,
          limit,
          filters: filters || undefined,
        },
        authMode: isAuthenticated ? "userPool" : "iam",
      });

      const result = (
        response as { data?: { getLeaderboard?: LeaderboardData } }
      ).data?.getLeaderboard;

      if (result) {
        setData(result);
      } else {
        setError("Failed to fetch leaderboard data");
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch leaderboard",
      );
    } finally {
      setLoading(false);
    }
  }, [category, limit, filters, isAuthenticated]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    data,
    loading,
    error,
    refetch: fetchLeaderboard,
  };
}
