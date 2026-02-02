import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";

interface Args {
  limit?: number;
  nextToken?: string;
  startDate?: string;
  endDate?: string;
  numberOfDecks?: number;
  minTrueCount?: number;
  maxTrueCount?: number;
}

interface QueryResult {
  items?: Array<Record<string, unknown>>;
  nextToken?: string;
}

type CTX = Context<Args, object, object, object, QueryResult>;

export function request(ctx: CTX) {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity?.sub;

  if (!userId) {
    return util.error("Unauthorized: No user ID found", "UnauthorizedException");
  }

  const {
    limit = 50,
    nextToken,
    startDate,
    endDate,
    numberOfDecks,
    minTrueCount,
    maxTrueCount,
  } = ctx.args;

  // Build key condition expression
  let keyExpression = "PK = :pk AND begins_with(SK, :handPrefix)";
  const expressionValues: Record<string, unknown> = {
    ":pk": `USER#${userId}`,
    ":handPrefix": "HAND#",
  };

  // Date range filtering via SK (since SK includes timestamp)
  if (startDate && endDate) {
    keyExpression = "PK = :pk AND SK BETWEEN :startSk AND :endSk";
    expressionValues[":startSk"] = `HAND#${startDate}`;
    expressionValues[":endSk"] = `HAND#${endDate}Z`;
  } else if (startDate) {
    keyExpression = "PK = :pk AND SK >= :startSk";
    expressionValues[":startSk"] = `HAND#${startDate}`;
  } else if (endDate) {
    keyExpression = "PK = :pk AND SK BETWEEN :handPrefix AND :endSk";
    expressionValues[":endSk"] = `HAND#${endDate}Z`;
  }

  // Build filter expression for additional filters
  const filterParts: string[] = [];

  if (numberOfDecks !== undefined && numberOfDecks !== null) {
    filterParts.push("numberOfDecks = :numberOfDecks");
    expressionValues[":numberOfDecks"] = numberOfDecks;
  }

  if (minTrueCount !== undefined && minTrueCount !== null) {
    filterParts.push("trueCount >= :minTrueCount");
    expressionValues[":minTrueCount"] = minTrueCount;
  }

  if (maxTrueCount !== undefined && maxTrueCount !== null) {
    filterParts.push("trueCount <= :maxTrueCount");
    expressionValues[":maxTrueCount"] = maxTrueCount;
  }

  const queryParams: Record<string, unknown> = {
    operation: "Query",
    query: {
      expression: keyExpression,
      expressionValues: util.dynamodb.toMapValues(expressionValues),
    },
    scanIndexForward: false, // Newest first
    limit: limit > 100 ? 100 : limit,
  };

  if (filterParts.length > 0) {
    const filterExpression = filterParts.join(" AND ");
    queryParams.filter = {
      expression: filterExpression,
      expressionValues: util.dynamodb.toMapValues(expressionValues),
    };
  }

  if (nextToken) {
    queryParams.nextToken = nextToken;
  }

  return queryParams;
}

export function response(ctx: CTX) {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }

  const items = ctx.result?.items || [];
  const hands: Array<Record<string, unknown>> = [];

  for (const item of items) {
    // Transform playerHands array
    const playerHands: string[][] = [];
    if (item.playerHands) {
      for (const hand of item.playerHands as string[][]) {
        playerHands.push(hand);
      }
    }

    // Transform other arrays
    const playerFinalValues: number[] = [];
    if (item.playerFinalValues) {
      for (const val of item.playerFinalValues as number[]) {
        playerFinalValues.push(+(val || 0));
      }
    }

    const results: string[] = [];
    if (item.results) {
      for (const r of item.results as string[]) {
        results.push(r);
      }
    }

    const bets: number[] = [];
    if (item.bets) {
      for (const b of item.bets as number[]) {
        bets.push(+(b || 0));
      }
    }

    const profits: number[] = [];
    if (item.profits) {
      for (const p of item.profits as number[]) {
        profits.push(+(p || 0));
      }
    }

    const dealerFinalCards: string[] = [];
    if (item.dealerFinalCards) {
      for (const c of item.dealerFinalCards as string[]) {
        dealerFinalCards.push(c);
      }
    }

    const actions: string[] = [];
    if (item.actions) {
      for (const a of item.actions as string[]) {
        actions.push(a);
      }
    }

    const correctActions: string[] = [];
    if (item.correctActions) {
      for (const ca of item.correctActions as string[]) {
        correctActions.push(ca);
      }
    }

    hands.push({
      __typename: "HandRecord",
      id: item.id || "",
      oduserId: item.oduserId || "",
      sessionId: item.sessionId || "",
      timestamp: item.timestamp || "",
      numberOfDecks: +(item.numberOfDecks || 0),
      countingSystem: item.countingSystem || "",
      dealerHitsSoft17: item.dealerHitsSoft17 === true,
      blackjackPayout: item.blackjackPayout || "",
      trueCount: +(item.trueCount || 0),
      runningCount: +(item.runningCount || 0),
      decksRemaining: +(item.decksRemaining || 0),
      dealerUpCard: item.dealerUpCard || "",
      dealerFinalCards: dealerFinalCards,
      dealerFinalValue: +(item.dealerFinalValue || 0),
      playerHands: playerHands,
      playerFinalValues: playerFinalValues,
      results: results,
      bets: bets,
      profits: profits,
      actions: actions,
      correctActions: correctActions,
      totalBet: +(item.totalBet || 0),
      totalProfit: +(item.totalProfit || 0),
      wasCorrectPlay: item.wasCorrectPlay === true,
      createdAt: item.createdAt || "",
    });
  }

  return {
    __typename: "HandHistoryResponse",
    hands: hands,
    nextToken: ctx.result?.nextToken || null,
  };
}
