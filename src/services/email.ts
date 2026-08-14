export type EmailMessage = { to: string; subject: string; text: string };
export interface EmailProvider { send(message: EmailMessage): Promise<void> }

class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage) { console.info(JSON.stringify({ event: "development_email", recipientConfigured: Boolean(message.to), subjectLength: message.subject.length })); }
}

class HttpEmailProvider implements EmailProvider {
  constructor(private readonly apiKey: string, private readonly endpoint: string, private readonly from: string) {}
  async send(message: EmailMessage) {
    const response = await fetch(this.endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` }, body: JSON.stringify({ from: this.from, ...message }) });
    if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  }
}

export function emailProvider(env: NodeJS.ProcessEnv = process.env): EmailProvider {
  const provider = env.EMAIL_PROVIDER ?? "console";
  if (provider === "console") {
    if (env.NODE_ENV === "production") throw new Error("Console email is disabled in production");
    return new ConsoleEmailProvider();
  }
  if (provider !== "http") throw new Error("Unsupported EMAIL_PROVIDER");
  if (!env.EMAIL_API_KEY) throw new Error("EMAIL_API_KEY is required");
  if (!env.EMAIL_API_URL) throw new Error("EMAIL_API_URL is required");
  if (!env.EMAIL_FROM) throw new Error("EMAIL_FROM is required");
  return new HttpEmailProvider(env.EMAIL_API_KEY, env.EMAIL_API_URL, env.EMAIL_FROM);
}
