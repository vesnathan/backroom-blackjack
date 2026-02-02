import { client } from "@/lib/amplify";

// GraphQL operations for chat
const GET_CHAT_MESSAGES = /* GraphQL */ `
  query GetChatMessages($channelId: ID!, $limit: Int, $nextToken: String) {
    getChatMessages(
      channelId: $channelId
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        channelId
        senderId
        senderUsername
        senderAvatarUrl
        subscriptionTier
        content
        createdAt
      }
      nextToken
    }
  }
`;

const SEND_CHAT_MESSAGE = /* GraphQL */ `
  mutation SendChatMessage($input: SendChatMessageInput!) {
    sendChatMessage(input: $input) {
      id
      channelId
      senderId
      senderUsername
      senderAvatarUrl
      subscriptionTier
      content
      createdAt
    }
  }
`;

const ON_NEW_CHAT_MESSAGE = /* GraphQL */ `
  subscription OnNewChatMessage($channelId: ID!) {
    onNewChatMessage(channelId: $channelId) {
      id
      channelId
      senderId
      senderUsername
      senderAvatarUrl
      subscriptionTier
      content
      createdAt
    }
  }
`;

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl?: string | null;
  subscriptionTier?: string;
  content: string;
  createdAt: string;
}

export interface ChatMessageConnection {
  items: ChatMessage[];
  nextToken?: string | null;
}

interface GetChatMessagesResponse {
  data?: {
    getChatMessages?: ChatMessageConnection;
  };
}

interface SendChatMessageResponse {
  data?: {
    sendChatMessage?: ChatMessage;
  };
}

/**
 * Fetch chat messages for a channel
 */
export async function getChatMessages(
  channelId: string,
  nextToken?: string,
  limit = 50,
): Promise<ChatMessageConnection> {
  const response = (await client.graphql({
    query: GET_CHAT_MESSAGES,
    variables: {
      channelId,
      limit,
      nextToken,
    },
    authMode: "userPool",
  })) as GetChatMessagesResponse;

  return response.data?.getChatMessages || { items: [], nextToken: null };
}

/**
 * Send a chat message
 */
export async function sendChatMessage(
  channelId: string,
  content: string,
  senderAvatarUrl?: string | null,
  subscriptionTier?: string,
): Promise<ChatMessage | null> {
  const input: {
    channelId: string;
    content: string;
    senderAvatarUrl?: string;
    subscriptionTier?: string;
  } = {
    channelId,
    content,
  };

  // Only include optional fields if provided
  if (senderAvatarUrl) {
    input.senderAvatarUrl = senderAvatarUrl;
  }
  if (subscriptionTier && subscriptionTier !== "NONE") {
    input.subscriptionTier = subscriptionTier;
  }

  const response = (await client.graphql({
    query: SEND_CHAT_MESSAGE,
    variables: { input },
    authMode: "userPool",
  })) as SendChatMessageResponse;

  return response.data?.sendChatMessage || null;
}

// Subscription type for Amplify observable
interface AmplifySubscription {
  unsubscribe: () => void;
}

/**
 * Subscribe to new chat messages in a channel
 * Returns an unsubscribe function
 */
export function subscribeToNewMessages(
  channelId: string,
  onMessage: (message: ChatMessage) => void,
  onError?: (error: Error) => void,
): () => void {
  let subscription: AmplifySubscription | null = null;
  let retryCount = 0;
  const maxRetries = 5;
  const retryDelay = 1000; // 1 second

  const subscribe = () => {
    try {
      subscription = client
        .graphql({
          query: ON_NEW_CHAT_MESSAGE,
          variables: { channelId },
          authMode: "userPool",
        })
        // @ts-expect-error - Amplify subscription returns an observable
        .subscribe({
          next: ({ data }: { data: { onNewChatMessage: ChatMessage } }) => {
            if (data?.onNewChatMessage) {
              retryCount = 0; // Reset on successful message
              onMessage(data.onNewChatMessage);
            }
          },
          error: (error: Error) => {
            if (retryCount < maxRetries) {
              retryCount += 1;
              setTimeout(subscribe, retryDelay * retryCount);
            } else {
              onError?.(error);
            }
          },
        });
    } catch (error) {
      onError?.(error as Error);
    }
  };

  subscribe();

  // Return unsubscribe function
  return () => {
    if (subscription) {
      subscription.unsubscribe();
    }
  };
}

// Default global chat channel ID
export const GLOBAL_CHAT_CHANNEL = "global";
