/**
 * Subscription types for Backroom Blackjack
 *
 * Tiers: NONE (free), BRONZE ($3), SILVER ($5), GOLD ($10), PLATINUM ($20)
 */

// Import enums (not just types) from gqlTypes - these are the source of truth
import {
  SubscriptionTier,
  SubscriptionStatus,
  PaymentProvider,
} from "./gqlTypes";

// Re-export for convenience
export { SubscriptionTier, SubscriptionStatus, PaymentProvider };

/**
 * Subscription tier constants - using actual enum values
 */
export const SUBSCRIPTION_TIERS = {
  NONE: SubscriptionTier.None,
  BRONZE: SubscriptionTier.Bronze,
  SILVER: SubscriptionTier.Silver,
  GOLD: SubscriptionTier.Gold,
  PLATINUM: SubscriptionTier.Platinum,
} as const;

/**
 * Subscription status constants - using actual enum values
 */
export const SUBSCRIPTION_STATUSES = {
  ACTIVE: SubscriptionStatus.Active,
  CANCELLED: SubscriptionStatus.Cancelled,
  PAST_DUE: SubscriptionStatus.PastDue,
  TRIALING: SubscriptionStatus.Trialing,
} as const;

/**
 * Display names for each tier
 */
export const SUBSCRIPTION_TIER_NAMES: Record<SubscriptionTier, string> = {
  [SubscriptionTier.None]: "Free",
  [SubscriptionTier.Bronze]: "Bronze",
  [SubscriptionTier.Silver]: "Silver",
  [SubscriptionTier.Gold]: "Gold",
  [SubscriptionTier.Platinum]: "Platinum",
};

/**
 * Prices in cents (USD) for each tier
 */
export const SUBSCRIPTION_TIER_PRICES: Record<SubscriptionTier, number> = {
  [SubscriptionTier.None]: 0,
  [SubscriptionTier.Bronze]: 300, // $3.00
  [SubscriptionTier.Silver]: 500, // $5.00
  [SubscriptionTier.Gold]: 1000, // $10.00
  [SubscriptionTier.Platinum]: 2000, // $20.00
};

/**
 * Tier benefits configuration
 */
export interface TierBenefits {
  chipPurchaseBonus: number; // Percentage bonus on chip purchases (10 = 10%)
  monthlyStipend: number; // Free chips granted monthly
  adFree: boolean;
  badge: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  creditsPage: boolean; // Name in credits/supporters page
  earlyAdopterEligible: boolean; // Can qualify for early adopter status
}

export const TIER_BENEFITS: Record<SubscriptionTier, TierBenefits> = {
  [SubscriptionTier.None]: {
    chipPurchaseBonus: 0,
    monthlyStipend: 0,
    adFree: false,
    badge: false,
    prioritySupport: false,
    advancedAnalytics: false,
    creditsPage: false,
    earlyAdopterEligible: false,
  },
  [SubscriptionTier.Bronze]: {
    chipPurchaseBonus: 10, // 10% bonus
    monthlyStipend: 0,
    adFree: false,
    badge: true,
    prioritySupport: true,
    advancedAnalytics: false,
    creditsPage: false,
    earlyAdopterEligible: false,
  },
  [SubscriptionTier.Silver]: {
    chipPurchaseBonus: 25, // 25% bonus
    monthlyStipend: 500,
    adFree: true,
    badge: true,
    prioritySupport: true,
    advancedAnalytics: false,
    creditsPage: false,
    earlyAdopterEligible: false,
  },
  [SubscriptionTier.Gold]: {
    chipPurchaseBonus: 50, // 50% bonus
    monthlyStipend: 1500,
    adFree: true,
    badge: true,
    prioritySupport: true,
    advancedAnalytics: true,
    creditsPage: false,
    earlyAdopterEligible: false,
  },
  [SubscriptionTier.Platinum]: {
    chipPurchaseBonus: 100, // 100% bonus (double chips)
    monthlyStipend: 3000,
    adFree: true,
    badge: true,
    prioritySupport: true,
    advancedAnalytics: true,
    creditsPage: true,
    earlyAdopterEligible: true,
  },
};

/**
 * Badge colors for each tier (hex)
 */
export const TIER_BADGE_COLORS: Record<SubscriptionTier, string> = {
  [SubscriptionTier.None]: "#6B7280", // Gray
  [SubscriptionTier.Bronze]: "#CD7F32", // Bronze metallic
  [SubscriptionTier.Silver]: "#C0C0C0", // Silver metallic
  [SubscriptionTier.Gold]: "#FFD700", // Gold
  [SubscriptionTier.Platinum]: "#E5E4E2", // Platinum
};

/**
 * Early adopter badge color
 */
export const EARLY_ADOPTER_BADGE_COLOR = "#9B59B6"; // Purple

