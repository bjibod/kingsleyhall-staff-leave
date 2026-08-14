import { describe, expect, it } from "vitest";
import { emailProvider } from "@/services/email";

describe("email environment safeguards", () => {
  it("refuses console delivery in production", () => expect(() => emailProvider({ NODE_ENV: "production", EMAIL_PROVIDER: "console" })).toThrow(/disabled in production/));
  it("refuses an unknown provider", () => expect(() => emailProvider({ NODE_ENV: "production", EMAIL_PROVIDER: "unknown" })).toThrow(/Unsupported/));
  it("requires complete HTTP configuration", () => expect(() => emailProvider({ NODE_ENV: "production", EMAIL_PROVIDER: "http" })).toThrow(/EMAIL_API_KEY/));
  it("permits console delivery in development", () => expect(emailProvider({ NODE_ENV: "development", EMAIL_PROVIDER: "console" })).toBeDefined());
});
