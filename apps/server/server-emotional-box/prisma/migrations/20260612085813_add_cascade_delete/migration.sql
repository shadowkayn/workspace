-- DropForeignKey
ALTER TABLE "public"."AnxietyHistory" DROP CONSTRAINT "AnxietyHistory_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserFavorite" DROP CONSTRAINT "UserFavorite_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserFavorite" DROP CONSTRAINT "UserFavorite_userId_fkey";

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnxietyHistory" ADD CONSTRAINT "AnxietyHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
