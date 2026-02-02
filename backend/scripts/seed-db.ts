import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const TABLE_NAME = process.env.TABLE_NAME || "backroom-blackjack-datatable-dev";
const SEED_ROLE_ARN = process.env.SEED_ROLE_ARN || "";
const SEED_EXTERNAL_ID = process.env.SEED_EXTERNAL_ID || "";

// Credentials from assuming the seed role (if provided)
let assumedCredentials:
  | {
      accessKeyId: string;
      secretAccessKey: string;
      sessionToken: string;
    }
  | undefined;

/**
 * Assume the seed role to get temporary credentials with required permissions.
 * This allows the deploy user (with minimal permissions) to seed the database.
 */
async function assumeSeedRole(): Promise<void> {
  if (!SEED_ROLE_ARN) {
    console.log("  ℹ️  No SEED_ROLE_ARN provided, using current credentials");
    return;
  }

  console.log(`  🔐 Assuming seed role: ${SEED_ROLE_ARN}`);

  const stsClient = new STSClient({ region: REGION });

  try {
    const response = await stsClient.send(
      new AssumeRoleCommand({
        RoleArn: SEED_ROLE_ARN,
        RoleSessionName: "backroom-blackjack-seed-session",
        ExternalId: SEED_EXTERNAL_ID || undefined,
        DurationSeconds: 3600, // 1 hour
      }),
    );

    if (!response.Credentials) {
      throw new Error("No credentials returned from AssumeRole");
    }

    assumedCredentials = {
      accessKeyId: response.Credentials.AccessKeyId!,
      secretAccessKey: response.Credentials.SecretAccessKey!,
      sessionToken: response.Credentials.SessionToken!,
    };

    console.log("  ✅ Successfully assumed seed role");
  } catch (error) {
    console.error("  ❌ Failed to assume seed role:", error);
    throw error;
  }
}

/**
 * Get AWS client configuration with assumed credentials if available.
 */
function getClientConfig() {
  const config: { region: string; credentials?: typeof assumedCredentials } = {
    region: REGION,
  };

  if (assumedCredentials) {
    config.credentials = assumedCredentials;
  }

  return config;
}

// DynamoDB clients - initialized after role assumption
let ddbDocClient: DynamoDBDocumentClient;

// Get current month in YYYY-MM format
const currentMonth = new Date().toISOString().substring(0, 7);
const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 7);

interface SeedUser {
  userId: string;
  email: string;
  username: string;
  chips: number;
  totalChipsPurchased: number;
  earlyAdopter: boolean;
  isSeedUser: boolean; // Tag to identify seed data
  avatarUrl?: string;
  subscriptionInfo?: {
    tier: "NONE" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
    status?: "active" | "cancelled" | null;
    provider?: "STRIPE" | null;
    startedAt?: string | null;
  };
  stats: {
    totalHandsPlayed: number;
    totalHandsWon: number;
    totalHandsLost: number;
    totalPushes: number;
    totalBlackjacks: number;
    totalWagered: number;
    totalProfit: number;
    peakChips: number;
    longestStreak: number;
    bestWinRate: number;
    highScore: number;
    perfectShoes: number;
    lastPlayedAt: string;
    lastCountingSystem?: string;
    lastNumberOfDecks?: number;
  };
  monthlyStats?: Array<{
    month: string;
    highScore: number;
    handsPlayed: number;
    handsWon: number;
    perfectShoes: number;
    countingSystem?: string;
    numberOfDecks?: number;
  }>;
  preferredCountingSystem?: string;
  preferredNumberOfDecks?: number;
}

