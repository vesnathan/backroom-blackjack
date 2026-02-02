/* eslint-disable sonarjs/no-duplicate-string */
// Dialogue files naturally contain repeated phrases - this is intentional

// ==============================
// Conversations: Players ↔ Dealers
// ==============================

/** Utility to safely pick a random item */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface DealerPlayerConversationTemplate {
  /** "generic" or a character id (e.g., "drunk-danny") */
  id: string;
  openers: string[]; // How the convo starts at a fresh shoe or seat
  dealerQuestions: string[]; // Dealer lines that prompt a reply
  playerQuestions: string[]; // Things the player (character) asks dealer
  smallTalk: string[]; // Neutral chit-chat
  heatMoments: string[]; // Subtle suspicion / tense beats
  exits: string[]; // How they wrap or pause the convo
}

/** Generic plus per-character overrides to flavor the experience */
export const DEALER_PLAYER_CONVERSATIONS: Record<
  string,
  DealerPlayerConversationTemplate
> = {
  generic: {
    id: "generic",
    openers: [
      "Welcome in—buy-in ready when you are.",
      "Fresh shoe—good luck everyone.",
      "Evening folks, let's keep it friendly and fun.",
    ],
    dealerQuestions: [
      "Insurance anyone?",
      // eslint-disable-next-line sonarjs/no-duplicate-string
      "Checks play?",
      "Color coming in or same color out?",
      "Would you like to cut the deck?",
      "Any side bets this hand?",
      "Are you comfortable with table limits?",
    ],
    playerQuestions: [
      "Can I get change for these bills?",
      "How many decks are we running?",
      "Do you hit soft 17 here?",
      "What are the surrender rules at this table?",
      "Is this a cut-card or hand shuffle tonight?",
      "Can you explain the side bet quickly?",
    ],
    smallTalk: [
      "Quiet night or is this the calm before the rush?",
      "You always deal this smooth?",
      "Nice music in here—does it loop every hour?",
      "How long you been dealing?",
      "Anyone hit a hot streak earlier?",
      "I like the vibe at this pit.",
    ],
    heatMoments: [
      "Let's keep the table moving, folks.",
      "I'll need to spread that bet in one spot, please.",
      "Try to keep hands visible on the felt.",
      "Eye in the sky says hello.",
      "No phones on the layout, thanks.",
      "Let's not coach other players, please.",
    ],
    exits: [
      "Good luck on your next table.",
      "Color up? I'll get you greens for those reds.",
      "Be right back after the break; new dealer coming in.",
      "Thanks for playing; appreciate the good energy.",
      "Shoes changing—grab a drink if you like.",
      "My relief's here—play nice for them.",
    ],
  },

  "drunk-danny": {
    id: "drunk-danny",
    openers: [
      "Bartender knows my name; the cards should too.",
      "Fresh shoe? Fresh drink.",
      "Keep it straight, Danny—cards first, stories second.",
    ],
    dealerQuestions: [
      "Danny, want checks play or you good?",
      "Another drink, or water for a bit?",
      "Cut the deck, sir?",
      "Are you locking that bet in, Danny?",
      "Insurance? Might pair with your whiskey.",
      "Color coming in?",
    ],
    playerQuestions: [
      "Do you take tips in dad jokes?",
      "Which side of the shoe smiles at me?",
      "Is the felt supposed to sway or is that me?",
      "Do I need to declare 'lucky elbow'?",
      "What time do blackjacks usually arrive?",
      "Can I split… my attention? Kidding. Mostly.",
    ],
    smallTalk: [
      "You deal smoother than my bartender pours.",
      "I've seen you turn disasters into wins—do that again?",
      "My grandkids say I should 'chill'. This is chilling.",
      "What's the bar's best snack for luck?",
      "I beat the house once. Might've been Monopoly.",
      "This chair hugs me. That's a tell.",
    ],
    heatMoments: [
      "Hands on the felt, Danny, not the drink.",
      "Let's keep the chips in one spot, please.",
      "One player to a hand, thanks.",
      "Let's slow the jokes for a second—hit or stand?",
      "No touching the discard, please.",
      "Eyes up here, sir—decision time.",
    ],
    exits: [
      "I'll color up when the room stops whispering.",
      "If I wander off, tell me I was legendary.",
      "I'm off to tip the bartender and my future.",
      "New dealer? I'll toast to that.",
      "I'll cash out before I start telling pirate stories.",
      "Bathroom break—don't let my chair get sober.",
    ],
  },

  "clumsy-claire": {
    id: "clumsy-claire",
    openers: [
      "Hi! I brought napkins—just in case.",
      "I'll try not to knock anything tonight.",
      "Light buy-in—lighter hands.",
    ],
    dealerQuestions: [
      "Cut the deck, Claire?",
      "Want me to square your chips up?",
      // eslint-disable-next-line sonarjs/no-duplicate-string
      "Insurance?",
      // eslint-disable-next-line sonarjs/no-duplicate-string
      "Would you like change for that?",
      // eslint-disable-next-line sonarjs/no-duplicate-string
      "Are you comfortable placing chips closer in?",
      "Need a second to decide?",
    ],
    playerQuestions: [
      "Is it okay if I move this drink back a bit?",
      "Do you mind if I stack in tiny piles?",
      "What's the polite word for 'oops' in casinos?",
      "Could I get a felt wipe if I spill? I hope not!",
      "Do you re-cut if I drop the card? Hypothetically.",
      "Is there a 'clumsy lane' at the table edge?",
    ],
    smallTalk: [
      "You shuffle like a ballet—it's lovely.",
      "I come once a month with friends—book club night.",
      "Do dealers prefer neat stacks? I'm practicing.",
      "What's your favorite lucky story?",
      "Your patience is a superpower.",
      "This table feels friendly. I like that.",
    ],
    heatMoments: [
      "Let's keep beverages off the rail, please.",
      "No touching the cards after your decision, thanks.",
      "We'll need chips in one tidy stack.",
      "Careful with hands near the layout.",
      "Phone away on the layout, please.",
      "Let's keep the game moving—hit or stand?",
    ],
    exits: [
      "I'll color up before gravity finds me again.",
      "Break time—I owe the bar some napkin duty.",
      "New dealer? I'll reorganize while you swap.",
      "Thanks for being kind—I'm learning!",
      "I'll be back. With fewer oopses.",
      "Gonna check on my friends—be right back.",
    ],
  },

  "chatty-carlos": {
    id: "chatty-carlos",
    openers: [
      "Great to see a pro behind the shoe.",
      "Let's make some Q4 magic right here.",
      "Buying in—call it marketing spend.",
    ],
    dealerQuestions: [
      "Carlos, want to cut?",
      "Any side bets today?",
      "Checks play?",
      "Holding that bet size this shoe?",
      "Stacks okay like that?",
      "Insurance—yes or no?",
    ],
    playerQuestions: [
      "How many decks? It affects… my storytelling.",
      "Are we hitting soft 17 here?",
      "What time does the pit heat up?",
      "Do you track table win rates? I love stats.",
      "Is there a 'dealer of the month' board?",
      "What's your favorite twist ending hand?",
    ],
    smallTalk: [
      "I tell my team: trust the process—like shuffles.",
      "You've got showmanship—that matters.",
      "Good tables are communities; this one's growing.",
      "I'll celebrate any player who hits a heater.",
      "I love a fair game—it's good business.",
      "We're all here to leave with a story.",
    ],
    heatMoments: [
      "Let's keep side commentary minimal, please.",
      "Phones off the rail, thanks.",
      "One player to a hand.",
      "Please don't coach decisions.",
      "Keep bets in the circle, sir.",
      "Decision please—hit, stand, double, or split?",
    ],
    exits: [
      "Color up—closing the daily ledger.",
      "New dealer—new KPI.",
      "Break time; I'll network the bar.",
      "I'll be back with a testimonial.",
      "Great dealing—genuinely.",
      "Story secured. See you next shoe.",
    ],
  },

  "superstitious-susan": {
    id: "superstitious-susan",
    openers: [
      "May I bless my chips before we start?",
      "I'll wait for the air to settle… now.",
      "This corner feels harmonious—thank you.",
    ],
    dealerQuestions: [
      "Would you like to cut the deck, Susan?",
      "Any problem if we keep the crystals off the layout?",
      "Insurance?",
      "Are you okay with a steady pace?",
      "Would you prefer end seat energy?",
      "Need a moment for your ritual?",
    ],
    playerQuestions: [
      "Do you mind if my rabbit's foot faces the shoe?",
      "How do you feel about sage—just a mist?",
      "Is today a soft-17 house?",
      "Could we pause one breath before dealing?",
      "Do you mind if I align chips symmetrically?",
      "Any superstition you've seen that actually works?",
    ],
    smallTalk: [
      "Your shuffle rhythm is grounding.",
      "I donate a win portion to animal rescues.",
      "People laugh, but rituals calm the mind.",
      "The shoe's energy changed after that cut.",
      "I once saw a table sing to reverse a slump.",
      "Thank you for holding a kind space.",
    ],
    heatMoments: [
      "Crystals can stay on the rail, not the felt—thanks.",
      "Let's keep the game moving, Susan.",
      "No blowing on the cards, please.",
      "Hands flat on the felt, thank you.",
      "We can't pause every deal—sorry.",
      "Decision time: hit or stand?",
    ],
    exits: [
      "I'll cleanse and return with new energy.",
      "Time to ground—be right back.",
      "New dealer—new aura, lovely.",
      "I'll color up with gratitude.",
      "Blessings to this table till I return.",
      "When the wind shifts, I'll be back.",
    ],
  },

  "cocky-kyle": {
    id: "cocky-kyle",
    openers: [
      "Make this cinematic, dealer.",
      "I'm here for the headline hand.",
      "Buy-in: let's make it photogenic.",
    ],
    dealerQuestions: [
      "Kyle, cut or keep the pace?",
      "Lock that bet, please.",
      "Insurance?",
      "Please keep the chips inside the circle.",
      "Phones off the felt, thanks.",
      "Checks play?",
    ],
    playerQuestions: [
      "What's the record win at this table?",
      "You ever deal five blackjacks in a row?",
      "Policy on sunglasses at night? For…the brand.",
      "Are side bets worth the spectacle?",
      "How many decks? I'm optimizing my clip.",
      "Do you call hot streaks 'content moments'?",
    ],
    smallTalk: [
      "You've got dealer swagger—I respect it.",
      "If I hit a heater, I'll tip like a hurricane.",
      "This pit feels premium.",
      "We should name this shoe 'Viral'.",
      "I collect wins and reactions.",
      "You run the cleanest game I've seen.",
    ],
    heatMoments: [
      "Eyes on the layout, please.",
      "Cool the commentary a bit, sir.",
      "One hand per player.",
      "Let's not touch the discard tray.",
      "Decision now, please.",
      "Keep it respectful—thank you.",
    ],
    exits: [
      "Color up; I've got a meet-and-greet with destiny.",
      "New dealer? New content arc.",
      "Break. I'll autograph a chip out there.",
      "I'll be back when the soundtrack swells.",
      "You were solid—respect.",
      "Off to spread the legend.",
    ],
  },

  "nervous-nancy": {
    id: "nervous-nancy",
    openers: [
      "Hi—small buy-in—quiet seat, please.",
      "End spot if possible—thank you.",
      "I'm friendly, just… jumpy.",
    ],
    dealerQuestions: [
      "Nancy, you okay with this pace?",
      "Insurance?",
      "Want me to remind you of options?",
      "Would you like to cut, or should I?",
      "Need change for that?",
      "All good to continue?",
    ],
    playerQuestions: [
      "Do you hit soft 17? I like to know.",
      "Is surrender allowed here?",
      "How strict are phone rules? I'll put it away!",
      "What's the table etiquette for questions?",
      "Is it okay if I take one deep breath first?",
      "How long is a shoe usually?",
    ],
    smallTalk: [
      "You're very calm—that helps me.",
      "I read one book; it made me more nervous.",
      "I'm here to have fun. Quietly.",
      "I like when people cheer… softly.",
      "Thanks for explaining with patience.",
      "Nice table energy tonight.",
    ],
    heatMoments: [
      "Hands flat on the felt, please.",
      "Let's keep the decisions moving.",
      "No signaling other players, thanks.",
      "Phones off the rail.",
      "Take your time, but we do need a decision.",
      "Stay seated during the deal, please.",
    ],
    exits: [
      "I'll color up and exhale outside.",
      "Break—my heart needs tea.",
      "New dealer—okay, new start.",
      "Thank you for being kind to me.",
      "I'll be back when my hands stop shaking.",
      "Appreciate the table—truly.",
    ],
  },

  "lucky-larry": {
    id: "lucky-larry",
    openers: [
      "Dealer! The streak followed me in.",
      "Make a note—today's a heater.",
      "Buy-in blessed by the gods of coincidence.",
    ],
    dealerQuestions: [
      "Cut the deck, Larry?",
      "Insurance on the streak?",
      "Keep that bet size or ramp it?",
      "Same color or color up?",
      "Want a seat change for luck?",
      "Ready for the next shoe?",
    ],
    playerQuestions: [
      "Are you the lucky dealer they told me about?",
      "Got a favorite place to cut?",
      "Ever see eight blackjacks in one session?",
      "What do you call it when luck hums?",
      "House rules kind to winners?",
      "Can I name this shoe 'Larry's Lane'?",
    ],
    smallTalk: [
      "Your deal has a rhythm—luck loves rhythm.",
      "I tip in streak energy and chips.",
      "I promise to share the glow.",
      "This shoe has good bones.",
      "Let the heater feed the whole table.",
      "I'm allergic to cold streaks—achoo!",
    ],
    heatMoments: [
      "Keep the celebration modest, please.",
      "Hands on the felt during the deal.",
      "No tapping the shoe, thanks.",
      "Let's not coach outcomes.",
      "We'll keep it fair and fun.",
      "Decision, please.",
    ],
    exits: [
      "Color up while the aura's high.",
      "Break—luck's grabbing a coffee.",
      "New dealer—new chapter.",
      "I'll be back before the streak cools.",
      "Thanks for riding the wave, dealer.",
      "Cashing and dashing—politely.",
    ],
  },

  "unlucky-ursula": {
    id: "unlucky-ursula",
    openers: [
      "Hello doom, my old friend—deal me in.",
      "I'm here to lower the average.",
      "Buy-in with optimism I can't afford.",
    ],
    dealerQuestions: [
      "Cut the deck, Ursula?",
      "Insurance? Might be your day.",
      "Want to keep the same bet size?",
      "Checks play?",
      "Any seat you prefer?",
      "Would you like to color up after this shoe?",
    ],
    playerQuestions: [
      "Got a mercy rule for chronic 16s?",
      "What's the statistically least cursed chair?",
      "Do you name ten runs or just endure them?",
      "Are side bets luckier for the unlucky?",
      "Can I borrow the house's optimism?",
      "If I win once, do we ring a bell?",
    ],
    smallTalk: [
      "If I push, I celebrate.",
      "You deal fair—my luck is the villain.",
      "I keep coming back; I'm charming like that.",
      "This table deserves better outcomes—watch me try.",
      "I tip with gallows humor.",
      "If I win, I'll frame the chip.",
    ],
    heatMoments: [
      "Let's keep comments light, please.",
      "Try not to touch your cards after the decision.",
      "No table slaps, thanks.",
      "Phones off the layout.",
      "Decision time—let's keep it moving.",
      "We're all good—just a reminder on etiquette.",
    ],
    exits: [
      "I'll color up before fate gets bored.",
      "Break time—recalibrating expectations.",
      "New dealer—maybe new destiny.",
      "Thanks for the fair dealing.",
      "I'll be back; doom loves a sequel.",
      "Cash me out before the ten parade returns.",
    ],
  },
};

