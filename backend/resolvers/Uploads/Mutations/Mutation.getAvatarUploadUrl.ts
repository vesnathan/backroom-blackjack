import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
import { UploadUrl, GetUploadUrlInput } from "gqlTypes";

interface Args {
  input: GetUploadUrlInput;
}

type CTX = Context<Args, object, object, object, UploadUrl>;

/**
 * Lambda resolver for getAvatarUploadUrl
 * Passes the request to the Lambda function which generates presigned S3 URLs
 */
export function request(ctx: CTX) {
  const identity = ctx.identity as AppSyncIdentityCognito;

  if (!identity?.sub) {
    return util.error(
      "Unauthorized: No user ID found",
      "UnauthorizedException"
    );
  }

  // Pass the arguments and identity to the Lambda
  return {
    operation: "Invoke",
    payload: {
      arguments: ctx.args,
      identity: {
        sub: identity.sub,
        username: identity.username,
      },
    },
  };
}

export function response(ctx: CTX): UploadUrl | null {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }

  const result = ctx.result as UploadUrl;

  if (!result) {
    return util.error("Failed to generate upload URL", "InternalError");
  }

  return {
    __typename: "UploadUrl",
    uploadUrl: result.uploadUrl,
    fileUrl: result.fileUrl,
    key: result.key,
  };
}
