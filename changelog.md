# Changelog

Semua perubahan penting pada proyek ini dicatat di file ini.
Format mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.1.0/): entri terbaru di atas, dikelompokkan **Ditambahkan / Diubah / Dihapus / Diperbaiki**.

> **Catatan untuk agent:** setiap kali membuat perubahan pada repo (dokumen, kode, konfigurasi), tambahkan entri ke bagian `[Belum Dirilis]` di bawah — pada tanggal yang sama — **sebelum menutup tugas**.

## [Belum Dirilis]

### 2026-06-30 — Fase 0 Milestone 3: Skema Domain Lengkap GlowBook

#### Ditambahkan
- **`backend/prisma/schema.prisma`** — diperluas dari 2 model (User, Tenant) ke **15 model** + **9 enum** baru:
  - Enum baru: `BookingStatus`, `PaymentStatus`, `SubscriptionStatus`, `InvoiceStatus`, `ReviewStatus`, `NotificationStatus`, `NotificationChannel`, `ServiceType`, `PlanInterval` — semua nilai UPPERCASE_ENGLISH sesuai `conventions.md`.
  - Model baru (tenant-scoped, wajib `tenantId`): `Theme` (1:1 Tenant), `Service`, `CustomField`, `PaymentProfile` (1:1 Tenant), `Client` (unique `[tenantId, phone]`), `Booking` (anti-bentrok index `[tenantId, tanggalAcara]`, `kodeBooking @unique` format GB-YYYYMMDD-XXXX), `BookingItem` (snapshot harga/nama), `CustomFieldValue`, `Payment`, `Review` (`bookingId @unique` — 1 ulasan/booking), `Subscription` (1:1 Tenant), `Invoice`.
  - Model baru (global, tanpa `tenantId`): `Plan` (`tierUrutan @unique`), `AuditLog`.
  - Model baru (tenant-scoped): `Notification`.
  - Semua field moneter (`harga`, `jumlah`, `amount`, `dpAmount`, `totalHarga`, `hargaSnapshot`) bertipe `Decimal(15,2)`.
  - Cascade delete: hapus Tenant → hapus semua data tenant-scoped. Booking dihapus → BookingItem, CustomFieldValue, Payment, Review ikut terhapus. Notification.bookingId → `SET NULL`.
  - Back-relation lengkap di Tenant (`payments[]`, `reviews[]`) dan Plan (`subscriptions[]`).
- **`backend/prisma/migrations/20260630000001_domain_schema/migration.sql`** — SQL migrasi manual: `CREATE TYPE` (9 enum), `CREATE TABLE` (13 tabel baru), `CREATE UNIQUE INDEX`, `CREATE INDEX`, `ALTER TABLE ... ADD CONSTRAINT` (FK lengkap). Check constraint `Review.rating` 1–5.

#### Verifikasi
- `npx prisma validate` — lulus (schema valid, 0 error).
- `npx prisma generate` — lulus (Prisma Client v7.8.0 di-generate ulang).

---

### 2026-06-30 — Commit & Push: 3 Unit Logis Fase 0

#### Diubah
- **`backend/.gitignore`** — tambah entri `dist` agar folder build NestJS tidak ikut ter-commit.

---

### 2026-06-30 — Fase 0 Milestone 2: Scaffold Fondasi Backend GlowBook

