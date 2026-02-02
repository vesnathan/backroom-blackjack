import type { Badge } from "../types";

const badge: Badge = {
  id: "streak_100",
  name: "Perfect Mind",
  description: "100 correct decisions in a row",
  icon: "🧠",
  imagePath: "/assets/images/badges/streak-100.png",
  groupId: "streak",
  tier: 5,
  rarity: "legendary",
  requirement: 100,
  repeatable: true,
};

export default badge;
