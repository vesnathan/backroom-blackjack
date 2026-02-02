import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
import { CreateCheckoutInput, CheckoutSession, SubscriptionTier } from "gqlTypes";

interface Args {
  input: CreateCheckoutInput;
}

type CTX = Context<Args, object, object, object, CheckoutSession>;

/**
 * Creates a checkout session for subscription purchase.
 * Invokes the createCheckout Lambda function.
 */
export function request(ctx: CTX) {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;

  if (!userId) {
    return util.error(
      "Unauthorized: No user ID found",
      "UnauthorizedException"
    );
  }

  const { tier, successUrl, cancelUrl } = ctx.args.input;

  // Validate tier - manual check instead of .includes()
  const isValidTier = tier === "BRONZE" || tier === "SILVER" || tier === "GOLD" || tier === "PLATINUM";
  if (!isValidTier) {
    return util.error(
      `Invalid tier: ${tier}. Must be BRONZE, SILVER, GOLD, or PLATINUM`,
      "ValidationException"
    );
  }

  // Validate URLs
  if (!successUrl || !cancelUrl) {
    return util.error(
      "Success and cancel URLs are required",
      "ValidationException"
    );
  }

  return {
    operation: "Invoke",
    payload: {
      userId,
      tier,
      successUrl,
      cancelUrl,
    },
  };
}

export function response(ctx: CTX): CheckoutSession {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }

  const result = ctx.result as {
    checkoutUrl: string;
    sessionId?: string;
  };

  if (!result || !result.checkoutUrl) {
    return util.error(
      "Failed to create checkout session",
      "InternalServerError"
    );
  }

  return {
    __typename: "CheckoutSession",
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId || null,
  };
}