/**
 * Default subscription info for free users
 */
export const DEFAULT_SUBSCRIPTION_INFO = {
  tier: SubscriptionTier.None,
  status: null as SubscriptionStatus | null,
  provider: null as PaymentProvider | null,
  subscriptionId: null as string | null,
  customerId: null as string | null,
  startedAt: null as string | null,
  expiresAt: null as string | null,
  cancelledAt: null as string | null,
  platinumSince: null as string | null,
  monthlyStipendGrantedAt: null as string | null,
};

/**
 * Get benefits for a subscription tier
 */
export function getTierBenefits(tier: SubscriptionTier): TierBenefits {
  return TIER_BENEFITS[tier] || TIER_BENEFITS[SubscriptionTier.None];
}

/**
 * Calculate chip purchase with tier bonus
 */
export function calculateChipPurchase(
  baseChips: number,
  tier: SubscriptionTier
): { baseChips: number; bonusChips: number; totalChips: number } {
  const benefits = getTierBenefits(tier);
  const bonusChips = Math.floor(baseChips * (benefits.chipPurchaseBonus / 100));
  return {
    baseChips,
    bonusChips,
    totalChips: baseChips + bonusChips,
  };
}

/**
 * Check if a tier has access to a specific feature
 */
export function hasFeature(
  tier: SubscriptionTier,
  feature: keyof TierBenefits
): boolean {
  const benefits = getTierBenefits(tier);
  return Boolean(benefits[feature]);
}

/**
 * Tier order for comparison (lowest to highest)
 */
const TIER_ORDER: SubscriptionTier[] = [
  SubscriptionTier.None,
  SubscriptionTier.Bronze,
  SubscriptionTier.Silver,
  SubscriptionTier.Gold,
  SubscriptionTier.Platinum,
];

/**
 * Compare two tiers (returns positive if tier1 > tier2)
 */
export function compareTiers(
  tier1: SubscriptionTier,
  tier2: SubscriptionTier
): number {
  return TIER_ORDER.indexOf(tier1) - TIER_ORDER.indexOf(tier2);
}

/**
 * Check if tier1 is at least tier2 level
 */
export function isAtLeastTier(
  currentTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  return compareTiers(currentTier, requiredTier) >= 0;
}

/**
 * Stripe webhook event types we handle
 */
export type StripeWebhookEvent =
  | "checkout.session.completed"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.payment_succeeded"
  | "invoice.payment_failed";

/**
 * Checkout session request
 */
