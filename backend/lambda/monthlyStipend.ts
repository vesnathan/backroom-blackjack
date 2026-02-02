/**
 * Monthly Stipend Lambda
 *
 * Runs daily via EventBridge to grant monthly chip stipends to eligible subscribers.
 * - SILVER: 500 chips/month
 * - GOLD: 1,500 chips/month
 * - PLATINUM: 3,000 chips/month
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { SubscriptionTier } from "@backroom-blackjack/shared";
import { TIER_BENEFITS } from "@backroom-blackjack/shared";

const TABLE_NAME = process.env.TABLE_NAME!;

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

// Days between stipend grants
const STIPEND_INTERVAL_DAYS = 30;

interface UserRecord {
  PK: string;
  SK: string;
  username: string;
  chips: number;
  subscriptionInfo?: {
    tier: SubscriptionTier;
    status: string;
    monthlyStipendGrantedAt?: string;
  };
}

interface StipendResult {
  usersProcessed: number;
  stipendsGranted: number;
  totalChipsGranted: number;
  errors: string[];
}

function daysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

async function grantStipend(
  userId: string,
  username: string,
  tier: SubscriptionTier,
  currentChips: number
): Promise<number> {
  const stipendAmount = TIER_BENEFITS[tier]?.monthlyStipend || 0;

  if (stipendAmount === 0) {
    return 0;
  }

  const now = new Date().toISOString();
  const newChips = currentChips + stipendAmount;

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `USER#${userId}` },
      UpdateExpression: `
        SET chips = :newChips,
            subscriptionInfo.monthlyStipendGrantedAt = :now,
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ":newChips": newChips,
        ":now": now,
      },
    })
  );

  console.log(
    `Granted ${stipendAmount} chips to ${username} (${tier}). New balance: ${newChips}`
  );

  return stipendAmount;
}

async function scanEligibleUsers(): Promise<UserRecord[]> {
  const eligibleUsers: UserRecord[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression:
          "begins_with(PK, :userPrefix) AND SK = PK AND " +
          "subscriptionInfo.tier IN (:silver, :gold, :platinum) AND " +
          "subscriptionInfo.#st = :active",
        ExpressionAttributeNames: {
          "#st": "status",
        },
        ExpressionAttributeValues: {
          ":userPrefix": "USER#",
          ":silver": "SILVER",
          ":gold": "GOLD",
          ":platinum": "PLATINUM",
          ":active": "active",
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    if (result.Items) {
      eligibleUsers.push(...(result.Items as UserRecord[]));
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return eligibleUsers;
}

export async function handler(): Promise<StipendResult> {
  console.log("Starting monthly stipend processing");

  const result: StipendResult = {
    usersProcessed: 0,
    stipendsGranted: 0,
    totalChipsGranted: 0,
    errors: [],
  };

  try {
    const eligibleUsers = await scanEligibleUsers();
    console.log(`Found ${eligibleUsers.length} eligible users`);

    for (const user of eligibleUsers) {
      result.usersProcessed++;

      try {
        const userId = user.PK.replace("USER#", "");
        const tier = user.subscriptionInfo?.tier;
        const lastGranted = user.subscriptionInfo?.monthlyStipendGrantedAt;

        if (!tier) {
          continue;
        }

        // Check if enough time has passed since last grant
        if (lastGranted && daysSince(lastGranted) < STIPEND_INTERVAL_DAYS) {
          console.log(
            `Skipping ${user.username}: Only ${daysSince(lastGranted)} days since last stipend`
          );
          continue;
        }

        const chipsGranted = await grantStipend(
          userId,
          user.username,
          tier,
          user.chips
        );

        if (chipsGranted > 0) {
          result.stipendsGranted++;
          result.totalChipsGranted += chipsGranted;
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`User ${user.username}: ${errorMsg}`);
        console.error(`Error processing user ${user.username}:`, error);
      }
    }

    console.log(
      `Monthly stipend complete: ${result.stipendsGranted} stipends granted, ${result.totalChipsGranted} total chips`
    );

    return result;
  } catch (error) {
    console.error("Error in monthly stipend processing:", error);
    throw error;
  }
}
