import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"));
describe("Vercel deployment configuration", () => {
  it("uses native Next.js with locked dependency installation", () => {
    expect(config.framework).toBe("nextjs");
    expect(config.installCommand).toContain("--frozen-lockfile");
    expect(config.buildCommand).toBe("pnpm build");
  });
  it("runs application functions near the UK database", () => expect(config.regions).toEqual(["lhr1"]));
  it("does not contain credentials", () => expect(JSON.stringify(config)).not.toMatch(/token|secret|password/i));
});
