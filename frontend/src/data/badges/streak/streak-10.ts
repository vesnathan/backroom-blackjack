import type { Badge } from "../types";

const badge: Badge = {
  id: "streak_10",
  name: "On Fire",
  description: "10 correct decisions in a row",
  icon: "🔥",
  imagePath: "/assets/images/badges/streak-10.png",
  groupId: "streak",
  tier: 2,
  rarity: "uncommon",
  requirement: 10,
  repeatable: true,
};

export default badge;
