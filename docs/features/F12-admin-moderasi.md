# F12 — Konsol Admin & Moderasi

| Atribut | Nilai |
|---------|-------|
| **ID** | F12 |
| **Rilis** | R3 |
| **Modul PRD** | §6.12 |
| **Kebutuhan Bisnis** | RULE-4, BR-10 |
| **Status** | Draft |
| **Dependensi** | semua |

## 1. Tujuan
Memberi tim platform alat ringan untuk **moderasi reaktif** (report/flag), dukungan, dan pengelolaan plan/langganan — menjaga kualitas tanpa verifikasi manual berat (operasi ringan, tim kecil).

## 2. User Stories
- **US-F12-1:** Sebagai admin, saya melihat daftar tenant + status langganan & invoice.
- **US-F12-2:** Sebagai admin, saya menangani report/flag storefront & ulasan (sembunyikan/abaikan).
- **US-F12-3:** Sebagai admin, saya men-suspend tenant yang melanggar.
- **US-F12-4:** Sebagai admin, saya mengelola `Plan` (harga, fitur).
- **US-F12-5:** Sebagai admin, saya membantu dukungan (lihat status, bukan ubah dana klien).

## 3. Kebutuhan Fungsional (FR)
- **FR-F12-1:** Daftar tenant lintas-tenant (read-mostly) + status langganan (lihat [F07](F07-langganan-midtrans.md)).
- **FR-F12-2:** Antrian moderasi: storefront ([F02](F02-storefront-publik.md)) & ulasan ([F11](F11-ulasan-rating.md)) yang di-flag.
- **FR-F12-3:** Tindakan: sembunyikan konten, suspend/unsuspend tenant, abaikan laporan.
- **FR-F12-4:** CRUD `Plan` **[global]**.
- **FR-F12-5:** **Audit log** semua tindakan admin (lintas-tenant) — wajib.
- **FR-F12-6:** Akses admin terpisah & ber-RBAC; tindakan sensitif tercatat.

## 4. Aturan & Logika Bisnis
- Moderasi bersifat **reaktif** (berbasis flag/report) + spot-check, bukan pra-moderasi.
- Admin **tidak** dapat mengubah/menyentuh dana klien (konsisten RULE-1).
- Suspend tenant → storefront nonaktif + notifikasi (mirip mekanisme `RESTRICTED`, lihat [F07](F07-langganan-midtrans.md)).

## 5. Data Terkait
`Tenant`, `Subscription`/`Invoice` (F07), `Review` (F11), report storefront (F02), `Plan` [global], `AuditLog` [global].

## 6. API / Endpoint (indikatif)
- `GET /admin/tenants` · `GET /admin/tenants/{id}`
- `GET /admin/moderation-queue`
- `POST /admin/content/{id}/hide` · `POST /admin/tenants/{id}/suspend`
- `GET/POST/PUT /admin/plans`
- `GET /admin/audit-logs`

## 7. Status / State Machine
Tenant (sisi admin): `active ↔ suspended`. Konten: `published → hidden`.

## 8. Edge Case
- Tindakan admin pada tenant aktif berbayar → wajib audit + alasan.
- Report palsu/berlebihan → throttle pelapor.
- Akses admin disalahgunakan → semua tindakan ter-audit & dapat ditinjau.

## 9. Kriteria Penerimaan (AC)
- **AC-F12-1:** Setiap tindakan admin tercatat di audit log lengkap (pelaku, sebelum/sesudah).
- **AC-F12-2:** Admin dapat menangani antrian moderasi & suspend tenant.
- **AC-F12-3:** Konsol admin tidak menyediakan jalur untuk mengubah dana klien.

## 10. Di Luar Lingkup Fitur
- Moderasi otomatis berbasis AI.
- Dashboard analitik bisnis platform lanjutan.

## 11. Metrik
Waktu tangani report, jumlah suspend, akurasi moderasi, beban admin per 100 tenant (operasi ringan).
