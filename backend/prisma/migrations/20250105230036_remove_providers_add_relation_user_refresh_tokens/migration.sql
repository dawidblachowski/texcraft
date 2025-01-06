/*
  Warnings:

  - You are about to drop the `OAuthProvider` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "OAuthProvider";

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
