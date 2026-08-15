-- AlterTable
ALTER TABLE "Dealer" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual',
ALTER COLUMN "address" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Dealer_source_idx" ON "Dealer"("source");
