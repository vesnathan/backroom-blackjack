"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Button, Chip } from "@nextui-org/react";
import { useSupporters, Supporter } from "@/hooks/useSupporters";
import { useSubscription } from "@/hooks/useSubscription";
import {
  TIER_BADGE_COLORS,
  SubscriptionTier,
} from "@backroom-blackjack/shared";

const SUBSCRIBE_ROUTE = "/subscribe";

function SupporterCard({
  supporter,
  onClick,
  size = "large",
}: {
  supporter: Supporter;
  onClick: () => void;
  size?: "large" | "medium";
}) {
  const tierColor = TIER_BADGE_COLORS[supporter.tier];
  const memberSince = supporter.subscribedSince
    ? new Date(supporter.subscribedSince).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  if (size === "large") {
    return (
      <Card
        className="bg-gray-800/70 backdrop-blur border-2 cursor-pointer hover:scale-105 transition-transform"
        style={{ borderColor: tierColor }}
        isPressable
        onPress={onClick}
      >
        <CardBody className="p-6 text-center">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: tierColor,
              border: `3px solid ${tierColor}`,
            }}
          >
            {supporter.username.charAt(0).toUpperCase()}
          </div>

          <div className="font-bold text-white text-lg mb-1">
            {supporter.username}
          </div>

          <div className="flex flex-wrap gap-1 justify-center mb-2">
            {supporter.earlyAdopter && (
              <Chip color="secondary" size="sm" variant="flat">
                Early Adopter
              </Chip>
            )}
          </div>

          {memberSince && (
            <div className="text-gray-400 text-xs">Since {memberSince}</div>
          )}
        </CardBody>
      </Card>
    );
  }

  // Medium size for Gold tier
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border cursor-pointer hover:bg-gray-700/50 transition-colors"
      style={{ borderColor: tierColor }}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      role="button"
      tabIndex={0}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ backgroundColor: tierColor }}
      >
        {supporter.username.charAt(0).toUpperCase()}
      </div>
      <span className="text-white font-medium">{supporter.username}</span>
      {supporter.earlyAdopter && (
        <span className="text-purple-400 text-xs">★</span>
      )}
    </div>
  );
}

function SupporterName({
  supporter,
  onClick,
}: {
  supporter: Supporter;
  onClick: () => void;
}) {
  return (
    <span
      className="text-gray-300 hover:text-white cursor-pointer hover:underline"
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      role="button"
      tabIndex={0}
    >
      {supporter.username}
      {supporter.earlyAdopter && (
        <span className="text-purple-400 ml-1">★</span>
      )}
    </span>
  );
}

