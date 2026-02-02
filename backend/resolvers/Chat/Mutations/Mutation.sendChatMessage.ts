import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
import { ChatMessage, SendChatMessageInput } from "gqlTypes";

interface Args {
  input: SendChatMessageInput;
}

type CTX = Context<Args, object, object, object, ChatMessage>;

export function request(ctx: CTX) {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;
  const username = identity.claims?.preferred_username || identity.username || "Anonymous";

  if (!userId) {
    return util.error(
      "Unauthorized: No user ID found",
      "UnauthorizedException"
    );
  }

  const { channelId, content, senderAvatarUrl, subscriptionTier } = ctx.args.input;

  // Validate content - check if empty (avoid .trim() which may not be supported)
  const contentStr = content || "";
  if (contentStr.length === 0) {
    return util.error("Message cannot be empty", "ValidationError");
  }

  if (contentStr.length > 500) {
    return util.error(
      "Message too long. Maximum 500 characters.",
      "ValidationError"
    );
  }

  // Content moderation - inline check without for...of loops
  const lowerContent = contentStr.toLowerCase();

  // Check blocked words and spam keywords inline
  const hasBlockedContent =
    lowerContent.indexOf("fuck") >= 0 ||
    lowerContent.indexOf("shit") >= 0 ||
    lowerContent.indexOf("bitch") >= 0 ||
    lowerContent.indexOf("cunt") >= 0 ||
    lowerContent.indexOf("dick") >= 0 ||
    lowerContent.indexOf("cock") >= 0 ||
    lowerContent.indexOf("pussy") >= 0 ||
    lowerContent.indexOf("nigger") >= 0 ||
    lowerContent.indexOf("faggot") >= 0 ||
    lowerContent.indexOf("retard") >= 0 ||
    lowerContent.indexOf("whore") >= 0 ||
    lowerContent.indexOf("slut") >= 0 ||
    lowerContent.indexOf("http://") >= 0 ||
    lowerContent.indexOf("https://") >= 0 ||
    lowerContent.indexOf("www.") >= 0 ||
    lowerContent.indexOf(".com/") >= 0 ||
    lowerContent.indexOf("buy now") >= 0 ||
    lowerContent.indexOf("click here") >= 0;

  if (hasBlockedContent) {
    return util.error(
      "Your message contains inappropriate content and cannot be sent.",
      "ModerationError"
    );
  }

  // Generate unique message ID and timestamp
  const messageId = util.autoId();
  const now = util.time.nowISO8601();

  // Build attribute values - only include avatar/tier if provided
  const attributeValues: Record<string, unknown> = {
    id: messageId,
    channelId: channelId,
    senderId: userId,
    senderUsername: username,
    content: contentStr,
    createdAt: now,
  };

  if (senderAvatarUrl) {
    attributeValues.senderAvatarUrl = senderAvatarUrl;
  }

  if (subscriptionTier) {
    attributeValues.subscriptionTier = subscriptionTier;
  }

  // Store message in DynamoDB
  // PK: CHAT#{channelId}
  // SK: MSG#{timestamp}#{messageId} - allows ordering by time
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: `CHAT#${channelId}`,
      SK: `MSG#${now}#${messageId}`,
    }),
    attributeValues: util.dynamodb.toMapValues(attributeValues),
  };
}

export function response(ctx: CTX): ChatMessage | null {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;
  const username = identity.claims?.preferred_username || identity.username || "Anonymous";

  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }

  const { channelId, content, senderAvatarUrl, subscriptionTier } = ctx.args.input;

  // Return the message that was stored
  const message: ChatMessage = {
    __typename: "ChatMessage",
    id: ctx.result?.id || util.autoId(),
    channelId: channelId,
    senderId: userId,
    senderUsername: username,
    senderAvatarUrl: senderAvatarUrl || null,
    subscriptionTier: subscriptionTier || "NONE",
    content: content || "",
    createdAt: ctx.result?.createdAt || util.time.nowISO8601(),
  };

  return message;
}
