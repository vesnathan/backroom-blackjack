import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_TIER_PRICES,
  type SubscriptionTier,
} from "@backroom-blackjack/shared";

const STRIPE_SECRETS_ARN = process.env.STRIPE_SECRETS_ARN!;

const secretsClient = new SecretsManagerClient({});

// Cache secrets for Lambda warm starts
let stripeSecrets: StripeSecrets | null = null;

interface StripeSecrets {
  secretKey: string;
  webhookSecret: string;
  priceIdBronze: string;
  priceIdSilver: string;
  priceIdGold: string;
  priceIdPlatinum: string;
}

interface CreateCheckoutEvent {
  userId: string;
  tier: SubscriptionTier;
  successUrl: string;
  cancelUrl: string;
}

interface CreateCheckoutResponse {
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

function getStripePriceId(tier: SubscriptionTier, secrets: StripeSecrets): string {
  switch (tier) {
    case SUBSCRIPTION_TIERS.BRONZE:
      return secrets.priceIdBronze;
    case SUBSCRIPTION_TIERS.SILVER:
      return secrets.priceIdSilver;
    case SUBSCRIPTION_TIERS.GOLD:
      return secrets.priceIdGold;
    case SUBSCRIPTION_TIERS.PLATINUM:
      return secrets.priceIdPlatinum;
    default:
      throw new Error(`Invalid tier: ${tier}`);
  }
}

async function createStripeCheckout(
  event: CreateCheckoutEvent,
  secrets: StripeSecrets
): Promise<CreateCheckoutResponse> {
  const priceId = getStripePriceId(event.tier, secrets);

  // Create Stripe Checkout Session via API
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secrets.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: event.successUrl,
      cancel_url: event.cancelUrl,
      "metadata[userId]": event.userId,
      "metadata[tier]": event.tier,
      "subscription_data[metadata][userId]": event.userId,
      "subscription_data[metadata][tier]": event.tier,
      "subscription_data[description]": "Backroom Blackjack Subscription",
      allow_promotion_codes: "true",
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
  event: CreateCheckoutEvent
): Promise<CreateCheckoutResponse> {
  console.log("Creating checkout session:", {
    userId: event.userId,
    tier: event.tier,
  });

  // Validate tier - must be one of the paid tiers
  const validTiers: SubscriptionTier[] = [
    SUBSCRIPTION_TIERS.BRONZE,
    SUBSCRIPTION_TIERS.SILVER,
    SUBSCRIPTION_TIERS.GOLD,
    SUBSCRIPTION_TIERS.PLATINUM,
  ];

  if (!validTiers.includes(event.tier)) {
    throw new Error(
      `Invalid tier: ${event.tier}. Must be BRONZE, SILVER, GOLD, or PLATINUM`
    );
  }

  // Validate tier has a price (not free)
  if (SUBSCRIPTION_TIER_PRICES[event.tier] === 0) {
    throw new Error("Cannot create checkout for free tier");
  }

  const secrets = await getStripeSecrets();
  return createStripeCheckout(event, secrets);
}
