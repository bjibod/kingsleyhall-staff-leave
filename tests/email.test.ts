import { afterEach, describe, expect, it, vi } from "vitest";
import { emailProvider } from "@/services/email";

const production: NodeJS.ProcessEnv = { NODE_ENV: "production", DEPLOYMENT_ENV: "production", EMAIL_PROVIDER: "http", EMAIL_API_KEY: "secret", EMAIL_API_URL: "https://email.example.org/send", EMAIL_FROM: "Leave <leave@example.org>", EMAIL_REPLY_TO: "people@example.org" };
const graphStaging: NodeJS.ProcessEnv = {
  NODE_ENV: "production",
  DEPLOYMENT_ENV: "staging",
  EMAIL_PROVIDER: "microsoft-graph",
  MICROSOFT_TENANT_ID: "tenant-id",
  MICROSOFT_CLIENT_ID: "client-id",
  MICROSOFT_CLIENT_SECRET: "client-secret",
  MICROSOFT_SENDER_EMAIL: "leave-staging@example.org",
  EMAIL_REPLY_TO: "people@example.org",
  EMAIL_ALLOWED_RECIPIENTS: "tester@example.org"
};

afterEach(() => vi.unstubAllGlobals());

describe("email environment safeguards", () => {
  it("refuses console delivery in staging and production", () => {
    expect(() => emailProvider({ NODE_ENV: "production", DEPLOYMENT_ENV: "production", EMAIL_PROVIDER: "console" })).toThrow(/disabled/);
    expect(() => emailProvider({ NODE_ENV: "production", DEPLOYMENT_ENV: "staging", EMAIL_PROVIDER: "console" })).toThrow(/disabled/);
  });

  it("refuses an unknown provider and incomplete configuration", () => {
    expect(() => emailProvider({ NODE_ENV: "production", EMAIL_PROVIDER: "unknown" })).toThrow(/Unsupported/);
    expect(() => emailProvider({ NODE_ENV: "production", EMAIL_PROVIDER: "http" })).toThrow(/EMAIL_API_KEY/);
    expect(() => emailProvider({ NODE_ENV: "production", EMAIL_PROVIDER: "microsoft-graph" })).toThrow(/MICROSOFT_TENANT_ID/);
  });

  it("requires HTTPS for staging and production HTTP delivery", () => expect(() => emailProvider({ ...production, EMAIL_API_URL: "http://email.example.org/send" })).toThrow(/HTTPS/));
  it("permits metadata-only console delivery in development", () => expect(emailProvider({ NODE_ENV: "development", EMAIL_PROVIDER: "console" })).toBeDefined());

  it("blocks non-allowlisted recipients outside production", async () => {
    const provider = emailProvider({ ...production, DEPLOYMENT_ENV: "preview", EMAIL_ALLOWED_RECIPIENTS: "tester@example.org" });
    await expect(provider.send({ to: "staff@example.org", subject: "Test", text: "Test" })).rejects.toThrow(/not allowed/);
  });

  it("sends configured sender, reply-to, tag and idempotency key to an HTTP provider", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    await emailProvider(production).send({ to: "staff@example.org", subject: "Test", text: "Body", tag: "test", idempotencyKey: "event-1" });
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["idempotency-key"]).toBe("event-1");
    expect(JSON.parse(options.body)).toMatchObject({ from: production.EMAIL_FROM, replyTo: production.EMAIL_REPLY_TO, tag: "test" });
  });

  it("uses the Microsoft client-credentials flow and Graph sendMail endpoint", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access-token", expires_in: 3600 }), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    await emailProvider(graphStaging).send({ to: "tester@example.org", subject: "Leave approved", text: "Your leave was approved." });

    expect(fetchMock.mock.calls[0][0]).toBe("https://login.microsoftonline.com/tenant-id/oauth2/v2.0/token");
    const tokenBody = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(tokenBody.get("scope")).toBe("https://graph.microsoft.com/.default");
    expect(fetchMock.mock.calls[1][0]).toBe("https://graph.microsoft.com/v1.0/users/leave-staging%40example.org/sendMail");
    const graphBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(graphBody).toMatchObject({
      message: {
        subject: "Leave approved",
        body: { contentType: "Text", content: "Your leave was approved." },
        toRecipients: [{ emailAddress: { address: "tester@example.org" } }],
        replyTo: [{ emailAddress: { address: "people@example.org" } }]
      },
      saveToSentItems: true
    });
  });

  it("does not retry a permanent Graph rejection", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access-token" }), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(emailProvider(graphStaging).send({ to: "tester@example.org", subject: "Test", text: "Body" })).rejects.toThrow(/rejected email/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry permanent HTTP provider rejection", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(emailProvider(production).send({ to: "staff@example.org", subject: "Test", text: "Body" })).rejects.toThrow(/rejected/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
