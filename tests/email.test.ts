import { afterEach, describe, expect, it, vi } from "vitest";
import { emailProvider } from "@/services/email";

const production: NodeJS.ProcessEnv = { NODE_ENV: "production", DEPLOYMENT_ENV: "production", EMAIL_PROVIDER: "http", EMAIL_API_KEY: "secret", EMAIL_API_URL: "https://email.example.org/send", EMAIL_FROM: "Leave <leave@example.org>", EMAIL_REPLY_TO: "people@example.org" };
afterEach(() => vi.unstubAllGlobals());
describe("email environment safeguards", () => {
  it("refuses console delivery in staging and production", () => {
    expect(() => emailProvider({ NODE_ENV: "production", DEPLOYMENT_ENV: "production", EMAIL_PROVIDER: "console" })).toThrow(/disabled/);
    expect(() => emailProvider({ NODE_ENV: "production", DEPLOYMENT_ENV: "staging", EMAIL_PROVIDER: "console" })).toThrow(/disabled/);
  });
  it("refuses an unknown provider and incomplete configuration", () => {
    expect(() => emailProvider({ NODE_ENV: "production", EMAIL_PROVIDER: "unknown" })).toThrow(/Unsupported/);
    expect(() => emailProvider({ NODE_ENV: "production", EMAIL_PROVIDER: "http" })).toThrow(/EMAIL_API_KEY/);
  });
  it("requires HTTPS for staging and production", () => expect(() => emailProvider({ ...production, EMAIL_API_URL: "http://email.example.org/send" })).toThrow(/HTTPS/));
  it("permits metadata-only console delivery in development", () => expect(emailProvider({ NODE_ENV: "development", EMAIL_PROVIDER: "console" })).toBeDefined());
  it("blocks non-allowlisted recipients outside production", async () => {
    const provider = emailProvider({ ...production, DEPLOYMENT_ENV: "preview", EMAIL_ALLOWED_RECIPIENTS: "tester@example.org" });
    await expect(provider.send({ to: "staff@example.org", subject: "Test", text: "Test" })).rejects.toThrow(/not allowed/);
  });
  it("sends configured sender, reply-to, tag and idempotency key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 })); vi.stubGlobal("fetch", fetchMock);
    await emailProvider(production).send({ to: "staff@example.org", subject: "Test", text: "Body", tag: "test", idempotencyKey: "event-1" });
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["idempotency-key"]).toBe("event-1");
    expect(JSON.parse(options.body)).toMatchObject({ from: production.EMAIL_FROM, replyTo: production.EMAIL_REPLY_TO, tag: "test" });
  });
  it("does not retry permanent provider rejection", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 400 })); vi.stubGlobal("fetch", fetchMock);
    await expect(emailProvider(production).send({ to: "staff@example.org", subject: "Test", text: "Body" })).rejects.toThrow(/rejected/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
