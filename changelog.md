# Changelog

Semua perubahan penting pada proyek ini dicatat di file ini.
Format mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.1.0/): entri terbaru di atas, dikelompokkan **Ditambahkan / Diubah / Dihapus / Diperbaiki**.

> **Catatan untuk agent:** setiap kali membuat perubahan pada repo (dokumen, kode, konfigurasi), tambahkan entri ke bagian `[Belum Dirilis]` di bawah — pada tanggal yang sama — **sebelum menutup tugas**.

## [Belum Dirilis]

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
