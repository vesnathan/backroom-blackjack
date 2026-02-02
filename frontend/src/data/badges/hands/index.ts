import type { BadgeGroup } from "../types";
import hands100 from "./hands-100";
import hands500 from "./hands-500";
import hands1000 from "./hands-1000";
import hands5000 from "./hands-5000";
import hands10000 from "./hands-10000";

export const handsGroup: BadgeGroup = {
  id: "hands",
  name: "Hands Played",
  description: "Total hands played",
  showHighestOnly: true,
  badges: [hands100, hands500, hands1000, hands5000, hands10000],
};

export const handsBadges = [
  hands100,
  hands500,
  hands1000,
  hands5000,
  hands10000,
];
