"use client";

import { useState, useEffect, useCallback } from "react";
import { client } from "@/lib/amplify";
import type { SubscriptionTier } from "@backroom-blackjack/shared";

// GraphQL query for fetching supporters
const GET_SUPPORTERS = /* GraphQL */ `
  query GetSupporters {
    getSupporters {
      platinum {
        userId
        username
        tier
        earlyAdopter
        subscribedSince
      }
      gold {
        userId
        username
        tier
        earlyAdopter
        subscribedSince
      }
      silver {
        userId
        username
        tier
        earlyAdopter
        subscribedSince
      }
      bronze {
        userId
        username
        tier
        earlyAdopter
        subscribedSince
      }
      totalCount
    }
  }
`;

export interface Supporter {
  userId: string;
  username: string;
  tier: SubscriptionTier;
  earlyAdopter: boolean;
  subscribedSince: string | null;
}

export interface SupportersData {
  platinum: Supporter[];
  gold: Supporter[];
  silver: Supporter[];
  bronze: Supporter[];
  totalCount: number;
}

interface UseSupportersReturn {
  supporters: SupportersData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DEFAULT_SUPPORTERS: SupportersData = {
  platinum: [],
  gold: [],
  silver: [],
  bronze: [],
  totalCount: 0,
};

export function useSupporters(): UseSupportersReturn {
  const [supporters, setSupporters] = useState<SupportersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSupporters = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await client.graphql({
        query: GET_SUPPORTERS,
        authMode: "iam",
      });

      const data = (
        response as {
          data?: {
            getSupporters?: SupportersData;
          };
        }
      ).data?.getSupporters;

      if (data) {
        setSupporters({
          platinum: data.platinum || [],
          gold: data.gold || [],
          silver: data.silver || [],
          bronze: data.bronze || [],
          totalCount: data.totalCount || 0,
        });
      } else {
        setSupporters(DEFAULT_SUPPORTERS);
      }
    } catch (err) {
      console.error("Failed to fetch supporters:", err);
      setError("Failed to load supporters");
      setSupporters(DEFAULT_SUPPORTERS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSupporters();
  }, [fetchSupporters]);

  return {
    supporters,
    isLoading,
    error,
    refetch: fetchSupporters,
  };
}
