# Changelog

Semua perubahan penting pada proyek ini dicatat di file ini.
Format mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.1.0/): entri terbaru di atas, dikelompokkan **Ditambahkan / Diubah / Dihapus / Diperbaiki**.

> **Catatan untuk agent:** setiap kali membuat perubahan pada repo (dokumen, kode, konfigurasi), tambahkan entri ke bagian `[Belum Dirilis]` di bawah — pada tanggal yang sama — **sebelum menutup tugas**.

## [Belum Dirilis]

### 2026-07-09 — Vercel build fix: Prisma client generation sebelum NestJS compile

#### Diperbaiki
- **`backend/vercel.json`** — tambah `buildCommand: "npm run vercel-build && npm run build"` agar Vercel menjalankan `prisma generate` (dan migrasi) **sebelum** `nest build`. Tanpa ini, `@prisma/client` belum ter-generate → 47 TS error saat build.

---

### 2026-07-05 — Deploy: adaptasi Vercel serverless + Neon, workflow branch dev/main

#### Ditambahkan
- **`backend/src/app.setup.ts`** — fungsi `configureApp(app)` (global prefix `api` + CORS dari `CORS_ORIGIN`), dipakai bersama oleh entry dev lokal dan serverless — tanpa duplikasi bootstrap.
- **`backend/api/index.ts`** — entry serverless Vercel: bootstrap NestJS di atas `ExpressAdapter`, `app.init()` tanpa listen, promise bootstrap di-cache di module scope (reset saat gagal agar invocation berikut bisa retry), export default handler Express.
- **`backend/vercel.json`** — region `sin1` (Singapore, dekat Neon), rewrite semua path → function `/api/index` (zero-config).
- **`frontend/vercel.json`** — rewrite SPA fallback ke `/index.html` (TanStack Router client-side routing).
- **`docs/conventions.md`** — seksi baru **Workflow Branch & Rilis**: branch `dev` (kerja harian → Neon `dev` + Vercel Preview) dan `main` (production → Neon `main` + Vercel Production); merge `dev`→`main` langsung (tanpa PR) **hanya saat user memerintahkan rilis**.
- **`docs/architecture.md`** — seksi Deployment: Vercel 2 project (Root Directory `backend/` & `frontend/`), Neon 2 branch, tabel pemetaan git↔Vercel↔Neon, aturan env var per scope (Production/Preview).

#### Diubah
- **`backend/prisma.config.ts`** — migrasi memakai `DIRECT_DATABASE_URL ?? DATABASE_URL` (Neon: migrasi wajib koneksi direct; runtime `PrismaService` tetap `DATABASE_URL` pooled).
- **`backend/src/main.ts`** — di-refactor memanggil `configureApp(app)`; perilaku dev lokal tidak berubah.
- **`backend/package.json`** — script baru `vercel-build` (`prisma generate && prisma migrate deploy` — migrasi otomatis mengikuti env branch saat deploy); `express` dieksplisitkan ke `dependencies`.
- **`backend/tsconfig.build.json`** — exclude folder `api/` dari `nest build` lokal (function di-compile oleh Vercel, tidak masuk `dist/`).
- **`backend/.env.example`** — tambah `DIRECT_DATABASE_URL` (contoh format Neon direct), `CORS_ORIGIN`; perjelas contoh `DATABASE_URL` format Neon pooled.
- **`frontend/.env.example`** — tambah contoh nilai production `VITE_API_URL=https://<api-domain>.vercel.app/api`.
- **`backend/.gitignore`** — perkuat pola menjadi `.env` + `.env.*` (kecuali `.env.example`), agar file referensi env berisi secret (mis. `.env.vercel.local`) tidak pernah ter-commit.
- **Workflow git** — commit milestone kini ke branch **`dev`** (bukan `main`); `main` hanya menerima merge saat rilis.

---

### 2026-07-05 — Frontend F03: halaman Layanan (katalog, transport, custom field)

