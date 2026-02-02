import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
import { ChatMessageConnection } from "gqlTypes";

interface Args {
  channelId: string;
  limit?: number;
  nextToken?: string;
}

type CTX = Context<Args, object, object, object, ChatMessageConnection>;

export function request(ctx: CTX) {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity?.sub;

  if (!userId) {
    return util.error(
      "Unauthorized: No user ID found",
      "UnauthorizedException"
    );
  }

  const { channelId, limit = 50, nextToken } = ctx.args;

  // Query messages in descending order (newest first)
  // Then reverse for display (oldest to newest)
  const queryExpression: any = {
    operation: "Query",
    query: {
      expression: "PK = :pk",
      expressionValues: util.dynamodb.toMapValues({
        ":pk": `CHAT#${channelId}`,
      }),
    },
    index: undefined,
    scanIndexForward: false, // Descending order (newest first)
    limit: limit > 100 ? 100 : limit, // Cap at 100 messages
  };

  if (nextToken) {
    queryExpression.nextToken = nextToken;
  }

  return queryExpression;
}

// Helper interface for chat message item
interface ChatMessageItem {
  id?: string;
  SK?: string;
  senderId?: string;
  senderUsername?: string;
  senderAvatarUrl?: string;
  subscriptionTier?: string;
  content?: string;
  createdAt?: string;
}

export function response(ctx: CTX): ChatMessageConnection {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }

  const items = ctx.result?.items || [];
  const channelId = ctx.args.channelId;

  // Transform DynamoDB items to ChatMessage objects using for...of loop
  const messages: any[] = [];
  for (const item of items as ChatMessageItem[]) {
    const skParts = item.SK ? item.SK.split("#") : [];
    messages.push({
      __typename: "ChatMessage",
      id: item.id || skParts[2] || "",
      channelId: channelId,
      senderId: item.senderId || "",
      senderUsername: item.senderUsername || "Anonymous",
      senderAvatarUrl: item.senderAvatarUrl || null,
      subscriptionTier: item.subscriptionTier || "NONE",
      content: item.content || "",
      createdAt: item.createdAt || skParts[1] || "",
    });
  }

  // Reverse to get chronological order (oldest to newest)
  messages.reverse();

  return {
    __typename: "ChatMessageConnection",
    items: messages,
    nextToken: ctx.result?.nextToken || null,
  };
}
