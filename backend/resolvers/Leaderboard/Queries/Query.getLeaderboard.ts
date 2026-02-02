import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
import {
  LeaderboardCategory,
  LeaderboardResult,
  LeaderboardEntry,
  LeaderboardFilters,
  LeaderboardTimePeriod,
  CountingSystem,
  SubscriptionTier,
} from "gqlTypes";

interface Args {
  category: LeaderboardCategory;
  limit?: number;
  filters?: LeaderboardFilters;
}

// Define UserData type outside the function
interface UserData {
  id: string;
  username: string;
  value: number;
  tier: SubscriptionTier;
  isSeedUser: boolean;
}

// Monthly stats entry
interface MonthlyStatsEntry {
  month: string;
  highScore?: number;
  handsPlayed?: number;
  perfectShoes?: number;
}

// Per-config stats stored as cfg_{SYSTEM}_{DECKS} attributes
interface ConfigStatsData {
  configKey?: string;
  countingSystem?: string;
  numberOfDecks?: number;
  handsPlayed?: number;
  handsWon?: number;
  handsLost?: number;
  pushes?: number;
  blackjacks?: number;
  peakChips?: number;
  longestStreak?: number;
  highScore?: number;
  perfectShoes?: number;
  lastPlayedAt?: string;
}

// DynamoDB user item structure
interface UserItem {
  PK: string;
  SK: string;
  username?: string;
  chips?: number;
  isSeedUser?: boolean;
  subscriptionInfo?: {
    tier?: SubscriptionTier;
  };
  preferredCountingSystem?: CountingSystem;
  preferredNumberOfDecks?: number;
  monthlyStats?: MonthlyStatsEntry[];
  stats?: {
    highScore?: number;
    totalHandsPlayed?: number;
    perfectShoes?: number;
    longestStreak?: number;
    lastCountingSystem?: CountingSystem;
    lastNumberOfDecks?: number;
    lastPlayedAt?: string;
    peakChips?: number;
  };
  // Dynamic cfg_ attributes will be accessed via indexing
  [key: string]: unknown;
}

// AGG#ALL record structure (new session-based stats)
interface AggregateItem {
  PK: string;
  SK: string;
  totalSessions?: number;
  totalHandsPlayed?: number;
  totalHandsWon?: number;
  totalHandsLost?: number;
  totalPushes?: number;
  totalBlackjacks?: number;
  totalShoesPlayed?: number;
  totalPerfectShoes?: number;
  totalWagered?: number;
  totalProfit?: number;
  lastPlayedAt?: string;
  // Config-specific AGG records also have:
  configHash?: string;
  settings?: {
    countingSystem?: string;
    numberOfDecks?: number;
  };
}

// User info extracted from USER#/USER# records
interface UserInfo {
  userId: string;
  username: string;
  chips: number;
  tier: SubscriptionTier;
  isSeedUser: boolean;
  preferredCountingSystem?: CountingSystem;
  preferredNumberOfDecks?: number;
  monthlyStats?: MonthlyStatsEntry[];
  // Old-style stats from user record (backwards compatibility)
  legacyStats?: {
    highScore?: number;
    totalHandsPlayed?: number;
    perfectShoes?: number;
    longestStreak?: number;
    lastCountingSystem?: CountingSystem;
    lastNumberOfDecks?: number;
    lastPlayedAt?: string;
    peakChips?: number;
  };
  // Old-style per-config stats
  legacyConfigStats: Record<string, ConfigStatsData>;
}

// Aggregated stats from AGG# records
interface AggStats {
  totalSessions: number;
  totalHandsPlayed: number;
  totalPerfectShoes: number;
  totalProfit: number;
  lastPlayedAt?: string;
}

// DynamoDB scan result
interface DynamoDBScanResult {
  items: UserItem[];
}

type CTX = Context<Args, object, object, object, DynamoDBScanResult>;

