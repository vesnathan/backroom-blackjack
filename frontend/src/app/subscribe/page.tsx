"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, Button, Chip } from "@nextui-org/react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import type { SubscriptionTier } from "@backroom-blackjack/shared";
import {
  TIER_BADGE_COLORS,
  SUBSCRIPTION_TIERS,
  PaymentProvider,
} from "@backroom-blackjack/shared";

// Hook to check if we're on a small/mobile screen (landscape)
function useIsMobileScreen(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerHeight < 500 || window.innerWidth < 900);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

interface TierInfo {
  id: SubscriptionTier;
  name: string;
  price: number;
  color: string;
  popular?: boolean;
  features: string[];
}

const AD_FREE = "Ad-free experience";
const PRIORITY_SUPPORT = "Priority support via email";

const TIERS: TierInfo[] = [
  {
    id: SUBSCRIPTION_TIERS.BRONZE,
    name: "Bronze",
    price: 300,
    color: TIER_BADGE_COLORS.BRONZE,
    features: [
      "10% chip purchase bonus",
      "Bronze badge on profile",
      PRIORITY_SUPPORT,
    ],
  },
  {
    id: SUBSCRIPTION_TIERS.SILVER,
    name: "Silver",
    price: 500,
    color: TIER_BADGE_COLORS.SILVER,
    features: [
      "25% chip purchase bonus",
      "500 free chips monthly",
      "Silver badge on profile",
      AD_FREE,
      PRIORITY_SUPPORT,
    ],
  },
  {
    id: SUBSCRIPTION_TIERS.GOLD,
    name: "Gold",
    price: 1000,
    color: TIER_BADGE_COLORS.GOLD,
    popular: true,
    features: [
      "50% chip purchase bonus",
      "1,500 free chips monthly",
      "Gold badge on profile",
      AD_FREE,
      "Advanced analytics",
      PRIORITY_SUPPORT,
    ],
  },
  {
    id: SUBSCRIPTION_TIERS.PLATINUM,
    name: "Platinum",
    price: 2000,
    color: TIER_BADGE_COLORS.PLATINUM,
    features: [
      "100% chip purchase bonus (double!)",
      "3,000 free chips monthly",
      "Platinum badge on profile",
      AD_FREE,
      "Name in credits",
      "Early adopter eligibility",
      PRIORITY_SUPPORT,
    ],
  },
];

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-green-400 flex-shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface TierCardProps {
  tier: TierInfo;
  currentTier: SubscriptionTier;
  onSelect: (tier: SubscriptionTier) => void;
  isLoading: boolean;
  loadingTier: SubscriptionTier | null;
  isMobile?: boolean;
}

