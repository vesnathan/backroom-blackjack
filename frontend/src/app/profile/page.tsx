"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardBody, Button, Chip } from "@nextui-org/react";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useAuth } from "@/contexts/AuthContext";
import AvatarUpload from "@/components/common/AvatarUpload";
import {
  TIER_BADGE_COLORS,
  SUBSCRIPTION_TIER_NAMES,
  SubscriptionTier,
} from "@backroom-blackjack/shared";

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: string;
}) {
  return (
    <Card className="bg-gray-800/70 backdrop-blur border border-gray-700">
      <CardBody className="text-center py-6">
        <div className="text-3xl mb-2">{icon}</div>
        <div className="text-2xl font-bold text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-gray-400 text-sm">{label}</div>
      </CardBody>
    </Card>
  );
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const { user, isAuthenticated } = useAuth();
  const { profile, isLoading, error, refetch } = usePublicProfile(userId || "");

  const isOwnProfile = isAuthenticated && user?.userId === userId;

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-casino-dark">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">No user ID provided</div>
          <Button onClick={() => router.push("/")}>Back to Game</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-casino-dark">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-casino-dark">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">
            {error || "Profile not found"}
          </div>
          <Button onClick={() => router.push("/")}>Back to Game</Button>
        </div>
      </div>
    );
  }

  const tierColor =
    profile.subscriptionTier &&
    profile.subscriptionTier !== SubscriptionTier.None
      ? TIER_BADGE_COLORS[profile.subscriptionTier]
      : null;
  const tierName =
    profile.subscriptionTier &&
    profile.subscriptionTier !== SubscriptionTier.None
      ? SUBSCRIPTION_TIER_NAMES[profile.subscriptionTier]
      : null;

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Unknown";

  return (
    <div className="min-h-screen bg-casino-dark py-12 px-4">
      <div className="max-w-4xl mx-auto">
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

        {/* Profile Header */}
        <Card className="bg-gray-800/70 backdrop-blur border border-gray-700 mb-8">
          <CardBody className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar - editable for own profile */}
              {isOwnProfile ? (
                <AvatarUpload
                  currentAvatarUrl={profile.avatarUrl}
                  username={profile.username}
                  onAvatarChange={() => refetch()}
                  size={96}
                />
              ) : profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.username}
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                  style={{
                    border: tierColor
                      ? `3px solid ${tierColor}`
                      : "3px solid #4B5563",
                  }}
                  unoptimized
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
                  style={{
                    backgroundColor: tierColor || "#374151",
                    border: tierColor
                      ? `3px solid ${tierColor}`
                      : "3px solid #4B5563",
                  }}
                >
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-white mb-1">
                  {profile.username}
                </h1>
                <div className="text-gray-400 mb-3">
                  Member since {memberSince}
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {tierName && (
                    <Chip
                      style={{
                        backgroundColor: tierColor || undefined,
                        color: "#FFF",
                      }}
                      size="sm"
                    >
                      {tierName} Supporter
                    </Chip>
                  )}
                  {profile.earlyAdopter && (
                    <Chip color="secondary" size="sm">
                      Early Adopter
                    </Chip>
                  )}
                </div>
              </div>

              {isOwnProfile && (
                <Button
                  variant="bordered"
                  className="text-gray-300 border-gray-600"
                  isDisabled
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Stats Section */}
        <h2 className="text-xl font-bold text-white mb-4">Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="⭐"
            label="High Score"
            value={profile.stats?.highScore || 0}
          />
          <StatCard
            icon="🔥"
            label="Longest Streak"
            value={profile.stats?.longestStreak || 0}
          />
          <StatCard
            icon="🎯"
            label="Perfect Shoes"
            value={profile.stats?.perfectShoes || 0}
          />
          <StatCard
            icon="🃏"
            label="Hands Played"
            value={profile.stats?.totalHandsPlayed || 0}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button color="primary" onClick={() => router.push("/")}>
            View on Leaderboard
          </Button>
          {!tierName && isOwnProfile && (
            <Button color="warning" onClick={() => router.push("/subscribe")}>
              Become a Supporter
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-casino-dark">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