export interface CreateCheckoutRequest {
  tier: SubscriptionTier;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Checkout session response
 */
export interface CreateCheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

/**
 * Game settings restrictions by tier
 */
export interface GameSettingsRestrictions {
  /** Available counting systems */
  countingSystems: string[];
  /** Available deck counts */
  deckCounts: number[];
  /** Min/max deck penetration percentage */
  penetrationRange: { min: number; max: number };
  /** Can use side count for aces */
  sideCountAces: boolean;
  /** Strategy card peeks per hand (0 = none, -1 = unlimited) */
  strategyCardPeeksPerHand: number;
  /** Count peeks per shoe (0 = none, -1 = unlimited) */
  countPeeksPerShoe: number;
  /** Available presets */
  presets: string[];
}

export const TIER_GAME_RESTRICTIONS: Record<SubscriptionTier, GameSettingsRestrictions> = {
  [SubscriptionTier.None]: {
    countingSystems: ["HI_LO"],
    deckCounts: [6, 8],
    penetrationRange: { min: 50, max: 75 },
    sideCountAces: false,
    strategyCardPeeksPerHand: 3,
    countPeeksPerShoe: 0,
    presets: ["LAS_VEGAS_STRIP"],
  },
  [SubscriptionTier.Bronze]: {
    countingSystems: ["HI_LO", "KO"],
    deckCounts: [4, 6, 8],
    penetrationRange: { min: 50, max: 80 },
    sideCountAces: false,
    strategyCardPeeksPerHand: 5,
    countPeeksPerShoe: 3,
    presets: ["LAS_VEGAS_STRIP", "BAD_RULES"],
  },
  [SubscriptionTier.Silver]: {
    countingSystems: ["HI_LO", "KO", "HI_OPT_I"],
    deckCounts: [2, 4, 6, 8],
    penetrationRange: { min: 40, max: 85 },
    sideCountAces: true,
    strategyCardPeeksPerHand: 10,
    countPeeksPerShoe: 5,
    presets: ["LAS_VEGAS_STRIP", "DOUBLE_DECK", "BAD_RULES", "EUROPEAN"],
  },
  [SubscriptionTier.Gold]: {
    countingSystems: ["HI_LO", "KO", "HI_OPT_I", "HI_OPT_II"],
    deckCounts: [1, 2, 4, 6, 8],
    penetrationRange: { min: 40, max: 90 },
    sideCountAces: true,
    strategyCardPeeksPerHand: -1, // Unlimited
    countPeeksPerShoe: -1, // Unlimited
    presets: ["LAS_VEGAS_STRIP", "SINGLE_DECK", "DOUBLE_DECK", "BAD_RULES", "EUROPEAN"],
  },
  [SubscriptionTier.Platinum]: {
    countingSystems: ["HI_LO", "KO", "HI_OPT_I", "HI_OPT_II", "OMEGA_II"],
    deckCounts: [1, 2, 4, 6, 8],
    penetrationRange: { min: 30, max: 95 },
    sideCountAces: true,
    strategyCardPeeksPerHand: -1, // Unlimited
    countPeeksPerShoe: -1, // Unlimited
    presets: ["LAS_VEGAS_STRIP", "SINGLE_DECK", "DOUBLE_DECK", "BAD_RULES", "EUROPEAN"],
  },
};

/**
 * Get game settings restrictions for a tier
 */
export function getGameRestrictions(tier: SubscriptionTier): GameSettingsRestrictions {
  return TIER_GAME_RESTRICTIONS[tier] || TIER_GAME_RESTRICTIONS[SubscriptionTier.None];
}

/**
 * Check if a counting system is available for a tier
 */
export function isCountingSystemAvailable(
  tier: SubscriptionTier,
  system: string
): boolean {
  const restrictions = getGameRestrictions(tier);
  return restrictions.countingSystems.includes(system);
}

/**
 * Check if a deck count is available for a tier
 */
export function isDeckCountAvailable(
  tier: SubscriptionTier,
  deckCount: number
): boolean {
  const restrictions = getGameRestrictions(tier);
  return restrictions.deckCounts.includes(deckCount);
}

/**
 * Check if a penetration value is within tier's range
 */
export function isPenetrationAvailable(
  tier: SubscriptionTier,
  penetration: number
): boolean {
  const restrictions = getGameRestrictions(tier);
  return (
    penetration >= restrictions.penetrationRange.min &&
    penetration <= restrictions.penetrationRange.max
  );
}

/**
 * Get the minimum tier required for a counting system
 */
export function getMinTierForCountingSystem(system: string): SubscriptionTier {
  const tiers: SubscriptionTier[] = [
    SubscriptionTier.None,
    SubscriptionTier.Bronze,
    SubscriptionTier.Silver,
    SubscriptionTier.Gold,
    SubscriptionTier.Platinum,
  ];
  for (const tier of tiers) {
    if (isCountingSystemAvailable(tier, system)) {
      return tier;
    }
  }
  return SubscriptionTier.Platinum;
}

/**
 * Get the minimum tier required for a deck count
 */
export function getMinTierForDeckCount(deckCount: number): SubscriptionTier {
  const tiers: SubscriptionTier[] = [
    SubscriptionTier.None,
    SubscriptionTier.Bronze,
    SubscriptionTier.Silver,
    SubscriptionTier.Gold,
    SubscriptionTier.Platinum,
  ];
  for (const tier of tiers) {
    if (isDeckCountAvailable(tier, deckCount)) {
      return tier;
    }
  }
  return SubscriptionTier.Platinum;
}

/**
 * Early adopter qualification requirements
 */
export const EARLY_ADOPTER_REQUIREMENTS = {
  requiredTier: SubscriptionTier.Platinum,
  requiredMonths: 12,
  chipRefillThreshold: 1000, // Refill when below this
  chipRefillAmount: 10000, // Refill to this amount
};

/**
 * Chip package for one-time purchase
 */
export interface ChipPackage {
  id: string;
  chips: number; // Base chips before any tier bonus
  priceInCents: number;
  displayName: string;
  popular?: boolean;
}

/**
 * Available chip packages for purchase
 */
export const CHIP_PACKAGES: ChipPackage[] = [
  {
    id: "chips_1000",
    chips: 1000,
    priceInCents: 1000, // $10
    displayName: "1,000 Chips",
  },
  {
    id: "chips_5000",
    chips: 5000,
    priceInCents: 4500, // $45 (10% discount)
    displayName: "5,000 Chips",
    popular: true,
  },
  {
    id: "chips_10000",
    chips: 10000,
    priceInCents: 8000, // $80 (20% discount)
    displayName: "10,000 Chips",
  },
];

/**
 * Get a chip package by ID
 */
export function getChipPackage(packageId: string): ChipPackage | undefined {
  return CHIP_PACKAGES.find((pkg) => pkg.id === packageId);
}

/**
 * Chip checkout request
 */
export interface CreateChipCheckoutRequest {
  packageId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Chip checkout response
 */
export interface CreateChipCheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}
