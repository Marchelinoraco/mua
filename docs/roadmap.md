# Roadmap Implementasi — GlowBook

Peta jalan dari **dokumen** (BRD/PRD/docs) menuju **implementasi**. Selaras dengan fase rilis R1–R4 ([conventions.md](conventions.md)) dan dokumen fitur [F01–F12](README.md).

## Status Sekarang
- ✅ BRD, PRD, model bisnis, arsitektur, model data, 12 dokumen fitur — selesai.
- ⏳ Implementasi belum dimulai.

## Stack Implementasi
| Lapis | Teknologi |
|------|-----------|
| **Frontend** | React 19 + Vite + TypeScript · TanStack Router/Query/Table · shadcn/ui (new-york) + Tailwind v4 · Zustand · React Hook Form + Zod · Axios · Vitest + Playwright. **Basis = template `shadcn-admin`** (referensi). |
| **Backend** | **NestJS + PostgreSQL** (Prisma) · arsitektur modular/clean · JWT auth + guards · class-validator/Zod DTO. |
| **Pembayaran** | Midtrans (Snap + Subscription API + webhook) untuk **langganan**; klien→MUA **manual non-kustodi**. |
| **Notifikasi** | WhatsApp Business API (utama) + email (fallback). |

## Pemilik Agent per Area
| Area | Agent |
|------|-------|
| **Orkestrasi & arahan implementasi (otak)** | **`tech-lead`** (agent utama/default) |
| UI/UX, storefront, dashboard | `frontend-engineer` |
| API, domain, multi-tenant | `backend-engineer` |
| Skema, migrasi, isolasi, index | `database-architect` |
| Midtrans, langganan, kuota, webhook | `payments-midtrans` |
| Audit isolasi/PDP/RULE-1, secrets | `security-reviewer` |
| Uji unit + browser + e2e | `qa-testing` |

---

## Fase 0 — Fondasi *(prasyarat semua)*
**Tujuan:** kerangka kerja siap, isolasi tenant ditegakkan sejak awal.
- Repo & struktur: **adopsi `shadcn-admin-main` → `frontend/`** (basis app FE, infra sudah siap); BE NestJS di `backend/`. Env & secret manager, config. Diorkestrasi oleh `tech-lead`.
- **Backend:** modul `Auth` (User akun), `Tenant`, **tenant-scoping guard/interceptor** (Paket A 1:1 via `owner_user_id`), Prisma + skema awal ([data-model.md](data-model.md)), migrasi, seed.
- **Frontend:** shell dashboard (layout/sidebar), routing TanStack, Axios client + auth interceptor, query client, store Zustand.
- CI: lint, format check, type-check, test, build.
- **DoD:** login → akun dibuat → tenant onboarding 1:1; setiap query ter-scope `tenant_id`; pipeline hijau.

## Fase 1 — Alat Inti (R1)
**Tujuan:** MUA bisa terima booking nyata (belum ada pembayaran online).
| Urutan | Fitur | FE | BE | DB |
|--------|-------|----|----|----|
| 1 | [F01](features/F01-onboarding-tenant.md) Onboarding (akun→tenant, trial, Theme default) | ✓ | ✓ | ✓ |
| 2 | [F03](features/F03-katalog-layanan.md) Katalog layanan, transport, custom field | ✓ | ✓ | ✓ |
| 3 | [F05](features/F05-kalender-anti-bentrok.md) Kalender & anti-bentrok (hold, kunci atomik) | ✓ | ✓ | ✓ |
| 4 | [F02](features/F02-storefront-publik.md) Storefront publik + Theme per tenant | ✓ | ✓ | — |
| 5 | [F04](features/F04-booking-mandiri.md) Booking mandiri klien (+ OTP status) | ✓ | ✓ | ✓ |
| 6 | [F09](features/F09-manajemen-order-klien.md) Order & data klien | ✓ | ✓ | — |
| 7 | [F08](features/F08-notifikasi.md) Notifikasi dasar (WA/email) | ✓ | ✓ | — |
- **DoD:** klien booking via link publik → slot ter-hold anti-bentrok → MUA kelola order; notifikasi terkirim.

## Fase 2 — Pembayaran & Billing (R2) *(fokus berisiko tinggi)*
| Urutan | Fitur | Catatan |
|--------|-------|---------|
| 1 | [F06](features/F06-pembayaran-klien-manual.md) Pembayaran klien manual (DP/pelunasan + bukti) | **NON-kustodi** — konfirmasi MUA mengunci slot (`CONFIRMED`). |
| 2 | [F07](features/F07-langganan-midtrans.md) Langganan Midtrans tier kuota | Snap+tokenisasi → Subscription API; webhook (signature+idempoten); dunning; kuota `orders_used_period`; overage soft-block. |
- Owner utama: `payments-midtrans` + `backend-engineer`; ditinjau `security-reviewer`.
- **DoD:** trial→paid otomatis; webhook idempoten & terverifikasi; kuota & overage bekerja; tidak ada dana klien melewati platform.

## Fase 3 — Kepercayaan & Skala (R3)
- [F10](features/F10-laporan-pendapatan.md) Laporan/pendapatan · [F11](features/F11-ulasan-rating.md) Ulasan · [F12](features/F12-admin-moderasi.md) Konsol admin & moderasi.
- Hardening: observability (log webhook/notif), rate-limit, **audit keamanan menyeluruh** (`security-reviewer`), polish UX.
- **DoD:** review pra-rilis lulus; coverage alur kritis memadai.

## Fase 4 — Marketplace (R4)
- Di luar MVP. Arsitektur sudah disiapkan (storefront/rating/lokasi terstruktur).

---

## Cross-Cutting (di setiap fase)
- **Keamanan & isolasi:** `tenant_id` wajib di tiap query; authz tiap endpoint; secret di vault; PII terenkripsi; **RULE-1** (nol kustodi dana klien); kepatuhan UU PDP (retensi 90 hari saat `RESTRICTED`).
- **Konsistensi data:** enum status **UPPERCASE_ENGLISH** ([conventions.md](conventions.md)); harga ter-snapshot; status final pembayaran via konfirmasi MUA / Get Status API Midtrans.
- **Testing:** unit (Vitest/Nest) + browser (Playwright) untuk alur booking, anti-bentrok, webhook idempoten, isolasi tenant, kuota.
- **Changelog:** perbarui [changelog.md](../changelog.md) tiap perubahan (hook aktif).

## Prinsip Urutan
Fondasi → alat inti yang berguna hari-1 → monetisasi → kepercayaan. Pembayaran (Fase 2) hanya setelah booking stabil, karena bergantung pada `CONFIRMED` sebagai sumber hitung kuota.