// ==============================
// Dealer Action Comments (Per AI Personality)
// ==============================

export type DealerPersonality =
  | "counter"
  | "friendly"
  | "strict"
  | "oblivious"
  | "veteran"
  | "rookie";
export type AIPersonality =
  | "drunk"
  | "clumsy"
  | "chatty"
  | "superstitious"
  | "cocky"
  | "nervous"
  | "lucky"
  | "unlucky";
export type PlayerAction =
  | "hit"
  | "stand"
  | "double"
  | "split"
  | "bust"
  | "blackjack"
  | "win"
  | "lose"
  | "push";

/** Dealer comments on player actions - organized by dealer personality */
export const DEALER_ACTION_COMMENTS: Record<
  DealerPersonality,
  Record<AIPersonality, Partial<Record<PlayerAction, string[]>>>
> = {
  // ========== MARIA (counter) - Sympathetic, knows the game ==========
  counter: {
    drunk: {
      hit: ["Easy does it, Danny.", "One more card coming."],
      bust: ["Happens to everyone. Especially after drinks."],
      blackjack: ["Nice one. Lucky timing."],
      win: ["Good hand, Danny."],
      lose: ["Maybe pace yourself a bit?"],
    },
    clumsy: {
      hit: ["Card coming your way, Claire. Carefully now."],
      bust: ["It's okay, Claire. Shake it off."],
      blackjack: ["Beautiful! Don't knock it over celebrating!"],
      win: ["Nicely done. Chips coming your way."],
      lose: ["Next hand, Claire. Keep your head up."],
    },
    chatty: {
      hit: ["Here you go, Carlos.", "Card for Carlos."],
      stand: ["Good decision.", "Smart play."],
      blackjack: ["There's your headline, Carlos!"],
      win: ["Something to talk about now."],
    },
    superstitious: {
      hit: ["The cards will reveal themselves, Susan."],
      stand: ["Trusting the energy. I respect that."],
      blackjack: ["Looks like the crystals paid off."],
      win: ["The universe provides, right?"],
      lose: ["Mercury must be acting up."],
    },
    cocky: {
      hit: ["Card for the legend.", "Here you go, Kyle."],
      bust: ["Even the best have off hands."],
      blackjack: ["There it is. As expected?"],
      win: ["Skill recognized.", "Good read."],
      lose: ["Variance catches up with everyone."],
    },
    nervous: {
      hit: ["Nice and easy, Nancy. You're doing fine."],
      stand: ["Smart. Trust yourself."],
      bust: ["Deep breath. It's just one hand."],
      blackjack: ["See? Nothing to worry about!"],
      win: ["You earned that. Relax a little!"],
    },
    lucky: {
      hit: ["Let's see what luck brings.", "Here comes your card."],
      blackjack: ["Of course. The streak continues!"],
      win: ["Must be nice, Larry!", "Luck loves you today."],
    },
    unlucky: {
      hit: ["Maybe this is the turnaround, Ursula."],
      bust: ["Tough break. Next one's yours."],
      blackjack: ["Finally! About time, right?"],
      win: ["Breaking the curse! Nice!"],
      lose: ["Hang in there. The math evens out."],
    },
  },

  // ========== MARCUS (friendly) - Jovial, supportive ==========
  friendly: {
    drunk: {
      hit: ["One more for Danny! Let's goooo!"],
      bust: ["Ouch! More drinks, less thinking about it!"],
      blackjack: ["BOOM! The drunk master strikes!"],
      win: ["That's what I'm talking about!"],
      lose: ["Ah, it's just chips. We're having fun!"],
    },
    clumsy: {
      hit: ["Sliding one over... carefully!", "Card for you, Claire!"],
      bust: ["No worries! Everyone busts sometimes!"],
      blackjack: ["Woohoo! That's a winner! Celebrate responsibly!"],
      win: ["Great job, Claire!"],
    },
    chatty: {
      hit: ["Another story, another card!", "Here's yours, Carlos!"],
      blackjack: ["Now THAT'S content! Blackjack!"],
      win: ["Network that win, my friend!"],
    },
    superstitious: {
      hit: ["The cards have spoken!", "One more for Susan!"],
      stand: ["Feeling it? I trust you!"],
      blackjack: ["The crystals came through!"],
      win: ["Good vibes pay off!"],
    },
    cocky: {
      hit: ["For the shark!", "One for Kyle!"],
      bust: ["Hey, even sharks miss sometimes!"],
      blackjack: ["There it is! Looking good, Kyle!"],
      win: ["Living up to the reputation!"],
    },
    nervous: {
      hit: ["You got this, Nancy! One card!"],
      stand: ["Smart call! Trust your gut!"],
      bust: ["Hey, it's all good! Just a game!"],
      blackjack: ["YES! See? Nothing to worry about!"],
      win: ["You're a natural! Relax!"],
    },
    lucky: {
      hit: ["Let's add to the legend!", "Here comes magic!"],
      blackjack: ["ANOTHER ONE?! Unbelievable!"],
      win: ["The streak is REAL!"],
    },
    unlucky: {
      hit: ["This could be the one!", "Sending good vibes!"],
      bust: ["Aw man. It'll turn around, I promise!"],
      blackjack: ["FINALLY! THE CURSE IS BROKEN!"],
      win: ["About time! You deserve this!"],
    },
  },

  // ========== HAROLD (strict) - Curt, suspicious ==========
  strict: {
    drunk: {
      hit: ["Card.", "One more. Watch your drink."],
      bust: ["Bust. Clear your bet."],
      blackjack: ["Blackjack. Pays three to two."],
      win: ["Winner. Chips coming."],
      lose: ["Loser. Next hand."],
    },
    clumsy: {
      hit: ["Card. Keep your hands clear."],
      bust: ["Bust. Don't knock anything over."],
      blackjack: ["Blackjack. Celebrate away from the layout."],
    },
    chatty: {
      hit: ["Card. Less talking, more playing."],
      stand: ["Standing. Good."],
      blackjack: ["Blackjack. Save the speech."],
    },
    superstitious: {
      hit: ["Card. No rituals, please."],
      stand: ["Standing. Let's move."],
      blackjack: ["Blackjack. Skip the ceremony."],
    },
    cocky: {
      hit: ["Card.", "One more."],
      bust: ["Bust. Happens to everyone."],
      blackjack: ["Blackjack. Quiet confidence, please."],
      lose: ["Loser. The house wins."],
    },
    nervous: {
      hit: ["Card. Decision, please.", "One more."],
      stand: ["Standing. Good choice."],
      bust: ["Bust. Next hand."],
    },
    lucky: {
      hit: ["Card.", "One more."],
      blackjack: ["Blackjack. Let's not get carried away."],
      win: ["Winner. Keep it moving."],
    },
    unlucky: {
      hit: ["Card."],
      bust: ["Bust. Next."],
      blackjack: ["Blackjack. Finally."],
    },
  },

  // ========== JENNY (rookie) - Sweet but nervous herself ==========
  rookie: {
    drunk: {
      hit: ["Um, here's your card! Is that good?"],
      bust: ["Oh no, that's a bust! Sorry!"],
      blackjack: ["Wow, blackjack! That's exciting!"],
    },
    clumsy: {
      hit: ["Here you go! *slides carefully*"],
      bust: ["Aww, bust. That's okay, I mess up too!"],
      blackjack: ["Blackjack! Oh that's so cool!"],
    },
    chatty: {
      hit: ["One card for you! Did I do that right?"],
      stand: ["Standing? Okay! Got it!"],
      blackjack: ["Blackjack! I love when that happens!"],
    },
    superstitious: {
      hit: ["Here's your card! Hope it's a good one!"],
      blackjack: ["Blackjack! Your crystals work!"],
    },
    cocky: {
      hit: ["Card for you, sir.", "Here you go..."],
      bust: ["Oh, bust. That's... um, unlucky?"],
      blackjack: ["Blackjack! You're really good!"],
    },
    nervous: {
      hit: ["Don't worry, you're doing great! Here's your card!"],
      stand: ["Good choice! I think? I'm still learning too!"],
      blackjack: ["Blackjack! See? Nothing to worry about!"],
    },
    lucky: {
      hit: ["Another card! You're so lucky!"],
      blackjack: ["AGAIN?! How do you do that?!"],
    },
    unlucky: {
      hit: ["Here you go... fingers crossed!"],
      bust: ["Oh no... I'm sorry! Maybe next time?"],
      blackjack: ["Finally! I was rooting for you!"],
    },
  },

  // ========== FRANK (oblivious) - Distracted, autopilot ==========
  oblivious: {
    drunk: {
      hit: ["Card.", "Here."],
      bust: ["Bust. Next.", "Over."],
      blackjack: ["Blackjack... nice."],
    },
    clumsy: {
      hit: ["Card.", "One more."],
      bust: ["Bust.", "That's... 22."],
    },
    chatty: {
      hit: ["Card.", "Mm-hmm."],
      stand: ["Standing. Okay."],
    },
    superstitious: {
      hit: ["Card.", "Here."],
      blackjack: ["Blackjack.", "Winners."],
    },
    cocky: {
      hit: ["Card.", "One more."],
      bust: ["Bust."],
      blackjack: ["Blackjack."],
    },
    nervous: {
      hit: ["Card.", "Here you go."],
      stand: ["Okay.", "Standing."],
    },
    lucky: {
      hit: ["Card.", "Sure."],
      blackjack: ["Blackjack again... huh."],
    },
    unlucky: {
      hit: ["Card."],
      bust: ["Bust."],
      blackjack: ["Oh, blackjack."],
    },
  },

  // ========== LISA (veteran) - Professional, measured ==========
  veteran: {
    drunk: {
      hit: ["One more for Danny.", "Card coming."],
      bust: ["Bust. Pace yourself out there."],
      blackjack: ["Blackjack. Well timed."],
      win: ["Winner. Nice hand."],
    },
    clumsy: {
      hit: ["Card for Claire.", "Here you go."],
      bust: ["Bust. Happens to the best of us."],
      blackjack: ["Blackjack, Claire. Congratulations."],
    },
    chatty: {
      hit: ["Card for Carlos.", "One more."],
      stand: ["Standing. Good read."],
      blackjack: ["Blackjack. Something to talk about."],
    },
    superstitious: {
      hit: ["Card for Susan.", "Here you go."],
      stand: ["Standing. Trust your instincts."],
      blackjack: ["Blackjack. The cards aligned."],
    },
    cocky: {
      hit: ["Card, Kyle.", "One more."],
      bust: ["Bust. It happens."],
      blackjack: ["Blackjack. Clean hand."],
      win: ["Winner. Good strategy."],
    },
    nervous: {
      hit: ["Card for Nancy. Take your time.", "One more."],
      stand: ["Standing. Smart play."],
      bust: ["Bust. Don't overthink it."],
      blackjack: ["Blackjack! See? You've got this."],
    },
    lucky: {
      hit: ["Let's see what you draw.", "Card coming."],
      blackjack: ["Another blackjack. Impressive run."],
      win: ["Winner again. Ride it while it lasts."],
    },
    unlucky: {
      hit: ["Here you go, Ursula.", "One more."],
      bust: ["Bust. The math will turn."],
      blackjack: ["Blackjack! There you go."],
      win: ["Winner. About time, right?"],
    },
  },
};

