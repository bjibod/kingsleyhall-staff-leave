export type EmailMessage = { to: string; subject: string; text: string };
export interface EmailProvider { send(message: EmailMessage): Promise<void> }

class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage) { console.info(JSON.stringify({ event: "development_email", ...message })); }
}

class HttpEmailProvider implements EmailProvider {
  constructor(private readonly apiKey: string) {}
  async send(message: EmailMessage) {
    const endpoint = process.env.EMAIL_API_URL; if (!endpoint) throw new Error("EMAIL_API_URL is required");
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` }, body: JSON.stringify({ from: process.env.EMAIL_FROM, ...message }) });
    if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  }
}

export function emailProvider(): EmailProvider {
  if ((process.env.EMAIL_PROVIDER ?? "console") === "console") return new ConsoleEmailProvider();
  if (!process.env.EMAIL_API_KEY) throw new Error("EMAIL_API_KEY is required");
  return new HttpEmailProvider(process.env.EMAIL_API_KEY);
}
