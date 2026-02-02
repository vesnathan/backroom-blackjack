import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  QueryCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import crypto from "crypto";
import {
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATUSES,
  type SubscriptionTier,
  type SubscriptionStatus,
} from "@backroom-blackjack/shared";

const TABLE_NAME = process.env.TABLE_NAME!;
const SECRETS_ARN = process.env.STRIPE_SECRETS_ARN!;

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});
const secretsClient = new SecretsManagerClient({});

// Cache secrets for Lambda warm starts
let cachedSecrets: StripeSecrets | null = null;

interface StripeSecrets {
  webhookSecret: string;
  secretKey: string;
  priceIdBronze: string;
  priceIdSilver: string;
  priceIdGold: string;
  priceIdPlatinum: string;
}

interface APIGatewayEvent {
  headers: Record<string, string | undefined>;
  body: string;
  isBase64Encoded?: boolean;
}

interface APIGatewayResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

// Stripe Event Types
interface StripeCheckoutSession {
  id: string;
  customer: string;
  subscription: string;
  mode?: "subscription" | "payment";
  metadata?: {
    userId?: string;
    tier?: string;
    type?: string;
    packageId?: string;
    baseChips?: string;
    bonusChips?: string;
    totalChips?: string;
    userTier?: string;
  };
}

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_end?: number;
  items?: {
    data?: Array<{
      price?: {
        id: string;
      };
    }>;
  };
}

interface StripeInvoice {
  id: string;
  customer: string;
  subscription?: string;
}

interface StripeCheckoutEvent {
  id: string;
  type: "checkout.session.completed";
  data: {
    object: StripeCheckoutSession;
  };
}

interface StripeSubscriptionEvent {
  id: string;
  type:
    | "customer.subscription.created"
    | "customer.subscription.updated"
    | "customer.subscription.deleted";
  data: {
    object: StripeSubscription;
  };
}

interface StripeInvoiceEvent {
  id: string;
  type: "invoice.payment_failed";
  data: {
    object: StripeInvoice;
  };
}

// Stripe subscription status mapping
const STRIPE_STATUS_MAP: Record<string, SubscriptionStatus | null> = {
  active: SUBSCRIPTION_STATUSES.ACTIVE,
  trialing: SUBSCRIPTION_STATUSES.TRIALING,
  past_due: SUBSCRIPTION_STATUSES.PAST_DUE,
  canceled: SUBSCRIPTION_STATUSES.CANCELLED,
  unpaid: SUBSCRIPTION_STATUSES.CANCELLED,
  incomplete: null,
  incomplete_expired: null,
};

async function getSecrets(): Promise<StripeSecrets> {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: SECRETS_ARN })
  );

  if (!response.SecretString) {
    throw new Error("Stripe secrets not found");
  }

  cachedSecrets = JSON.parse(response.SecretString);
  return cachedSecrets!;
}

function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Stripe signature format: t=timestamp,v1=signature
  const elements = signature.split(",");
  const timestampElement = elements.find((e) => e.startsWith("t="));
  const signatureElement = elements.find((e) => e.startsWith("v1="));

  if (!timestampElement || !signatureElement) {
    console.error("Invalid signature format");
    return false;
  }

  const timestamp = timestampElement.substring(2);
  const expectedSignature = signatureElement.substring(3);

  // Create signed payload
  const signedPayload = `${timestamp}.${payload}`;
  const computedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(computedSignature)
    );
  } catch {
    return false;
  }
}

async function getTierFromPriceId(priceId: string): Promise<SubscriptionTier> {
  const secrets = await getSecrets();

  if (priceId === secrets.priceIdBronze) return SUBSCRIPTION_TIERS.BRONZE;
  if (priceId === secrets.priceIdSilver) return SUBSCRIPTION_TIERS.SILVER;
  if (priceId === secrets.priceIdGold) return SUBSCRIPTION_TIERS.GOLD;
  if (priceId === secrets.priceIdPlatinum) return SUBSCRIPTION_TIERS.PLATINUM;

  // Fallback: check price ID naming convention
  const lowerPriceId = priceId.toLowerCase();
  if (lowerPriceId.includes("bronze")) return SUBSCRIPTION_TIERS.BRONZE;
  if (lowerPriceId.includes("silver")) return SUBSCRIPTION_TIERS.SILVER;
  if (lowerPriceId.includes("gold")) return SUBSCRIPTION_TIERS.GOLD;
  if (lowerPriceId.includes("platinum")) return SUBSCRIPTION_TIERS.PLATINUM;

  console.warn(`Unknown price ID: ${priceId}, defaulting to BRONZE`);
  return SUBSCRIPTION_TIERS.BRONZE;
}