export default function SupportersPage() {
  const router = useRouter();
  const { supporters, isLoading, error } = useSupporters();
  const { tier: currentTier } = useSubscription();
  const [showLowerTiers, setShowLowerTiers] = useState(false);

  const isSubscribed = currentTier !== SubscriptionTier.None;
  const lowerTierCount =
    (supporters?.silver.length || 0) + (supporters?.bronze.length || 0);

  const navigateToProfile = (userId: string) => {
    router.push(`/profile?userId=${userId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-casino-dark">
        <div className="text-white">Loading supporters...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-casino-dark">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <Button onClick={() => router.push("/")}>Back to Game</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-casino-dark py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white"
            onClick={() => router.push("/")}
          >
            ← Back to Game
          </Button>
          {!isSubscribed && (
            <Button
              color="warning"
              onClick={() => router.push(SUBSCRIBE_ROUTE)}
            >
              Become a Supporter
            </Button>
          )}
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Our Supporters</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Thank you to everyone who supports Backroom Blackjack! Your
            contributions help us build the ultimate card counting trainer.
          </p>
          {supporters && supporters.totalCount > 0 && (
            <div className="mt-4 text-casino-gold font-semibold">
              {supporters.totalCount} supporter
              {supporters.totalCount !== 1 ? "s" : ""} and counting!
            </div>
          )}
        </div>

        {/* Platinum Supporters */}
        {supporters && supporters.platinum.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: TIER_BADGE_COLORS.PLATINUM }}
              />
              <h2 className="text-2xl font-bold text-white">
                Platinum Supporters
              </h2>
              <Chip
                size="sm"
                style={{
                  backgroundColor: TIER_BADGE_COLORS.PLATINUM,
                  color: "#000",
                }}
              >
                {supporters.platinum.length}
              </Chip>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {supporters.platinum.map((supporter) => (
                <SupporterCard
                  key={supporter.userId}
                  supporter={supporter}
                  onClick={() => navigateToProfile(supporter.userId)}
                  size="large"
                />
              ))}
            </div>
          </section>
        )}

        {/* Gold Supporters */}
        {supporters && supporters.gold.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: TIER_BADGE_COLORS.GOLD }}
              />
              <h2 className="text-2xl font-bold text-white">Gold Supporters</h2>
              <Chip
                size="sm"
                style={{
                  backgroundColor: TIER_BADGE_COLORS.GOLD,
                  color: "#000",
                }}
              >
                {supporters.gold.length}
              </Chip>
            </div>
            <div className="flex flex-wrap gap-3">
              {supporters.gold.map((supporter) => (
                <SupporterCard
                  key={supporter.userId}
                  supporter={supporter}
                  onClick={() => navigateToProfile(supporter.userId)}
                  size="medium"
                />
              ))}
            </div>
          </section>
        )}

        {/* Silver & Bronze (Collapsed) */}
        {lowerTierCount > 0 && (
          <section className="mb-12">
            <button
              type="button"
              className="flex items-center gap-3 mb-4 text-left w-full"
              onClick={() => setShowLowerTiers(!showLowerTiers)}
            >
              <span className="text-gray-400 text-xl">
                {showLowerTiers ? "▼" : "▶"}
              </span>
              <h2 className="text-xl font-bold text-gray-300">
                Silver & Bronze Supporters
              </h2>
              <Chip
                size="sm"
                variant="flat"
                className="bg-gray-700 text-gray-300"
              >
                {lowerTierCount}
              </Chip>
            </button>

            {showLowerTiers && (
              <Card className="bg-gray-800/30 border border-gray-700">
                <CardBody className="p-6">
                  {supporters && supporters.silver.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: TIER_BADGE_COLORS.SILVER }}
                        />
                        <span className="text-gray-400 text-sm font-semibold">
                          Silver ({supporters.silver.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {supporters.silver.map((supporter, idx) => (
                          <span key={supporter.userId}>
                            <SupporterName
                              supporter={supporter}
                              onClick={() =>
                                navigateToProfile(supporter.userId)
                              }
                            />
                            {idx < supporters.silver.length - 1 && (
                              <span className="text-gray-600">,</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {supporters && supporters.bronze.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: TIER_BADGE_COLORS.BRONZE }}
                        />
                        <span className="text-gray-400 text-sm font-semibold">
                          Bronze ({supporters.bronze.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {supporters.bronze.map((supporter, idx) => (
                          <span key={supporter.userId}>
                            <SupporterName
                              supporter={supporter}
                              onClick={() =>
                                navigateToProfile(supporter.userId)
                              }
                            />
                            {idx < supporters.bronze.length - 1 && (
                              <span className="text-gray-600">,</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
          </section>
        )}

        {/* No Supporters Yet */}
        {supporters && supporters.totalCount === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎰</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Be Our First Supporter!
            </h2>
            <p className="text-gray-400 mb-6">
              No supporters yet. Be the first to support Backroom Blackjack!
            </p>
            <Button
              color="warning"
              onClick={() => router.push(SUBSCRIBE_ROUTE)}
            >
              Become a Supporter
            </Button>
          </div>
        )}

        {/* CTA for Non-Subscribers */}
        {!isSubscribed && supporters && supporters.totalCount > 0 && (
          <div className="text-center mt-12 p-8 bg-casino-gold/10 rounded-lg border border-casino-gold/30">
            <h2 className="text-2xl font-bold text-casino-gold mb-2">
              Join Our Community
            </h2>
            <p className="text-gray-300 mb-4">
              Support Backroom Blackjack and get your name on this page!
            </p>
            <Button
              color="warning"
              onClick={() => router.push(SUBSCRIBE_ROUTE)}
            >
              Become a Supporter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
