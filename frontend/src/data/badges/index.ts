/**
 * Badge Registry
 *
 * Central registry for all badges and helper functions.
 * Badges are organized into groups with progressive or one-off display modes.
 */

import type { Badge, BadgeGroup, BadgeRarity } from "./types";
import { SKILL_POINTS_BY_RARITY, RARITY_COLORS, RARITY_GLOW } from "./types";

// Import all badge groups
import { handsGroup, handsBadges } from "./hands";
import { streakGroup, streakBadges } from "./streak";
import { blackjacksGroup, blackjacksBadges } from "./blackjacks";
import { chipsGroup, chipsBadges } from "./chips";
import { perfectGroup, perfectBadges } from "./perfect";
import { milestonesGroup, milestonesBadges } from "./milestones";

// All badge groups
export const BADGE_GROUPS: BadgeGroup[] = [
  handsGroup,
  streakGroup,
  blackjacksGroup,
  chipsGroup,
  perfectGroup,
  milestonesGroup,
];

// All badges flattened
export const ALL_BADGES: Badge[] = [
  ...handsBadges,
  ...streakBadges,
  ...blackjacksBadges,
  ...chipsBadges,
  ...perfectBadges,
  ...milestonesBadges,
];

// Helper functions

/**
 * Get a badge by its ID
 */
export function getBadgeById(id: string): Badge | undefined {
  return ALL_BADGES.find((badge) => badge.id === id);
}

/**
 * Get a badge group by its ID
 */
export function getGroupById(id: string): BadgeGroup | undefined {
  return BADGE_GROUPS.find((group) => group.id === id);
}

/**
 * Get the highest tier badge earned in a group
 */
export function getHighestBadgeInGroup(
  groupId: string,
  earnedBadgeIds: string[],
): Badge | undefined {
  const group = getGroupById(groupId);
  if (!group) return undefined;

  // Filter to earned badges in this group, sort by tier descending
  const earnedInGroup = group.badges.filter((badge) =>
    earnedBadgeIds.includes(badge.id),
  );

  if (earnedInGroup.length === 0) return undefined;

  // Return highest tier
  return earnedInGroup.reduce((highest, badge) =>
    badge.tier > highest.tier ? badge : highest,
  );
}

/**
 * Get badges to display, respecting showHighestOnly for progressive groups
 */
export function getBadgesToDisplay(earnedBadgeIds: string[]): Badge[] {
  return BADGE_GROUPS.reduce<Badge[]>((displayBadges, group) => {
    if (group.showHighestOnly) {
      // Progressive: only display highest tier earned
      const highest = getHighestBadgeInGroup(group.id, earnedBadgeIds);
      if (highest) {
        displayBadges.push(highest);
      }
    } else {
      // One-off: show all earned badges in group
      const earnedInGroup = group.badges.filter((badge) =>
        earnedBadgeIds.includes(badge.id),
      );
      displayBadges.push(...earnedInGroup);
    }
    return displayBadges;
  }, []);
}

/**
 * Calculate total skill points from earned badges
 */
export function calculateTotalSkillPoints(earnedBadgeIds: string[]): number {
  return earnedBadgeIds.reduce((total, id) => {
    const badge = getBadgeById(id);
    if (badge) {
      return total + SKILL_POINTS_BY_RARITY[badge.rarity];
    }
    return total;
  }, 0);
}

/**
 * Get the color for a rarity level
 */
export function getRarityColor(rarity: BadgeRarity): string {
  return RARITY_COLORS[rarity];
}

/**
 * Get the glow/border color for a rarity level
 */
export function getRarityGlow(rarity: BadgeRarity): string {
  return RARITY_GLOW[rarity];
}

/**
 * Get skill points for a badge
 */
export function getBadgeSkillPoints(badge: Badge): number {
  return SKILL_POINTS_BY_RARITY[badge.rarity];
}

// Re-export types
export type { Badge, BadgeGroup, BadgeRarity } from "./types";
export { SKILL_POINTS_BY_RARITY, RARITY_COLORS, RARITY_GLOW } from "./types";
