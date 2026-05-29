-- CreateTable
CREATE TABLE "ImageCache" (
    "id" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "uploadCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImageCache_fileHash_key" ON "ImageCache"("fileHash");

-- CreateIndex
CREATE INDEX "ImageCache_fileHash_idx" ON "ImageCache"("fileHash");