#### Ditambahkan
- **`frontend/src/features/services/`** — fitur halaman "Layanan" penuh menggantikan placeholder "Segera hadir", mengikuti pola `frontend/src/features/users/` (provider + dialogs coordinator + primary-buttons) dan `frontend/src/features/onboarding/` (hook TanStack Query langsung ke `api` Axios, toast via `sonner`):
  - `data/types.ts` — tipe `Service`, `TransportRule`, `TransportZone`, `CustomField` persis kontrak `ServiceResponseDto` dkk dari backend-engineer.
  - `data/schema.ts` — skema Zod `serviceFormSchema`, `transportRuleFormSchema`, `customFieldFormSchema` dengan validasi conditional: `dpNilai` ≤ 100 saat `dpTipe=PERSEN`; `flatNominal` wajib saat `mode=FLAT`; `zona` non-kosong saat `mode=ZONA`; `opsi` non-kosong saat `tipe=select`. Mengekspor tipe `*FormInput` (bentuk sebelum coerce, dipakai `defaultValues`) terpisah dari `*FormValues` (bentuk output, dipakai payload mutation) — diperlukan karena `z.coerce.number()` punya input (`unknown`) dan output (`number`) berbeda di Zod v4 + `@hookform/resolvers` v5 (`useForm<Input, Context, Output>`).
  - `data/data.ts` — daftar nilai enum mentah (`SERVICE_TIPE_VALUES`, `DP_TIPE_VALUES`, `CUSTOM_FIELD_TIPE_VALUES`) + kelas badge status aktif theme-aware (pola `BOOKING_STATUS_BADGE_CLASS`); label ditampilkan lewat i18n, bukan hardcode di file ini.
  - `hooks/use-services.ts`, `hooks/use-transport-rule.ts`, `hooks/use-custom-fields.ts` — `useServices`/`useCreateService`/`useUpdateService`/`useToggleServiceAktif`, `useTransportRule`/`useUpsertTransportRule`, `useCustomFields`/`useCreateCustomField`/`useUpdateCustomField`/`useDeleteCustomField`. Semua mutation invalidate query cache terkait + toast sukses/error (`handleServerError`). `useDeleteCustomField` menangani khusus 409 (field masih dipakai booking historis) dengan menampilkan pesan dari `response.data.message`/`title` backend, bukan pesan generik.
  - `components/service-provider.tsx` + `service-dialogs.tsx` + `service-primary-buttons.tsx` — koordinasi dialog create/edit (state `open`/`currentRow` via context), tombol "Tambah Layanan" di header halaman terhubung ke tombol edit per-baris di tabel.
  - `components/service-list.tsx` — tabel shadcn: nama, kategori (Badge `tipe`), harga (`formatCurrencyIDR`), durasi, DP ("30%" atau `formatCurrencyIDR`), ikon transport bila `butuhTransport`, Badge status aktif/nonaktif, `Switch` toggle aktif langsung dari baris, tombol edit. Loading (`Skeleton`), error, dan empty state ditangani di komponen.
  - `components/service-form-dialog.tsx` — dialog create/edit: nama, deskripsi, harga (prefix "Rp"), durasi (suffix "menit"), tipe (`Select`), dpTipe (`Select`) + dpNilai (suffix "%"/"Rp" dinamis mengikuti `dpTipe`), butuhTransport (`Switch`).
  - `components/transport-settings-card.tsx` — `RadioGroup` FLAT/ZONA; FLAT menampilkan satu input nominal, ZONA menampilkan daftar dinamis `{nama, nominal}` via `useFieldArray` RHF dengan tombol tambah/hapus baris. Submit menormalkan payload (`flatNominal`/`zona` di-null-kan sesuai mode aktif) sebelum memanggil `useUpsertTransportRule`.
  - `components/custom-field-list.tsx` + `custom-field-form-dialog.tsx` — list (tabel) + dialog create/edit custom field. `opsi` (khusus `tipe=select`) memakai input tag-list manual (state lokal + `form.setValue`, bukan `useFieldArray`, karena RHF `useFieldArray` mengharuskan array objek sedangkan `opsi` adalah `string[]`) dengan badge yang bisa dihapus. Hapus field pakai `ConfirmDialog` (`frontend/src/components/confirm-dialog.tsx`) — sesuai aturan bisnis, `CustomField` boleh dihapus permanen (beda dari `Service`).
  - `index.tsx` — halaman utama: Header + tombol "Tambah Layanan", lalu 3 seksi `ServiceList` / `TransportSettingsCard` / `CustomFieldList` dalam satu `ServiceProvider`.
  - **Tidak ada tombol hapus untuk `Service`** di UI manapun — hanya `Switch` aktif/nonaktif (FR-F03-6, riwayat order lama tetap valid).
