"use client";

import { useState, useEffect, useCallback } from "react";
import { client } from "@/lib/amplify";
import type { SubscriptionTier } from "@backroom-blackjack/shared";

// GraphQL query for fetching public profile
const GET_PUBLIC_PROFILE = /* GraphQL */ `
  query GetPublicProfile($userId: ID!) {
    getPublicProfile(userId: $userId) {
      userId
      username
      avatarUrl
      subscriptionTier
      earlyAdopter
      stats {
        highScore
        longestStreak
        perfectShoes
        totalHandsPlayed
      }
      createdAt
    }
  }
`;

export interface PublicStats {
  highScore: number;
  longestStreak: number;
  perfectShoes: number;
  totalHandsPlayed: number;
}

export interface PublicProfile {
  userId: string;
  username: string;
  avatarUrl: string | null;
  subscriptionTier: SubscriptionTier | null;
  earlyAdopter: boolean;
  stats: PublicStats | null;
  createdAt: string | null;
}

interface UsePublicProfileReturn {
  profile: PublicProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePublicProfile(
  userId: string | null,
): UsePublicProfileReturn {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.graphql({
        query: GET_PUBLIC_PROFILE,
        variables: { userId },
        authMode: "iam",
      });

      const data = (
        response as {
          data?: {
            getPublicProfile?: {
              userId: string;
              username: string;
              avatarUrl: string | null;
              subscriptionTier: SubscriptionTier | null;
              earlyAdopter: boolean;
              stats: PublicStats | null;
              createdAt: string | null;
            };
          };
        }
      ).data?.getPublicProfile;

      if (data) {
        setProfile({
          userId: data.userId,
          username: data.username,
          avatarUrl: data.avatarUrl,
          subscriptionTier: data.subscriptionTier,
          earlyAdopter: data.earlyAdopter,
          stats: data.stats,
          createdAt: data.createdAt,
        });
      } else {
        setProfile(null);
        setError("Profile not found");
      }
    } catch (err) {
      console.error("Failed to fetch public profile:", err);
      setError("Failed to load profile");
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}
