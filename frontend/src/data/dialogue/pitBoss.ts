/**
 * Pit Boss dialogue for high suspicion levels
 * Progressive warnings before the player gets backed off
 */

/**
 * Pit boss warning dialogue by suspicion threshold
 */
export interface PitBossWarning {
  threshold: number; // Suspicion level that triggers this warning
  dialogue: string[];
  isFinal: boolean; // Whether this is the backoff warning
}

export const PIT_BOSS_WARNINGS: PitBossWarning[] = [
  {
    threshold: 70,
    dialogue: [
      "I've been watching your play. Interesting betting pattern.",
      "Mind if I ask what system you're using?",
      "You seem to know when to bet big. Lucky streak?",
      "We don't see many players with your... discipline.",
    ],
    isFinal: false,
  },
  {
    threshold: 85,
    dialogue: [
      "I'm going to have to ask you to keep your bets more consistent.",
      "Management is getting concerned about your action.",
      "Look, I know what's going on. Let's not make this difficult.",
      "You're making my dealers nervous. Dial it back.",
    ],
    isFinal: false,
  },
  {
    threshold: 95,
    dialogue: [
      "Last warning. Flatten your bets or we're done here.",
      "You've got one more chance before I make a call upstairs.",
      "I'm giving you a courtesy heads up. The eye in the sky has you flagged.",
      "Security is already pulling your player card. Your move.",
    ],
    isFinal: false,
  },
  {
    threshold: 100,
    dialogue: [
      "That's it. You're done at this table.",
      "I'm going to have to ask you to color up and leave.",
      "You've been backed off. Cash out and move on.",
      "We appreciate your business, but blackjack isn't for you here anymore.",
    ],
    isFinal: true,
  },
];

/**
 * Get the appropriate pit boss warning for the current suspicion level
 */
export function getPitBossWarning(
  suspicionLevel: number,
  previousWarningThreshold: number,
): PitBossWarning | null {
  // Find the first warning that applies and hasn't been shown yet
  return (
    PIT_BOSS_WARNINGS.find(
      (warning) =>
        suspicionLevel >= warning.threshold &&
        previousWarningThreshold < warning.threshold,
    ) ?? null
  );
}

/**
 * Get a random dialogue from a warning
 */
export function getRandomWarningDialogue(warning: PitBossWarning): string {
  return warning.dialogue[Math.floor(Math.random() * warning.dialogue.length)];
}

// ==============================
// Dealer ↔ Pit Boss Conversations
// ==============================

export type DealerPersonality =
  | "counter"
  | "friendly"
  | "strict"
  | "oblivious"
  | "veteran"
  | "rookie";

/** Pit boss lines when approaching the table */
export const PIT_BOSS_APPROACHES = [
  "How's the table running tonight?",
  "Everything under control here?",
  "Any issues I should know about?",
  "Good crowd tonight?",
  "How's the shoe treating us?",
  "Any players I should be watching?",
  "Table count looking okay?",
];

/** Pit boss departing lines */
export const PIT_BOSS_DEPARTURES = [
  "Keep me posted.",
  "I'll be around if you need me.",
  "Radio if anything comes up.",
  "Good work, keep it up.",
  "I'll check back in a bit.",
];

/** Dealer responses when pit boss approaches - by personality */
export const DEALER_PIT_BOSS_GREETINGS: Record<DealerPersonality, string[]> = {
  // Maria (counter) - Deflects, protects players
  counter: [
    "Evening, boss. Just a normal shoe here.",
    "All good. Solid players, no issues.",
    "Quiet night. Nothing unusual.",
    "Table's running smooth. No concerns.",
    "Standard crowd. Everyone's having fun.",
  ],

  // Marcus (friendly) - Casual, doesn't take it seriously
  friendly: [
    "Hey boss! Great vibes at this table!",
    "All good here! Just having fun!",
    "Everyone's happy, no drama!",
    "We're all friends here! Pull up a chair!",
    "Smooth sailing, boss! Want a joke?",
  ],

  // Harold (strict) - Eager to report
  strict: [
    "Boss. I've been keeping a close eye on things.",
    "Running a tight table as always.",
    "A few players worth watching. I'll brief you.",
    "Table discipline is high. Bets are being tracked.",
    "Standard procedure. Everything documented.",
  ],

  // Jenny (rookie) - Nervous, uncertain
  rookie: [
    "Oh! Hi! Um, everything's... good? I think?",
    "I'm doing my best! Is everything okay?",
    "The table's running! I haven't messed up... much.",
    "Hi! Are you checking on me? Did I do something wrong?",
    "Um, all players seem nice? Is that what you need?",
  ],

  // Frank (oblivious) - Confused, unhelpful
  oblivious: [
    "Hmm? Oh, hey. Table's... table.",
    "All good, I guess. Standard stuff.",
    "Nothing notable. Or was there? I don't remember.",
    "We're dealing cards. That's what we do, right?",
    "Boss. Yes. The table. It's here.",
  ],

  // Lisa (veteran) - Professional, measured
  veteran: [
    "Evening. Table's running within parameters.",
    "Solid shoe. A few skilled players, nothing extreme.",
    "All good. I'll flag anything that needs attention.",
    "Twenty-five years, I know what to look for. We're fine.",
    "Standard Wednesday night crowd. Nothing to report.",
  ],
};

/** Dealer responses when pit boss asks about suspicious players - by personality */
export const DEALER_SUSPICION_REPORTS: Record<
  DealerPersonality,
  {
    covers: string[]; // What they say to cover for players
    reports: string[]; // What they say to report players
  }
