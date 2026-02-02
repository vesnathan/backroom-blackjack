/**
 * Single source of truth for all layout constants.
 * All avatar sizes, card sizes, positions, and spacing should come from here.
 */

// =============================================================================
// DESKTOP CONSTANTS
// =============================================================================

// Avatar sizes
export const AVATAR_SIZE = 150; // px - player/AI avatar
export const AVATAR_RING_SIZE = 170; // px - ring around avatar
export const AVATAR_BORDER_WIDTH = 4; // px

// Card sizes
export const CARD_WIDTH = 70; // px
export const CARD_HEIGHT = 98; // px
export const CARD_SPACING = 15; // px between cards

// Card layout (player hands)
export const CARD_AVATAR_GAP = 69; // px - gap between avatar top and card container bottom
export const CARD_CONTAINER_WIDTH = 230; // px - width of card container
export const CARD_CONTAINER_HEIGHT = 210; // px - height of card container
export const CARDS_PER_ROW = 3; // cards per row in grid layout
export const CARD_GRID_H_SPACING = 74; // px - horizontal spacing between cards
export const CARD_GRID_V_SPACING = 102; // px - vertical spacing between cards

// Dealer card layout
export const DEALER_CARD_SPACING = 74; // px - horizontal spacing for dealer cards
export const DEALER_CONTAINER_WIDTH = 370; // px
export const DEALER_CONTAINER_HEIGHT = 110; // px

// Split hands
export const SPLIT_CONTAINER_WIDTH = 150; // px
export const SPLIT_CARDS_PER_ROW = 2;

// Pit boss
export const PIT_BOSS_X_OFFSET_BASE = 100; // px from center when close
export const PIT_BOSS_X_OFFSET_MAX = 500; // px from center when far

// =============================================================================
// MOBILE CONSTANTS
// =============================================================================

// Avatar sizes
export const MOBILE_AVATAR_SIZE = 85; // px
export const MOBILE_AVATAR_RING_SIZE = 103; // px
export const MOBILE_AVATAR_BORDER_WIDTH = 2; // px

// Card sizes (larger for better visibility, text stays at 32px in PlayingCard.tsx)
export const MOBILE_CARD_WIDTH = 56; // px
export const MOBILE_CARD_HEIGHT = 78; // px

// Card layout (player hands)
export const MOBILE_CARD_AVATAR_GAP = 42; // px
export const MOBILE_CARD_CONTAINER_WIDTH = 180; // px
export const MOBILE_CARD_GRID_H_SPACING = 60; // px
export const MOBILE_CARD_GRID_V_SPACING = 82; // px

// Dealer card layout
export const MOBILE_DEALER_CARD_SPACING = 60; // px
export const MOBILE_DEALER_CONTAINER_WIDTH = 300; // px
export const MOBILE_DEALER_CONTAINER_HEIGHT = 85; // px

// Pit boss
export const MOBILE_PIT_BOSS_X_OFFSET_BASE = 60; // px
export const MOBILE_PIT_BOSS_X_OFFSET_MAX = 300; // px

// =============================================================================
// LAYOUT CONFIG TYPE AND HELPER
// =============================================================================

export interface LayoutConfig {
  // Avatar
  avatarSize: number;
  avatarRingSize: number;
  avatarBorderWidth: number;

  // Cards
  cardWidth: number;
  cardHeight: number;
  cardSpacing: number;

  // Player card layout
  cardAvatarGap: number;
  cardContainerWidth: number;
  cardContainerHeight: number;
  cardsPerRow: number;
  cardGridHSpacing: number;
  cardGridVSpacing: number;

  // Dealer
  dealerCardSpacing: number;
  dealerContainerWidth: number;
  dealerContainerHeight: number;

  // Pit boss
  pitBossXOffsetBase: number;
  pitBossXOffsetMax: number;

  // Meta
  isMobile: boolean;
}

/**
 * Get layout configuration based on mobile state.
 * This is the primary way to get layout values - use this instead of individual constants.
 */
