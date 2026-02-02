"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { client } from "@/lib/amplify";
import type {
  SubscriptionTier,
  SubscriptionStatus,
  PaymentProvider,
  TierBenefits,
} from "@backroom-blackjack/shared";
import {
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_TIER_NAMES,
  SUBSCRIPTION_TIER_PRICES,
  TIER_BADGE_COLORS,
  getTierBenefits,
  calculateChipPurchase,
  hasFeature,
  isAtLeastTier,
} from "@backroom-blackjack/shared";

// GraphQL query for fetching user with subscription info
const GET_USER = /* GraphQL */ `
  query GetUser {
    getUser {
      id
      email
      username
      chips
      avatarUrl
      earlyAdopter
      earlyAdopterQualifiedAt
      subscriptionInfo {
        tier
        status
        provider
        subscriptionId
        customerId
        startedAt
        expiresAt
        cancelledAt
        platinumSince
        monthlyStipendGrantedAt
      }
    }
  }
`;

// GraphQL mutation for creating a checkout session
const CREATE_CHECKOUT_SESSION = /* GraphQL */ `
  mutation CreateCheckoutSession($input: CreateCheckoutInput!) {
    createCheckoutSession(input: $input) {
      checkoutUrl
      sessionId
    }
  }
`;

interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus | null;
  provider: PaymentProvider | null;
  subscriptionId: string | null;
  customerId: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  cancelledAt: string | null;
  platinumSince: string | null;
  monthlyStipendGrantedAt: string | null;
}

interface UseSubscriptionReturn {
  // Subscription info
  tier: SubscriptionTier;
  tierName: string;
  tierPrice: number;
  tierColor: string;
  status: SubscriptionStatus | null;
  isSubscribed: boolean;
  isActive: boolean;
  subscription: SubscriptionInfo;

  // Benefits
  benefits: TierBenefits;
  chipPurchaseBonus: number;
  monthlyStipend: number;

  // Feature checks
  hasFeature: (feature: keyof TierBenefits) => boolean;
  isAtLeastTier: (requiredTier: SubscriptionTier) => boolean;

  // Chip purchase calculation
  calculateChipPurchase: (baseChips: number) => {
    baseChips: number;
    bonusChips: number;
    totalChips: number;
  };

  // Early adopter
  isEarlyAdopter: boolean;
  earlyAdopterQualifiedAt: string | null;

  // User display info
  displayName: string | null;
  avatarUrl: string | null;

  // Actions
  refreshSubscription: () => Promise<void>;
  createCheckout: (
    tier: SubscriptionTier,
    provider: PaymentProvider,
  ) => Promise<string | null>;

  // Loading state
  isLoading: boolean;
}

const DEFAULT_SUBSCRIPTION_INFO: SubscriptionInfo = {
  tier: SUBSCRIPTION_TIERS.NONE,
  status: null,
  provider: null,
  subscriptionId: null,
  customerId: null,
  startedAt: null,
  expiresAt: null,
  cancelledAt: null,
  platinumSince: null,
  monthlyStipendGrantedAt: null,
};

