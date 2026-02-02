import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";

interface Args {
  friendName: string;
  email: string;
  recaptchaToken: string;
}

interface InviteResult {
  success: boolean;
  error?: string;
}

type CTX = Context<Args, object, object, object, InviteResult>;

/**
 * Sends an email invitation to a friend.
 * Invokes the sendInvite Lambda function.
 * Rate limited to 5 invites per day per user.
 */
export function request(ctx: CTX) {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;
  const username =
    identity.claims?.preferred_username || identity.username || "A friend";

  if (!userId) {
    return util.error(
      "Unauthorized: No user ID found",
      "UnauthorizedException",
    );
  }

  const { friendName, email, recaptchaToken } = ctx.args;

  // Validate friend's name
  const friendNameStr = friendName || "";
  if (friendNameStr.length === 0) {
    return util.error("Friend's name is required", "ValidationException");
  }

  if (friendNameStr.length > 100) {
    return util.error(
      "Friend's name too long. Maximum 100 characters.",
      "ValidationException",
    );
  }

  // Validate email format (basic check, Lambda will do full validation)
  const emailStr = email || "";
  if (emailStr.length === 0 || emailStr.indexOf("@") < 0) {
    return util.error("Valid email address is required", "ValidationException");
  }

  if (emailStr.length > 255) {
    return util.error(
      "Email too long. Maximum 255 characters.",
      "ValidationException",
    );
  }

  return {
    operation: "Invoke",
    payload: {
      userId,
      username,
      friendName: friendNameStr,
      email: emailStr.toLowerCase(),
      recaptchaToken,
    },
  };
}

export function response(ctx: CTX): boolean {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }

  const result = ctx.result;

  if (!result || !result.success) {
    const errorMessage = result?.error || "Failed to send invite";
    return util.error(errorMessage, "InviteError");
  }

  return true;
}
