import { z } from "zod";

const serverConfigSchema = z.object({
  APP_NAME: z.string().min(1).default("Kingsley Hall Staff Leave"),
  ORGANISATION_NAME: z.string().min(1).default("Kingsley Hall"),
  APP_URL: z.string().url(),
  APP_TIMEZONE: z.string().min(1).default("Europe/London"),
  AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url()
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;

export function serverConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return serverConfigSchema.parse(env);
}