/** Dealer reactions to player quirks (personality-specific behaviors) */
export const DEALER_QUIRK_REACTIONS: Record<
  DealerPersonality,
  Record<AIPersonality, string[]>
> = {
  counter: {
    drunk: ["Take your time, Danny.", "Steady there."],
    clumsy: ["No rush, Claire. Careful with those.", "I'll wait."],
    chatty: ["Great story, Carlos. Decision when you're ready."],
    superstitious: ["Your ritual, Susan. Go ahead."],
    cocky: ["Confidence noted, Kyle.", "Bold."],
    nervous: ["You're fine, Nancy. Deep breath."],
    lucky: ["The streak is real, huh?", "Lucky charm working."],
    unlucky: ["Hang in there, Ursula.", "The turn is coming."],
  },
  friendly: {
    drunk: ["Ha! Classic Danny!", "You're killing me, Danny!"],
    clumsy: ["Whoops! No worries, we got it!", "Happens to everyone!"],
    chatty: ["Love the energy, Carlos!", "Tell me more later!"],
    superstitious: ["Whatever works, Susan!", "I believe!"],
    cocky: ["Big talk! Back it up, Kyle!", "Show me what you got!"],
    nervous: ["Relax, you're among friends!", "It's just cards!"],
    lucky: ["Must be nice! Share some luck!", "Unbelievable!"],
    unlucky: ["Your time is coming, I feel it!", "Stay positive!"],
  },
  strict: {
    drunk: ["Hands on the felt, please.", "Focus, Danny."],
    clumsy: ["Keep the area clear, please.", "Careful."],
    chatty: ["Less talking. Decision, please.", "Save it for later."],
    superstitious: ["No rituals. Let's move.", "Cards only on the layout."],
    cocky: ["Quiet confidence works better.", "Less talk."],
    nervous: ["Decision. We need to keep moving.", "Decide, please."],
    lucky: ["Everyone's luck runs out.", "Keep it moving."],
    unlucky: ["We don't need commentary.", "Next hand."],
  },
  rookie: {
    drunk: ["Um, are you okay? Should I get water?", "Ha ha, funny!"],
    clumsy: ["Oh! Let me help! No, wait, I'll make it worse!"],
    chatty: ["Wow, that's so interesting! I mean, focus, right?"],
    superstitious: ["Those crystals are pretty! What do they do?"],
    cocky: ["You're really good at this! Teach me sometime?"],
    nervous: ["Same! I get nervous too! We can be nervous together!"],
    lucky: ["How do you DO that?! Is it a trick?!"],
    unlucky: ["Aww, that's so sad! I'm rooting for you!"],
  },
  oblivious: {
    drunk: ["Hmm.", "Okay."],
    clumsy: ["...", "It's fine."],
    chatty: ["Mm-hmm.", "Uh-huh."],
    superstitious: ["Sure.", "Okay."],
    cocky: ["Right.", "Yeah."],
    nervous: ["You're fine.", "Relax."],
    lucky: ["Huh.", "Nice."],
    unlucky: ["That happens.", "Yeah."],
  },
  veteran: {
    drunk: ["Seen it before, Danny. Keep it together."],
    clumsy: ["It's fine. I'll adjust.", "No harm done."],
    chatty: ["Good stories. Save some for later."],
    superstitious: ["Your ritual, your business.", "Noted."],
    cocky: ["Confidence is good. Overconfidence, less so."],
    nervous: ["Twenty-five years, I've seen it all. Relax."],
    lucky: ["Impressive streak. Don't get attached."],
    unlucky: ["Variance. It corrects itself. Stay patient."],
  },
};

