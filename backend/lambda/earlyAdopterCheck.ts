/**
 * Early Adopter Check Lambda
 *
 * Runs daily via EventBridge to check if PLATINUM users have qualified
 * for early adopter status (12 consecutive months as PLATINUM).
 *
 * Early adopters get lifetime unlimited chips.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { EARLY_ADOPTER_REQUIREMENTS } from "@backroom-blackjack/shared";

const TABLE_NAME = process.env.TABLE_NAME!;

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

interface UserRecord {
  PK: string;
  SK: string;
  username: string;
  email: string;
  chips: number;
  earlyAdopter: boolean;
  subscriptionInfo?: {
    tier: string;
    status: string;
    platinumSince?: string;
  };
}

interface CheckResult {
  usersProcessed: number;
  newEarlyAdopters: number;
  chipRefills: number;
  errors: string[];
}

function monthsSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();

  const years = now.getFullYear() - date.getFullYear();
  const months = now.getMonth() - date.getMonth();

  return years * 12 + months;
}

async function markAsEarlyAdopter(
  userId: string,
  username: string
): Promise<void> {
  const now = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `USER#${userId}` },
      UpdateExpression: `
        SET earlyAdopter = :true,
            earlyAdopterQualifiedAt = :now,
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ":true": true,
        ":now": now,
      },
    })
  );

  console.log(`User ${username} qualified as Early Adopter!`);
}

async function refillChips(
  userId: string,
  username: string,
  currentChips: number
): Promise<boolean> {
  const { chipRefillThreshold, chipRefillAmount } = EARLY_ADOPTER_REQUIREMENTS;

  if (currentChips >= chipRefillThreshold) {
    return false;
  }

  const now = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `USER#${userId}` },
      UpdateExpression: `
        SET chips = :refillAmount,
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ":refillAmount": chipRefillAmount,
        ":now": now,
      },
    })
  );

  console.log(
    `Refilled chips for early adopter ${username}: ${currentChips} -> ${chipRefillAmount}`
  );

  return true;
}

async function scanPlatinumUsers(): Promise<UserRecord[]> {
  const users: UserRecord[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression:
          "begins_with(PK, :userPrefix) AND SK = PK AND " +
          "subscriptionInfo.tier = :platinum AND " +
          "subscriptionInfo.#st = :active",
        ExpressionAttributeNames: {
          "#st": "status",
        },
        ExpressionAttributeValues: {
          ":userPrefix": "USER#",
          ":platinum": "PLATINUM",
          ":active": "active",
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    if (result.Items) {
      users.push(...(result.Items as UserRecord[]));
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return users;
}

async function scanEarlyAdopters(): Promise<UserRecord[]> {
  const users: UserRecord[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression:
          "begins_with(PK, :userPrefix) AND SK = PK AND earlyAdopter = :true",
        ExpressionAttributeValues: {
          ":userPrefix": "USER#",
          ":true": true,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    if (result.Items) {
      users.push(...(result.Items as UserRecord[]));
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return users;
}

export async function handler(): Promise<CheckResult> {
  console.log("Starting early adopter qualification check");

  const result: CheckResult = {
    usersProcessed: 0,
    newEarlyAdopters: 0,
    chipRefills: 0,
    errors: [],
  };

  try {
    // Check PLATINUM users for early adopter qualification
    const platinumUsers = await scanPlatinumUsers();
    console.log(`Found ${platinumUsers.length} active PLATINUM users`);

    for (const user of platinumUsers) {
      result.usersProcessed++;

      try {
        const userId = user.PK.replace("USER#", "");

        // Skip if already an early adopter
        if (user.earlyAdopter) {
          continue;
        }

        const platinumSince = user.subscriptionInfo?.platinumSince;
        if (!platinumSince) {
          console.log(`User ${user.username} has no platinumSince date`);
          continue;
        }

        const monthsAsPlatinum = monthsSince(platinumSince);
        console.log(
          `User ${user.username} has been PLATINUM for ${monthsAsPlatinum} months`
        );

        if (monthsAsPlatinum >= EARLY_ADOPTER_REQUIREMENTS.requiredMonths) {
          await markAsEarlyAdopter(userId, user.username);
          result.newEarlyAdopters++;
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`User ${user.username}: ${errorMsg}`);
        console.error(`Error processing user ${user.username}:`, error);
      }
    }

    // Refill chips for all early adopters
    const earlyAdopters = await scanEarlyAdopters();
    console.log(`Found ${earlyAdopters.length} early adopters for chip refill check`);

    for (const user of earlyAdopters) {
      try {
        const userId = user.PK.replace("USER#", "");
        const didRefill = await refillChips(userId, user.username, user.chips);

        if (didRefill) {
          result.chipRefills++;
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`Refill for ${user.username}: ${errorMsg}`);
        console.error(`Error refilling chips for ${user.username}:`, error);
      }
    }

    console.log(
      `Early adopter check complete: ${result.newEarlyAdopters} new qualifications, ${result.chipRefills} refills`
    );

    return result;
  } catch (error) {
    console.error("Error in early adopter check:", error);
    throw error;
  }
}
