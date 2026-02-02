import { util, Context } from "@aws-appsync/utils";
import { PublicProfile, QueryGetPublicProfileArgs } from "gqlTypes";

type CTX = Context<QueryGetPublicProfileArgs, object, object, object, PublicProfile>;

export function request(ctx: CTX) {
  const { userId } = ctx.args;

  if (!userId) {
    return util.error("userId is required", "ValidationException");
  }

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${userId}`,
      SK: `USER#${userId}`,
    }),
  };
}

export function response(ctx: CTX): PublicProfile | null {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result as any;

  if (!item) {
    return null;
  }

  const { userId } = ctx.args;
  const stats = item.stats || {};

  const publicProfile: PublicProfile = {
    __typename: "PublicProfile",
    userId: userId,
    username: item.username || "Anonymous",
    avatarUrl: item.avatarUrl || null,
    subscriptionTier: item.subscriptionInfo?.tier || "NONE",
    earlyAdopter: item.earlyAdopter || false,
    stats: {
      __typename: "PublicStats",
      highScore: stats.highScore || 0,
      longestStreak: stats.longestStreak || 0,
      perfectShoes: stats.perfectShoes || 0,
      totalHandsPlayed: stats.totalHandsPlayed || 0,
    },
    createdAt: item.createdAt || null,
  };

  return publicProfile;
}
