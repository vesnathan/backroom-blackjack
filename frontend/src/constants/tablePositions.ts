// Table positions for all 8 seats [left%, top%]
// Seats are numbered right-to-left from dealer's perspective (0=far right/first base, 7=far left/third base)
// Note: Compressed horizontally for edge clearance, moved up to clear badge bar
export const TABLE_POSITIONS: readonly [number, number][] = [
  [92, 56], // Seat 0 - Far right (first base)
  [80, 63], // Seat 1 - Right
  [68, 69], // Seat 2 - Center-right
  [56, 73], // Seat 3 - Center
  [43, 73], // Seat 4 - Center
  [31, 69], // Seat 5 - Center-left
  [19, 63], // Seat 6 - Left
  [7, 56], // Seat 7 - Far left (third base)
] as const;

// Mobile positions for 5 seats - more spread out for bigger cards
// Maps mobile seat index (0-4) to position [left%, top%]
export const MOBILE_TABLE_POSITIONS: readonly [number, number][] = [
  [85, 60], // Seat 0 - Right
  [67, 68], // Seat 1 - Center-right
  [50, 72], // Seat 2 - Center
  [33, 68], // Seat 3 - Center-left
  [15, 60], // Seat 4 - Left
] as const;

// Which desktop seat indices are used on mobile (for AI player mapping)
// Mobile seats 0-4 map to desktop seats 1, 2, 3, 5, 6
export const MOBILE_SEAT_MAPPING: readonly number[] = [1, 2, 3, 5, 6] as const;

// Dealer position for speech bubbles (top center of screen, below dealer)
// Use position -1 to indicate dealer speech bubble
export const DEALER_POSITION: readonly [number, number] = [50, 25] as const;

// Pit boss position for speech bubbles (left side near top, where pit boss watches from)
// Use position -2 to indicate pit boss speech bubble
export const PIT_BOSS_POSITION: readonly [number, number] = [20, 15] as const;
