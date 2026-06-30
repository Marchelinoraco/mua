-- Migration: 20260630000001_domain_schema
-- Fase 0 Milestone 3 — Skema Domain Lengkap GlowBook
-- Dibuat manual (tanpa DB hidup).
-- Untuk migrasi resmi, jalankan: npx prisma migrate dev --name domain_schema
-- File ini dapat diterapkan langsung ke Postgres dengan: psql $DATABASE_URL -f migration.sql

-- ---------------------------------------------------------------------------
-- CreateEnum
-- ---------------------------------------------------------------------------

CREATE TYPE "BookingStatus" AS ENUM (
    'AWAITING_DP',
    'CONFIRMED',
    'PAID',
    'COMPLETED',
    'CANCELED',
    'EXPIRED'
);

CREATE TYPE "PaymentStatus" AS ENUM (
    'PENDING',
    'SUBMITTED',
    'CONFIRMED',
    'REJECTED'
);

CREATE TYPE "SubscriptionStatus" AS ENUM (
    'TRIALING',
    'ACTIVE',
    'PAST_DUE',
    'CANCELED',
    'EXPIRED'
);

CREATE TYPE "InvoiceStatus" AS ENUM (
    'PAID',
    'PENDING',
    'FAILED'
);

CREATE TYPE "ReviewStatus" AS ENUM (
    'PUBLISHED',
    'FLAGGED',
    'HIDDEN'
);

CREATE TYPE "NotificationStatus" AS ENUM (
    'QUEUED',
    'SENT',
    'DELIVERED',
    'FAILED'
);

CREATE TYPE "NotificationChannel" AS ENUM (
    'WHATSAPP',
    'EMAIL'
);

CREATE TYPE "ServiceType" AS ENUM (
    'MAKEUP',
    'HAIR',
    'NAIL',
    'OTHER'
);

CREATE TYPE "PlanInterval" AS ENUM (
    'MONTHLY'
);

-- ---------------------------------------------------------------------------
-- CreateTable: Theme
-- ---------------------------------------------------------------------------

