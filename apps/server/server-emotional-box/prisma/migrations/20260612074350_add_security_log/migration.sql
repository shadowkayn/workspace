-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "result" TEXT NOT NULL,
    "label" TEXT,
    "score" INTEGER,
    "suggestion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityLog_userId_createdAt_idx" ON "SecurityLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityLog_result_createdAt_idx" ON "SecurityLog"("result", "createdAt");
