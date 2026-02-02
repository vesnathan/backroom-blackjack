import { client } from "@/lib/amplify";

/**
 * Strip metadata (EXIF, GPS, etc.) from an image using Canvas API
 * This re-renders the image, removing all metadata while preserving visual quality
 */
async function stripImageMetadata(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image to canvas (this strips all metadata)
      ctx.drawImage(img, 0, 0);

      // Convert canvas back to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob from canvas"));
            return;
          }

          // Create a new File with the stripped image data
          const strippedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          resolve(strippedFile);
        },
        file.type,
        0.92, // Quality for JPEG/WebP (ignored for PNG)
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Load the image from the file
    img.src = URL.createObjectURL(file);
  });
}

// GraphQL mutations for avatar upload
const GET_AVATAR_UPLOAD_URL = /* GraphQL */ `
  mutation GetAvatarUploadUrl($input: GetUploadUrlInput!) {
    getAvatarUploadUrl(input: $input) {
      uploadUrl
      fileUrl
      key
    }
  }
`;

const UPDATE_AVATAR = /* GraphQL */ `
  mutation UpdateAvatar($avatarUrl: String!) {
    updateAvatar(avatarUrl: $avatarUrl) {
      id
      avatarUrl
    }
  }
`;

export interface UploadUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

interface GetUploadUrlResponse {
  data?: {
    getAvatarUploadUrl?: UploadUrlResult;
  };
}

interface UpdateAvatarResponse {
  data?: {
    updateAvatar?: {
      id: string;
      avatarUrl: string;
    };
  };
}

/**
 * Get a presigned URL for uploading an avatar
 */
export async function getAvatarUploadUrl(
  contentType: string,
  fileExtension: string,
): Promise<UploadUrlResult> {
  const response = (await client.graphql({
    query: GET_AVATAR_UPLOAD_URL,
    variables: {
      input: {
        contentType,
        fileExtension,
      },
    },
    authMode: "userPool",
  })) as GetUploadUrlResponse;

  const result = response.data?.getAvatarUploadUrl;

  if (!result) {
    throw new Error("Failed to get upload URL");
  }

  return result;
}

/**
 * Upload a file to S3 using a presigned URL
 */
export async function uploadFileToS3(
  uploadUrl: string,
  file: File,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
}

/**
 * Update the user's avatar URL in the database
 */
export async function updateUserAvatar(avatarUrl: string): Promise<void> {
  const response = (await client.graphql({
    query: UPDATE_AVATAR,
    variables: {
      avatarUrl,
    },
    authMode: "userPool",
  })) as UpdateAvatarResponse;

  if (!response.data?.updateAvatar) {
    throw new Error("Failed to update avatar");
  }
}

/**
 * Complete avatar upload flow:
 * 1. Get presigned URL
 * 2. Upload file to S3
 * 3. Update user's avatar URL in database
 */
export async function uploadAvatar(file: File): Promise<string> {
  // Validate file
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
  }

  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size is 2MB.");
  }

  // Strip metadata (EXIF, GPS, etc.) from image for privacy
  const strippedFile = await stripImageMetadata(file);

  // Get file extension from mime type
  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const fileExtension = extensionMap[strippedFile.type];

  // Step 1: Get presigned URL
  const { uploadUrl, fileUrl } = await getAvatarUploadUrl(
    strippedFile.type,
    fileExtension,
  );

  // Step 2: Upload to S3 (with metadata stripped)
  await uploadFileToS3(uploadUrl, strippedFile);

  // Step 3: Update user's avatar URL
  await updateUserAvatar(fileUrl);

  return fileUrl;
}