CREATE TABLE "Theme" (
    "id"            TEXT NOT NULL,
    "tenantId"      TEXT NOT NULL,
    "logoUrl"       TEXT,
    "bannerUrl"     TEXT,
    "warnaPrimer"   TEXT NOT NULL DEFAULT '#6C63FF',
    "warnaSekunder" TEXT NOT NULL DEFAULT '#F3F4F6',
    "font"          TEXT NOT NULL DEFAULT 'Inter',
    "template"      TEXT NOT NULL DEFAULT 'classic',
    "customCss"     TEXT,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- CreateTable: Service
-- ---------------------------------------------------------------------------

CREATE TABLE "Service" (
    "id"           TEXT NOT NULL,
    "tenantId"     TEXT NOT NULL,
    "nama"         TEXT NOT NULL,
    "deskripsi"    TEXT,
    "harga"        DECIMAL(15,2) NOT NULL,
    "durasi"       INTEGER NOT NULL,
    "tipe"         "ServiceType" NOT NULL DEFAULT 'MAKEUP',
    "aktif"        BOOLEAN NOT NULL DEFAULT true,
    "urutanTampil" INTEGER NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- CreateTable: CustomField
-- ---------------------------------------------------------------------------

CREATE TABLE "CustomField" (
    "id"       TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label"    TEXT NOT NULL,
    "tipe"     TEXT NOT NULL,
    "opsi"     JSONB,
    "wajib"    BOOLEAN NOT NULL DEFAULT false,
    "urutan"   INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- CreateTable: PaymentProfile
-- ---------------------------------------------------------------------------

CREATE TABLE "PaymentProfile" (
    "id"                TEXT NOT NULL,
    "tenantId"          TEXT NOT NULL,
    "namaBank"          TEXT NOT NULL,
    "nomorRekening"     TEXT NOT NULL,
    "namaPemilik"       TEXT NOT NULL,
    "instruksiTambahan" TEXT,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentProfile_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- CreateTable: Client
-- ---------------------------------------------------------------------------

CREATE TABLE "Client" (
    "id"           TEXT NOT NULL,
    "tenantId"     TEXT NOT NULL,
    "nama"         TEXT NOT NULL,
    "phone"        TEXT NOT NULL,
    "email"        TEXT,
    "catatan"      TEXT,
    "totalBooking" INTEGER NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- CreateTable: Booking
-- ---------------------------------------------------------------------------

CREATE TABLE "Booking" (
    "id"            TEXT NOT NULL,
    "tenantId"      TEXT NOT NULL,
    "clientId"      TEXT NOT NULL,
    "kodeBooking"   TEXT NOT NULL,
    "tanggalAcara"  TIMESTAMP(3) NOT NULL,
    "lokasiAcara"   TEXT,
    "statusBooking" "BookingStatus" NOT NULL DEFAULT 'AWAITING_DP',
    "catatan"       TEXT,
    "totalHarga"    DECIMAL(15,2) NOT NULL,
    "dpAmount"      DECIMAL(15,2) NOT NULL,
    "holdUntil"     TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- CreateTable: BookingItem
-- ---------------------------------------------------------------------------

CREATE TABLE "BookingItem" (
    "id"            TEXT NOT NULL,
    "bookingId"     TEXT NOT NULL,
    "serviceId"     TEXT NOT NULL,
    "namaSnapshot"  TEXT NOT NULL,
    "hargaSnapshot" DECIMAL(15,2) NOT NULL,
    "durasi"        INTEGER NOT NULL,

    CONSTRAINT "BookingItem_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- CreateTable: CustomFieldValue
-- ---------------------------------------------------------------------------

CREATE TABLE "CustomFieldValue" (
    "id"            TEXT NOT NULL,
    "bookingId"     TEXT NOT NULL,
    "customFieldId" TEXT NOT NULL,
    "nilai"         TEXT NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- CreateTable: Payment
-- ---------------------------------------------------------------------------

CREATE TABLE "Payment" (
    "id"           TEXT NOT NULL,
    "tenantId"     TEXT NOT NULL,
    "bookingId"    TEXT NOT NULL,
    "tipe"         TEXT NOT NULL,
    "jumlah"       DECIMAL(15,2) NOT NULL,
    "status"       "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "buktiFotoUrl" TEXT,
    "catatanKlien" TEXT,
    "catatanMua"   TEXT,
    "confirmedAt"  TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- CreateTable: Review
-- ---------------------------------------------------------------------------

CREATE TABLE "Review" (
    "id"        TEXT NOT NULL,
    "tenantId"  TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "rating"    INTEGER NOT NULL,
    "komentar"  TEXT,
    "status"    "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Review_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- ---------------------------------------------------------------------------
-- CreateTable: Plan  [global]
-- ---------------------------------------------------------------------------

CREATE TABLE "Plan" (
    "id"         TEXT NOT NULL,
    "nama"       TEXT NOT NULL,
    "harga"      DECIMAL(15,2) NOT NULL,
    "interval"   "PlanInterval" NOT NULL DEFAULT 'MONTHLY',
    "orderQuota" INTEGER,
    "tierUrutan" INTEGER NOT NULL,
    "fitur"      JSONB NOT NULL,
    "aktif"      BOOLEAN NOT NULL DEFAULT true,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- CreateTable: Subscription
-- ---------------------------------------------------------------------------

CREATE TABLE "Subscription" (
    "id"                     TEXT NOT NULL,
    "tenantId"               TEXT NOT NULL,
    "planId"                 TEXT NOT NULL,
    "status"                 "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "currentPeriodStart"     TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd"       TIMESTAMP(3) NOT NULL,
    "ordersUsedPeriod"       INTEGER NOT NULL DEFAULT 0,
    "midtransCustomerId"     TEXT,
    "midtransSubscriptionId" TEXT,
    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- CreateTable: Invoice
-- ---------------------------------------------------------------------------

CREATE TABLE "Invoice" (
    "id"              TEXT NOT NULL,
    "subscriptionId"  TEXT NOT NULL,
    "tenantId"        TEXT NOT NULL,
    "amount"          DECIMAL(15,2) NOT NULL,
    "status"          "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "midtransOrderId" TEXT,
    "paidAt"          TIMESTAMP(3),
    "dueAt"           TIMESTAMP(3) NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- CreateTable: Notification
-- ---------------------------------------------------------------------------

CREATE TABLE "Notification" (
    "id"        TEXT NOT NULL,
    "tenantId"  TEXT NOT NULL,
    "bookingId" TEXT,
    "channel"   "NotificationChannel" NOT NULL,
    "tujuan"    TEXT NOT NULL,
    "judul"     TEXT NOT NULL,
    "pesan"     TEXT NOT NULL,
    "status"    "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- CreateTable: AuditLog  [global]
-- ---------------------------------------------------------------------------

CREATE TABLE "AuditLog" (
    "id"         TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "aksi"       TEXT NOT NULL,
    "targetTipe" TEXT NOT NULL,
    "targetId"   TEXT NOT NULL,
    "metadata"   JSONB,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- CreateUniqueIndex
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX "Theme_tenantId_key"        ON "Theme"("tenantId");
CREATE UNIQUE INDEX "PaymentProfile_tenantId_key" ON "PaymentProfile"("tenantId");
CREATE UNIQUE INDEX "Client_tenantId_phone_key"  ON "Client"("tenantId", "phone");
CREATE UNIQUE INDEX "Booking_kodeBooking_key"    ON "Booking"("kodeBooking");
CREATE UNIQUE INDEX "Review_bookingId_key"       ON "Review"("bookingId");
CREATE UNIQUE INDEX "Plan_tierUrutan_key"        ON "Plan"("tierUrutan");
CREATE UNIQUE INDEX "Subscription_tenantId_key"  ON "Subscription"("tenantId");
CREATE UNIQUE INDEX "Invoice_midtransOrderId_key" ON "Invoice"("midtransOrderId");

-- ---------------------------------------------------------------------------
-- CreateIndex
-- ---------------------------------------------------------------------------

-- Theme
CREATE INDEX "Theme_tenantId_idx"          ON "Theme"("tenantId");

-- Service
CREATE INDEX "Service_tenantId_idx"        ON "Service"("tenantId");

-- CustomField
CREATE INDEX "CustomField_tenantId_idx"    ON "CustomField"("tenantId");

-- Client
CREATE INDEX "Client_tenantId_idx"         ON "Client"("tenantId");

-- Booking — index kritis anti-bentrok & status lifecycle
CREATE INDEX "Booking_tenantId_idx"               ON "Booking"("tenantId");
CREATE INDEX "Booking_tanggalAcara_idx"            ON "Booking"("tanggalAcara");
CREATE INDEX "Booking_statusBooking_idx"           ON "Booking"("statusBooking");
CREATE INDEX "Booking_tenantId_tanggalAcara_idx"   ON "Booking"("tenantId", "tanggalAcara");

-- BookingItem
CREATE INDEX "BookingItem_bookingId_idx"    ON "BookingItem"("bookingId");

-- CustomFieldValue
CREATE INDEX "CustomFieldValue_bookingId_idx" ON "CustomFieldValue"("bookingId");

-- Payment
CREATE INDEX "Payment_bookingId_idx"       ON "Payment"("bookingId");
CREATE INDEX "Payment_tenantId_idx"        ON "Payment"("tenantId");

-- Review
CREATE INDEX "Review_tenantId_idx"         ON "Review"("tenantId");
CREATE INDEX "Review_bookingId_idx"        ON "Review"("bookingId");

-- Subscription
CREATE INDEX "Subscription_tenantId_idx"   ON "Subscription"("tenantId");

-- Invoice
CREATE INDEX "Invoice_subscriptionId_idx"  ON "Invoice"("subscriptionId");
CREATE INDEX "Invoice_tenantId_idx"        ON "Invoice"("tenantId");
CREATE INDEX "Invoice_midtransOrderId_idx" ON "Invoice"("midtransOrderId");

-- Notification
CREATE INDEX "Notification_tenantId_idx"   ON "Notification"("tenantId");
CREATE INDEX "Notification_bookingId_idx"  ON "Notification"("bookingId");

-- AuditLog
CREATE INDEX "AuditLog_adminEmail_idx"     ON "AuditLog"("adminEmail");
CREATE INDEX "AuditLog_targetId_idx"       ON "AuditLog"("targetId");

-- ---------------------------------------------------------------------------
-- AddForeignKey
-- ---------------------------------------------------------------------------

-- Theme → Tenant
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Service → Tenant
ALTER TABLE "Service" ADD CONSTRAINT "Service_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CustomField → Tenant
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PaymentProfile → Tenant
ALTER TABLE "PaymentProfile" ADD CONSTRAINT "PaymentProfile_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Client → Tenant
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Booking → Tenant
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Booking → Client
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- BookingItem → Booking
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BookingItem → Service
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CustomFieldValue → Booking
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CustomFieldValue → CustomField
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_customFieldId_fkey"
    FOREIGN KEY ("customFieldId") REFERENCES "CustomField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Payment → Tenant
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Payment → Booking
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Review → Tenant
ALTER TABLE "Review" ADD CONSTRAINT "Review_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Review → Booking
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Subscription → Tenant
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Subscription → Plan
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Invoice → Subscription
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Invoice → Tenant
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Notification → Tenant
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Notification → Booking (nullable — SET NULL bila booking dihapus)
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