#### Ditambahkan
- **`backend/`** — app NestJS (TypeScript strict) hasil `npx @nestjs/cli new`, dependensi: `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `class-validator`, `class-transformer`, `bcrypt`, `@prisma/client`, Prisma CLI, `dotenv`.
- **`backend/prisma/schema.prisma`** — skema awal Prisma 7 (provider postgresql): enum `TenantStatus { ACTIVE TRIAL PAST_DUE RESTRICTED CANCELED }`, model `User` (id, email unique, phone?, passwordHash?, timezone?, createdAt), model `Tenant` (id, ownerUserId @unique 1:1, slug @unique, namaBisnis, kota?, status default TRIAL, createdAt) + index `ownerUserId` & `slug`.
- **`backend/prisma.config.ts`** — konfigurasi datasource Prisma 7 (`DATABASE_URL` dari env, path migrasi).
- **`backend/prisma/migrations/20260630000000_init/migration.sql`** — SQL migrasi awal (dibuat manual; terapkan setelah Postgres hidup dengan `npx prisma migrate dev`).
- **`backend/prisma/migrations/migration_lock.toml`** — lock file migrasi Prisma.
- **`backend/.env.example`** — template env: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV`.
- **`backend/docker-compose.yml`** — service `postgres:16-alpine` untuk dev lokal (user/pass/db: glowbook, port 5432).
- **`backend/src/prisma/`** — `PrismaModule` (@Global) + `PrismaService` (extends PrismaClient, lifecycle connect/disconnect).
- **`backend/src/auth/`** — `AuthModule`: register (User + Tenant 1:1 dalam transaksi atomik, bcrypt 12 rounds), login (JWT), DTO `RegisterDto`/`LoginDto`/`AuthResponseDto` (class-validator), `JwtStrategy` (passport-jwt), response tidak bocorkan `passwordHash`.
- **`backend/src/tenant/`** — `TenantModule`: `GET /tenant/me`, `PATCH /tenant/me` (namaBisnis, kota) — semua query difilter `tenantId`, `ownerUserId` tidak disertakan di response.
- **`backend/src/health/`** — `HealthController`: `GET /health` → `{ status, timestamp }`.
- **`backend/src/common/guards/jwt-auth.guard.ts`** — `JwtAuthGuard` (extends AuthGuard('jwt')).
- **`backend/src/common/decorators/current-tenant.decorator.ts`** — `@CurrentTenant()`: resolusi `tenantId` dari `request.user` (JWT payload, Paket A 1:1).
- **`backend/src/common/decorators/current-user.decorator.ts`** — `@CurrentUser()` + interface `JwtPayload { sub, email, tenantId }`.
- **`backend/src/app.module.ts`** — root module: `ConfigModule` (global), `PrismaModule`, `AuthModule`, `TenantModule`, `HealthModule`, `ValidationPipe` global (whitelist, forbidNonWhitelisted, transform).
- **`backend/src/main.ts`** — bootstrap: global prefix `/api`, CORS (`CORS_ORIGIN` dari env), log port.
- **`backend/README.md`** — dokumentasi setup (docker compose + migrasi + dev), tabel endpoint, pola tenant-scoping lengkap dengan contoh kode dan aturan keras.

#### Verifikasi
- `npx prisma validate` — lulus (schema valid).
- `npx prisma generate` — lulus (Prisma Client v7.8.0 ter-generate).
- `npm run build` — lulus (0 error TypeScript strict).
- `prisma migrate dev --create-only` — tidak dapat dijalankan tanpa Postgres; SQL migrasi ditulis manual di `prisma/migrations/20260630000000_init/migration.sql`.

### 2026-06-30 — Fase 0 Milestone 1: Adopsi Shell Frontend GlowBook

#### Ditambahkan
- **`frontend/`** — direktori app frontend hasil `git mv shadcn-admin-main/ frontend/` (history terjaga, tidak ada `.git` bersarang).
- **6 route stub** di `frontend/src/routes/_authenticated/`: `storefront/index.tsx`, `bookings/index.tsx`, `clients/index.tsx`, `services/index.tsx`, `reports/index.tsx`, `subscription/index.tsx` — masing-masing menampilkan judul + teks "Segera hadir." agar navigasi sidebar tidak 404.
- **`routeTree.gen.ts`** diperbarui dengan 6 route GlowBook baru terdaftar penuh (import, konstanta route, interface type, children map).

#### Diubah
- **`frontend/src/lib/i18n.ts`** — `fallbackLng` diubah `'en'` → `'id'`; urutan `supportedLngs` diubah menjadi `['id', 'en']` agar locale Indonesia menjadi default.
- **`frontend/src/components/layout/data/sidebar-data.ts`** — menu diganti penuh ke GlowBook: Dashboard, Storefront, Booking & Order, Klien, Layanan (grup Utama); Laporan, Langganan (grup Bisnis); Pengaturan dengan sub-item tetap (grup Lainnya). Branding team diubah ke "GlowBook / Pro". Semua ikon dari lucide-react.
- **`frontend/src/components/layout/app-title.tsx`** — teks "Shadcn-Admin / Vite + ShadcnUI" diganti "GlowBook / Platform MUA".
- **`frontend/index.html`** — `<title>` dan semua meta tag (title, description, OG, Twitter) diganti ke branding GlowBook; URL referensi diubah ke `glowbook.id`.

