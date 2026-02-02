import { util, Context } from "@aws-appsync/utils";
import { TierInfo, SubscriptionTier } from "gqlTypes";

type CTX = Context<object, object, object, object, TierInfo[]>;

/**
 * Returns static tier information - no database access needed.
 * Uses NoneDataSource.
 */
export function request(_ctx: CTX) {
  return { payload: null };
}

export function response(_ctx: CTX): TierInfo[] {
  const tiers: TierInfo[] = [
    {
      __typename: "TierInfo",
      tier: SubscriptionTier.Bronze,
      name: "Bronze",
      priceMonthly: 300,
      chipPurchaseBonus: 10,
      monthlyStipend: 0,
      features: ["10% chip purchase bonus", "Bronze badge", "Priority support"],
    },
    {
      __typename: "TierInfo",
      tier: SubscriptionTier.Silver,
      name: "Silver",
      priceMonthly: 500,
      chipPurchaseBonus: 25,
      monthlyStipend: 500,
      features: [
        "25% chip purchase bonus",
        "500 chips monthly",
        "Silver badge",
        "Ad-free experience",
        "Early access to features",
        "Custom avatar border",
      ],
    },
    {
      __typename: "TierInfo",
      tier: SubscriptionTier.Gold,
      name: "Gold",
      priceMonthly: 1000,
      chipPurchaseBonus: 50,
      monthlyStipend: 1500,
      features: [
        "50% chip purchase bonus",
        "1,500 chips monthly",
        "Gold badge",
        "Ad-free experience",
        "Discord access",
        "Advanced analytics",
        "Vote on features",
        "Custom avatar border",
      ],
    },
    {
      __typename: "TierInfo",
      tier: SubscriptionTier.Platinum,
      name: "Platinum",
      priceMonthly: 2000,
      chipPurchaseBonus: 100,
      monthlyStipend: 3000,
      features: [
        "100% chip purchase bonus (double chips)",
        "3,000 chips monthly",
        "Platinum badge",
        "Ad-free experience",
        "Discord access",
        "Exclusive platinum tables",
        "Custom table themes",
        "Video tutorials",
        "Name in credits",
        "Early adopter eligibility",
      ],
    },
  ];

  return tiers;
}
