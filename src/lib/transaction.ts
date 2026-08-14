import { Prisma, PrismaClient } from "@prisma/client";

export async function serializableTransaction<T>(client: PrismaClient, operation: (transaction: Prisma.TransactionClient) => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try { return await client.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
    catch (error) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
      if (!retryable || attempt === maxAttempts) throw error;
    }
  }
  throw new Error("Transaction retry limit exceeded");
}