// ==============================
// Optional: Convenience APIs
// ==============================

/** Pull a random dealer-player line by category for a given character (falls back to generic). */
export function getDealerPlayerLine(
  characterId: string | "generic",
  category: keyof DealerPlayerConversationTemplate,
): string {
  const tpl =
    DEALER_PLAYER_CONVERSATIONS[characterId] ??
    DEALER_PLAYER_CONVERSATIONS.generic;
  const arr = (tpl[category] ?? []) as string[];
  return arr.length ? pick(arr) : "";
}

/** Get a dealer's comment on a specific player's action */
export function getDealerActionComment(
  dealerPersonality: DealerPersonality,
  aiPersonality: AIPersonality,
  action: PlayerAction,
): string | null {
  const dealerComments = DEALER_ACTION_COMMENTS[dealerPersonality];
  if (!dealerComments) return null;

  const playerComments = dealerComments[aiPersonality];
  if (!playerComments) return null;

  const actionComments = playerComments[action];
  if (!actionComments || actionComments.length === 0) return null;

  return pick(actionComments);
}

/** Get a dealer's reaction to a player's quirky behavior */
export function getDealerQuirkReaction(
  dealerPersonality: DealerPersonality,
  aiPersonality: AIPersonality,
): string | null {
  const reactions = DEALER_QUIRK_REACTIONS[dealerPersonality]?.[aiPersonality];
  if (!reactions || reactions.length === 0) return null;
  return pick(reactions);
}
