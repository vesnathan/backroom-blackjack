import { util, Context } from "@aws-appsync/utils";
import { SupportersResponse, Supporter, SubscriptionTier } from "gqlTypes";

// Define supporter data type outside the function
interface SupporterData {
  userId: string;
  username: string;
  tier: SubscriptionTier;
  earlyAdopter: boolean;
  subscribedSince: string | null;
}

// DynamoDB user item structure
interface UserItem {
  PK: string;
  SK: string;
  username?: string;
  subscriptionInfo?: {
    tier?: SubscriptionTier;
    status?: string;
    subscribedSince?: string;
    startedAt?: string;
  };
  earlyAdopter?: boolean;
}

// DynamoDB scan result
interface DynamoDBScanResult {
  items: UserItem[];
}

type CTX = Context<object, object, object, object, DynamoDBScanResult>;

export function request(ctx: CTX) {
  return {
    operation: "Scan",
    filter: {
      expression: "begins_with(PK, :userPrefix)",
      expressionValues: util.dynamodb.toMapValues({
        ":userPrefix": "USER#",
      }),
    },
    limit: 1000,
  };
}

export function response(ctx: CTX): SupportersResponse {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }

  const items = ctx.result?.items || [];

  // Collect supporters by tier
  const platinumList: SupporterData[] = [];
  const goldList: SupporterData[] = [];
  const silverList: SupporterData[] = [];
  const bronzeList: SupporterData[] = [];

  for (const item of items) {
    if (item && item.subscriptionInfo) {
      const tier = item.subscriptionInfo.tier;
      const status = item.subscriptionInfo.status;

      // Only include active subscribers (skip NONE tier and inactive)
      if (tier && tier !== "NONE" && (!status || status === "active")) {
        const userId = item.PK ? item.PK.replace("USER#", "") : "";
        const supporterData: SupporterData = {
          userId: userId,
          username: item.username || "Supporter",
          tier: tier as SubscriptionTier,
          earlyAdopter: item.earlyAdopter || false,
          subscribedSince: item.subscriptionInfo.startedAt || null,
        };

        if (tier === "PLATINUM") {
          platinumList.push(supporterData);
        } else if (tier === "GOLD") {
          goldList.push(supporterData);
        } else if (tier === "SILVER") {
          silverList.push(supporterData);
        } else if (tier === "BRONZE") {
          bronzeList.push(supporterData);
        }
      }
    }
  }

  // Sort each tier by subscribedSince (oldest first - long-time supporters get prominence)
  const sortByDate = (list: SupporterData[]): SupporterData[] => {
    // Simple selection sort for oldest first
    const sorted: SupporterData[] = [];
    const used: Record<string, boolean> = {};

    for (const _item of list) {
      let oldestDate: string | null = null;
      let oldestIndex = -1;
      let currentIndex = 0;

      for (const entry of list) {
        const indexKey = `${currentIndex}`;
        if (!used[indexKey]) {
          const entryDate = entry.subscribedSince || "9999-99-99";
          if (oldestDate === null || entryDate < oldestDate) {
            oldestDate = entryDate;
            oldestIndex = currentIndex;
          }
        }
        currentIndex = currentIndex + 1;
      }

      if (oldestIndex >= 0) {
        let idx = 0;
        for (const entry of list) {
          if (idx === oldestIndex) {
            sorted.push(entry);
            used[`${oldestIndex}`] = true;
          }
          idx = idx + 1;
        }
      }
    }
    return sorted;
  };

  const sortedPlatinum = sortByDate(platinumList);
  const sortedGold = sortByDate(goldList);
  const sortedSilver = sortByDate(silverList);
  const sortedBronze = sortByDate(bronzeList);

  // Convert to Supporter type
  const toSupporter = (data: SupporterData): Supporter => {
    return {
      __typename: "Supporter",
      userId: data.userId,
      username: data.username,
      tier: data.tier,
      earlyAdopter: data.earlyAdopter,
      subscribedSince: data.subscribedSince,
    };
  };

  const platinum: Supporter[] = [];
  const gold: Supporter[] = [];
  const silver: Supporter[] = [];
  const bronze: Supporter[] = [];

  for (const s of sortedPlatinum) {
    platinum.push(toSupporter(s));
  }
  for (const s of sortedGold) {
    gold.push(toSupporter(s));
  }
  for (const s of sortedSilver) {
    silver.push(toSupporter(s));
  }
  for (const s of sortedBronze) {
    bronze.push(toSupporter(s));
  }

  const totalCount = platinum.length + gold.length + silver.length + bronze.length;

  return {
    __typename: "SupportersResponse",
    platinum: platinum,
    gold: gold,
    silver: silver,
    bronze: bronze,
    totalCount: totalCount,
  };
}
