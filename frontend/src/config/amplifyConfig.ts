import type { ResourcesConfig } from "aws-amplify";
import { getDeploymentOutput } from "./deploymentOutputs";

const DEPLOYMENT_OUTPUT = getDeploymentOutput("CCT");
const AWS_REGION = "ap-southeast-2";

// Determine the redirect sign-in URL based on environment
const getRedirectSignIn = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Fallback for SSR
  return process.env.NEXT_PUBLIC_ENVIRONMENT === "prod"
    ? "https://backroom-blackjack.com"
    : "http://localhost:3001";
};

export const AMPLIFY_CONFIG: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: DEPLOYMENT_OUTPUT.cctUserPoolId,
      userPoolClientId: DEPLOYMENT_OUTPUT.cctUserPoolClientId,
      identityPoolId: DEPLOYMENT_OUTPUT.cctIdentityPoolId,
      allowGuestAccess: true,
      loginWith: {
        oauth: {
          domain: `cct-${process.env.NEXT_PUBLIC_ENVIRONMENT || "dev"}.auth.ap-southeast-2.amazoncognito.com`,
          scopes: [
            "email",
            "openid",
            "profile",
            "aws.cognito.signin.user.admin",
          ],
          redirectSignIn: [getRedirectSignIn()],
          redirectSignOut: [getRedirectSignIn()],
          responseType: "code",
        },
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: DEPLOYMENT_OUTPUT.cctGraphQLUrl,
      region: AWS_REGION,
      defaultAuthMode: "userPool",
    },
  },
};