// Helper to get admin tier override from localStorage
function getAdminTierOverride(): SubscriptionTier | null {
  if (typeof window === "undefined") return null;
  const override = localStorage.getItem("adminTierOverride");
  if (override && override !== "null" && override !== "NONE") {
    return override as SubscriptionTier;
  }
  return null;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo>(
    DEFAULT_SUBSCRIPTION_INFO,
  );
  const [isEarlyAdopter, setIsEarlyAdopter] = useState(false);
  const [earlyAdopterQualifiedAt, setEarlyAdopterQualifiedAt] = useState<
    string | null
  >(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminTierOverride, setAdminTierOverride] =
    useState<SubscriptionTier | null>(null);

  // Load admin override - ONLY for admin users
  useEffect(() => {
    if (!isAdmin) {
      setAdminTierOverride(null);
      return undefined;
    }

    setAdminTierOverride(getAdminTierOverride());

    // Listen for changes from admin settings
    const handleStorageChange = () => {
      setAdminTierOverride(getAdminTierOverride());
    };
    window.addEventListener("adminTierOverrideChanged", handleStorageChange);
    return () => {
      window.removeEventListener(
        "adminTierOverrideChanged",
        handleStorageChange,
      );
    };
  }, [isAdmin]);

  // Derived values - use admin override if set
  const actualTier = adminTierOverride || subscription.tier;
  const { status } = subscription;
  const tier = actualTier;
  const tierName = SUBSCRIPTION_TIER_NAMES[tier] || "Free";
  const tierPrice = SUBSCRIPTION_TIER_PRICES[tier] || 0;
  const tierColor = TIER_BADGE_COLORS[tier] || "#6B7280";
  const isSubscribed = tier !== SUBSCRIPTION_TIERS.NONE;
  const isActive = isSubscribed && status === SUBSCRIPTION_STATUSES.ACTIVE;

  // Benefits based on tier
  const benefits = useMemo(() => getTierBenefits(tier), [tier]);
  const { chipPurchaseBonus, monthlyStipend } = benefits;

  // Feature check functions
  const checkFeature = useCallback(
    (feature: keyof TierBenefits) => hasFeature(tier, feature),
    [tier],
  );

  const checkTier = useCallback(
    (requiredTier: SubscriptionTier) => isAtLeastTier(tier, requiredTier),
    [tier],
  );

  // Chip purchase calculation
  const calcChipPurchase = useCallback(
    (baseChips: number) => calculateChipPurchase(baseChips, tier),
    [tier],
  );

  // Fetch subscription data from user profile
  const refreshSubscription = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setSubscription(DEFAULT_SUBSCRIPTION_INFO);
      setIsEarlyAdopter(false);
      setEarlyAdopterQualifiedAt(null);
      setDisplayName(null);
      setAvatarUrl(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await client.graphql({
        query: GET_USER,
        authMode: "userPool",
      });

      const userData = (
        response as {
          data?: {
            getUser?: {
              username?: string | null;
              avatarUrl?: string | null;
              earlyAdopter?: boolean;
              earlyAdopterQualifiedAt?: string;
              subscriptionInfo?: {
                tier: SubscriptionTier;
                status: SubscriptionStatus | null;
                provider: PaymentProvider | null;
                subscriptionId: string | null;
                customerId: string | null;
                startedAt: string | null;
                expiresAt: string | null;
                cancelledAt: string | null;
                platinumSince: string | null;
                monthlyStipendGrantedAt: string | null;
              };
            };
          };
        }
      ).data?.getUser;

      if (userData) {
        setDisplayName(userData.username ?? null);
        setAvatarUrl(userData.avatarUrl ?? null);
        setIsEarlyAdopter(userData.earlyAdopter ?? false);
        setEarlyAdopterQualifiedAt(userData.earlyAdopterQualifiedAt ?? null);

        if (userData.subscriptionInfo) {
          setSubscription({
            tier: userData.subscriptionInfo.tier,
            status: userData.subscriptionInfo.status,
            provider: userData.subscriptionInfo.provider,
            subscriptionId: userData.subscriptionInfo.subscriptionId,
            customerId: userData.subscriptionInfo.customerId,
            startedAt: userData.subscriptionInfo.startedAt,
            expiresAt: userData.subscriptionInfo.expiresAt,
            cancelledAt: userData.subscriptionInfo.cancelledAt,
            platinumSince: userData.subscriptionInfo.platinumSince,
            monthlyStipendGrantedAt:
              userData.subscriptionInfo.monthlyStipendGrantedAt,
          });
        } else {
          setSubscription(DEFAULT_SUBSCRIPTION_INFO);
        }
      } else {
        setSubscription(DEFAULT_SUBSCRIPTION_INFO);
        setIsEarlyAdopter(false);
        setEarlyAdopterQualifiedAt(null);
        setDisplayName(null);
        setAvatarUrl(null);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      setSubscription(DEFAULT_SUBSCRIPTION_INFO);
      setDisplayName(null);
      setAvatarUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Create a checkout session for subscription
  const createCheckout = useCallback(
    async (
      checkoutTier: SubscriptionTier,
      // Provider is currently always Stripe, but kept for future expansion
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _provider: PaymentProvider,
    ): Promise<string | null> => {
      if (!isAuthenticated) {
        console.error("Must be authenticated to create checkout");
        return null;
      }

      try {
        const baseUrl = window.location.origin;
        const response = await client.graphql({
          query: CREATE_CHECKOUT_SESSION,
          variables: {
            input: {
              tier: checkoutTier,
              successUrl: `${baseUrl}/subscribe?success=true`,
              cancelUrl: `${baseUrl}/subscribe?cancelled=true`,
            },
          },
          authMode: "userPool",
        });

        const result = (
          response as {
            data?: {
              createCheckoutSession?: {
                checkoutUrl: string;
                sessionId?: string;
              };
            };
          }
        ).data?.createCheckoutSession;

        if (result?.checkoutUrl) {
          return result.checkoutUrl;
        }

        console.error("No checkout URL returned");
        return null;
      } catch (error) {
        console.error("Failed to create checkout session:", error);
        return null;
      }
    },
    [isAuthenticated],
  );

  // Initial fetch
  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  return {
    tier,
    tierName,
    tierPrice,
    tierColor,
    status,
    isSubscribed,
    isActive,
    subscription,
    benefits,
    chipPurchaseBonus,
    monthlyStipend,
    hasFeature: checkFeature,
    isAtLeastTier: checkTier,
    calculateChipPurchase: calcChipPurchase,
    isEarlyAdopter,
    earlyAdopterQualifiedAt,
    displayName,
    avatarUrl,
    refreshSubscription,
    createCheckout,
    isLoading,
  };
}
