import type { BadgeGroup } from "../types";
import blackjack10 from "./blackjack-10";
import blackjack50 from "./blackjack-50";
import blackjack100 from "./blackjack-100";
import blackjack250 from "./blackjack-250";
import blackjack500 from "./blackjack-500";

export const blackjacksGroup: BadgeGroup = {
  id: "blackjacks",
  name: "Blackjacks",
  description: "Total blackjacks dealt",
  showHighestOnly: true,
  badges: [blackjack10, blackjack50, blackjack100, blackjack250, blackjack500],
};

export const blackjacksBadges = [
  blackjack10,
  blackjack50,
  blackjack100,
  blackjack250,
  blackjack500,
];
