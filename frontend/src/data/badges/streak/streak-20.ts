import type { Badge } from "../types";

const badge: Badge = {
  id: "streak_20",
  name: "Hot Streak",
  description: "20 correct decisions in a row",
  icon: "🌟",
  imagePath: "/assets/images/badges/streak-20.png",
  groupId: "streak",
  tier: 3,
  rarity: "rare",
  requirement: 20,
  repeatable: true,
};

export default badge;
