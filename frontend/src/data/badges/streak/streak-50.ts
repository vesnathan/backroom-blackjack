import type { Badge } from "../types";

const badge: Badge = {
  id: "streak_50",
  name: "Unstoppable",
  description: "50 correct decisions in a row",
  icon: "⚡",
  imagePath: "/assets/images/badges/streak-50.png",
  groupId: "streak",
  tier: 4,
  rarity: "epic",
  requirement: 50,
  repeatable: true,
};

export default badge;
