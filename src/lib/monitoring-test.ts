import { timingSafeEqual } from "node:crypto";

export function monitoringTestAuthorised(env: NodeJS.ProcessEnv, authorization: string | null) {
  if (env.DEPLOYMENT_ENV !== "staging") return false;

  const secret = env.MONITORING_TEST_SECRET;
  if (!secret || secret.length < 32 || !authorization?.startsWith("Bearer ")) return false;

  const supplied = authorization.slice("Bearer ".length);
  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}
