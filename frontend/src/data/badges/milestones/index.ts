import type { BadgeGroup } from "../types";
import firstBlackjack from "./first-blackjack";
import firstWin from "./first-win";
import firstSplit from "./first-split";
import firstDouble from "./first-double";
import pitBossWarning from "./pit-boss-warning";
import insuranceWin from "./insurance-win";
import comebackKid from "./comeback-kid";
import bustMaster from "./bust-master";

export const milestonesGroup: BadgeGroup = {
  id: "milestones",
  name: "Milestones",
  description: "Special one-time achievements",
  showHighestOnly: false, // One-off - show all earned
  badges: [
    firstBlackjack,
    firstWin,
    firstSplit,
    firstDouble,
    pitBossWarning,
    insuranceWin,
    comebackKid,
    bustMaster,
  ],
};

export const milestonesBadges = [
  firstBlackjack,
  firstWin,
  firstSplit,
  firstDouble,
  pitBossWarning,
  insuranceWin,
  comebackKid,
  bustMaster,
];
