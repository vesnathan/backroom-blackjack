/**
 * Cognito User Groups for Backroom Blackjack
 */
export const COGNITO_GROUPS = ["admin", "user"];

export type CognitoGroup = (typeof COGNITO_GROUPS)[number];
