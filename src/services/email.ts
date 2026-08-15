export type EmailMessage = { to: string; subject: string; text: string; replyTo?: string; tag?: string; idempotencyKey?: string };
export interface EmailProvider { send(message: EmailMessage): Promise<void> }

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage) { console.info(JSON.stringify({ event: "development_email", recipientConfigured: Boolean(message.to), subjectLength: message.subject.length, tag: message.tag })); }
}

class HttpEmailProvider implements EmailProvider {
  constructor(private readonly apiKey: string, private readonly endpoint: string, private readonly from: string, private readonly defaultReplyTo?: string) {}
  async send(message: EmailMessage) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: "Bearer " + this.apiKey, ...(message.idempotencyKey ? { "idempotency-key": message.idempotencyKey } : {}) },
          body: JSON.stringify({ from: this.from, to: message.to, subject: message.subject, text: message.text, replyTo: message.replyTo ?? this.defaultReplyTo, tag: message.tag }),
          signal: AbortSignal.timeout(10_000)
        });
        if (response.ok) return;
        if (response.status < 500 && response.status !== 429) throw new Error("Email provider rejected request with " + response.status);
        if (attempt === 3) throw new Error("Email provider unavailable after " + attempt + " attempts (" + response.status + ")");
      } catch (error) {
        if (attempt === 3 || (error instanceof Error && /rejected request/.test(error.message))) throw error;
      }
      await wait(attempt * 250);
    }
  }
}

class MicrosoftGraphEmailProvider implements EmailProvider {
  private cachedToken?: { value: string; expiresAt: number };
  constructor(
    private readonly tenantId: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly senderEmail: string,
    private readonly defaultReplyTo?: string
  ) {}

  private async accessToken() {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) return this.cachedToken.value;
    const response = await fetch("https://login.microsoftonline.com/" + encodeURIComponent(this.tenantId) + "/oauth2/v2.0/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: this.clientId, client_secret: this.clientSecret, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }),
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) throw new Error("Microsoft Graph authentication failed with " + response.status);
    const payload = await response.json() as { access_token?: unknown; expires_in?: unknown };
    if (typeof payload.access_token !== "string") throw new Error("Microsoft Graph authentication response was invalid");
    const lifetime = typeof payload.expires_in === "number" ? payload.expires_in : 3600;
    this.cachedToken = { value: payload.access_token, expiresAt: Date.now() + Math.max(60, lifetime - 60) * 1000 };
    return payload.access_token;
  }

  async send(message: EmailMessage) {
    const token = await this.accessToken();
    const replyTo = message.replyTo ?? this.defaultReplyTo;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch("https://graph.microsoft.com/v1.0/users/" + encodeURIComponent(this.senderEmail) + "/sendMail", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: "Bearer " + token },
          body: JSON.stringify({
            message: {
              subject: message.subject,
              body: { contentType: "Text", content: message.text },
              toRecipients: [{ emailAddress: { address: message.to } }],
              ...(replyTo ? { replyTo: [{ emailAddress: { address: replyTo } }] } : {})
            },
            saveToSentItems: true
          }),
          signal: AbortSignal.timeout(10_000)
        });
        if (response.ok) return;
        if (response.status < 500 && response.status !== 429) throw new Error("Microsoft Graph rejected email with " + response.status);
        if (attempt === 3) throw new Error("Microsoft Graph email delivery failed after " + attempt + " attempts (" + response.status + ")");
      } catch (error) {
        if (attempt === 3 || (error instanceof Error && /rejected email/.test(error.message))) throw error;
      }
      await wait(attempt * 250);
    }
  }
}

class RestrictedEmailProvider implements EmailProvider {
  constructor(private readonly provider: EmailProvider, private readonly allowed: Set<string>) {}
  async send(message: EmailMessage) {
    if (!this.allowed.has(message.to.trim().toLowerCase())) throw new Error("Recipient is not allowed in this environment");
    await this.provider.send(message);
  }
}

export function emailProvider(env: NodeJS.ProcessEnv = process.env): EmailProvider {
  const provider = env.EMAIL_PROVIDER ?? "console";
  const environment = env.DEPLOYMENT_ENV ?? (env.NODE_ENV === "production" ? "production" : "development");
  if (provider === "console") {
    if (environment === "production" || environment === "staging") throw new Error("Console email is disabled outside local development");
    return new ConsoleEmailProvider();
  }

  let delivery: EmailProvider;
  if (provider === "http") {
    if (!env.EMAIL_API_KEY) throw new Error("EMAIL_API_KEY is required");
    if (!env.EMAIL_API_URL) throw new Error("EMAIL_API_URL is required");
    if (!env.EMAIL_FROM) throw new Error("EMAIL_FROM is required");
    if ((environment === "production" || environment === "staging") && new URL(env.EMAIL_API_URL).protocol !== "https:") throw new Error("EMAIL_API_URL must use HTTPS");
    delivery = new HttpEmailProvider(env.EMAIL_API_KEY, env.EMAIL_API_URL, env.EMAIL_FROM, env.EMAIL_REPLY_TO);
  } else if (provider === "microsoft-graph") {
    if (!env.MICROSOFT_TENANT_ID) throw new Error("MICROSOFT_TENANT_ID is required");
    if (!env.MICROSOFT_CLIENT_ID) throw new Error("MICROSOFT_CLIENT_ID is required");
    if (!env.MICROSOFT_CLIENT_SECRET) throw new Error("MICROSOFT_CLIENT_SECRET is required");
    if (!env.MICROSOFT_SENDER_EMAIL) throw new Error("MICROSOFT_SENDER_EMAIL is required");
    delivery = new MicrosoftGraphEmailProvider(env.MICROSOFT_TENANT_ID, env.MICROSOFT_CLIENT_ID, env.MICROSOFT_CLIENT_SECRET, env.MICROSOFT_SENDER_EMAIL, env.EMAIL_REPLY_TO);
  } else {
    throw new Error("Unsupported EMAIL_PROVIDER");
  }

  if (environment === "production") return delivery;
  const allowed = new Set((env.EMAIL_ALLOWED_RECIPIENTS ?? "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean));
  if (!allowed.size) throw new Error("EMAIL_ALLOWED_RECIPIENTS is required outside production");
  return new RestrictedEmailProvider(delivery, allowed);
}