- **`frontend/src/routes/_authenticated/services/index.tsx`** — ganti placeholder "Segera hadir" agar merender `Services` dari `@/features/services` (pola sama seperti `routes/_authenticated/index.tsx` → `Dashboard`).
- **`frontend/src/locales/id/services.json`** + **`frontend/src/locales/en/services.json`** — namespace i18n baru (judul, label form, pesan toast, opsi enum, empty/error state); didaftarkan di **`frontend/src/lib/i18n.ts`** (resource `services` untuk `id`/`en`).

#### Verifikasi
- `npm run build` (tsc -b && vite build) — 0 error TypeScript.
- `npx eslint src/features/services src/routes/_authenticated/services src/lib/i18n.ts --max-warnings=0` — 0 error, 0 warning (termasuk suppress terarah `react-hooks/incompatible-library` untuk `form.watch()`, pola sama seperti `otp-form.tsx`/`users-table.tsx`).
- Belum ada test baru ditulis untuk fitur ini (tidak ada `*.test.tsx` di `features/services`) — endpoint backend (`/services`, `/transport-rule`, `/custom-fields`) diasumsikan sesuai kontrak yang diberikan tech-lead; integrasi end-to-end belum diverifikasi terhadap backend nyata.

### 2026-07-05 — Backend F03: modul Katalog Layanan, Transport Rule, Custom Field

#### Ditambahkan
- **`backend/src/services/`** (`ServicesModule`) — CRUD (tanpa hapus) katalog layanan tenant:
  - `GET /services?aktif=true|false` — list urut `urutanTampil` asc lalu `createdAt` asc.
  - `POST /services`, `PUT /services/:id` — create/update, validasi `class-validator` (harga & durasi positif, `dpNilai >= 0`).
  - `PATCH /services/:id` — toggle `aktif`; **tidak ada endpoint DELETE** (FR-F03-6, jaga riwayat `BookingItem`).
  - Validasi bisnis "`dpNilai` ≤ 100 jika `dpTipe=PERSEN`" dilakukan di `ServicesService` (bukan DTO) dengan menggabungkan payload baru + data lama, karena `dpTipe`/`dpNilai` bisa dikirim di request update terpisah.
  - Semua query difilter `tenantId` dari `@CurrentTenant()`; response tidak menyertakan `tenantId`; `harga`/`dpNilai` (Prisma `Decimal`) dikonversi eksplisit ke `number`.
- **`backend/src/transport-rules/`** (`TransportRulesModule`) — aturan transport 1:1 per tenant:
  - `GET /transport-rule` — kembalikan `null` (bukan 404) jika tenant belum pernah mengatur.
  - `PUT /transport-rule` — upsert; validasi conditional via `@ValidateIf` berdasar `mode` (`FLAT` → `flatNominal` wajib; `ZONA` → `zona[]` wajib non-kosong, divalidasi nested via `class-transformer`).
- **`backend/src/custom-fields/`** (`CustomFieldsModule`) — pertanyaan booking kustom per tenant:
  - `GET/POST/PUT/DELETE /custom-fields` — CRUD penuh (field ini boleh hard delete, beda dengan `Service`).
  - `DELETE` menangkap error FK Prisma `P2003` → `409 Conflict` ("Custom field masih dipakai booking, tidak bisa dihapus.") jika masih direferensikan `CustomFieldValue` booking historis.
  - Validasi "`opsi` wajib non-kosong jika `tipe=select`" digabung dengan data lama di service (pola sama seperti `ServicesService`).
- **`backend/src/common/pricing/pricing.util.ts`** — util murni untuk kalkulasi harga (dipakai lintas modul, disiapkan untuk F04 booking):
  - `computeDpAmount(harga, dpTipe, dpNilai)` — PERSEN dibulatkan ke rupiah terdekat; NOMINAL di-clamp agar tidak melebihi harga.
  - `computeTransportFee(rule, zonaNama?)` — `null` → 0; `FLAT` → `flatNominal`; `ZONA` → cari berdasar nama, 0 jika tidak ditemukan.
  - Unit test `pricing.util.spec.ts` (11 kasus): DP persen/nominal (AC-F03-1), transport flat/zona termasuk zona tak ditemukan (AC-F03-2), clamp DP nominal > harga.
