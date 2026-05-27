-- AlterTable
ALTER TABLE "BackgroundImage" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "BackgroundImage" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "BackgroundImage_category_isActive_order_idx" ON "BackgroundImage"("category", "isActive", "order");
