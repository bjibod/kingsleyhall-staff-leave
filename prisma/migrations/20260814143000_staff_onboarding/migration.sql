CREATE TABLE "AccountInvitationToken" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountInvitationToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AccountInvitationToken_tokenHash_key" ON "AccountInvitationToken"("tokenHash");
CREATE INDEX "AccountInvitationToken_userId_expiresAt_idx" ON "AccountInvitationToken"("userId", "expiresAt");
CREATE INDEX "AccountInvitationToken_expiresAt_usedAt_idx" ON "AccountInvitationToken"("expiresAt", "usedAt");
ALTER TABLE "AccountInvitationToken" ADD CONSTRAINT "AccountInvitationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
