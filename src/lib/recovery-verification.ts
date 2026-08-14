import { z } from "zod";

const schema = z.object({
  DEPLOYMENT_ENV: z.string().refine(value => value !== "production", "Recovery verification cannot run in the production environment"),
  RECOVERY_VERIFICATION: z.literal("true"),
  RECOVERY_TARGET_CONFIRMED_NON_PRODUCTION: z.literal("true"),
  RECOVERY_DATABASE_URL: z.string().url().refine(value => ["postgres:", "postgresql:"].includes(new URL(value).protocol), "Recovery target must be PostgreSQL")
});

export function recoveryVerificationConfig(env: NodeJS.ProcessEnv = process.env) { return schema.parse(env); }
