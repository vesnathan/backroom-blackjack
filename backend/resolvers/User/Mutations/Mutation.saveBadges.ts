import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
import { User } from "gqlTypes";

interface Args {
  badgeIds: string[];
}

type CTX = Context<Args, object, object, object, User>;

export function request(ctx: CTX) {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;

  if (!userId) {
    return util.error(
      "Unauthorized: No user ID found",
      "UnauthorizedException",
    );
  }

  const badgeIds = ctx.args.badgeIds || [];
  const now = util.time.nowISO8601();

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${userId}`,
      SK: `USER#${userId}`,
    }),
    update: {
      expression: "SET earnedBadgeIds = :badgeIds, updatedAt = :now",
      expressionValues: util.dynamodb.toMapValues({
        ":badgeIds": badgeIds,
        ":now": now,
      }),
    },
  };
}

export function response(ctx: CTX): User | null {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = ctx.result as any;
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;

  if (!item) {
    return null;
  }

  const user: User = {
    __typename: "User",
    id: userId,
    email: item.email || "",
    username: item.username || "",
    chips: item.chips || 0,
    totalChipsPurchased: item.totalChipsPurchased || 0,
    avatarUrl: item.avatarUrl || null,
    subscriptionInfo: item.subscriptionInfo || null,
    stats: item.stats || {
      __typename: "UserStats",
      totalHandsPlayed: 0,
      totalHandsWon: 0,
      totalHandsLost: 0,
      totalPushes: 0,
      totalBlackjacks: 0,
      peakChips: 1000,
      longestStreak: 0,
      bestWinRate: 0,
      highScore: 0,
      perfectShoes: 0,
      lastPlayedAt: null,
    },
    earnedBadgeIds: item.earnedBadgeIds || [],
    earlyAdopter: item.earlyAdopter || false,
    earlyAdopterQualifiedAt: item.earlyAdopterQualifiedAt || null,
    createdAt: item.createdAt || util.time.nowISO8601(),
    updatedAt: item.updatedAt || util.time.nowISO8601(),
  };

  return user;
}