/**
 * Build config key from counting system and deck count
 * Format: "cfg_{SYSTEM}_{DECKS}" e.g. "cfg_HI_LO_6"
 */
function buildConfigKey(countingSystem: string, numberOfDecks: number): string {
  return `cfg_${countingSystem}_${numberOfDecks}`;
}

export function request(ctx: CTX) {
  return {
    operation: "Scan",
    filter: {
      expression: "begins_with(PK, :userPrefix)",
      expressionValues: util.dynamodb.toMapValues({
        ":userPrefix": "USER#",
      }),
    },
    limit: 1000,
  };
}

// Helper to get current month key (YYYY-MM format)
function getCurrentMonthKey(): string {
  const now = util.time.nowISO8601();
  return now.substring(0, 7);
}

// Helper to check if a date is within the time period
function isWithinTimePeriod(dateStr: string | undefined, period: LeaderboardTimePeriod): boolean {
  if (!dateStr || period === "ALL_TIME") {
    return true;
  }

  const now = util.time.nowISO8601();
  const nowDate = now.substring(0, 10);
  const checkDate = dateStr.substring(0, 10);

  if (period === "DAILY") {
    return checkDate === nowDate;
  }

  if (period === "WEEKLY") {
    // Simple week check - within last 7 days
    const nowParts = nowDate.split("-");
    const checkParts = checkDate.split("-");
    // Use unary + operator for AppSync APPSYNC_JS compatibility (no parseInt/Number)
    const nowYear = +(nowParts[0] || 0);
    const nowMonth = +(nowParts[1] || 0);
    const nowDay = +(nowParts[2] || 0);
    const checkYear = +(checkParts[0] || 0);
    const checkMonth = +(checkParts[1] || 0);
    const checkDay = +(checkParts[2] || 0);

    // Approximate: same year/month within 7 days, or end of previous month
    if (nowYear === checkYear && nowMonth === checkMonth) {
      return nowDay - checkDay <= 7 && nowDay >= checkDay;
    }
    return false;
  }

  if (period === "MONTHLY") {
    return now.substring(0, 7) === dateStr.substring(0, 7);
  }

  return true;
}

/**
 * Get value for a category from config-specific stats
 */
function getConfigValue(
  configStats: ConfigStatsData | undefined,
  category: LeaderboardCategory,
): number {
  if (!configStats) {
    return 0;
  }

  if (category === "PEAK_CHIPS") {
    return +(configStats.peakChips || 0);
  }
  if (category === "LONGEST_STREAK") {
    return +(configStats.longestStreak || 0);
  }
  if (category === "HIGH_SCORE") {
    return +(configStats.highScore || configStats.peakChips || 0);
  }
  if (category === "PERFECT_SHOES") {
    return +(configStats.perfectShoes || 0);
  }
  // CURRENT_CHIPS and MONTHLY_HIGH_SCORE use aggregate stats
  return 0;
}

/**
 * Get value for a category from aggregate stats (legacy - used for backwards compatibility)
 */
function getAggregateValue(
  item: UserItem,
  category: LeaderboardCategory,
): number {
  if (category === "CURRENT_CHIPS") {
    return +(item.chips || 0);
  }
  if (category === "PEAK_CHIPS") {
    return +(item.stats?.peakChips || 0);
  }
  if (category === "LONGEST_STREAK") {
    return +(item.stats?.longestStreak || 0);
  }
  if (category === "HIGH_SCORE") {
    return +(item.stats?.highScore || item.stats?.peakChips || 0);
  }
  if (category === "PERFECT_SHOES") {
    return +(item.stats?.perfectShoes || 0);
  }
  if (category === "MONTHLY_HIGH_SCORE") {
    const currentMonth = getCurrentMonthKey();
    const monthlyStats = item.monthlyStats || [];
    for (const ms of monthlyStats) {
      if (ms.month === currentMonth) {
        return +(ms.highScore || 0);
      }
    }
    return 0;
  }
  return 0;
}