> = {
  // Maria (counter) - Covers for skilled players, she's on their side
  counter: {
    covers: [
      "Nah, just a lucky streak. Variance happens.",
      "Bet spread? Looks normal to me. Just a confident player.",
      "They're playing basic strategy. Nothing special.",
      "I've seen real counters. This isn't it.",
      "Just a player who's done their homework. Not counting.",
      "Gut feeling says they're just having a good night.",
    ],
    reports: [
      // Maria almost never reports, but if forced...
      "If you insist, but I don't see anything concerning.",
    ],
  },

  // Marcus (friendly) - Casual, doesn't want trouble
  friendly: {
    covers: [
      "They're just having fun! No worries!",
      "Lucky streak, that's all! Happens!",
      "Nah, they're cool. Just enjoying the game!",
      "Everyone's a winner sometimes, right?",
      "They're fine! Great tipper too!",
    ],
    reports: [
      "I mean, I guess they're betting big? But like, so what?",
      "You're the expert, boss. I just deal the cards!",
    ],
  },

  // Harold (strict) - Eager to report suspicious activity
  strict: {
    covers: [
      // Harold doesn't cover for anyone
      "I can't confirm that. They seem suspicious to me.",
    ],
    reports: [
      "Definite bet spread pattern. Classic counter behavior.",
      "I've been tracking their bets. 1-12 spread. Red flag.",
      "Perfect basic strategy every hand. No hesitation.",
      "They're watching the discard tray. Dead giveaway.",
      "Betting heavy on high counts, light on low. Classic.",
      "I recommend shuffling early. Throw off their count.",
      "Want me to speed up the deal? Make it harder?",
    ],
  },

  // Jenny (rookie) - Doesn't really know what to look for
  rookie: {
    covers: [
      "Um, I'm not sure what counting looks like? They seem nice!",
      "Are they doing something wrong? I didn't notice!",
      "I think they're just... good at cards? Is that bad?",
    ],
    reports: [
      "I don't know what to look for, but you're the boss!",
      "If you say something's wrong, I believe you!",
      "Should I be watching them more? I'll try harder!",
    ],
  },

  // Frank (oblivious) - Barely paying attention
  oblivious: {
    covers: [
      "Who? The one in the hat? I dunno.",
      "Counting? Cards? Sure. Whatever you say.",
      "I wasn't really watching. Probably fine though.",
    ],
    reports: [
      "If you say so. I wasn't really... yeah.",
      "Suspicious? Maybe? I don't know anymore.",
      "You're probably right. I missed it.",
    ],
  },

  // Lisa (veteran) - Professional, only reports if obvious
  veteran: {
    covers: [
      "Skilled player, but staying subtle. I'd let it ride.",
      "Borderline. Bet spread is reasonable. Not worth the scene.",
      "Could be counting, could just be smart. Hard to tell.",
      "I've seen worse. They're not being obvious about it.",
    ],
    reports: [
      "Okay, this one's clear. 1-16 spread. Perfect strategy.",
      "I'd shuffle early on this one. They're tracking.",
      "Yeah, I've been watching too. Definite counter.",
      "This one's obvious. Your call, but I'd act.",
    ],
  },
};

/** Dealer small talk with pit boss - by personality */
export const DEALER_PIT_BOSS_SMALL_TALK: Record<DealerPersonality, string[]> = {
  counter: [
    "Long shift tonight?",
    "Quiet compared to last weekend.",
    "New cocktail waitress seems nice.",
    "Heard they're renovating the poker room.",
    "My feet are killing me. This floor is brutal.",
  ],

  friendly: [
    "Did you catch the game last night?! What a finish!",
    "My kid's birthday is Saturday. Going to Chuck E. Cheese!",
    "You try the new burger at the restaurant? SO good!",
    "This one regular tips in high fives. I love it!",
    "We should grab coffee on break. Catch up!",
  ],

  strict: [
    "Surveillance updated their software. Faster tracking now.",
    "I submitted that training request. Still waiting.",
    "The new shufflers are faster. I approve.",
    "Break schedules seem off this week.",
    "Any updates on that policy change?",
  ],

  rookie: [
    "Am I doing okay? Like, compared to other new dealers?",
    "I still get nervous when you watch! Is that normal?",
    "Do you have any tips for dealing faster?",
    "How long until I get the good tables?",
    "Sorry, was that a dumb question?",
  ],

  oblivious: [
    "What day is it?",
    "I forgot my lunch again.",
    "Three more months to retirement...",
    "My boat needs new paint.",
    "Did someone say something?",
  ],

  veteran: [
    "Remember the 90s? Tables were different then.",
    "New kids don't appreciate proper dealing technique.",
    "Surveillance has gotten so sophisticated. Remember the old days?",
    "Twenty-five years. I've seen everything twice.",
    "This job has changed. Not always for the better.",
  ],
};

/** Utility to pick random item from array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Get a dealer's greeting to the pit boss */
export function getDealerPitBossGreeting(
  personality: DealerPersonality,
): string {
  return pick(DEALER_PIT_BOSS_GREETINGS[personality]);
}

/** Get a dealer's response about a suspicious player */
export function getDealerSuspicionReport(
  personality: DealerPersonality,
  covers: boolean,
): string {
  const responses = DEALER_SUSPICION_REPORTS[personality];
  return covers ? pick(responses.covers) : pick(responses.reports);
}

/** Get dealer small talk with pit boss */
export function getDealerPitBossSmallTalk(
  personality: DealerPersonality,
): string {
  return pick(DEALER_PIT_BOSS_SMALL_TALK[personality]);
}

/** Get pit boss approach line */
export function getPitBossApproach(): string {
  return pick(PIT_BOSS_APPROACHES);
}

/** Get pit boss departure line */
export function getPitBossDeparture(): string {
  return pick(PIT_BOSS_DEPARTURES);
}
