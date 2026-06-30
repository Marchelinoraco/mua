# Konvensi Dokumentasi Fitur

## Skema ID
- **Fitur:** `F01`–`Fnn` (urut sesuai peta di [README](README.md)).
- **Kebutuhan Fungsional:** `FR-<ID fitur>-<n>`, mis. `FR-F06-3`.
- **User Story:** `US-<ID fitur>-<n>`, mis. `US-F04-1`.
- **Kriteria Penerimaan:** `AC-<ID fitur>-<n>`.

## Legenda Status
| Status | Arti |
|--------|------|
| `Draft` | Spesifikasi sedang disusun |
| `Planned` | Disepakati, menunggu implementasi |
| `In Progress` | Sedang dibangun |
| `Done` | Selesai & diterima |

## Konvensi Enum Status (Kanonik)
Nilai enum **status** ditulis **UPPERCASE_ENGLISH** (snake_case bila multi-kata) di seluruh dokumen, model data, dan kode. Ini sumber kebenaran:

| Entitas | Field | Nilai |
|---------|-------|-------|
| Tenant | `status` | `ACTIVE` `TRIAL` `PAST_DUE` `RESTRICTED` `CANCELED` |
| Subscription | `status` | `TRIALING` `ACTIVE` `PAST_DUE` `CANCELED` `EXPIRED` |
| Invoice | `status` | `PAID` `PENDING` `FAILED` |
| Booking | `status` | `AWAITING_DP` `CONFIRMED` `PAID` `COMPLETED` `CANCELED` `EXPIRED` |
| Payment | `status` | `PENDING` `SUBMITTED` `CONFIRMED` `REJECTED` |
| Review | `status` | `PUBLISHED` `FLAGGED` `HIDDEN` |
| Notification | `status` | `QUEUED` `SENT` `DELIVERED` `FAILED` `FALLBACK_EMAIL` |

> **Catatan:** nilai eksternal pihak ketiga (mis. `transaction_status` Midtrans: `capture`, `settlement`, `pending`, `deny`, `expire`, `refund`) **ditulis apa adanya** sesuai API, tidak di-uppercase. Field non-status (`jenis`, `tipe`, `mode`, `kanal`, `interval`) tetap memakai nilai domainnya saat ini.

## Legenda Rilis (selaras PRD §12)
- **R1 — Alat Inti:** onboarding, storefront, layanan, kalender, booking, order/klien, notifikasi dasar.
- **R2 — Pembayaran & Billing:** pembayaran klien manual + langganan Midtrans.
- **R3 — Kepercayaan & Skala:** ulasan, laporan, moderasi, polish.
- **R4 — Marketplace:** di luar MVP.

## Template Dokumen Fitur
Salin struktur berikut untuk fitur baru:

```markdown
# F0X — <Nama Fitur>

| Atribut | Nilai |
|---------|-------|
| **ID** | F0X |
| **Rilis** | R? |
| **Modul PRD** | §6.? |
| **Kebutuhan Bisnis** | BR-?, RULE-? |
| **Status** | Draft |
| **Dependensi** | F0? |

## 1. Tujuan
## 2. User Stories
## 3. Kebutuhan Fungsional (FR)
## 4. Alur Pengguna (UX Flow)
## 5. Aturan & Logika Bisnis
## 6. Data Terkait
## 7. API / Endpoint (indikatif)
## 8. Status / State Machine
## 9. Edge Case
## 10. Kriteria Penerimaan (AC)
## 11. Di Luar Lingkup Fitur
## 12. Metrik
```

> Endpoint & skema bersifat **indikatif** — final di desain teknis. Bahasa: Indonesia. UI mobile-first.
