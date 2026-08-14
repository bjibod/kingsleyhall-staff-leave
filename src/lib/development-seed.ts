export type DevelopmentSeedConfig = {
  databaseUrl: string;
  password: string;
};

export function developmentSeedConfig(env: NodeJS.ProcessEnv = process.env): DevelopmentSeedConfig {
  if (env.NODE_ENV === "production") throw new Error("Development fixture seeding is disabled in production");
  if (env.ALLOW_DEMO_SEED !== "true") throw new Error("Set ALLOW_DEMO_SEED=true to confirm development fixture seeding");
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required");

  const databaseUrl = new URL(env.DATABASE_URL);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  if (!localHosts.has(databaseUrl.hostname)) throw new Error("Development fixtures may only be seeded into a local database");

  const password = env.DEMO_SEED_PASSWORD ?? "";
  if (password.length < 14) throw new Error("DEMO_SEED_PASSWORD must contain at least 14 characters");
  return { databaseUrl: env.DATABASE_URL, password };
}
