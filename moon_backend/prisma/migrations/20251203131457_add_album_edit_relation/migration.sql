-- AlterTable
ALTER TABLE "Edit" ADD COLUMN     "albumId" TEXT;

-- CreateIndex
CREATE INDEX "Edit_albumId_idx" ON "Edit"("albumId");

-- AddForeignKey
ALTER TABLE "Edit" ADD CONSTRAINT "Edit_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;
