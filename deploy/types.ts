import { readFile } from "fs/promises";
import { join } from "path";

export interface StackConfig {
  stackName: string;
  region: string;
  templateBucket: string;
  stage: string;
}

export enum DeploymentAction {
  UPDATE = "update", // Update existing stack
  REPLACE = "replace", // Delete and recreate stack
  REMOVE = "remove", // Delete stack only
}

export interface DeploymentOptions {
  stage: string;
  action?: DeploymentAction; // Deployment action to take
  region?: string;
  autoDeleteFailedStacks?: boolean;
  skipFrontendBuild?: boolean;
  skipResolversBuild?: boolean; // Skip building and uploading resolvers and Lambda functions
  skipUpload?: boolean;
  skipInvalidation?: boolean;
  skipUserSetup?: boolean;
  debugMode?: boolean;
  adminEmail?: string;
  testUserEmail?: string;
  skipUserCreation?: boolean;
  roleArn?: string;
  tags?: { [key: string]: string };
  disableRollback?: boolean;
  skipWAF?: boolean; // Skip WAF dependency (useful for dev to save costs)
  domainName?: string; // Custom domain name for CloudFront (prod only)
  hostedZoneId?: string; // Route53 Hosted Zone ID for domain validation (prod only)
  certificateArn?: string; // ACM Certificate ARN in us-east-1 for CloudFront (prod only)
}

export interface ForceDeleteOptions {
  stackType: StackType;
  stage: string;
  region?: string;
}

export enum StackType {
  WAF = "WAF",
  Shared = "Shared",
  CWL = "CWL",
  AwsExample = "AwsExample",
  TheStoryHub = "TheStoryHub",
  Backroom_Blackjack = "Backroom_Blackjack",
  LawnOrder = "LawnOrder",
  AppBuilderStudio = "AppBuilderStudio",
}

export const STACK_ORDER: StackType[] = [
  StackType.WAF,
  StackType.Shared,
  StackType.CWL,
  StackType.AwsExample,
  StackType.TheStoryHub,
  StackType.Backroom_Blackjack,
  StackType.LawnOrder,
  StackType.AppBuilderStudio,
];

export const TEMPLATE_PATHS: Record<StackType, string> = {
  [StackType.WAF]: join(import.meta.dirname, "templates/waf/cfn-template.yaml"),
  [StackType.Shared]: join(import.meta.dirname, "templates/shared/cfn-template.yaml"),
  [StackType.CWL]: join(import.meta.dirname, "templates/cwl/cfn-template.yaml"),
  [StackType.AwsExample]: join(
    import.meta.dirname,
    "templates/aws-example/cfn-template.yaml",
  ),
  [StackType.TheStoryHub]: join(
    import.meta.dirname,
    "templates/the-story-hub/cfn-template.yaml",
  ),
  [StackType.Backroom_Blackjack]: join(
    import.meta.dirname,
    "cfn-template.yaml",
  ),
  [StackType.LawnOrder]: join(
    import.meta.dirname,
    "templates/lawn-order/cfn-template.yaml",
  ),
  [StackType.AppBuilderStudio]: join(
    import.meta.dirname,
    "templates/app-builder-studio/cfn-template.yaml",
  ),
};

export const TEMPLATE_RESOURCES_PATHS: Record<StackType, string> = {
  [StackType.WAF]: join(import.meta.dirname, "templates/waf/"),
  [StackType.Shared]: join(import.meta.dirname, "templates/shared/"),
  [StackType.CWL]: join(import.meta.dirname, "templates/cwl/"),
  [StackType.AwsExample]: join(import.meta.dirname, "templates/aws-example/"),
  [StackType.TheStoryHub]: join(import.meta.dirname, "templates/the-story-hub/"),
  [StackType.Backroom_Blackjack]: join(import.meta.dirname, "resources/"),
  [StackType.LawnOrder]: join(import.meta.dirname, "templates/lawn-order/"),
  [StackType.AppBuilderStudio]: join(
    import.meta.dirname,
    "templates/app-builder-studio/",
  ),
};

export const getStackName = (stackType: StackType, stage: string) =>
  `${String(stackType).toLowerCase().replace(/_/g, "-")}-${stage}`;

export const getTemplateBucketName = (_stage?: string) =>
  `backroom-blackjack-deploy-templates`;

export const getTemplateBody = async (
  stackType: StackType,
): Promise<string> => {
  const templatePath = TEMPLATE_PATHS[stackType];
  return readFile(templatePath, "utf-8");
};
