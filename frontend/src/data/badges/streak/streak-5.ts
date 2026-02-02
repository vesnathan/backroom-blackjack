import type { Badge } from "../types";

const badge: Badge = {
  id: "streak_5",
  name: "Warm Up",
  description: "5 correct decisions in a row",
  icon: "🔥",
  imagePath: "/assets/images/badges/streak-5.png",
  groupId: "streak",
  tier: 1,
  rarity: "common",
  requirement: 5,
  repeatable: true,
};

export default badge;
