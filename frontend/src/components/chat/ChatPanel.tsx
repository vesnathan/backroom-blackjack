"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button, Input, Spinner } from "@nextui-org/react";
import { useAuth } from "@/contexts/AuthContext";
import { useChatMessages } from "@/hooks/useChatMessages";
import { ChatMessage, GLOBAL_CHAT_CHANNEL } from "@/lib/api/chat";
import {
  TIER_BADGE_COLORS,
  SUBSCRIPTION_TIER_NAMES,
  SubscriptionTier,
} from "@backroom-blackjack/shared";

// Message bubble component - defined before use
interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  formatTime: (date: string) => string;
  getInitials: (username: string) => string;
  getTierColor: (tier?: string) => string | null;
}

function MessageBubble({
  message,
  isOwnMessage,
  formatTime,
  getInitials,
  getTierColor,
}: MessageBubbleProps) {
  const tierColor = getTierColor(message.subscriptionTier);

  return (
    <div className={`flex gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {message.senderAvatarUrl ? (
          <Image
            src={message.senderAvatarUrl}
            alt={message.senderUsername}
            width={32}
            height={32}
            className="rounded-full object-cover"
            style={tierColor ? { border: `2px solid ${tierColor}` } : {}}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold"
            style={tierColor ? { border: `2px solid ${tierColor}` } : {}}
          >
            {getInitials(message.senderUsername)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col ${isOwnMessage ? "items-end" : ""}`}>
        {/* Username and tier badge */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs font-medium"
            style={{ color: tierColor || "#9CA3AF" }}
          >
            {message.senderUsername}
          </span>
          {tierColor && message.subscriptionTier !== "NONE" && (
            <span
              className="text-[10px] px-1 rounded"
              style={{ backgroundColor: tierColor, color: "#000" }}
            >
              {
                SUBSCRIPTION_TIER_NAMES[
                  message.subscriptionTier as SubscriptionTier
                ]
              }
            </span>
          )}
        </div>

        {/* Message bubble */}
        <div
          className={`max-w-[200px] rounded-lg px-3 py-2 ${
            isOwnMessage
              ? "bg-yellow-600 text-white"
              : "bg-gray-800 text-gray-200"
          }`}
        >
          <p className="text-sm break-words">{message.content}</p>
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-gray-500 mt-1">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

interface ChatPanelProps {
  channelId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPanel({
  channelId = GLOBAL_CHAT_CHANNEL,
  isOpen,
  onClose,
}: ChatPanelProps) {
  const { isAuthenticated, user } = useAuth();
  const {
    messages,
    loading,
    error,
    sendChatMessage,
    sending,
    hasMore,
    loadMore,
  } = useChatMessages(channelId);

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || sending) return;

    const success = await sendChatMessage(inputValue);
    if (success) {
      setInputValue("");
    }
  }, [inputValue, sending, sendChatMessage]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle scroll for loading more
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || loading || !hasMore) return;

    // Load more when scrolled near top
    if (container.scrollTop < 50) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get initials from username
  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get tier color
  const getTierColor = (tier?: string) => {
    if (!tier || tier === "NONE") return null;
    return TIER_BADGE_COLORS[tier as SubscriptionTier];
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed right-0 top-0 w-80 bg-gray-900 border-l border-yellow-500/50 shadow-2xl z-50 flex flex-col"
      style={{ maxWidth: "100vw", height: "calc(100% - 50px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white">Global Chat</h2>
        <Button
          size="sm"
          variant="light"
          isIconOnly
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          X
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {/* Load more indicator */}
        {hasMore && (
          <div className="text-center py-2">
            <Button
              size="sm"
              variant="flat"
              onClick={loadMore}
              isLoading={loading}
            >
              Load Earlier Messages
            </Button>
          </div>
        )}

        {/* Loading state */}
        {loading && messages.length === 0 && (
          <div className="flex justify-center py-8">
            <Spinner size="lg" color="warning" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-red-400 text-center text-sm py-4">{error}</div>
        )}

        {/* Empty state */}
        {!loading && messages.length === 0 && !error && (
          <div className="text-gray-500 text-center text-sm py-8">
            No messages yet. Start the conversation!
          </div>
        )}

        {/* Messages list */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={message.senderId === user?.userId}
            formatTime={formatTime}
            getInitials={getInitials}
            getTierColor={getTierColor}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {isAuthenticated ? (
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              maxLength={500}
              disabled={sending}
              classNames={{
                input: "text-white",
                inputWrapper: "bg-gray-800 border-gray-700",
              }}
            />
            <Button
              color="warning"
              onClick={handleSend}
              isLoading={sending}
              isDisabled={!inputValue.trim() || sending}
            >
              Send
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-700">
          <p className="text-gray-400 text-center text-sm">
            Sign in to join the chat
          </p>
        </div>
      )}
    </div>
  );
}
