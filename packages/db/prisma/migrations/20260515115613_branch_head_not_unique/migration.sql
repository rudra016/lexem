-- DropIndex
DROP INDEX "Branch_headId_key";

-- CreateIndex
CREATE INDEX "Branch_headId_idx" ON "Branch"("headId");
