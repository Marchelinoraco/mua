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
