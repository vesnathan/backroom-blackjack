import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-2",
});

const BUCKET_NAME = process.env.AVATAR_BUCKET_NAME;
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

interface AppSyncEvent {
  arguments: {
    input: {
      contentType: string;
      fileExtension: string;
    };
  };
  identity: {
    sub: string;
    username: string;
  };
}

interface UploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

/**
 * Lambda function to generate presigned S3 URLs for avatar uploads
 * Called via AppSync HTTP Lambda datasource
 */
export const handler = async (event: AppSyncEvent): Promise<UploadUrlResponse> => {
  console.log("getUploadUrl event:", JSON.stringify(event));

  if (!BUCKET_NAME) {
    throw new Error("AVATAR_BUCKET_NAME environment variable not set");
  }

  const { contentType, fileExtension } = event.arguments.input;
  const userId = event.identity?.sub;

  if (!userId) {
    throw new Error("Unauthorized: No user ID found");
  }

  // Validate content type
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(
      `Invalid content type. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`
    );
  }

  // Validate file extension
  const validExtensions = ["jpg", "jpeg", "png", "webp"];
  const ext = fileExtension.toLowerCase().replace(".", "");
  if (!validExtensions.includes(ext)) {
    throw new Error(
      `Invalid file extension. Allowed: ${validExtensions.join(", ")}`
    );
  }

  // Generate unique key for the avatar
  const uniqueId = uuidv4();
  const key = `avatars/${userId}/${uniqueId}.${ext}`;

  try {
    // Generate presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      // Limit file size
      ContentLength: MAX_FILE_SIZE,
      // Make the object publicly readable
      ACL: "public-read",
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300, // 5 minutes
    });

    // Construct the public URL for the uploaded file
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-southeast-2"}.amazonaws.com/${key}`;

    console.log(`Generated upload URL for user ${userId}, key: ${key}`);

    return {
      uploadUrl,
      fileUrl,
      key,
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate upload URL");
  }
};
