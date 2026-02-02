import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
import { CreateChipCheckoutInput, CheckoutSession } from "gqlTypes";

interface Args {
  input: CreateChipCheckoutInput;
}

type CTX = Context<Args, object, object, object, CheckoutSession>;

/**
 * Creates a checkout session for one-time chip purchase.
 * Invokes the createChipCheckout Lambda function.
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

  const { packageId, successUrl, cancelUrl } = ctx.args.input;

  // Validate package ID - manual check instead of .includes()
  const isValidPackage = packageId === "chips_1000" || packageId === "chips_5000" || packageId === "chips_10000";
  if (!isValidPackage) {
    return util.error(
      `Invalid package ID: ${packageId}. Must be one of: chips_1000, chips_5000, chips_10000`,
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
      packageId,
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
      "Failed to create chip checkout session",
      "InternalServerError"
    );
  }

  return {
    __typename: "CheckoutSession",
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId || null,
  };
}