async function findUserByStripeCustomerId(
  customerId: string
): Promise<string | null> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `STRIPE#${customerId}`,
        },
        Limit: 1,
      })
    );

    if (result.Items && result.Items.length > 0) {
      // Extract userId from PK (format: USER#userId)
      const pk = result.Items[0].PK as string;
      return pk.replace("USER#", "");
    }

    return null;
  } catch (error) {
    console.error("Error finding user by Stripe customer ID:", error);
    return null;
  }
}

async function updateUserSubscription(
  userId: string,
  subscriptionId: string,
  customerId: string,
  tier: SubscriptionTier,
  status: SubscriptionStatus | null,
  currentPeriodEnd?: number
): Promise<void> {
  const now = new Date().toISOString();
  const expiresAt = currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000).toISOString()
    : null;

  // Build update expression based on whether this is PLATINUM (track platinumSince)
  let updateExpression = `
    SET subscriptionInfo.tier = :tier,
        subscriptionInfo.#st = :status,
        subscriptionInfo.provider = :provider,
        subscriptionInfo.subscriptionId = :subId,
        subscriptionInfo.customerId = :custId,
        subscriptionInfo.startedAt = if_not_exists(subscriptionInfo.startedAt, :now),
        subscriptionInfo.expiresAt = :expiresAt,
        GSI2PK = :gsi2pk,
        GSI2SK = :gsi2sk,
        updatedAt = :now
  `;

  const expressionAttributeValues: Record<string, unknown> = {
    ":tier": tier,
    ":status": status,
    ":provider": "STRIPE",
    ":subId": subscriptionId,
    ":custId": customerId,
    ":now": now,
    ":expiresAt": expiresAt,
    ":gsi2pk": `STRIPE#${customerId}`,
    ":gsi2sk": `CUSTOMER`,
  };

  // Track when user first becomes PLATINUM for early adopter tracking
  if (tier === SUBSCRIPTION_TIERS.PLATINUM) {
    updateExpression += `, subscriptionInfo.platinumSince = if_not_exists(subscriptionInfo.platinumSince, :now)`;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `USER#${userId}` },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: {
        "#st": "status",
      },
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );

  console.log(
    `Updated subscription for user ${userId}: tier=${tier}, status=${status}`
  );
}

async function handleChipPurchase(
  session: StripeCheckoutSession
): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("No userId in chip purchase metadata");
    return;
  }

  const totalChipsStr = session.metadata?.totalChips;
  if (!totalChipsStr) {
    console.error("No totalChips in chip purchase metadata");
    return;
  }

  const totalChips = parseInt(totalChipsStr, 10);
  if (isNaN(totalChips) || totalChips <= 0) {
    console.error(`Invalid totalChips value: ${totalChipsStr}`);
    return;
  }

  const now = new Date().toISOString();
  const packageId = session.metadata?.packageId || "unknown";
  const baseChips = parseInt(session.metadata?.baseChips || "0", 10);
  const bonusChips = parseInt(session.metadata?.bonusChips || "0", 10);

  // Update user's chip balance
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `USER#${userId}` },
      UpdateExpression: `
        SET chips = chips + :chips,
            totalChipsPurchased = if_not_exists(totalChipsPurchased, :zero) + :chips,
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ":chips": totalChips,
        ":zero": 0,
        ":now": now,
      },
    })
  );

  // Log the transaction
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: `CHIP_PURCHASE#${now}#${session.id}`,
        GSI1PK: `CHIP_PURCHASE`,
        GSI1SK: now,
        sessionId: session.id,
        packageId,
        baseChips,
        bonusChips,
        totalChips,
        createdAt: now,
      },
    })
  );

  console.log(
    `Chip purchase completed for user ${userId}: ${totalChips} chips (base: ${baseChips}, bonus: ${bonusChips})`
  );
}

