-- Migration: 20260630000000_init
-- Fase 0 — skema awal: User, Tenant, TenantStatus
-- Dibuat manual (tanpa DB hidup); terapkan dengan: npx prisma migrate dev

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'TRIAL', 'PAST_DUE', 'RESTRICTED', 'CANCELED');

-- CreateTable: User
CREATE TABLE "User" (
    "id"           TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "phone"        TEXT,
    "passwordHash" TEXT,
    "timezone"     TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Tenant
CREATE TABLE "Tenant" (
    "id"          TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "namaBisnis"  TEXT NOT NULL,
    "kota"        TEXT,
    "status"      "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE UNIQUE INDEX "Tenant_ownerUserId_key" ON "Tenant"("ownerUserId");
CREATE UNIQUE INDEX "Tenant_slug_key"        ON "Tenant"("slug");
CREATE INDEX "Tenant_ownerUserId_idx"        ON "Tenant"("ownerUserId");
CREATE INDEX "Tenant_slug_idx"               ON "Tenant"("slug");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_ownerUserId_fkey"
    FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