- Ketiga module didaftarkan di `backend/src/app.module.ts` (pola sama seperti `OnboardingModule`/`PaymentProfileModule`).

#### Verifikasi
- `npx tsc --noEmit` — 0 error.
- `npm test` — 11/11 lulus (`pricing.util.spec.ts`).
- `npm run start:dev` (proses watch existing) tetap hidup setelah perubahan; endpoint baru dicek via `curl` — `GET/PUT/PATCH/DELETE` baru mengembalikan `401` (guard JWT aktif, bukan 404) untuk `/api/services`, `/api/transport-rule`, `/api/custom-fields`.

### 2026-07-05 — Skema: lengkapi Service (DP + transport) & TransportRule baru (persiapan F03)

#### Ditambahkan
- **`backend/prisma/schema.prisma`** — tutup gap skema vs [data-model.md](docs/data-model.md) untuk F03 (Katalog Layanan):
  - Enum baru `DpTipe { PERSEN NOMINAL }` dan `TransportMode { FLAT ZONA }`.
  - Model `Service`: tambah `dpTipe` (default `PERSEN`), `dpNilai` (Decimal 15,2, default 0 — persen 0-100 atau nominal rupiah tergantung `dpTipe`), `butuhTransport` (Boolean, default `false`).
  - Model baru `TransportRule` — 1:1 per tenant (`tenantId @unique`), `mode` (`FLAT`/`ZONA`), `flatNominal` nullable, `zona` JSONB nullable (array `{nama, nominal}`), relasi cascade ke `Tenant`, index `@@index([tenantId])`. Relasi balik `Tenant.transportRule`.
  - Model `BookingItem`: tambah `qty` (Int, default 1) sesuai `data-model.md` baris 46 — aman karena tabel masih kosong (F04 belum insert data).
- **Migrasi Prisma** `backend/prisma/migrations/20260705085619_f03_katalog_layanan_transport_dp/` — additive only (2 `CREATE TYPE`, 2 `ALTER TABLE ADD COLUMN` dengan default, 1 `CREATE TABLE` + index & FK baru); diterapkan bersih ke database dev (`glowbook-db`), `prisma migrate status` bersih.

### 2026-07-05 — Fix: registrasi 500 (tabel Plan kosong) + seed data Plan

#### Ditambahkan
- **`backend/prisma/seed.ts`** — seed 3 tier `Plan` global sesuai [business-model.md](docs/business-model.md) §3.3 (placeholder, belum final): Basic (kuota 30/bulan, Rp20.000), Pro (kuota 100/bulan, Rp50.000), Bisnis (unlimited, Rp150.000). Idempoten via `upsert` pada `tierUrutan`. Jalankan: `npx prisma db seed`.
- **`backend/prisma.config.ts`** — tambah `migrations.seed: "ts-node prisma/seed.ts"` (konvensi seed Prisma 7 dipindah dari `package.json` ke config file).

#### Diperbaiki
- **`backend/src/auth/auth.service.ts`** — `POST /auth/register` selalu gagal 500 saat tabel `Plan` kosong: kode lama menutupi bug dengan `planId: firstPlan?.id ?? null` + `as any`, padahal `Subscription.planId` adalah kolom **wajib** (NOT NULL FK ke `Plan`) — insert melanggar constraint di level database. Sekarang: jika tidak ada Plan aktif, lempar `InternalServerErrorException` yang jelas ("seed data belum dijalankan") alih-alih insert diam-diam dengan `null`; hapus band-aid `as any`.

---

### 2026-07-05 — Fix: PrismaService gagal start (Prisma 7 butuh driver adapter)

#### Diperbaiki
- **`backend/src/prisma/prisma.service.ts`** — `PrismaClient` gagal diinisialisasi saat `npm run start:dev` pertama kali: Prisma 7 dengan generator `prisma-client-js` default memakai engine type `client` (tanpa binary Rust bawaan) sehingga **wajib** diberi `adapter` di constructor (bukan connection string langsung). Tambah `PrismaPg` dari `@prisma/adapter-pg` dibangun dari `process.env.DATABASE_URL`.

