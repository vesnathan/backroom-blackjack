import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  CHIP_PACKAGES,
  getChipPackage,
  calculateChipPurchase,
  type SubscriptionTier,
} from "@backroom-blackjack/shared";

const STRIPE_SECRETS_ARN = process.env.STRIPE_SECRETS_ARN!;
const TABLE_NAME = process.env.TABLE_NAME!;

const secretsClient = new SecretsManagerClient({});
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

// Cache secrets for Lambda warm starts
let stripeSecrets: StripeSecrets | null = null;

interface StripeSecrets {
  secretKey: string;
  webhookSecret: string;
  // Chip package price IDs
  priceIdChips1000?: string;
  priceIdChips5000?: string;
  priceIdChips10000?: string;
}

interface CreateChipCheckoutEvent {
  userId: string;
  packageId: string;
  successUrl: string;
  cancelUrl: string;
}

interface CreateChipCheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

async function getStripeSecrets(): Promise<StripeSecrets> {
  if (stripeSecrets) return stripeSecrets;

  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: STRIPE_SECRETS_ARN })
  );

  if (!response.SecretString) {
    throw new Error("Stripe secrets not found");
  }

  stripeSecrets = JSON.parse(response.SecretString);
  return stripeSecrets!;
}

function getStripePriceId(packageId: string, secrets: StripeSecrets): string {
  // Map package IDs to Stripe price IDs from secrets
  switch (packageId) {
    case "chips_1000":
      return secrets.priceIdChips1000 || "";
    case "chips_5000":
      return secrets.priceIdChips5000 || "";
    case "chips_10000":
      return secrets.priceIdChips10000 || "";
    default:
      throw new Error(`Unknown package ID: ${packageId}`);
  }
}

async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `USER#${userId}`,
        },
        ProjectionExpression: "subscriptionInfo.tier",
      })
    );

    if (result.Item?.subscriptionInfo?.tier) {
      return result.Item.subscriptionInfo.tier as SubscriptionTier;
    }

    return "NONE" as SubscriptionTier;
  } catch (error) {
    console.error("Error fetching user subscription tier:", error);
    return "NONE" as SubscriptionTier;
  }
}

async function createStripeCheckout(
  event: CreateChipCheckoutEvent,
  secrets: StripeSecrets,
  userTier: SubscriptionTier
): Promise<CreateChipCheckoutResponse> {
  const chipPackage = getChipPackage(event.packageId);
  if (!chipPackage) {
    throw new Error(`Invalid package ID: ${event.packageId}`);
  }

  const priceId = getStripePriceId(event.packageId, secrets);
  if (!priceId) {
    throw new Error(`No Stripe price ID configured for package: ${event.packageId}`);
  }

  // Calculate bonus chips for display in metadata
  const { bonusChips, totalChips } = calculateChipPurchase(chipPackage.chips, userTier);

  // Create Stripe Checkout Session via API (one-time payment, not subscription)
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secrets.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      mode: "payment", // One-time payment, not subscription
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: event.successUrl,
      cancel_url: event.cancelUrl,
      "metadata[userId]": event.userId,
      "metadata[type]": "chip_purchase",
      "metadata[packageId]": event.packageId,
      "metadata[baseChips]": chipPackage.chips.toString(),
      "metadata[bonusChips]": bonusChips.toString(),
      "metadata[totalChips]": totalChips.toString(),
      "metadata[userTier]": userTier,
      "payment_intent_data[description]": `Backroom Blackjack: ${chipPackage.displayName}`,
      "payment_intent_data[metadata][userId]": event.userId,
      "payment_intent_data[metadata][type]": "chip_purchase",
      "payment_intent_data[metadata][packageId]": event.packageId,
      "payment_intent_data[metadata][totalChips]": totalChips.toString(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Stripe API error:", error);
    throw new Error("Failed to create Stripe checkout session");
  }

  const session = (await response.json()) as { url: string; id: string };

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
}

export async function handler(
  event: CreateChipCheckoutEvent
): Promise<CreateChipCheckoutResponse> {
  console.log("Creating chip checkout session:", {
    userId: event.userId,
    packageId: event.packageId,
  });

  // Validate package ID
  const validPackageIds = CHIP_PACKAGES.map((pkg) => pkg.id);
  if (!validPackageIds.includes(event.packageId)) {
    throw new Error(
      `Invalid package ID: ${event.packageId}. Must be one of: ${validPackageIds.join(", ")}`
    );
  }

  // Get user's subscription tier for bonus calculation
  const userTier = await getUserSubscriptionTier(event.userId);

  const secrets = await getStripeSecrets();
  return createStripeCheckout(event, secrets, userTier);
}
