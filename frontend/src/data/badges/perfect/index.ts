import type { BadgeGroup } from "../types";
import perfect1 from "./perfect-1";
import perfect5 from "./perfect-5";
import perfect10 from "./perfect-10";
import perfect25 from "./perfect-25";

export const perfectGroup: BadgeGroup = {
  id: "perfect",
  name: "Perfect Shoes",
  description: "Shoes completed with 100% optimal decisions",
  showHighestOnly: true,
  badges: [perfect1, perfect5, perfect10, perfect25],
};

export const perfectBadges = [perfect1, perfect5, perfect10, perfect25];
