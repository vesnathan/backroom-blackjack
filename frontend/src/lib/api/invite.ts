import { client } from "@/lib/amplify";

// Response type for GraphQL operation
interface SendInviteResponse {
  sendInvite: boolean;
}

// GraphQL mutation for sending invites
const SEND_INVITE = /* GraphQL */ `
  mutation SendInvite(
    $friendName: String!
    $email: String!
    $recaptchaToken: String!
  ) {
    sendInvite(
      friendName: $friendName
      email: $email
      recaptchaToken: $recaptchaToken
    )
  }
`;

export interface SendInviteInput {
  friendName: string;
  email: string;
  recaptchaToken: string;
}

/**
 * Send an invite email to a friend
 * @param input - The invite details
 * @returns true if successful
 */
export async function sendInvite(input: SendInviteInput): Promise<boolean> {
  try {
    const result = await client.graphql({
      query: SEND_INVITE,
      variables: input,
      authMode: "userPool",
    });

    return (result as { data: SendInviteResponse }).data?.sendInvite === true;
  } catch (error) {
    console.error("Failed to send invite:", error);
    throw error;
  }
}
