/*
  Warnings:

  - You are about to drop the column `activeVersionId` on the `Environment` table. All the data in the column will be lost.
  - Added the required column `promptId` to the `Deployment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Environment" DROP CONSTRAINT "Environment_activeVersionId_fkey";

-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN     "promptId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Environment" DROP COLUMN "activeVersionId";

-- CreateTable
CREATE TABLE "PromptEnvironment" (
    "id" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "activeVersionId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptEnvironment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromptEnvironment_environmentId_idx" ON "PromptEnvironment"("environmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PromptEnvironment_promptId_environmentId_key" ON "PromptEnvironment"("promptId", "environmentId");

-- CreateIndex
CREATE INDEX "Deployment_promptId_environmentId_createdAt_idx" ON "Deployment"("promptId", "environmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "PromptEnvironment" ADD CONSTRAINT "PromptEnvironment_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptEnvironment" ADD CONSTRAINT "PromptEnvironment_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptEnvironment" ADD CONSTRAINT "PromptEnvironment_activeVersionId_fkey" FOREIGN KEY ("activeVersionId") REFERENCES "Version"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
