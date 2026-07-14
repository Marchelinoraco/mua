-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');

-- CreateTable
CREATE TABLE "StorefrontReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "alasan" TEXT NOT NULL,
    "kontak" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorefrontReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StorefrontReport_tenantId_idx" ON "StorefrontReport"("tenantId");

-- CreateIndex
CREATE INDEX "StorefrontReport_status_idx" ON "StorefrontReport"("status");

-- AddForeignKey
ALTER TABLE "StorefrontReport" ADD CONSTRAINT "StorefrontReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
