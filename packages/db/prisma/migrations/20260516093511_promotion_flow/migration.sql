-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'REJECTED');

-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "status" "DeploymentStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Environment" ADD COLUMN     "requiresApproval" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Deployment_environmentId_status_idx" ON "Deployment"("environmentId", "status");