#### Verifikasi
- `npm install --legacy-peer-deps` lulus (1 vulnerability minor bawaan template, tidak kritis untuk fase shell).
- `npm run build` lulus: `tsc -b` 0 error, Vite membangun 3942 modul, output `dist/` lengkap.
- `npm run dev` boot di `http://localhost:5173/` dan merespons HTTP 200.
- Catatan peer-deps: `i18next@24` membutuhkan TypeScript `^5` sedangkan proyek memakai TypeScript `~6.0.3`; diselesaikan dengan `--legacy-peer-deps`. Ini bawaan template dan tidak mempengaruhi build/runtime.

### 2026-06-30

#### Diubah (terbaru)
- **`frontend-engineer` diperkaya** dengan konvensi konkret template `shadcn-admin` (pola fitur, building block data-table, hooks, routing, i18n `id`, integrasi API NestJS, auth nyata) — disiapkan untuk adopsi `shadcn-admin-main` sebagai basis app FE (`frontend/`).
- **Nilai enum status → UPPERCASE_ENGLISH** di seluruh dokumen (Tenant, Subscription, Invoice, Booking, Payment, Review, Notification) — definisi skema (`data-model.md`, PRD §5), prosa, dan diagram state (F04/F05/F06/F07). Nilai eksternal Midtrans (`capture`/`pending`/`expire`/dll.) **dibiarkan apa adanya**.
- Harga tier langganan difinalkan dari placeholder → **Basic Rp 20.000 / Pro Rp 50.000 / Bisnis Rp 150.000** per bulan; disinkronkan di `docs/features/F07-langganan-midtrans.md`, `docs/business-model.md`, dan `PRD-MUA-SaaS.md`.

#### Ditambahkan
- **Agent `tech-lead`** (`.claude/agents/tech-lead.md`, model opus) sebagai **agent utama/default** (`.claude/settings.json` → `"agent": "tech-lead"`) — pengarah implementasi yang mendelegasikan ke 6 spesialis.
- **Roadmap implementasi** [`docs/roadmap.md`](docs/roadmap.md) — Fase 0–4, stack (FE shadcn-admin + BE NestJS/PostgreSQL), pemilik agent per area.
- **6 subagent** di `.claude/agents/`: `frontend-engineer`, `backend-engineer`, `payments-midtrans`, `database-architect`, `security-reviewer` (read-only), `qa-testing`.
- **`User.timezone`** (opsional/nullable untuk sekarang) di `data-model.md` & PRD §5.
- Konvensi **enum status kanonik** (tabel UPPERCASE_ENGLISH) di `docs/conventions.md`.
- `changelog.md` + hook `PostToolUse` (Write/Edit) yang mengingatkan agar changelog selalu diperbarui setiap ada perubahan.
- `PRD-MUA-SaaS.md` — PRD lengkap dengan bab mendalam mekanisme pembayaran (klien→MUA manual non-kustodi; langganan→platform via Midtrans).
- Folder `docs/`: peta fitur (`README.md`), `conventions.md`, `architecture.md`, `data-model.md`, `business-model.md`, dan 12 dokumen fitur `F01`–`F12`.
- Entitas **`Theme` per tenant** (tampilan storefront) di ERD, `data-model.md`, F01 (theme default saat onboarding), F02 (render & kustomisasi), dan PRD.

#### Diubah
- **Kepemilikan → Paket A: 1 user : 1 tenant** (tabel `User` & `Tenant` terpisah, relasi 1:1). Multi-tenant per user dipindah ke paket masa depan.
- **Monetisasi → langganan tier kuota berbasis volume order** (revisi RULE-2, tetap langganan bukan komisi), ditagih per tenant.
- Tier teratas di-rename **"Studio" → "Bisnis"** di seluruh dokumen.
- Persona PRD disederhanakan: aktor inti **User(MUA)** & **Admin(Sistem)**; Klien ditegaskan bukan user SaaS.
- Alur onboarding: daftar trial → buat akun `User` → langsung masuk onboarding tenant.