#### Ditambahkan
- **`backend/package.json`** — dependensi baru `@prisma/adapter-pg`, `pg`; devDependency `@types/pg`.
- **`backend/.env`** (tidak dikomit — lihat `.gitignore`) — dibuat lokal oleh user berisi `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV` untuk pengembangan lokal dengan PostgreSQL via Docker (`docker run postgres:16`, port 5432).

---

### 2026-07-05 — Dashboard: Redesign Overview ala CommerceO (data mock siap-API)

#### Ditambahkan
- **`frontend/src/components/ui/chart.tsx`** — primitif chart resmi shadcn/ui (`ChartContainer`, `ChartTooltip`, `ChartLegend`) membungkus recharts; theme-aware via CSS variables (`--chart-1`…`--chart-5`).
- **`frontend/src/components/ui/progress.tsx`** — komponen Progress (radix-ui) untuk bar kuota order.
- **`frontend/src/features/dashboard/data/types.ts`** — kontrak `DashboardStats` = acuan DTO future `GET /dashboard/stats` (revenue/bookings/clients + `deltaPct`, `quota`, `weeklyRevenue`, `statusBreakdown`, `recentBookings`, `upcomingBookings`, `popularServices`); enum `BookingStatus` UPPERCASE_ENGLISH sesuai `docs/data-model.md`.
- **`frontend/src/features/dashboard/data/status.ts`** — urutan tampil status, kelas Badge per status (light/dark), dan warna chart per status via CSS variables (tanpa hex hardcode).
- **`frontend/src/features/dashboard/data/mock-stats.ts`** — data dummy deterministik bernuansa MUA Indonesia (layanan wedding/wisuda/party, nominal Rupiah wajar).
- **`frontend/src/features/dashboard/hooks/use-dashboard-stats.ts`** — hook TanStack Query `['dashboard-stats']`; `queryFn` resolve mock dengan TODO ganti ke `api.get('/dashboard/stats')` pasca F02–F04.
- **`frontend/src/features/dashboard/components/`** — komponen baru: `stat-cards.tsx` (4 kartu: Pendapatan IDR, Booking, Klien, Kuota Order + progress bar; fallback `subscription.ordersUsedPeriod` dari auth-store), `revenue-chart.tsx` (area chart mingguan), `booking-status-card.tsx` (donut + legend per status), `recent-bookings-table.tsx` (tabel kode/klien/layanan/tanggal/DP/Badge status), `upcoming-bookings.tsx` (jadwal terdekat), `popular-services.tsx` (layanan terpopuler).
- **`frontend/src/routes/_authenticated/availability/index.tsx`** — route placeholder Ketersediaan ("Segera hadir").
- **`frontend/src/lib/utils.ts`** — helper `formatCurrencyIDR()` (Intl.NumberFormat id-ID, tanpa desimal).

#### Diubah
- **`frontend/src/features/dashboard/index.tsx`** — dirakit ulang mengikuti layout CommerceO adaptasi MUA: baris 4 stat cards → grafik pendapatan + donut status → tabel booking terbaru + kolom jadwal terdekat & layanan terpopuler; skeleton loading per seksi; state error; `TrialBanner` dan tab Analytics dipertahankan; TopNav sisa template (Customers/Products disabled) dihapus.
- **`frontend/src/components/layout/data/sidebar-data.ts`** — tambah item **Ketersediaan** (`/availability`, ikon `CalendarClock`) di grup Utama.
- **`frontend/src/locales/id/dashboard.json`** + **`en/dashboard.json`** — kunci baru untuk judul kartu, label status booking, dan judul seksi.
- **`frontend/package.json`** — tambah dependensi `radix-ui` (Progress).

#### Dihapus
- **`frontend/src/features/dashboard/components/overview.tsx`** dan **`recent-sales.tsx`** — widget default template (data `Math.random()` dan nama hardcoded), digantikan komponen domain MUA di atas.

---

### 2026-07-01 — Fase 1 F01: Auth FE + Wizard Onboarding

