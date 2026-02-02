import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { logger } from "./logger";

export interface SeedDBOptions {
  region: string;
  tableName: string;
  stage: string;
  skipConfirmation?: boolean;
  // ARN of the seed role to assume for permissions
  seedRoleArn?: string;
  // External ID for assuming the seed role
  externalId?: string;
}

export async function seedDB(options: SeedDBOptions): Promise<void> {
  const { region, tableName, stage, skipConfirmation = false, seedRoleArn, externalId } = options;

  logger.info(`🌱 Seeding database`);
  logger.info(`Region: ${region}`);
  logger.info(`Table: ${tableName}`);
  logger.info(`Stage: ${stage}`);
  if (seedRoleArn) {
    logger.info(`Seed Role: ${seedRoleArn}`);
  }

  if (!skipConfirmation) {
    logger.warning("This will create test data in your DynamoDB table.");
    logger.warning("Press Ctrl+C to cancel, or wait 5 seconds to continue...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  logger.info("Starting seed process...");

  // Resolve seeder script
  const scriptPath = path.resolve(import.meta.dirname, "../../backend/scripts/seed-db.ts");

  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Seed script not found at: ${scriptPath}`);
  }

  logger.info(`Using seeder script: ${scriptPath}`);

  const env: Record<string, string | undefined> = {
    ...process.env,
    AWS_REGION: region,
    TABLE_NAME: tableName,
    STAGE: stage,
  };

  // Add seed role credentials if provided
  if (seedRoleArn) {
    env.SEED_ROLE_ARN = seedRoleArn;
    if (externalId) {
      env.SEED_EXTERNAL_ID = externalId;
    }
  }

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    const tsxProcess = spawn("tsx", [scriptPath], {
      env,
      stdio: ["inherit", "pipe", "pipe"],
    });

    // Capture and log stdout
    tsxProcess.stdout?.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      // Also log to console in real-time
      process.stdout.write(text);
      // Log to our logger
      logger.info(text.trim());
    });

    // Capture and log stderr
    tsxProcess.stderr?.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      // Also log to console in real-time
      process.stderr.write(text);
      // Log to our logger
      logger.error(text.trim());
    });

    tsxProcess.on("close", (code) => {
      if (code === 0) {
        logger.success("✅ User seeding completed successfully");
        resolve();
      } else {
        logger.error(`❌ Seed process exited with code ${code}`);
        if (stderr) {
          logger.error(`Stderr output: ${stderr}`);
        }
        if (stdout) {
          logger.debug(`Stdout output: ${stdout}`);
        }
        reject(
          new Error(
            `Seed process failed with code ${code}${stderr ? ": " + stderr.slice(0, 200) : ""}`,
          ),
        );
      }
    });

    tsxProcess.on("error", (error) => {
      logger.error(`❌ Failed to start seed process: ${error.message}`);
      reject(error);
    });
  });
}
