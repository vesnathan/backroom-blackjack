/**
 * Manages conversation colors to ensure no two active conversations
 * share the same color. Colors are assigned sequentially and recycled
 * when conversations end.
 */

const COLOR_PALETTE = [
  {
    // Soft pink
    bg: "rgba(255, 230, 235, 0.98)",
    border: "rgba(200, 140, 160, 0.5)",
    arrow: "rgba(255, 230, 235, 0.98)",
  },
  {
    // Soft mint
    bg: "rgba(220, 255, 230, 0.98)",
    border: "rgba(120, 180, 140, 0.5)",
    arrow: "rgba(220, 255, 230, 0.98)",
  },
  {
    // Soft lavender
    bg: "rgba(235, 225, 255, 0.98)",
    border: "rgba(150, 130, 200, 0.5)",
    arrow: "rgba(235, 225, 255, 0.98)",
  },
  {
    // Soft peach
    bg: "rgba(255, 235, 215, 0.98)",
    border: "rgba(200, 160, 120, 0.5)",
    arrow: "rgba(255, 235, 215, 0.98)",
  },
  {
    // Soft sky blue
    bg: "rgba(220, 240, 255, 0.98)",
    border: "rgba(120, 170, 210, 0.5)",
    arrow: "rgba(220, 240, 255, 0.98)",
  },
  {
    // Soft lemon
    bg: "rgba(255, 250, 210, 0.98)",
    border: "rgba(200, 180, 100, 0.5)",
    arrow: "rgba(255, 250, 210, 0.98)",
  },
];

const DEFAULT_COLOR = {
  bg: "rgba(255, 255, 255, 0.98)",
  border: "rgba(0, 0, 0, 0.15)",
  arrow: "rgba(255, 255, 255, 0.98)",
};

export type ConversationColor = {
  bg: string;
  border: string;
  arrow: string;
};

// Track which conversation IDs have which color index
const conversationColorMap = new Map<string, number>();

// Track which color indices are currently in use
const usedColorIndices = new Set<number>();

/**
 * Get a color for a conversation. If the conversation already has a color,
 * return it. Otherwise, randomly assign an available color.
 */
export function getConversationColor(
  conversationId: string | undefined,
): ConversationColor {
  // No conversation ID = default white
  if (!conversationId) {
    return DEFAULT_COLOR;
  }

  // Check if this conversation already has a color
  if (conversationColorMap.has(conversationId)) {
    const colorIndex = conversationColorMap.get(conversationId)!;
    return COLOR_PALETTE[colorIndex];
  }

  // Find all available colors
  const availableIndices: number[] = [];
  COLOR_PALETTE.forEach((_, i) => {
    if (!usedColorIndices.has(i)) {
      availableIndices.push(i);
    }
  });

  // Randomly select from available colors
  let colorIndex: number;
  if (availableIndices.length > 0) {
    const randomIdx = Math.floor(Math.random() * availableIndices.length);
    colorIndex = availableIndices[randomIdx];
  } else {
    // If all colors are used, randomly pick any (this shouldn't happen with <= 6 concurrent conversations)
    colorIndex = Math.floor(Math.random() * COLOR_PALETTE.length);
  }

  // Assign this color to the conversation
  conversationColorMap.set(conversationId, colorIndex);
  usedColorIndices.add(colorIndex);

  return COLOR_PALETTE[colorIndex];
}

/**
 * Release a conversation's color when it ends.
 * Call this when a speech bubble with a conversationId is removed.
 */
export function releaseConversationColor(
  conversationId: string | undefined,
): void {
  if (!conversationId) return;

  const colorIndex = conversationColorMap.get(conversationId);
  if (colorIndex !== undefined) {
    usedColorIndices.delete(colorIndex);
    conversationColorMap.delete(conversationId);
  }
}

/**
 * Get all currently active conversation IDs.
 * Useful for debugging.
 */
export function getActiveConversations(): string[] {
  return Array.from(conversationColorMap.keys());
}

/**
 * Clear all conversation color assignments.
 * Useful when starting a new game or resetting state.
 */
export function clearAllConversationColors(): void {
  conversationColorMap.clear();
  usedColorIndices.clear();
}