async function handleCheckoutCompleted(
  event: StripeCheckoutEvent
): Promise<void> {
  const session = event.data.object;

  // Check if this is a chip purchase (one-time payment)
  if (session.metadata?.type === "chip_purchase") {
    await handleChipPurchase(session);
    return;
  }

  // Get the user ID from metadata (set during checkout creation)
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("No userId in checkout session metadata");
    return;
  }

  const customerId = session.customer;
  const subscriptionId = session.subscription;

  // Get tier from metadata (tier is stored as string enum value like "BRONZE")
  const tierFromMetadata = session.metadata?.tier;
  const tier: SubscriptionTier = (
    tierFromMetadata === SUBSCRIPTION_TIERS.BRONZE ||
    tierFromMetadata === SUBSCRIPTION_TIERS.SILVER ||
    tierFromMetadata === SUBSCRIPTION_TIERS.GOLD ||
    tierFromMetadata === SUBSCRIPTION_TIERS.PLATINUM
  ) ? tierFromMetadata : SUBSCRIPTION_TIERS.BRONZE;

  await updateUserSubscription(
    userId,
    subscriptionId,
    customerId,
    tier,
    SUBSCRIPTION_STATUSES.ACTIVE
  );

  console.log(`Checkout completed for user ${userId}, tier ${tier}`);
}

async function handleSubscriptionCreated(
  event: StripeSubscriptionEvent
): Promise<void> {
  const subscription = event.data.object;
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = STRIPE_STATUS_MAP[subscription.status] || null;

  // Get tier from first price item
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const tier = priceId ? await getTierFromPriceId(priceId) : SUBSCRIPTION_TIERS.BRONZE;

  // Find user by customer ID
  const userId = await findUserByStripeCustomerId(customerId);
  if (!userId) {
    console.log(
      `No user found for Stripe customer ${customerId} - may be handled by checkout.session.completed`
    );
    return;
  }

  await updateUserSubscription(
    userId,
    subscriptionId,
    customerId,
    tier,
    status,
    subscription.current_period_end
  );
}

async function handleSubscriptionUpdated(
  event: StripeSubscriptionEvent
): Promise<void> {
  const subscription = event.data.object;
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = STRIPE_STATUS_MAP[subscription.status] || null;

  // Get tier from first price item
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const tier = priceId ? await getTierFromPriceId(priceId) : SUBSCRIPTION_TIERS.BRONZE;

  const userId = await findUserByStripeCustomerId(customerId);
  if (!userId) {
    console.error(`No user found for Stripe customer ${customerId}`);
    return;
  }

  await updateUserSubscription(
    userId,
    subscriptionId,
    customerId,
    tier,
    status,
    subscription.current_period_end
  );

  console.log(
    `Subscription updated for user ${userId}: tier=${tier}, status=${status}`
  );
}

async function handleSubscriptionDeleted(
  event: StripeSubscriptionEvent
): Promise<void> {
  const subscription = event.data.object;
  const customerId = subscription.customer;

  const userId = await findUserByStripeCustomerId(customerId);
  if (!userId) {
    console.error(`No user found for Stripe customer ${customerId}`);
    return;
  }

  const now = new Date().toISOString();

  // Set tier to NONE (free) and mark as cancelled
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `USER#${userId}` },
      UpdateExpression: `
        SET subscriptionInfo.tier = :tier,
            subscriptionInfo.#st = :status,
            subscriptionInfo.cancelledAt = :now,
            updatedAt = :now
      `,
      ExpressionAttributeNames: {
        "#st": "status",
      },
      ExpressionAttributeValues: {
        ":tier": SUBSCRIPTION_TIERS.NONE,
        ":status": SUBSCRIPTION_STATUSES.CANCELLED,
        ":now": now,
      },
    })
  );

  console.log(`Subscription cancelled for user ${userId}`);
}