function TierCard({
  tier,
  currentTier,
  onSelect,
  isLoading,
  loadingTier,
  isMobile = false,
}: TierCardProps) {
  const isCurrentTier = currentTier === tier.id;
  const priceDisplay = `$${(tier.price / 100).toFixed(0)}`;

  // Mobile: compact card for landscape view
  if (isMobile) {
    return (
      <div
        className={`bg-gray-800/70 backdrop-blur border-2 rounded-lg p-2 transition-all ${
          tier.popular
            ? "border-casino-gold"
            : isCurrentTier
              ? "border-green-500"
              : "border-gray-700"
        }`}
      >
        {tier.popular && (
          <div className="text-center mb-1">
            <span className="bg-yellow-500 text-black text-[10px] px-2 py-0.5 rounded font-bold">
              Popular
            </span>
          </div>
        )}
        {isCurrentTier && (
          <div className="text-center mb-1">
            <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">
              Current
            </span>
          </div>
        )}
        <div
          className="w-6 h-6 rounded-full mx-auto mb-1"
          style={{ backgroundColor: tier.color }}
        />
        <h3 className="text-sm font-bold text-white text-center">
          {tier.name}
        </h3>
        <div className="text-center">
          <span className="text-lg font-extrabold text-white">
            {priceDisplay}
          </span>
          <span className="text-gray-400 text-[10px]">/mo</span>
        </div>
        <div className="text-[9px] text-gray-400 text-center my-1 leading-tight">
          {tier.features.slice(0, 2).join(" • ")}
        </div>
        {!isCurrentTier ? (
          <Button
            color="primary"
            size="sm"
            className="w-full text-xs min-h-[32px]"
            onClick={() => onSelect(tier.id)}
            isLoading={isLoading && loadingTier === tier.id}
            isDisabled={isLoading}
          >
            Subscribe
          </Button>
        ) : (
          <Button
            color="success"
            size="sm"
            className="w-full text-xs min-h-[32px]"
            isDisabled
          >
            Current
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card
      className={`bg-gray-800/70 backdrop-blur border-2 transition-all ${
        tier.popular
          ? "border-casino-gold scale-105"
          : isCurrentTier
            ? "border-green-500"
            : "border-gray-700"
      }`}
    >
      <CardHeader className="flex flex-col items-center pt-6 pb-2">
        {tier.popular && (
          <Chip color="warning" size="sm" className="mb-2">
            Most Popular
          </Chip>
        )}
        {isCurrentTier && (
          <Chip color="success" size="sm" className="mb-2">
            Current Plan
          </Chip>
        )}
        <div
          className="w-12 h-12 rounded-full mb-3"
          style={{ backgroundColor: tier.color }}
        />
        <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
        <div className="flex items-baseline mt-2">
          <span className="text-4xl font-extrabold text-white">
            {priceDisplay}
          </span>
          <span className="text-gray-400 ml-1">/month</span>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <ul className="space-y-3 mb-6">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckIcon />
              <span className="text-gray-300 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {!isCurrentTier && (
          <Button
            color="primary"
            className="w-full"
            onClick={() => onSelect(tier.id)}
            isLoading={isLoading && loadingTier === tier.id}
            isDisabled={isLoading}
          >
            Subscribe Now
          </Button>
        )}

        {isCurrentTier && (
          <Button color="success" className="w-full" isDisabled>
            Current Plan
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

function SubscribeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    tier: currentTier,
    isLoading: subLoading,
    createCheckout,
    refreshSubscription,
  } = useSubscription();
  const isMobile = useIsMobileScreen();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Check for success/cancel query params
  useEffect(() => {
    const success = searchParams.get("success");
    const cancelled = searchParams.get("cancelled");

    if (success === "true") {
      setMessage({
        type: "success",
        text: "Thank you for subscribing! Your benefits are now active.",
      });
      // Refresh subscription data to show new tier
      refreshSubscription();
    } else if (cancelled === "true") {
      setMessage({
        type: "error",
        text: "Subscription cancelled. No charges were made.",
      });
    }
  }, [searchParams, refreshSubscription]);

  const handleSelectTier = async (tier: SubscriptionTier) => {
    if (!isAuthenticated) {
      // Redirect to login or show auth modal
      router.push("/?auth=true");
      return;
    }

    setIsLoading(true);
    setLoadingTier(tier);
    setMessage(null);

    try {
      const checkoutUrl = await createCheckout(tier, PaymentProvider.Stripe);

      if (checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = checkoutUrl;
      } else {
        setMessage({
          type: "error",
          text: "Failed to create checkout session. Please try again.",
        });
        setIsLoading(false);
        setLoadingTier(null);
      }
    } catch (error) {
      console.error("Failed to create checkout:", error);
      setMessage({
        type: "error",
        text: "Failed to create checkout session. Please try again.",
      });
      setIsLoading(false);
      setLoadingTier(null);
    }
  };

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-casino-dark">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Mobile layout: compact, horizontal, no header text
  if (isMobile) {
    return (
      <div className="min-h-screen bg-casino-dark py-2 px-2 overflow-auto">
        <div className="max-w-full mx-auto">
          {/* Back Button - compact */}
          <div className="mb-2 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white text-xs"
              onClick={() => router.push("/")}
            >
              ← Back
            </Button>
            <h1 className="text-sm font-bold text-casino-gold">
              Choose a Plan
            </h1>
            <div className="w-12" /> {/* Spacer for centering */}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-2 p-2 rounded-lg text-center text-xs ${
                message.type === "success"
                  ? "bg-green-900/50 text-green-300 border border-green-700"
                  : "bg-red-900/50 text-red-300 border border-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Tier Cards - 4 in a row */}
          <div className="grid grid-cols-4 gap-2">
            {TIERS.map((tier) => (
              <TierCard
                key={tier.id}
                tier={tier}
                currentTier={currentTier}
                onSelect={handleSelectTier}
                isLoading={isLoading}
                loadingTier={loadingTier}
                isMobile
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-casino-dark py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white"
            onClick={() => router.push("/")}
          >
            ← Back to Game
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Support Backroom Blackjack
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choose a plan to unlock exclusive benefits, bonus chips, and help us
            build the ultimate card counting trainer.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-8 p-4 rounded-lg text-center ${
              message.type === "success"
                ? "bg-green-900/50 text-green-300 border border-green-700"
                : "bg-red-900/50 text-red-300 border border-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              currentTier={currentTier}
              onSelect={handleSelectTier}
              isLoading={isLoading}
              loadingTier={loadingTier}
            />
          ))}
        </div>

        {/* Early Adopter Banner */}
        <div className="mt-12 p-6 bg-purple-900/30 rounded-lg border border-purple-700">
          <h2 className="text-2xl font-bold text-purple-300 mb-2">
            Early Adopter Program
          </h2>
          <p className="text-gray-300">
            Subscribe to <strong>Platinum</strong> for 12 consecutive months and
            unlock <strong>lifetime unlimited chips</strong>! Your chips will
            automatically refill whenever you run low. This is our way of
            thanking our earliest supporters.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-400">
                Yes! You can cancel your subscription at any time. You will
                retain your benefits until the end of your current billing
                period.
              </p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-400">
                We accept all major credit and debit cards via Stripe, including
                Visa, Mastercard, and American Express.
              </p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                When do I receive my monthly chips?
              </h3>
              <p className="text-gray-400">
                Monthly chip stipends are automatically credited to your account
                every 30 days from your subscription start date.
              </p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I upgrade or downgrade?
              </h3>
              <p className="text-gray-400">
                Yes! You can change your plan at any time. Upgrades take effect
                immediately, and downgrades take effect at your next billing
                cycle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-casino-dark">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <SubscribeContent />
    </Suspense>
  );
}
