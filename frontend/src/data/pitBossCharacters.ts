/**
 * Pit Boss character definition
 * Single pit boss with four image states based on attention level
 */

export interface PitBossCharacter {
  id: string;
  name: string;
  // Image paths for different distance states
  imageFront: string; // At the table, watching (distance 0-25)
  imageSide: string; // Nearby, glancing over (distance 25-50)
  imageBack: string; // Walking away / in the distance (distance 50-75)
  imageGone: string; // Gone from the area (distance 75-100)
}

export const PIT_BOSS: PitBossCharacter = {
  id: "pitboss",
  name: "Pit Boss",
  imageFront: "/assets/images/pitt-boss/front.webp",
  imageSide: "/assets/images/pitt-boss/side.webp",
  imageBack: "/assets/images/pitt-boss/back.webp",
  imageGone: "/assets/images/pitt-boss/none.webp",
};

/**
 * Get the pit boss character
 */
export function getRandomPitBoss(): PitBossCharacter {
  return PIT_BOSS;
}

/**
 * Get pit boss image based on distance only
 * @param pitBoss The pit boss character
 * @param distance 0-100, lower = closer to the table (watching), higher = further away
 */
export function getPitBossImage(
  pitBoss: PitBossCharacter,
  distance: number,
): string {
  // Distance determines image: close = watching, far = gone
  if (distance <= 25) {
    return pitBoss.imageFront; // At the table, watching
  }
  if (distance <= 50) {
    return pitBoss.imageSide; // Nearby, glancing over
  }
  if (distance <= 75) {
    return pitBoss.imageBack; // Walking away / in the distance
  }
  return pitBoss.imageGone; // Gone from the area
}
