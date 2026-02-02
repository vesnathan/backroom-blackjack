import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";

interface RecordHandInput {
  sessionId: string;
  numberOfDecks: number;
  countingSystem: string;
  dealerHitsSoft17: boolean;
  blackjackPayout: string;
  trueCount: number;
  runningCount: number;
  decksRemaining: number;
  dealerUpCard: string;
  dealerFinalCards: string[];
  dealerFinalValue: number;
  playerHands: string[][];
  playerFinalValues: number[];
  results: string[];
  bets: number[];
  profits: number[];
  actions: string[];
  correctActions: string[];
  totalBet: number;
  totalProfit: number;
  wasCorrectPlay: boolean;
}

interface Args {
  input: RecordHandInput;
}

type CTX = Context<Args>;

export function request(ctx: CTX) {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity?.sub;

  if (!userId) {
    return util.error("Unauthorized: No user ID found", "UnauthorizedException");
  }

  const input = ctx.args.input;
  const handId = util.autoId();
  const now = util.time.nowISO8601();

  // Count results for stats update (no inline functions allowed)
  let handsWon = 0;
  let handsLost = 0;
  let pushes = 0;
  let blackjacks = 0;

  for (const result of input.results) {
    if (result === "WIN") {
      handsWon = handsWon + 1;
    } else if (result === "LOSE" || result === "BUST") {
      handsLost = handsLost + 1;
    } else if (result === "PUSH") {
      pushes = pushes + 1;
    } else if (result === "BLACKJACK") {
      blackjacks = blackjacks + 1;
      handsWon = handsWon + 1; // Blackjack is also a win
    }
  }

  // Total hands = number of results (accounts for splits)
  const handsPlayed = input.results.length;

  // Store hand record
  // PK: USER#{userId}, SK: HAND#{timestamp}#{handId}
  const handItem = {
    PK: `USER#${userId}`,
    SK: `HAND#${now}#${handId}`,
    id: handId,
    userId: userId,
    sessionId: input.sessionId,
    timestamp: now,
    numberOfDecks: input.numberOfDecks,
    countingSystem: input.countingSystem,
    dealerHitsSoft17: input.dealerHitsSoft17,
    blackjackPayout: input.blackjackPayout,
    trueCount: input.trueCount,
    runningCount: input.runningCount,
    decksRemaining: input.decksRemaining,
    dealerUpCard: input.dealerUpCard,
    dealerFinalCards: input.dealerFinalCards,
    dealerFinalValue: input.dealerFinalValue,
    playerHands: input.playerHands,
    playerFinalValues: input.playerFinalValues,
    results: input.results,
    bets: input.bets,
    profits: input.profits,
    actions: input.actions,
    correctActions: input.correctActions,
    totalBet: input.totalBet,
    totalProfit: input.totalProfit,
    wasCorrectPlay: input.wasCorrectPlay,
    createdAt: now,
  };

  // Store in context for response
  ctx.stash.handItem = handItem;
  ctx.stash.userId = userId;

  // Use TransactWriteItems to atomically:
  // 1. Put the hand record
  // 2. Update user stats
  return {
    operation: "TransactWriteItems",
    transactItems: [
      // Put hand record
      {
        table: ctx.env.TABLE_NAME,
        operation: "PutItem",
        key: util.dynamodb.toMapValues({
          PK: handItem.PK,
          SK: handItem.SK,
        }),
        attributeValues: util.dynamodb.toMapValues(handItem),
      },
      // Update user stats
      {
        table: ctx.env.TABLE_NAME,
        operation: "UpdateItem",
        key: util.dynamodb.toMapValues({
          PK: `USER#${userId}`,
          SK: `USER#${userId}`,
        }),
        update: {
          expression:
            "SET #stats.#thp = if_not_exists(#stats.#thp, :zero) + :handsPlayed, " +
            "#stats.#thw = if_not_exists(#stats.#thw, :zero) + :handsWon, " +
            "#stats.#thl = if_not_exists(#stats.#thl, :zero) + :handsLost, " +
            "#stats.#tp = if_not_exists(#stats.#tp, :zero) + :pushes, " +
            "#stats.#tbj = if_not_exists(#stats.#tbj, :zero) + :blackjacks, " +
            "#stats.#tw = if_not_exists(#stats.#tw, :zero) + :totalWagered, " +
            "#stats.#tpr = if_not_exists(#stats.#tpr, :zero) + :totalProfit, " +
            "#stats.#lpa = :lastPlayedAt, " +
            "#updatedAt = :updatedAt",
          expressionNames: {
            "#stats": "stats",
            "#thp": "totalHandsPlayed",
            "#thw": "totalHandsWon",
            "#thl": "totalHandsLost",
            "#tp": "totalPushes",
            "#tbj": "totalBlackjacks",
            "#tw": "totalWagered",
            "#tpr": "totalProfit",
            "#lpa": "lastPlayedAt",
            "#updatedAt": "updatedAt",
          },
          expressionValues: util.dynamodb.toMapValues({
            ":zero": 0,
            ":handsPlayed": handsPlayed,
            ":handsWon": handsWon,
            ":handsLost": handsLost,
            ":pushes": pushes,
            ":blackjacks": blackjacks,
            ":totalWagered": input.totalBet,
            ":totalProfit": input.totalProfit,
            ":lastPlayedAt": now,
            ":updatedAt": now,
          }),
        },
      },
    ],
  };
}

export function response(ctx: CTX) {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }

  // TransactWriteItems doesn't return items, use stashed data
  const handItem = ctx.stash.handItem as Record<string, unknown>;

  return {
    __typename: "HandRecord",
    id: handItem.id,
    userId: handItem.userId,
    sessionId: handItem.sessionId,
    timestamp: handItem.timestamp,
    numberOfDecks: handItem.numberOfDecks,
    countingSystem: handItem.countingSystem,
    dealerHitsSoft17: handItem.dealerHitsSoft17,
    blackjackPayout: handItem.blackjackPayout,
    trueCount: handItem.trueCount,
    runningCount: handItem.runningCount,
    decksRemaining: handItem.decksRemaining,
    dealerUpCard: handItem.dealerUpCard,
    dealerFinalCards: handItem.dealerFinalCards,
    dealerFinalValue: handItem.dealerFinalValue,
    playerHands: handItem.playerHands,
    playerFinalValues: handItem.playerFinalValues,
    results: handItem.results,
    bets: handItem.bets,
    profits: handItem.profits,
    actions: handItem.actions,
    correctActions: handItem.correctActions,
    totalBet: handItem.totalBet,
    totalProfit: handItem.totalProfit,
    wasCorrectPlay: handItem.wasCorrectPlay,
    createdAt: handItem.createdAt,
  };
}