/**
 * Get value for a category from UserInfo structure
 */
function getAggregateValueFromUserInfo(
  userInfo: UserInfo,
  category: LeaderboardCategory,
): number {
  if (category === "CURRENT_CHIPS") {
    return userInfo.chips;
  }
  if (category === "PEAK_CHIPS") {
    return +(userInfo.legacyStats?.peakChips || 0);
  }
  if (category === "LONGEST_STREAK") {
    return +(userInfo.legacyStats?.longestStreak || 0);
  }
  if (category === "HIGH_SCORE") {
    return +(userInfo.legacyStats?.highScore || userInfo.legacyStats?.peakChips || 0);
  }
  if (category === "PERFECT_SHOES") {
    return +(userInfo.legacyStats?.perfectShoes || 0);
  }
  if (category === "MONTHLY_HIGH_SCORE") {
    const currentMonth = getCurrentMonthKey();
    const monthlyStats = userInfo.monthlyStats || [];
    for (const ms of monthlyStats) {
      if (ms.month === currentMonth) {
        return +(ms.highScore || 0);
      }
    }
    return 0;
  }
  return 0;
}

export function response(ctx: CTX): LeaderboardResult {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const currentUserId = identity?.sub || "";
  const category = ctx.args.category;
  const limit = ctx.args.limit || 10;
  const filters = ctx.args.filters;
  const timePeriod: LeaderboardTimePeriod = filters?.timePeriod || "ALL_TIME";
  const countingSystemFilter: CountingSystem | null = filters?.countingSystem || null;
  const numberOfDecksFilter: number | null = filters?.numberOfDecks || null;

  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }

  const items = ctx.result?.items || [];

  // First pass: Build maps for user info and AGG stats
  // userId -> UserInfo (from USER#/USER# records)
  const userInfoMap: Record<string, UserInfo> = {};
  // userId -> AggStats (from AGG#ALL records)
  const aggAllMap: Record<string, AggStats> = {};
  // userId -> configHash -> AggStats (from AGG#CFG# records)
  const aggConfigMap: Record<string, Record<string, AggStats>> = {};

  for (const item of items) {
    if (!item || !item.PK) {
      // Skip invalid items - use flag pattern instead of continue
    } else {
      const userId = item.PK.replace("USER#", "");
      const sk = item.SK || "";

      // Check what type of record this is
      const isUserRecord = sk === `USER#${userId}`;
      const isAggAll = sk === "AGG#ALL";
      const isAggConfig = sk.indexOf("AGG#CFG#") === 0;

      if (isUserRecord && item.username) {
        // Extract legacy config stats
        const legacyConfigStats: Record<string, ConfigStatsData> = {};
        for (const key of Object.keys(item)) {
          if (key.indexOf("cfg_") === 0) {
            legacyConfigStats[key] = item[key] as ConfigStatsData;
          }
        }

        userInfoMap[userId] = {
          userId: userId,
          username: item.username || "Anonymous",
          chips: +(item.chips || 0),
          tier: (item.subscriptionInfo?.tier || "NONE") as SubscriptionTier,
          isSeedUser: !!(item.isSeedUser),
          preferredCountingSystem: item.preferredCountingSystem,
          preferredNumberOfDecks: item.preferredNumberOfDecks,
          monthlyStats: item.monthlyStats,
          legacyStats: item.stats,
          legacyConfigStats: legacyConfigStats,
        };
      } else if (isAggAll) {
        const aggItem = item as unknown as AggregateItem;
        aggAllMap[userId] = {
          totalSessions: +(aggItem.totalSessions || 0),
          totalHandsPlayed: +(aggItem.totalHandsPlayed || 0),
          totalPerfectShoes: +(aggItem.totalPerfectShoes || 0),
          totalProfit: +(aggItem.totalProfit || 0),
          lastPlayedAt: aggItem.lastPlayedAt,
        };
      } else if (isAggConfig) {
        const aggItem = item as unknown as AggregateItem;
        const configHash = sk.replace("AGG#CFG#", "");
        if (!aggConfigMap[userId]) {
          aggConfigMap[userId] = {};
        }
        aggConfigMap[userId][configHash] = {
          totalSessions: +(aggItem.totalSessions || 0),
          totalHandsPlayed: +(aggItem.totalHandsPlayed || 0),
          totalPerfectShoes: +(aggItem.totalPerfectShoes || 0),
          totalProfit: +(aggItem.totalProfit || 0),
          lastPlayedAt: aggItem.lastPlayedAt,
        };
      }
    }
  }

  // Determine if we should use config-specific stats
  // Only use config stats when BOTH filters are specified
  const useConfigStats = countingSystemFilter !== null && numberOfDecksFilter !== null;
  const legacyConfigKey = useConfigStats
    ? buildConfigKey(countingSystemFilter as string, numberOfDecksFilter as number)
    : null;

  // Second pass: Build userData array by merging user info with stats
  const userData: UserData[] = [];

  for (const userId of Object.keys(userInfoMap)) {
    const userInfo = userInfoMap[userId];
    const aggAll = aggAllMap[userId];
    const userConfigStats = aggConfigMap[userId];

    let value = 0;
    let lastPlayedAt: string | undefined;

    if (useConfigStats && legacyConfigKey) {
      // Use config-specific stats
      // First check new AGG#CFG# records, fall back to legacy cfg_ attributes
      let hasConfigStats = false;

      // Check new session-based config stats
      if (userConfigStats) {
        // Find matching config by checking all configs
        // Note: We'd need to store countingSystem/numberOfDecks in AGG#CFG# to match
        // For now, use legacy configKey matching
        for (const configHash of Object.keys(userConfigStats)) {
          // This is a simplification - in practice you'd want to match by settings
          const cfgStats = userConfigStats[configHash];
          if (cfgStats && cfgStats.totalSessions > 0) {
            hasConfigStats = true;
            if (category === "PERFECT_SHOES") {
              value = cfgStats.totalPerfectShoes;
            }
            lastPlayedAt = cfgStats.lastPlayedAt;
          }
        }
      }

      // Fall back to legacy config stats
      if (!hasConfigStats) {
        const legacyStats = userInfo.legacyConfigStats[legacyConfigKey];
        if (legacyStats) {
          hasConfigStats = true;
          value = getConfigValue(legacyStats, category);
          lastPlayedAt = legacyStats.lastPlayedAt;
        }
      }

      // For CURRENT_CHIPS, always use user's chips balance
      if (category === "CURRENT_CHIPS") {
        value = userInfo.chips;
        if (!hasConfigStats) {
          value = 0; // Only include if they've played this config
        }
      }

      if (!hasConfigStats) {
        value = 0;
      }
    } else {
      // Use aggregate stats
      // Prefer new AGG#ALL stats, fall back to legacy user.stats
      if (aggAll) {
        // New session-based stats
        if (category === "CURRENT_CHIPS") {
          value = userInfo.chips;
        } else if (category === "PERFECT_SHOES") {
          value = aggAll.totalPerfectShoes;
        } else if (category === "HIGH_SCORE" || category === "PEAK_CHIPS" || category === "LONGEST_STREAK") {
          // These need to be tracked as max values - for now use legacy
          value = getAggregateValueFromUserInfo(userInfo, category);
        } else if (category === "MONTHLY_HIGH_SCORE") {
          value = getAggregateValueFromUserInfo(userInfo, category);
        }
        lastPlayedAt = aggAll.lastPlayedAt || userInfo.legacyStats?.lastPlayedAt;
      } else if (userInfo.legacyStats) {
        // Fall back to legacy stats
        value = getAggregateValueFromUserInfo(userInfo, category);
        lastPlayedAt = userInfo.legacyStats.lastPlayedAt;
      }

      // Apply counting system filter if specified (filter by last used)
      if (countingSystemFilter && value > 0) {
        const userCountingSystem = userInfo.preferredCountingSystem || userInfo.legacyStats?.lastCountingSystem;
        if (userCountingSystem && userCountingSystem !== countingSystemFilter) {
          value = 0;
        }
      }

      // Apply number of decks filter if specified (filter by last used)
      if (numberOfDecksFilter && value > 0) {
        const userDeckPreference = userInfo.preferredNumberOfDecks || userInfo.legacyStats?.lastNumberOfDecks;
        if (userDeckPreference && userDeckPreference !== numberOfDecksFilter) {
          value = 0;
        }
      }
    }

    // Apply time period filter
    if (timePeriod !== "ALL_TIME" && value > 0) {
      if (!isWithinTimePeriod(lastPlayedAt, timePeriod)) {
        value = 0;
      }
    }

    // Only include users with non-zero values
    if (value > 0) {
      userData.push({
        id: userId,
        username: userInfo.username,
        value: value,
        tier: userInfo.tier,
        isSeedUser: userInfo.isSeedUser,
      });
    }
  }

  // Selection sort to find top N entries
  // Real users (isSeedUser=false) always rank above seed users
  const sortedData: UserData[] = [];
  const used: Record<string, boolean> = {};
  let foundCount = 0;

  for (const _item of userData) {
    if (foundCount < limit) {
      let maxValue = -1;
      let maxIndex = -1;
      let maxIsSeed = true; // Start assuming seed, real user will override
      let currentIndex = 0;

      for (const entry of userData) {
        const indexKey = `${currentIndex}`;
        if (!used[indexKey]) {
          // Real users always beat seed users
          // If current best is a seed user and this is a real user, take this one
          // If both are same type, compare by value
          let isBetter = false;
          if (maxIndex < 0) {
            // First valid entry
            isBetter = true;
          } else if (!entry.isSeedUser && maxIsSeed) {
            // Real user beats seed user regardless of value
            isBetter = true;
          } else if (entry.isSeedUser && !maxIsSeed) {
            // Seed user never beats real user
            isBetter = false;
          } else if (entry.value > maxValue) {
            // Same type (both real or both seed), higher value wins
            isBetter = true;
          }

          if (isBetter) {
            maxValue = entry.value;
            maxIndex = currentIndex;
            maxIsSeed = entry.isSeedUser;
          }
        }
        currentIndex = currentIndex + 1;
      }

      if (maxIndex >= 0) {
        let idx = 0;
        for (const entry of userData) {
          if (idx === maxIndex) {
            sortedData.push(entry);
            used[`${maxIndex}`] = true;
            foundCount = foundCount + 1;
          }
          idx = idx + 1;
        }
      }
    }
  }

  // Build leaderboard entries
  const entries: LeaderboardEntry[] = [];
  let rank = 1;

  for (const entry of sortedData) {
    entries.push({
      __typename: "LeaderboardEntry",
      rank: rank,
      username: entry.username,
      userId: entry.id,
      value: entry.value,
      subscriptionTier: entry.tier,
      isSeedUser: entry.isSeedUser,
    });
    rank = rank + 1;
  }

  // Find current user's rank
  let userRank: number | null = null;
  let userValue: number | null = null;
  let foundUser = false;

  for (const entry of userData) {
    if (!foundUser && entry.id === currentUserId) {
      let higherCount = 0;
      for (const other of userData) {
        if (other.value > entry.value) {
          higherCount = higherCount + 1;
        }
      }
      userRank = higherCount + 1;
      userValue = entry.value;
      foundUser = true;
    }
  }

  return {
    __typename: "LeaderboardResult",
    category: category,
    entries: entries,
    userRank: userRank,
    userValue: userValue,
    timePeriod: timePeriod,
    filters: {
      __typename: "AppliedFilters",
      timePeriod: timePeriod,
      countingSystem: countingSystemFilter,
      numberOfDecks: numberOfDecksFilter,
    },
  };
}
