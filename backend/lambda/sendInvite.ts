import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
});

const secretsClient = new SecretsManagerClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
});

const TABLE_NAME = process.env.TABLE_NAME;
const RECAPTCHA_SECRETS_ARN = process.env.RECAPTCHA_SECRETS_ARN;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@backroom-blackjack.com";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://backroom-blackjack.com";

const DAILY_INVITE_LIMIT = 5;

// Cache secrets for Lambda warm starts
let cachedRecaptchaSecret: string | null = null;

interface InviteEvent {
  userId: string;
  username: string;
  friendName: string;
  email: string;
  recaptchaToken: string;
}

interface InviteResponse {
  success: boolean;
  error?: string;
}

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * Get reCAPTCHA secret from Secrets Manager
 */
async function getRecaptchaSecret(): Promise<string | null> {
  if (cachedRecaptchaSecret) return cachedRecaptchaSecret;

  if (!RECAPTCHA_SECRETS_ARN) {
    console.warn("RECAPTCHA_SECRETS_ARN not configured");
    return null;
  }

  try {
    const response = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: RECAPTCHA_SECRETS_ARN }),
    );

    const secrets = JSON.parse(response.SecretString!) as { secretKey: string };
    cachedRecaptchaSecret = secrets.secretKey;
    return cachedRecaptchaSecret;
  } catch (error) {
    console.error("Failed to get reCAPTCHA secret:", error);
    return null;
  }
}

/**
 * Verify reCAPTCHA token with Google
 */
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = await getRecaptchaSecret();

  if (!secretKey) {
    console.warn("reCAPTCHA secret not available, skipping verification");
    return true;
  }

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${secretKey}&response=${token}`,
      },
    );

    const data = (await response.json()) as RecaptchaResponse;
    console.log("reCAPTCHA verification result:", data);

    // Check if verification passed and score is acceptable (0.5 or higher)
    return data.success && (!data.score || data.score >= 0.5);
  } catch (error) {
    console.error("reCAPTCHA verification failed:", error);
    return false;
  }
}

/**
 * Check if user has exceeded daily invite limit
 */
async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  count: number;
}> {
  if (!TABLE_NAME) {
    throw new Error("TABLE_NAME environment variable not set");
  }

  // Get today's date as partition for rate limiting
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const pk = `INVITE#${userId}`;
  const skPrefix = `DATE#${today}`;

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": pk,
          ":sk": skPrefix,
        },
      }),
    );

    const count = result.Count || 0;
    return {
      allowed: count < DAILY_INVITE_LIMIT,
      count,
    };
  } catch (error) {
    console.error("Error checking rate limit:", error);
    throw new Error("Failed to check rate limit");
  }
}

/**
 * Record an invite in DynamoDB
 */
async function recordInvite(
  userId: string,
  email: string,
  friendName: string,
): Promise<void> {
  if (!TABLE_NAME) {
    throw new Error("TABLE_NAME environment variable not set");
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const timestamp = now.toISOString();

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `INVITE#${userId}`,
        SK: `DATE#${today}#${timestamp}`,
        email,
        friendName,
        sentAt: timestamp,
        TTL: Math.floor(now.getTime() / 1000) + 7 * 24 * 60 * 60, // 7 days TTL
      },
    }),
  );
}

/**
 * Send the invite email via SES
 */
async function sendEmail(
  toEmail: string,
  friendName: string,
  fromUsername: string,
  userId: string,
): Promise<void> {
  const referralUrl = `${FRONTEND_URL}/?ref=${userId}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #2d2d2d; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-bottom: 3px solid #FFD700; text-align: center;">
              <h1 style="margin: 0; color: #FFD700; font-size: 32px; font-weight: bold;">
                Backroom Blackjack
              </h1>
              <p style="margin: 10px 0 0; color: #888; font-size: 14px;">
                Master the Art of Card Counting
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #FFD700; font-size: 24px;">
                Hey ${friendName}!
              </h2>
              <p style="margin: 0 0 20px; color: #ffffff; font-size: 16px; line-height: 1.6;">
                <strong style="color: #FFD700;">${fromUsername}</strong> thinks you'd love Backroom Blackjack - an immersive card counting trainer where you'll learn to beat the house.
              </p>
              <p style="margin: 0 0 30px; color: #cccccc; font-size: 16px; line-height: 1.6;">
                Practice with AI opponents, track your progress, and compete on the leaderboard. No real money required!
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${referralUrl}" style="display: inline-block; padding: 16px 40px; background-color: #FFD700; color: #000000; text-decoration: none; font-size: 18px; font-weight: bold; border-radius: 8px;">
                      Join the Table
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #888; font-size: 14px; text-align: center;">
                Or copy this link: <a href="${referralUrl}" style="color: #FFD700;">${referralUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #1a1a1a; border-top: 1px solid #444;">
              <p style="margin: 0; color: #666; font-size: 12px; text-align: center;">
                This email was sent because ${fromUsername} thought you'd enjoy Backroom Blackjack.
                <br>
                &copy; ${new Date().getFullYear()} Backroom Blackjack. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const textBody = `
Hey ${friendName}!

${fromUsername} thinks you'd love Backroom Blackjack - an immersive card counting trainer where you'll learn to beat the house.

Practice with AI opponents, track your progress, and compete on the leaderboard. No real money required!

Join now: ${referralUrl}

---
This email was sent because ${fromUsername} thought you'd enjoy Backroom Blackjack.
`;

  await sesClient.send(
    new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: `${fromUsername} invited you to Backroom Blackjack!`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    }),
  );
}

/**
 * Lambda handler for sending invite emails
 */
export const handler = async (event: InviteEvent): Promise<InviteResponse> => {
  console.log("sendInvite event:", JSON.stringify(event));

  const { userId, username, friendName, email, recaptchaToken } = event;

  // Validate required fields
  if (!userId || !friendName || !email) {
    return {
      success: false,
      error: "Missing required fields",
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "Invalid email address",
    };
  }

  try {
    // Verify reCAPTCHA
    const recaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaValid) {
      return {
        success: false,
        error: "reCAPTCHA verification failed. Please try again.",
      };
    }

    // Check rate limit
    const { allowed, count } = await checkRateLimit(userId);
    if (!allowed) {
      return {
        success: false,
        error: `Daily invite limit reached (${DAILY_INVITE_LIMIT}/day). Try again tomorrow.`,
      };
    }

    // Send the email
    await sendEmail(email, friendName, username, userId);

    // Record the invite
    await recordInvite(userId, email, friendName);

    console.log(
      `Invite sent successfully from ${userId} to ${email} (${count + 1}/${DAILY_INVITE_LIMIT} today)`,
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error sending invite:", error);
    return {
      success: false,
      error: "Failed to send invite. Please try again later.",
    };
  }
};
