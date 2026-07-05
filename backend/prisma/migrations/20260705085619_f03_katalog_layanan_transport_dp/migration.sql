-- CreateEnum
CREATE TYPE "DpTipe" AS ENUM ('PERSEN', 'NOMINAL');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('FLAT', 'ZONA');

-- AlterTable
ALTER TABLE "BookingItem" ADD COLUMN     "qty" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "butuhTransport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dpNilai" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "dpTipe" "DpTipe" NOT NULL DEFAULT 'PERSEN';

-- CreateTable
CREATE TABLE "TransportRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "mode" "TransportMode" NOT NULL DEFAULT 'FLAT',
    "flatNominal" DECIMAL(15,2),
    "zona" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransportRule_tenantId_key" ON "TransportRule"("tenantId");

-- CreateIndex
CREATE INDEX "TransportRule_tenantId_idx" ON "TransportRule"("tenantId");

-- AddForeignKey
ALTER TABLE "TransportRule" ADD CONSTRAINT "TransportRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
