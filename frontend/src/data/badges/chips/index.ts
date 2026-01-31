import type { BadgeGroup } from "../types";
import chips5k from "./chips-5k";
import chips25k from "./chips-25k";
import chips50k from "./chips-50k";
import chips100k from "./chips-100k";
import chips250k from "./chips-250k";
import chips500k from "./chips-500k";
import chips1m from "./chips-1m";

export const chipsGroup: BadgeGroup = {
  id: "chips",
  name: "Chip Stack",
  description: "Peak chip count reached",
  showHighestOnly: false,
  badges: [
    chips5k,
    chips25k,
    chips50k,
    chips100k,
    chips250k,
    chips500k,
    chips1m,
  ],
};

export const chipsBadges = [
  chips5k,
  chips25k,
  chips50k,
  chips100k,
  chips250k,
  chips500k,
  chips1m,
];