#### Ditambahkan
- **`frontend/src/lib/api.ts`** — Axios instance (`VITE_API_URL`); request interceptor pasang `Authorization: Bearer <token>` dari auth-store; response interceptor 401 → `reset()` + redirect ke `/sign-in`; response interceptor 5xx → `toast.error`.
- **`frontend/src/features/onboarding/data/schema.ts`** — skema Zod `paymentProfileSchema` + `onboardingChecklistSchema`; tipe `PaymentProfileFormValues` dan `OnboardingChecklist`.
- **`frontend/src/features/onboarding/components/onboarding-checklist.tsx`** — komponen + hook `useOnboardingChecklist` (TanStack Query `GET /onboarding/checklist`); tampilkan badge "Siap Tayang" atau daftar item belum selesai.
- **`frontend/src/features/onboarding/components/onboarding-payment-step.tsx`** — form PaymentProfile (namaBank, nomorRekening, namaPemilik, instruksiTambahan); `PUT /payment-profile` via `useMutation`; disclaimer dana non-kustodi; invalidasi checklist setelah simpan.
- **`frontend/src/features/onboarding/index.tsx`** — `OnboardingWizard` 3-step: (1) selamat datang + info trial, (2) PaymentProfile, (3) stub layanan + checklist. Progress bar inline (Radix Progress tidak terinstal karena konflik peer-dep TS6), step pills, `Badge` langkah.
- **`frontend/src/routes/_authenticated/onboarding/index.tsx`** — route TanStack `/_authenticated/onboarding/` yang render `OnboardingWizard`.
- **`frontend/src/features/dashboard/components/trial-banner.tsx`** — `TrialBanner`: baca `subscription` dari auth-store; jika `TRIALING` tampilkan Alert kuning (sisa hari); jika ≤ 3 hari Alert merah + tombol "Berlangganan Sekarang" (link ke `/subscription`).
- **`frontend/.env.example`** — template env: `VITE_API_URL=http://localhost:3000/api`.

#### Diubah
- **`frontend/src/stores/auth-store.ts`** — diganti total: hapus token dummy `'thisisjustarandomstring'`; tipe baru `AuthUser { id, email, phone?, timezone? }`, `AuthTenant { id, slug, namaBisnis, kota, status }`, `AuthSubscription { status, currentPeriodEnd, ordersUsedPeriod }`; tambah `tenant`, `subscription`, `justRegistered`; method baru `setAuth(token, user, tenant, subscription)`, `setJustRegistered(value)`. Cookie key diubah ke `glowbook_access_token`.
- **`frontend/src/features/auth/sign-in/components/user-auth-form.tsx`** — ganti `sleep(2000)` mock dengan `api.post('/auth/login')`; simpan response via `auth.setAuth()`; `toast.promise()` pola template; hapus tombol OAuth (tidak relevan GlowBook).
- **`frontend/src/features/auth/sign-up/components/sign-up-form.tsx`** — diganti total: form 2-step (Step 1: email, phone, password, konfirmasi; Step 2: namaBisnis, slug, kota); slug check real-time debounced 500 ms via `GET /tenants/slug-check`; indikator `CheckCircle2`/`XCircle`/`Loader2`; submit → `POST /auth/register` → `setAuth` + `setJustRegistered(true)` → navigate ke `/onboarding`.
- **`frontend/src/routes/_authenticated/route.tsx`** — tambah `beforeLoad`: redirect ke `/sign-in` jika tidak ada token; redirect ke `/onboarding` jika `justRegistered === true` dan belum di halaman onboarding.
- **`frontend/src/features/dashboard/index.tsx`** — tambah `<TrialBanner />` di awal `<Main>`.
- **`frontend/src/locales/id/auth.json`** — tambah kunci baru: signUp multi-step (phone, namaBisnis, slug, kota, hint, status slug), onboarding (step1–step3, checklist).
- **`frontend/src/locales/en/auth.json`** — sinkronkan kunci baru sesuai versi Indonesia.
- **`frontend/src/stores/auth-store.test.ts`** — perbarui `sampleUser` ke shape `AuthUser` baru (`id` + `email`); hapus field lama `accountNo`/`role`/`exp`.
- **`frontend/src/features/auth/sign-in/components/user-auth-form.test.tsx`** — perbarui mock: `setAuth` menggantikan `setUser`/`setAccessToken` terpisah; mock `api.post`; label disesuaikan ke teks Bahasa Indonesia.

