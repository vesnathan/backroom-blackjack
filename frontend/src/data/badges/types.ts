/**
 * Badge/Achievement System Types
 *
 * Badges are organized into groups. Each group can be:
 * - Progressive (showHighestOnly: true): Only the highest tier badge is displayed
 * - One-off (showHighestOnly: false): All earned badges in the group are displayed
 */

export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  imagePath?: string; // Path to badge image (e.g., "/assets/images/badges/won-5k-chips.png")
  groupId: string;
  tier: number; // For progressive badges, higher tier = better achievement
  rarity: BadgeRarity;
  requirement?: number; // Threshold value for progressive badges
  repeatable?: boolean; // If true, badge can be earned multiple times (e.g., streaks)
}

export interface BadgeGroup {
  id: string;
  name: string;
  description: string;
  showHighestOnly: boolean; // true = progressive, false = one-off
  badges: Badge[];
}

// Skill points awarded by rarity
export const SKILL_POINTS_BY_RARITY: Record<BadgeRarity, number> = {
  common: 10,
  uncommon: 25,
  rare: 50,
  epic: 100,
  legendary: 250,
};

// Colors for each rarity level
export const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: "#9CA3AF",
  uncommon: "#22C55E",
  rare: "#3B82F6",
  epic: "#A855F7",
  legendary: "#F59E0B",
};

// Border/glow colors for badges
export const RARITY_GLOW: Record<BadgeRarity, string> = {
  common: "rgba(156, 163, 175, 0.5)",
  uncommon: "rgba(34, 197, 94, 0.5)",
  rare: "rgba(59, 130, 246, 0.5)",
  epic: "rgba(168, 85, 247, 0.5)",
  legendary: "rgba(245, 158, 11, 0.6)",
};
