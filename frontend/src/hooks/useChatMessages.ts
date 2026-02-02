import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import {
  ChatMessage,
  getChatMessages,
  sendChatMessage as sendMessage,
  subscribeToNewMessages,
  GLOBAL_CHAT_CHANNEL,
} from "@/lib/api/chat";

interface UseChatMessagesResult {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendChatMessage: (content: string) => Promise<boolean>;
  sending: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

/**
 * Hook to manage chat messages for a channel
 * Handles fetching, sending, and real-time subscriptions
 */
export function useChatMessages(
  channelId: string = GLOBAL_CHAT_CHANNEL,
): UseChatMessagesResult {
  const { isAuthenticated, user } = useAuth();
  const { avatarUrl, tier } = useSubscription();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Track seen message IDs to prevent duplicates
  const seenMessageIds = useRef(new Set<string>());

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getChatMessages(channelId);
      setMessages(result.items);
      setNextToken(result.nextToken || null);
      setHasMore(!!result.nextToken);

      // Track seen message IDs
      seenMessageIds.current = new Set(result.items.map((m) => m.id));
    } catch (err) {
      console.error("Error fetching chat messages:", err);
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, channelId]);

  // Load more messages (pagination)
  const loadMore = useCallback(async () => {
    if (!isAuthenticated || !nextToken || loading) {
      return;
    }

    setLoading(true);

    try {
      const result = await getChatMessages(channelId, nextToken);

      setMessages((prev) => {
        // Prepend older messages (they come in reverse chronological order)
        const newMessages = result.items.filter(
          (m) => !seenMessageIds.current.has(m.id),
        );
        newMessages.forEach((m) => seenMessageIds.current.add(m.id));
        return [...newMessages, ...prev];
      });

      setNextToken(result.nextToken || null);
      setHasMore(!!result.nextToken);
    } catch (err) {
      console.error("Error loading more messages:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, channelId, nextToken, loading]);

  // Send a message
  const sendChatMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!isAuthenticated || !user) {
        setError("You must be logged in to send messages");
        return false;
      }

      if (!content.trim()) {
        return false;
      }

      setSending(true);
      setError(null);

      try {
        const message = await sendMessage(
          channelId,
          content.trim(),
          avatarUrl,
          tier,
        );

        if (message) {
          // Optimistically add the message if not already received via subscription
          setMessages((prev) => {
            if (seenMessageIds.current.has(message.id)) {
              return prev;
            }
            seenMessageIds.current.add(message.id);
            return [...prev, message];
          });
          return true;
        }

        return false;
      } catch (err) {
        console.error("Error sending message:", err);
        setError(err instanceof Error ? err.message : "Failed to send message");
        return false;
      } finally {
        setSending(false);
      }
    },
    [isAuthenticated, user, channelId, avatarUrl, tier],
  );

  // Subscribe to new messages
  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const unsubscribe = subscribeToNewMessages(
      channelId,
      (newMessage) => {
        // Add new message if not already seen
        setMessages((prev) => {
          if (seenMessageIds.current.has(newMessage.id)) {
            return prev;
          }
          seenMessageIds.current.add(newMessage.id);
          return [...prev, newMessage];
        });
      },
      (err) => {
        console.error("Chat subscription error:", err);
        setError("Connection lost. Trying to reconnect...");
      },
    );

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, channelId]);

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    sendChatMessage,
    sending,
    hasMore,
    loadMore,
  };
}