export function getLayoutConfig(isMobile: boolean): LayoutConfig {
  if (isMobile) {
    return {
      avatarSize: MOBILE_AVATAR_SIZE,
      avatarRingSize: MOBILE_AVATAR_RING_SIZE,
      avatarBorderWidth: MOBILE_AVATAR_BORDER_WIDTH,
      cardWidth: MOBILE_CARD_WIDTH,
      cardHeight: MOBILE_CARD_HEIGHT,
      cardSpacing: CARD_SPACING,
      cardAvatarGap: MOBILE_CARD_AVATAR_GAP,
      cardContainerWidth: MOBILE_CARD_CONTAINER_WIDTH,
      cardContainerHeight: CARD_CONTAINER_HEIGHT,
      cardsPerRow: CARDS_PER_ROW,
      cardGridHSpacing: MOBILE_CARD_GRID_H_SPACING,
      cardGridVSpacing: MOBILE_CARD_GRID_V_SPACING,
      dealerCardSpacing: MOBILE_DEALER_CARD_SPACING,
      dealerContainerWidth: MOBILE_DEALER_CONTAINER_WIDTH,
      dealerContainerHeight: MOBILE_DEALER_CONTAINER_HEIGHT,
      pitBossXOffsetBase: MOBILE_PIT_BOSS_X_OFFSET_BASE,
      pitBossXOffsetMax: MOBILE_PIT_BOSS_X_OFFSET_MAX,
      isMobile: true,
    };
  }

  return {
    avatarSize: AVATAR_SIZE,
    avatarRingSize: AVATAR_RING_SIZE,
    avatarBorderWidth: AVATAR_BORDER_WIDTH,
    cardWidth: CARD_WIDTH,
    cardHeight: CARD_HEIGHT,
    cardSpacing: CARD_SPACING,
    cardAvatarGap: CARD_AVATAR_GAP,
    cardContainerWidth: CARD_CONTAINER_WIDTH,
    cardContainerHeight: CARD_CONTAINER_HEIGHT,
    cardsPerRow: CARDS_PER_ROW,
    cardGridHSpacing: CARD_GRID_H_SPACING,
    cardGridVSpacing: CARD_GRID_V_SPACING,
    dealerCardSpacing: DEALER_CARD_SPACING,
    dealerContainerWidth: DEALER_CONTAINER_WIDTH,
    dealerContainerHeight: DEALER_CONTAINER_HEIGHT,
    pitBossXOffsetBase: PIT_BOSS_X_OFFSET_BASE,
    pitBossXOffsetMax: PIT_BOSS_X_OFFSET_MAX,
    isMobile: false,
  };
}

// =============================================================================
// POSITION CALCULATION HELPERS
// =============================================================================

/**
 * Calculate the absolute position for a card in a player's hand.
 * Used by both static rendering (TableSeats) and flying card animations.
 */
export function getPlayerCardPosition(
  seatX: number,
  seatY: number,
  cardIndex: number,
  isMobile = false,
): { left: string; top: string } {
  const config = getLayoutConfig(isMobile);

  const col = cardIndex % config.cardsPerRow;
  const row = Math.floor(cardIndex / config.cardsPerRow);
  const containerOffset = -(config.cardContainerWidth / 2);
  const cardLeft = col * config.cardGridHSpacing;
  const cardBottomOffset = row * config.cardGridVSpacing;

  const baseTopOffset = config.cardAvatarGap + config.cardHeight;
  const topOffset = baseTopOffset + cardBottomOffset;

  return {
    left: `calc(${seatX}% + ${containerOffset + cardLeft}px)`,
    top: `calc(${seatY}% - ${topOffset}px)`,
  };
}

/**
 * Calculate dealer card position for flying animations.
 */
export function getDealerCardPosition(
  cardIndex: number,
  isMobile = false,
): { left: string; top: string } {
  const config = getLayoutConfig(isMobile);

  const containerOffset = -(config.dealerContainerWidth / 2);
  const cardOffset = cardIndex * config.dealerCardSpacing;
  const topOffset = isMobile ? "calc(3% + 90px)" : "calc(3% + 162px + 4px)";

  return {
    left: `calc(50% + ${containerOffset + cardOffset}px)`,
    top: topOffset,
  };
}

/**
 * Get pit boss X offset based on distance (0-100).
 */
export function getPitBossXOffset(distance: number, isMobile = false): number {
  const config = getLayoutConfig(isMobile);
  return (
    config.pitBossXOffsetBase +
    (distance / 100) * (config.pitBossXOffsetMax - config.pitBossXOffsetBase)
  );
}
