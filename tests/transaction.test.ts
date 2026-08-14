import { Prisma, PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { serializableTransaction } from "@/lib/transaction";

describe("serializable transaction retry", () => {
  it("retries a PostgreSQL serialization conflict", async () => {
    const operation = vi.fn(async () => "complete");
    const transaction = vi.fn()
      .mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("conflict", { code: "P2034", clientVersion: "6.19.0" }))
      .mockImplementationOnce(operation);
    const client = { $transaction: transaction } as unknown as PrismaClient;
    await expect(serializableTransaction(client, async () => "complete")).resolves.toBe("complete");
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it("does not retry unrelated database failures", async () => {
    const transaction = vi.fn().mockRejectedValue(new Error("unavailable"));
    const client = { $transaction: transaction } as unknown as PrismaClient;
    await expect(serializableTransaction(client, async () => "complete")).rejects.toThrow("unavailable");
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