async function handlePaymentFailed(event: StripeInvoiceEvent): Promise<void> {
  const invoice = event.data.object;
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    // Not a subscription payment
    return;
  }

  const userId = await findUserByStripeCustomerId(customerId);
  if (!userId) {
    console.error(`No user found for Stripe customer ${customerId}`);
    return;
  }

  const now = new Date().toISOString();

  // Mark subscription as past_due
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `USER#${userId}` },
      UpdateExpression: `
        SET subscriptionInfo.#st = :status,
            updatedAt = :now
      `,
      ExpressionAttributeNames: {
        "#st": "status",
      },
      ExpressionAttributeValues: {
        ":status": SUBSCRIPTION_STATUSES.PAST_DUE,
        ":now": now,
      },
    })
  );

  console.log(`Payment failed for user ${userId}, marked as past_due`);
}

/**
 * Extract email from Stripe event payload
 */
function extractEmailFromStripeEvent(
  event: Record<string, unknown>
): string | undefined {
  const data = event.data as { object?: Record<string, unknown> } | undefined;
  const obj = data?.object;
  if (!obj) return undefined;

  if (typeof obj.customer_email === "string") {
    return obj.customer_email;
  }

  const customerDetails = obj.customer_details as { email?: string } | undefined;
  if (customerDetails?.email) {
    return customerDetails.email;
  }

  if (typeof obj.receipt_email === "string") {
    return obj.receipt_email;
  }

  return undefined;
}

async function logWebhookEvent(
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>,
  status: "received" | "processed" | "error",
  errorMessage?: string
): Promise<void> {
  const now = new Date();
  const timestamp = now.toISOString();

  const email = extractEmailFromStripeEvent(payload);

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: "WEBHOOK_LOG",
          SK: `STRIPE#${timestamp}#${eventId}`,
          GSI1PK: "WEBHOOK_LOG#STRIPE",
          GSI1SK: timestamp,
          provider: "STRIPE",
          eventId,
          eventType,
          payload: JSON.stringify(payload),
          status,
          errorMessage,
          email,
          createdAt: timestamp,
          // TTL: 30 days from now
          ttl: Math.floor(now.getTime() / 1000) + 30 * 24 * 60 * 60,
        },
      })
    );
  } catch (error) {
    console.error("Failed to log webhook event:", error);
  }
}

export async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayResponse> {
  console.log("Stripe webhook received");

  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    // Get the signature from headers
    const signature =
      event.headers["stripe-signature"] || event.headers["Stripe-Signature"];
    if (!signature) {
      console.error("Missing Stripe signature");
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing signature" }),
      };
    }

    // Get webhook secret
    const secrets = await getSecrets();

    // Get raw body
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf-8")
      : event.body;

    // Verify signature
    if (!verifyStripeSignature(rawBody, signature, secrets.webhookSecret)) {
      console.error("Invalid Stripe signature");
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid signature" }),
      };
    }

    // Parse event
    const stripeEvent = JSON.parse(rawBody);
    const eventType = stripeEvent.type;
    const eventId = stripeEvent.id;

    console.log(`Processing Stripe event: ${eventType} (${eventId})`);

    // Log webhook received
    await logWebhookEvent(eventId, eventType, stripeEvent, "received");

    try {
      // Handle different event types
      switch (eventType) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(stripeEvent);
          break;

        case "customer.subscription.created":
          await handleSubscriptionCreated(stripeEvent);
          break;

        case "customer.subscription.updated":
          await handleSubscriptionUpdated(stripeEvent);
          break;

        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(stripeEvent);
          break;

        case "invoice.payment_failed":
          await handlePaymentFailed(stripeEvent);
          break;

        default:
          console.log(`Unhandled event type: ${eventType}`);
      }

      // Log webhook processed successfully
      await logWebhookEvent(eventId, eventType, stripeEvent, "processed");
    } catch (processingError) {
      // Log webhook processing error
      const errorMessage =
        processingError instanceof Error
          ? processingError.message
          : "Unknown error";
      await logWebhookEvent(eventId, eventType, stripeEvent, "error", errorMessage);
      throw processingError;
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error("Error processing Stripe webhook:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}