#### Verifikasi
- `npm run build` (frontend) — lulus, **0 TypeScript error**.

---

### 2026-07-01 — Fase 1 F01: Onboarding Endpoint Lengkap

#### Ditambahkan
- **`backend/src/auth/dto/me-response.dto.ts`** — DTO response `GET /auth/me`: `{ user, tenant, subscription }`; tidak menyertakan `passwordHash` / `ownerUserId`.
- **`backend/src/auth/dto/verify-otp.dto.ts`** — DTO `POST /auth/verify-otp`: validasi `phone` (format internasional) + `otp` string.
- **`backend/src/onboarding/`** — `OnboardingModule` baru:
  - `onboarding.service.ts` — `getChecklist(tenantId)`: query paralel `Service.count({ aktif: true })` + `PaymentProfile.findUnique`; kembalikan `{ hasService, hasPaymentProfile, isReady }`. TODO F05 untuk `hasAvailability`.
  - `onboarding.controller.ts` — `GET /onboarding/checklist` terproteksi `JwtAuthGuard`, scoped `@CurrentTenant()`.
  - `onboarding.module.ts` — modul NestJS.
- **`backend/src/payment-profile/`** — `PaymentProfileModule` baru (RULE-1 nol kustodi):
  - `dto/upsert-payment-profile.dto.ts` — validasi `namaBank`, `nomorRekening`, `namaPemilik`, `instruksiTambahan?` dengan `class-validator`.
  - `dto/payment-profile-response.dto.ts` — response tanpa `tenantId`.
  - `payment-profile.service.ts` — `getPaymentProfile(tenantId)` + `upsertPaymentProfile(tenantId, dto)` via Prisma `upsert`; semua query filter `tenantId`.
  - `payment-profile.controller.ts` — `GET /payment-profile` + `PUT /payment-profile`, keduanya terproteksi `JwtAuthGuard`.
  - `payment-profile.module.ts` — modul NestJS.
- **`backend/src/tenant/dto/slug-check-response.dto.ts`** — DTO `{ available: bool, suggestion?: string }`.

#### Diubah
- **`backend/src/auth/auth.service.ts`** — `register()` diperluas: transaksi atomik tunggal kini membuat `User + Tenant + Theme(default) + Subscription(TRIALING 14 hari)`. Guard anti-duplikat tenant: `ConflictException` jika `User` sudah punya `Tenant`. Tambah `getMe(userId, tenantId)` untuk endpoint `GET /auth/me` (query `User` + `Tenant` paralel, tanpa bocor field sensitif).
- **`backend/src/auth/auth.controller.ts`** — tambah `GET /auth/me` (terproteksi `JwtAuthGuard`) dan `POST /auth/verify-otp` (stub, selalu `{ verified: true }`, TODO F08). Perbaiki import `JwtPayload` dengan `import type` untuk kompatibilitas `isolatedModules`.
- **`backend/src/tenant/tenant.service.ts`** — tambah `checkSlug(slug)`: validasi pola `^[a-z0-9-]{3,30}$`, cek DB, beri saran `slug-2`…`slug-10` jika tidak tersedia.
- **`backend/src/tenant/tenant.controller.ts`** — refactor: prefix diubah ke `tenants`; tambah `GET /tenants/slug-check?slug=xxx` (publik, tanpa JWT); `GET /tenants/me` + `PATCH /tenants/me` tetap terproteksi JWT (guard dipindah ke level method).
- **`backend/src/app.module.ts`** — daftarkan `OnboardingModule` dan `PaymentProfileModule`.

#### Verifikasi
- `npm run build` — lulus, 0 TypeScript error.

---

### 2026-06-30 — Penutup Fase 0: Roadmap Diperbarui + Handoff Notes Fase 1

#### Diubah
- **`docs/roadmap.md`** — ditandai Fase 0 selesai per 2026-06-30 (frontend shell, backend NestJS + Auth + tenant-scoping guard, skema Prisma 17 model/10 enum); ditambahkan seksi "Handoff Fase 0 → Fase 1" berisi 5 risiko teknis yang wajib ditangani di Fase 1 (anti-bentrok atomik, `kodeBooking` atomik, `ordersUsedPeriod` atomik, auth FE nyata, `routeTree.gen.ts`).

---

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
