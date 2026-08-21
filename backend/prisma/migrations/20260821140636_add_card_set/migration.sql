-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "set" TEXT;

-- CreateIndex
CREATE INDEX "Card_set_idx" ON "Card"("set");