const seedUsers: SeedUser[] = [
  // Admin user - vesnathan (actual Cognito user)
  // Stats aligned with 50 seeded hand records for analytics testing
  {
    userId: "d9eea4d8-30b1-708f-54d7-cb4437641196",
    email: "vesnathan+bb-admin@gmail.com",
    username: "VesnathanAdmin",
    chips: 100000,
    totalChipsPurchased: 50000,
    earlyAdopter: true,
    isSeedUser: true,
    subscriptionInfo: {
      tier: "PLATINUM",
      status: "active",
      provider: "STRIPE",
      startedAt: "2024-01-01T00:00:00.000Z",
    },
    stats: {
      totalHandsPlayed: 50, // Matches seeded hand records
      totalHandsWon: 24,
      totalHandsLost: 21,
      totalPushes: 5,
      totalBlackjacks: 3,
      totalWagered: 5000,
      totalProfit: 1200,
      peakChips: 150000,
      longestStreak: 8,
      bestWinRate: 52.5,
      highScore: 85000,
      perfectShoes: 2,
      lastPlayedAt: new Date().toISOString(),
      lastCountingSystem: "HI_LO",
      lastNumberOfDecks: 6,
    },
    monthlyStats: [
      {
        month: currentMonth,
        highScore: 45000,
        handsPlayed: 50, // Matches seeded hand records
        handsWon: 24,
        perfectShoes: 2,
        countingSystem: "HI_LO",
        numberOfDecks: 6,
      },
    ],
    preferredCountingSystem: "HI_LO",
    preferredNumberOfDecks: 6,
  },
  // Normal user - vesnathan (actual Cognito user)
  // Stats aligned with 30 seeded hand records for analytics testing
  {
    userId: "a90ec408-e0c1-7080-16f0-461ad2b63b7e",
    email: "vesnathan+bb-user@gmail.com",
    username: "Vesnathan",
    chips: 15000,
    totalChipsPurchased: 10000,
    earlyAdopter: true,
    isSeedUser: true,
    subscriptionInfo: {
      tier: "SILVER",
      status: "active",
      provider: "STRIPE",
      startedAt: "2024-06-01T00:00:00.000Z",
    },
    stats: {
      totalHandsPlayed: 30, // Matches seeded hand records
      totalHandsWon: 14,
      totalHandsLost: 13,
      totalPushes: 3,
      totalBlackjacks: 2,
      totalWagered: 3000,
      totalProfit: 450,
      peakChips: 25000,
      longestStreak: 5,
      bestWinRate: 48.5,
      highScore: 22000,
      perfectShoes: 1,
      lastPlayedAt: new Date().toISOString(),
      lastCountingSystem: "HI_LO",
      lastNumberOfDecks: 8,
    },
    monthlyStats: [
      {
        month: currentMonth,
        highScore: 18000,
        handsPlayed: 30, // Matches seeded hand records
        handsWon: 14,
        perfectShoes: 1,
        countingSystem: "HI_LO",
        numberOfDecks: 8,
      },
    ],
    preferredCountingSystem: "HI_LO",
    preferredNumberOfDecks: 8,
  },
  // High roller
  {
    userId: "test-highroller",
    email: "highroller@example.com",
    username: "HighRoller99",
    chips: 250000,
    totalChipsPurchased: 100000,
    earlyAdopter: false,
    isSeedUser: true,
    subscriptionInfo: {
      tier: "PLATINUM",
      status: "active",
      provider: "STRIPE",
      startedAt: "2024-03-15T00:00:00.000Z",
    },
    stats: {
      totalHandsPlayed: 10000,
      totalHandsWon: 5200,
      totalHandsLost: 4200,
      totalPushes: 600,
      totalBlackjacks: 520,
      totalWagered: 1000000,
      totalProfit: 150000,
      peakChips: 500000,
      longestStreak: 35,
      bestWinRate: 55.2,
      highScore: 125000,
      perfectShoes: 28,
      lastPlayedAt: new Date().toISOString(),
      lastCountingSystem: "OMEGA_II",
      lastNumberOfDecks: 6,
    },
    monthlyStats: [
      {
        month: currentMonth,
        highScore: 75000,
        handsPlayed: 1200,
        handsWon: 650,
        perfectShoes: 5,
        countingSystem: "OMEGA_II",
        numberOfDecks: 6,
      },
      {
        month: lastMonth,
        highScore: 68000,
        handsPlayed: 1100,
        handsWon: 580,
        perfectShoes: 4,
        countingSystem: "OMEGA_II",
        numberOfDecks: 6,
      },
    ],
    preferredCountingSystem: "OMEGA_II",
    preferredNumberOfDecks: 6,
  },
  // Card counter specialist
  {
    userId: "test-counter",
    email: "counter@example.com",
    username: "CardCounter",
    chips: 45000,
    totalChipsPurchased: 20000,
    earlyAdopter: true,
    isSeedUser: true,
    subscriptionInfo: { tier: "GOLD", status: "active", provider: "STRIPE", startedAt: "2024-04-01T00:00:00.000Z" },
    stats: { totalHandsPlayed: 3500, totalHandsWon: 1850, totalHandsLost: 1400, totalPushes: 250, totalBlackjacks: 180, totalWagered: 0, totalProfit: 0, peakChips: 80000, longestStreak: 22, bestWinRate: 53.8, highScore: 65000, perfectShoes: 42, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_OPT_II", lastNumberOfDecks: 8 },
    monthlyStats: [{ month: currentMonth, highScore: 52000, handsPlayed: 600, handsWon: 330, perfectShoes: 8, countingSystem: "HI_OPT_II", numberOfDecks: 8 }],
    preferredCountingSystem: "HI_OPT_II",
    preferredNumberOfDecks: 8,
  },
  // Bronze tier casual player
  {
    userId: "test-casual",
    email: "casual@example.com",
    username: "CasualPlayer",
    chips: 5000,
    totalChipsPurchased: 5000,
    earlyAdopter: false,
    isSeedUser: true,
    subscriptionInfo: { tier: "BRONZE", status: "active", provider: "STRIPE", startedAt: "2024-08-01T00:00:00.000Z" },
    stats: { totalHandsPlayed: 500, totalHandsWon: 230, totalHandsLost: 220, totalPushes: 50, totalBlackjacks: 25, totalWagered: 0, totalProfit: 0, peakChips: 8000, longestStreak: 8, bestWinRate: 46.0, highScore: 6500, perfectShoes: 1, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_LO", lastNumberOfDecks: 6 },
    monthlyStats: [{ month: currentMonth, highScore: 4500, handsPlayed: 100, handsWon: 45, perfectShoes: 0, countingSystem: "HI_LO", numberOfDecks: 6 }],
    preferredCountingSystem: "HI_LO",
    preferredNumberOfDecks: 6,
  },
  // Free tier player
  {
    userId: "test-free",
    email: "freebie@example.com",
    username: "FreeBee",
    chips: 1000,
    totalChipsPurchased: 0,
    earlyAdopter: false,
    isSeedUser: true,
    subscriptionInfo: { tier: "NONE", status: null, provider: null, startedAt: null },
    stats: { totalHandsPlayed: 200, totalHandsWon: 85, totalHandsLost: 95, totalPushes: 20, totalBlackjacks: 10, totalWagered: 0, totalProfit: 0, peakChips: 2500, longestStreak: 5, bestWinRate: 42.5, highScore: 2000, perfectShoes: 0, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "KO", lastNumberOfDecks: 6 },
    preferredCountingSystem: "KO",
    preferredNumberOfDecks: 6,
  },
  // Streak master
  {
    userId: "test-streak",
    email: "streakmaster@example.com",
    username: "StreakMaster",
    chips: 35000,
    totalChipsPurchased: 15000,
    earlyAdopter: true,
    isSeedUser: true,
    subscriptionInfo: { tier: "SILVER", status: "active", provider: "STRIPE", startedAt: "2024-05-15T00:00:00.000Z" },
    stats: { totalHandsPlayed: 2800, totalHandsWon: 1450, totalHandsLost: 1150, totalPushes: 200, totalBlackjacks: 145, totalWagered: 0, totalProfit: 0, peakChips: 55000, longestStreak: 45, bestWinRate: 51.8, highScore: 42000, perfectShoes: 12, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_LO", lastNumberOfDecks: 6 },
    monthlyStats: [{ month: currentMonth, highScore: 38000, handsPlayed: 400, handsWon: 215, perfectShoes: 2, countingSystem: "HI_LO", numberOfDecks: 6 }],
    preferredCountingSystem: "HI_LO",
    preferredNumberOfDecks: 6,
  },
  // Perfect shoe specialist
  {
    userId: "test-perfectionist",
    email: "perfectionist@example.com",
    username: "Perfectionist",
    chips: 28000,
    totalChipsPurchased: 12000,
    earlyAdopter: false,
    isSeedUser: true,
    subscriptionInfo: { tier: "GOLD", status: "active", provider: "STRIPE", startedAt: "2024-02-20T00:00:00.000Z" },
    stats: { totalHandsPlayed: 4200, totalHandsWon: 2100, totalHandsLost: 1800, totalPushes: 300, totalBlackjacks: 210, totalWagered: 0, totalProfit: 0, peakChips: 48000, longestStreak: 18, bestWinRate: 50.0, highScore: 38000, perfectShoes: 55, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "ZEN", lastNumberOfDecks: 8 },
    monthlyStats: [{ month: currentMonth, highScore: 32000, handsPlayed: 550, handsWon: 280, perfectShoes: 10, countingSystem: "ZEN", numberOfDecks: 8 }, { month: lastMonth, highScore: 28000, handsPlayed: 480, handsWon: 240, perfectShoes: 8, countingSystem: "ZEN", numberOfDecks: 8 }],
    preferredCountingSystem: "ZEN",
    preferredNumberOfDecks: 8,
  },
  // === NEW SEED USERS (20 more) ===
  {
    userId: "seed-001", email: "seed001@example.com", username: "AceHunter", chips: 18500, totalChipsPurchased: 8000, earlyAdopter: false, isSeedUser: true,
    subscriptionInfo: { tier: "SILVER", status: "active", provider: "STRIPE", startedAt: "2024-07-01T00:00:00.000Z" },
    stats: { totalHandsPlayed: 1800, totalHandsWon: 920, totalHandsLost: 750, totalPushes: 130, totalBlackjacks: 95, totalWagered: 0, totalProfit: 0, peakChips: 32000, longestStreak: 16, bestWinRate: 51.1, highScore: 28000, perfectShoes: 6, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_LO", lastNumberOfDecks: 6 },
    monthlyStats: [{ month: currentMonth, highScore: 22000, handsPlayed: 300, handsWon: 155, perfectShoes: 2, countingSystem: "HI_LO", numberOfDecks: 6 }],
    preferredCountingSystem: "HI_LO", preferredNumberOfDecks: 6,
  },
  {
    userId: "seed-002", email: "seed002@example.com", username: "BlackjackQueen", chips: 67000, totalChipsPurchased: 30000, earlyAdopter: true, isSeedUser: true,
    subscriptionInfo: { tier: "GOLD", status: "active", provider: "STRIPE", startedAt: "2024-03-01T00:00:00.000Z" },
    stats: { totalHandsPlayed: 4800, totalHandsWon: 2550, totalHandsLost: 1950, totalPushes: 300, totalBlackjacks: 255, totalWagered: 0, totalProfit: 0, peakChips: 95000, longestStreak: 28, bestWinRate: 53.1, highScore: 78000, perfectShoes: 22, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_OPT_I", lastNumberOfDecks: 8 },
    monthlyStats: [{ month: currentMonth, highScore: 62000, handsPlayed: 700, handsWon: 380, perfectShoes: 4, countingSystem: "HI_OPT_I", numberOfDecks: 8 }],
    preferredCountingSystem: "HI_OPT_I", preferredNumberOfDecks: 8,
  },
  {
    userId: "seed-003", email: "seed003@example.com", username: "CountMaster", chips: 42000, totalChipsPurchased: 18000, earlyAdopter: false, isSeedUser: true,
    subscriptionInfo: { tier: "SILVER", status: "active", provider: "STRIPE", startedAt: "2024-06-15T00:00:00.000Z" },
    stats: { totalHandsPlayed: 3200, totalHandsWon: 1680, totalHandsLost: 1320, totalPushes: 200, totalBlackjacks: 168, totalWagered: 0, totalProfit: 0, peakChips: 58000, longestStreak: 19, bestWinRate: 52.5, highScore: 48000, perfectShoes: 18, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "OMEGA_II", lastNumberOfDecks: 6 },
    monthlyStats: [{ month: currentMonth, highScore: 42000, handsPlayed: 450, handsWon: 240, perfectShoes: 3, countingSystem: "OMEGA_II", numberOfDecks: 6 }],
    preferredCountingSystem: "OMEGA_II", preferredNumberOfDecks: 6,
  },
  {
    userId: "seed-004", email: "seed004@example.com", username: "DeckDestroyer", chips: 89000, totalChipsPurchased: 40000, earlyAdopter: true, isSeedUser: true,
    subscriptionInfo: { tier: "PLATINUM", status: "active", provider: "STRIPE", startedAt: "2024-02-01T00:00:00.000Z" },
    stats: { totalHandsPlayed: 7200, totalHandsWon: 3850, totalHandsLost: 2900, totalPushes: 450, totalBlackjacks: 385, totalWagered: 0, totalProfit: 0, peakChips: 145000, longestStreak: 32, bestWinRate: 53.5, highScore: 112000, perfectShoes: 35, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_LO", lastNumberOfDecks: 8 },
    monthlyStats: [{ month: currentMonth, highScore: 85000, handsPlayed: 900, handsWon: 490, perfectShoes: 6, countingSystem: "HI_LO", numberOfDecks: 8 }],
    preferredCountingSystem: "HI_LO", preferredNumberOfDecks: 8,
  },
  {
    userId: "seed-005", email: "seed005@example.com", username: "EdgePlayer", chips: 12000, totalChipsPurchased: 5000, earlyAdopter: false, isSeedUser: true,
    subscriptionInfo: { tier: "BRONZE", status: "active", provider: "STRIPE", startedAt: "2024-09-01T00:00:00.000Z" },
    stats: { totalHandsPlayed: 850, totalHandsWon: 410, totalHandsLost: 380, totalPushes: 60, totalBlackjacks: 42, totalWagered: 0, totalProfit: 0, peakChips: 18000, longestStreak: 11, bestWinRate: 48.2, highScore: 14500, perfectShoes: 3, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "KO", lastNumberOfDecks: 6 },
    monthlyStats: [{ month: currentMonth, highScore: 12000, handsPlayed: 180, handsWon: 88, perfectShoes: 1, countingSystem: "KO", numberOfDecks: 6 }],
    preferredCountingSystem: "KO", preferredNumberOfDecks: 6,
  },
  {
    userId: "seed-006", email: "seed006@example.com", username: "FeltFury", chips: 31000, totalChipsPurchased: 14000, earlyAdopter: true, isSeedUser: true,
    subscriptionInfo: { tier: "SILVER", status: "active", provider: "STRIPE", startedAt: "2024-05-01T00:00:00.000Z" },
    stats: { totalHandsPlayed: 2400, totalHandsWon: 1250, totalHandsLost: 1000, totalPushes: 150, totalBlackjacks: 125, totalWagered: 0, totalProfit: 0, peakChips: 45000, longestStreak: 20, bestWinRate: 52.1, highScore: 38000, perfectShoes: 9, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_LO", lastNumberOfDecks: 6 },
    monthlyStats: [{ month: currentMonth, highScore: 32000, handsPlayed: 380, handsWon: 200, perfectShoes: 2, countingSystem: "HI_LO", numberOfDecks: 6 }],
    preferredCountingSystem: "HI_LO", preferredNumberOfDecks: 6,
  },
  {
    userId: "seed-007", email: "seed007@example.com", username: "GamblersPro", chips: 55000, totalChipsPurchased: 25000, earlyAdopter: false, isSeedUser: true,
    subscriptionInfo: { tier: "GOLD", status: "active", provider: "STRIPE", startedAt: "2024-04-15T00:00:00.000Z" },
    stats: { totalHandsPlayed: 4100, totalHandsWon: 2150, totalHandsLost: 1700, totalPushes: 250, totalBlackjacks: 215, totalWagered: 0, totalProfit: 0, peakChips: 78000, longestStreak: 24, bestWinRate: 52.4, highScore: 62000, perfectShoes: 16, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "ZEN", lastNumberOfDecks: 8 },
    monthlyStats: [{ month: currentMonth, highScore: 55000, handsPlayed: 550, handsWon: 295, perfectShoes: 3, countingSystem: "ZEN", numberOfDecks: 8 }],
    preferredCountingSystem: "ZEN", preferredNumberOfDecks: 8,
  },
  {
    userId: "seed-008", email: "seed008@example.com", username: "HotStreak", chips: 23000, totalChipsPurchased: 10000, earlyAdopter: false, isSeedUser: true,
    subscriptionInfo: { tier: "BRONZE", status: "active", provider: "STRIPE", startedAt: "2024-08-15T00:00:00.000Z" },
    stats: { totalHandsPlayed: 1500, totalHandsWon: 780, totalHandsLost: 620, totalPushes: 100, totalBlackjacks: 78, totalWagered: 0, totalProfit: 0, peakChips: 35000, longestStreak: 38, bestWinRate: 52.0, highScore: 29000, perfectShoes: 5, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_LO", lastNumberOfDecks: 6 },
    monthlyStats: [{ month: currentMonth, highScore: 24000, handsPlayed: 280, handsWon: 148, perfectShoes: 1, countingSystem: "HI_LO", numberOfDecks: 6 }],
    preferredCountingSystem: "HI_LO", preferredNumberOfDecks: 6,
  },
  {
    userId: "seed-009", email: "seed009@example.com", username: "InsuranceKing", chips: 8000, totalChipsPurchased: 5000, earlyAdopter: false, isSeedUser: true,
    subscriptionInfo: { tier: "NONE", status: null, provider: null, startedAt: null },
    stats: { totalHandsPlayed: 600, totalHandsWon: 280, totalHandsLost: 280, totalPushes: 40, totalBlackjacks: 30, totalWagered: 0, totalProfit: 0, peakChips: 12000, longestStreak: 9, bestWinRate: 46.7, highScore: 9500, perfectShoes: 1, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_LO", lastNumberOfDecks: 6 },
    monthlyStats: [{ month: currentMonth, highScore: 8000, handsPlayed: 120, handsWon: 56, perfectShoes: 0, countingSystem: "HI_LO", numberOfDecks: 6 }],
    preferredCountingSystem: "HI_LO", preferredNumberOfDecks: 6,
  },
  {
    userId: "seed-010", email: "seed010@example.com", username: "JackpotJane", chips: 72000, totalChipsPurchased: 32000, earlyAdopter: true, isSeedUser: true,
    subscriptionInfo: { tier: "GOLD", status: "active", provider: "STRIPE", startedAt: "2024-03-15T00:00:00.000Z" },
    stats: { totalHandsPlayed: 5500, totalHandsWon: 2900, totalHandsLost: 2250, totalPushes: 350, totalBlackjacks: 290, totalWagered: 0, totalProfit: 0, peakChips: 105000, longestStreak: 26, bestWinRate: 52.7, highScore: 88000, perfectShoes: 24, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_OPT_II", lastNumberOfDecks: 8 },
    monthlyStats: [{ month: currentMonth, highScore: 72000, handsPlayed: 680, handsWon: 365, perfectShoes: 5, countingSystem: "HI_OPT_II", numberOfDecks: 8 }],
    preferredCountingSystem: "HI_OPT_II", preferredNumberOfDecks: 8,
  },
  {
    userId: "seed-011", email: "seed011@example.com", username: "KOCounter", chips: 19500, totalChipsPurchased: 8000, earlyAdopter: false, isSeedUser: true,
    subscriptionInfo: { tier: "SILVER", status: "active", provider: "STRIPE", startedAt: "2024-07-15T00:00:00.000Z" },
    stats: { totalHandsPlayed: 2100, totalHandsWon: 1080, totalHandsLost: 880, totalPushes: 140, totalBlackjacks: 108, totalWagered: 0, totalProfit: 0, peakChips: 28000, longestStreak: 14, bestWinRate: 51.4, highScore: 24000, perfectShoes: 7, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "KO", lastNumberOfDecks: 6 },
    monthlyStats: [{ month: currentMonth, highScore: 19500, handsPlayed: 320, handsWon: 168, perfectShoes: 2, countingSystem: "KO", numberOfDecks: 6 }],
    preferredCountingSystem: "KO", preferredNumberOfDecks: 6,
  },
  {
    userId: "seed-012", email: "seed012@example.com", username: "LuckyLuke", chips: 38000, totalChipsPurchased: 16000, earlyAdopter: true, isSeedUser: true,
    subscriptionInfo: { tier: "SILVER", status: "active", provider: "STRIPE", startedAt: "2024-06-01T00:00:00.000Z" },
    stats: { totalHandsPlayed: 2900, totalHandsWon: 1520, totalHandsLost: 1200, totalPushes: 180, totalBlackjacks: 152, totalWagered: 0, totalProfit: 0, peakChips: 52000, longestStreak: 21, bestWinRate: 52.4, highScore: 44000, perfectShoes: 11, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_LO", lastNumberOfDecks: 8 },
    monthlyStats: [{ month: currentMonth, highScore: 38000, handsPlayed: 420, handsWon: 225, perfectShoes: 2, countingSystem: "HI_LO", numberOfDecks: 8 }],
    preferredCountingSystem: "HI_LO", preferredNumberOfDecks: 8,
  },
  {
    userId: "seed-013", email: "seed013@example.com", username: "MidnightAce", chips: 105000, totalChipsPurchased: 45000, earlyAdopter: false, isSeedUser: true,
    subscriptionInfo: { tier: "PLATINUM", status: "active", provider: "STRIPE", startedAt: "2024-01-15T00:00:00.000Z" },
    stats: { totalHandsPlayed: 8500, totalHandsWon: 4550, totalHandsLost: 3400, totalPushes: 550, totalBlackjacks: 455, totalWagered: 0, totalProfit: 0, peakChips: 180000, longestStreak: 31, bestWinRate: 53.5, highScore: 142000, perfectShoes: 38, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "OMEGA_II", lastNumberOfDecks: 6 },
    monthlyStats: [{ month: currentMonth, highScore: 95000, handsPlayed: 1100, handsWon: 595, perfectShoes: 7, countingSystem: "OMEGA_II", numberOfDecks: 6 }],
    preferredCountingSystem: "OMEGA_II", preferredNumberOfDecks: 6,
  },
  {
    userId: "seed-014", email: "seed014@example.com", username: "NaturalNine", chips: 14000, totalChipsPurchased: 6000, earlyAdopter: false, isSeedUser: true,
    subscriptionInfo: { tier: "BRONZE", status: "active", provider: "STRIPE", startedAt: "2024-09-15T00:00:00.000Z" },
    stats: { totalHandsPlayed: 950, totalHandsWon: 470, totalHandsLost: 420, totalPushes: 60, totalBlackjacks: 48, totalWagered: 0, totalProfit: 0, peakChips: 19000, longestStreak: 13, bestWinRate: 49.5, highScore: 16000, perfectShoes: 2, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_LO", lastNumberOfDecks: 6 },
    monthlyStats: [{ month: currentMonth, highScore: 14000, handsPlayed: 200, handsWon: 100, perfectShoes: 1, countingSystem: "HI_LO", numberOfDecks: 6 }],
    preferredCountingSystem: "HI_LO", preferredNumberOfDecks: 6,
  },
  {
    userId: "seed-015", email: "seed015@example.com", username: "OmegaPlayer", chips: 48000, totalChipsPurchased: 22000, earlyAdopter: true, isSeedUser: true,
    subscriptionInfo: { tier: "GOLD", status: "active", provider: "STRIPE", startedAt: "2024-04-01T00:00:00.000Z" },
    stats: { totalHandsPlayed: 3800, totalHandsWon: 2000, totalHandsLost: 1560, totalPushes: 240, totalBlackjacks: 200, totalWagered: 0, totalProfit: 0, peakChips: 72000, longestStreak: 23, bestWinRate: 52.6, highScore: 58000, perfectShoes: 19, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "OMEGA_II", lastNumberOfDecks: 8 },
    monthlyStats: [{ month: currentMonth, highScore: 48000, handsPlayed: 520, handsWon: 280, perfectShoes: 4, countingSystem: "OMEGA_II", numberOfDecks: 8 }],
    preferredCountingSystem: "OMEGA_II", preferredNumberOfDecks: 8,
  },
  {
    userId: "seed-016", email: "seed016@example.com", username: "PitBossBane", chips: 62000, totalChipsPurchased: 28000, earlyAdopter: false, isSeedUser: true,
    subscriptionInfo: { tier: "GOLD", status: "active", provider: "STRIPE", startedAt: "2024-05-15T00:00:00.000Z" },
    stats: { totalHandsPlayed: 4600, totalHandsWon: 2420, totalHandsLost: 1900, totalPushes: 280, totalBlackjacks: 242, totalWagered: 0, totalProfit: 0, peakChips: 88000, longestStreak: 27, bestWinRate: 52.6, highScore: 72000, perfectShoes: 20, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_OPT_I", lastNumberOfDecks: 6 },
    monthlyStats: [{ month: currentMonth, highScore: 62000, handsPlayed: 620, handsWon: 335, perfectShoes: 4, countingSystem: "HI_OPT_I", numberOfDecks: 6 }],
    preferredCountingSystem: "HI_OPT_I", preferredNumberOfDecks: 6,
  },
  {
    userId: "seed-017", email: "seed017@example.com", username: "QuietCounter", chips: 26000, totalChipsPurchased: 11000, earlyAdopter: true, isSeedUser: true,
    subscriptionInfo: { tier: "SILVER", status: "active", provider: "STRIPE", startedAt: "2024-07-01T00:00:00.000Z" },
    stats: { totalHandsPlayed: 2200, totalHandsWon: 1150, totalHandsLost: 920, totalPushes: 130, totalBlackjacks: 115, totalWagered: 0, totalProfit: 0, peakChips: 38000, longestStreak: 17, bestWinRate: 52.3, highScore: 32000, perfectShoes: 14, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "ZEN", lastNumberOfDecks: 8 },
    monthlyStats: [{ month: currentMonth, highScore: 26000, handsPlayed: 350, handsWon: 185, perfectShoes: 3, countingSystem: "ZEN", numberOfDecks: 8 }],
    preferredCountingSystem: "ZEN", preferredNumberOfDecks: 8,
  },
  {
    userId: "seed-018", email: "seed018@example.com", username: "RiskyBusiness", chips: 4500, totalChipsPurchased: 3000, earlyAdopter: false, isSeedUser: true,
    subscriptionInfo: { tier: "NONE", status: null, provider: null, startedAt: null },
    stats: { totalHandsPlayed: 400, totalHandsWon: 175, totalHandsLost: 195, totalPushes: 30, totalBlackjacks: 18, totalWagered: 0, totalProfit: 0, peakChips: 7500, longestStreak: 6, bestWinRate: 43.8, highScore: 5500, perfectShoes: 0, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_LO", lastNumberOfDecks: 6 },
    monthlyStats: [{ month: currentMonth, highScore: 4500, handsPlayed: 85, handsWon: 38, perfectShoes: 0, countingSystem: "HI_LO", numberOfDecks: 6 }],
    preferredCountingSystem: "HI_LO", preferredNumberOfDecks: 6,
  },
  {
    userId: "seed-019", email: "seed019@example.com", username: "SplitKing", chips: 33000, totalChipsPurchased: 15000, earlyAdopter: false, isSeedUser: true,
    subscriptionInfo: { tier: "SILVER", status: "active", provider: "STRIPE", startedAt: "2024-06-15T00:00:00.000Z" },
    stats: { totalHandsPlayed: 2600, totalHandsWon: 1360, totalHandsLost: 1080, totalPushes: 160, totalBlackjacks: 136, totalWagered: 0, totalProfit: 0, peakChips: 48000, longestStreak: 15, bestWinRate: 52.3, highScore: 40000, perfectShoes: 10, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_LO", lastNumberOfDecks: 8 },
    monthlyStats: [{ month: currentMonth, highScore: 33000, handsPlayed: 400, handsWon: 212, perfectShoes: 2, countingSystem: "HI_LO", numberOfDecks: 8 }],
    preferredCountingSystem: "HI_LO", preferredNumberOfDecks: 8,
  },
  {
    userId: "seed-020", email: "seed020@example.com", username: "TrueCountTom", chips: 78000, totalChipsPurchased: 35000, earlyAdopter: true, isSeedUser: true,
    subscriptionInfo: { tier: "PLATINUM", status: "active", provider: "STRIPE", startedAt: "2024-02-15T00:00:00.000Z" },
    stats: { totalHandsPlayed: 6200, totalHandsWon: 3300, totalHandsLost: 2500, totalPushes: 400, totalBlackjacks: 330, totalWagered: 0, totalProfit: 0, peakChips: 125000, longestStreak: 29, bestWinRate: 53.2, highScore: 98000, perfectShoes: 30, lastPlayedAt: new Date().toISOString(), lastCountingSystem: "HI_OPT_II", lastNumberOfDecks: 6 },
    monthlyStats: [{ month: currentMonth, highScore: 78000, handsPlayed: 800, handsWon: 432, perfectShoes: 5, countingSystem: "HI_OPT_II", numberOfDecks: 6 }],
    preferredCountingSystem: "HI_OPT_II", preferredNumberOfDecks: 6,
  },
];

// ============================================
// HAND HISTORY SEED DATA
// ============================================

interface SeedHand {
  sessionId: string;
  numberOfDecks: number;
  countingSystem: string;
  dealerHitsSoft17: boolean;
  blackjackPayout: string;
  trueCount: number;
  runningCount: number;
  decksRemaining: number;
  dealerUpCard: string;
  dealerFinalCards: string[];
  dealerFinalValue: number;
  playerHands: string[][];
  playerFinalValues: number[];
  results: string[];
  bets: number[];
  profits: number[];
  actions: string[];
  correctActions: string[];
  totalBet: number;
  totalProfit: number;
  wasCorrectPlay: boolean;
}

/**
 * Generate realistic hand records for a user
 */
function generateHandsForUser(userId: string, count: number): SeedHand[] {
  const hands: SeedHand[] = [];
  const sessionId = `seed-session-${userId}`;
  const suits = ["H", "D", "C", "S"];
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

  const randomCard = () => `${ranks[Math.floor(Math.random() * ranks.length)]}${suits[Math.floor(Math.random() * suits.length)]}`;
  const cardValue = (card: string): number => {
    const rank = card.slice(0, -1);
    if (["J", "Q", "K"].includes(rank)) return 10;
    if (rank === "A") return 11;
    return parseInt(rank);
  };

  for (let i = 0; i < count; i++) {
    // Vary true count (-5 to +8)
    const trueCount = Math.floor(Math.random() * 14) - 5;
    const decksRemaining = 4 + Math.random() * 2;
    const runningCount = Math.round(trueCount * decksRemaining);

    // Bet sizing based on count (realistic spread)
    const baseBet = 25;
    const bet = trueCount > 2 ? baseBet * Math.min(trueCount, 6) : baseBet;

    // Generate player cards
    const playerCard1 = randomCard();
    const playerCard2 = randomCard();
    let playerCards = [playerCard1, playerCard2];
    let playerValue = cardValue(playerCard1) + cardValue(playerCard2);

    // Adjust for soft hands (Ace)
    if (playerValue > 21 && (playerCard1.startsWith("A") || playerCard2.startsWith("A"))) {
      playerValue -= 10;
    }

    // Generate dealer cards
    const dealerUpCard = randomCard();
    const dealerHoleCard = randomCard();
    let dealerCards = [dealerUpCard, dealerHoleCard];
    let dealerValue = cardValue(dealerUpCard) + cardValue(dealerHoleCard);
    if (dealerValue > 21 && (dealerUpCard.startsWith("A") || dealerHoleCard.startsWith("A"))) {
      dealerValue -= 10;
    }

    // Simulate player actions
    const actions: string[] = [];
    const correctActions: string[] = [];

    // Determine if player should hit based on basic strategy (simplified)
    const shouldHit = playerValue < 17 && dealerValue >= 7;

    if (playerValue < 21) {
      if (shouldHit && playerValue < 17) {
        actions.push("HIT");
        correctActions.push("HIT");
        const hitCard = randomCard();
        playerCards.push(hitCard);
        playerValue += cardValue(hitCard);
        if (playerValue > 21) playerValue = playerValue; // bust
      } else {
        actions.push("STAND");
        correctActions.push(shouldHit ? "HIT" : "STAND");
      }
    }

    // Dealer plays
    while (dealerValue < 17) {
      const dealerHit = randomCard();
      dealerCards.push(dealerHit);
      dealerValue += cardValue(dealerHit);
      if (dealerValue > 21 && dealerCards.some(c => c.startsWith("A"))) {
        dealerValue -= 10;
      }
    }

    // Cap values for display
    if (playerValue > 21) playerValue = playerValue; // show bust value
    if (dealerValue > 21) dealerValue = dealerValue;

    // Determine result
    let result: string;
    let profit: number;

    if (playerValue > 21) {
      result = "BUST";
      profit = -bet;
    } else if (playerValue === 21 && playerCards.length === 2) {
      result = "BLACKJACK";
      profit = Math.floor(bet * 1.5);
    } else if (dealerValue > 21) {
      result = "WIN";
      profit = bet;
    } else if (playerValue > dealerValue) {
      result = "WIN";
      profit = bet;
    } else if (playerValue < dealerValue) {
      result = "LOSE";
      profit = -bet;
    } else {
      result = "PUSH";
      profit = 0;
    }

    const wasCorrectPlay = actions.every((a, idx) => a === correctActions[idx]);

    hands.push({
      sessionId,
      numberOfDecks: 6,
      countingSystem: "HI_LO",
      dealerHitsSoft17: true,
      blackjackPayout: "3:2",
      trueCount,
      runningCount,
      decksRemaining: Math.round(decksRemaining * 10) / 10,
      dealerUpCard: dealerUpCard.slice(0, -1), // Remove suit for upcard display
      dealerFinalCards: dealerCards,
      dealerFinalValue: Math.min(dealerValue, 26), // Cap display value
      playerHands: [playerCards],
      playerFinalValues: [Math.min(playerValue, 26)],
      results: [result],
      bets: [bet],
      profits: [profit],
      actions,
      correctActions,
      totalBet: bet,
      totalProfit: profit,
      wasCorrectPlay,
    });
  }

  return hands;
}

async function seedHandHistory() {
  console.log("\n🃏 Seeding hand history...");

  // Seed hands for the two real Cognito users
  const usersToSeed = [
    { userId: "d9eea4d8-30b1-708f-54d7-cb4437641196", username: "VesnathanAdmin", handCount: 50 },
    { userId: "a90ec408-e0c1-7080-16f0-461ad2b63b7e", username: "Vesnathan", handCount: 30 },
  ];

  let totalHands = 0;
  let errorCount = 0;

  for (const user of usersToSeed) {
    const hands = generateHandsForUser(user.userId, user.handCount);
    console.log(`   Seeding ${hands.length} hands for ${user.username}...`);

    for (let i = 0; i < hands.length; i++) {
      const hand = hands[i];
      const handId = `seed-hand-${user.userId}-${i}`;
      // Spread hands over the last 30 days
      const daysAgo = Math.floor((hands.length - i) / 2);
      const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

      const item = {
        PK: `USER#${user.userId}`,
        SK: `HAND#${timestamp}#${handId}`,
        id: handId,
        oduserId: user.userId,
        ...hand,
        timestamp,
        createdAt: timestamp,
      };

      try {
        await ddbDocClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
          }),
        );
        totalHands++;
      } catch (error) {
        console.error(`   ✗ Failed to seed hand ${handId}:`, error);
        errorCount++;
      }
    }
  }

  console.log(`   ✅ Seeded ${totalHands} hands (${errorCount} errors)`);
}

async function seed() {
  console.log(`🌱 Seeding users to table: ${TABLE_NAME}`);
  console.log(`   Region: ${REGION}`);
  console.log(`   Users to seed: ${seedUsers.length}`);
  console.log("");

  // Assume seed role if provided (for minimal IAM user deployment)
  await assumeSeedRole();

  // Initialize DynamoDB client with assumed credentials
  const client = new DynamoDBClient(getClientConfig());
  ddbDocClient = DynamoDBDocumentClient.from(client);

  let successCount = 0;
  let errorCount = 0;

  for (const user of seedUsers) {
    const now = new Date().toISOString();
    const item: Record<string, unknown> = {
      PK: `USER#${user.userId}`,
      SK: `USER#${user.userId}`,
      id: user.userId,
      email: user.email,
      username: user.username,
      chips: user.chips,
      totalChipsPurchased: user.totalChipsPurchased,
      earlyAdopter: user.earlyAdopter,
      earlyAdopterQualifiedAt: user.earlyAdopter ? "2024-01-01T00:00:00.000Z" : null,
      avatarUrl: user.avatarUrl || null,
      subscriptionInfo: user.subscriptionInfo || { tier: "NONE" },
      stats: user.stats,
      monthlyStats: user.monthlyStats || [],
      preferredCountingSystem: user.preferredCountingSystem || null,
      preferredNumberOfDecks: user.preferredNumberOfDecks || null,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: now,
    };

    try {
      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
        }),
      );
      const tierLabel = user.subscriptionInfo?.tier || "NONE";
      console.log(`✓ ${user.username.padEnd(20)} | ${tierLabel.padEnd(8)} | Chips: ${user.chips.toLocaleString().padStart(10)} | High Score: ${user.stats.highScore.toLocaleString().padStart(10)} | Streak: ${user.stats.longestStreak}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to seed user ${user.username}:`, error);
      errorCount++;
    }
  }

  console.log("");
  console.log(`✅ User seeding complete! ${successCount} users created, ${errorCount} errors.`);

  // Seed hand history for analytics testing
  await seedHandHistory();

  console.log("");
  console.log("📊 Test data summary:");
  console.log("  Leaderboard:");
  console.log("    - Highest Score: HighRoller99 (125,000)");
  console.log("    - Longest Streak: StreakMaster (45)");
  console.log("    - Most Perfect Shoes: Perfectionist (55)");
  console.log("  Analytics:");
  console.log("    - VesnathanAdmin: 50 hands with varied true counts");
  console.log("    - Vesnathan: 30 hands for testing");
}

seed().catch(console.error);
