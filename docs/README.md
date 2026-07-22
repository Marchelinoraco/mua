# MuaGlow — Dokumentasi Fitur

Peta detail fitur MuaGlow, diturunkan dari [PRD-MUA-SaaS.md](../PRD-MUA-SaaS.md) dan [BRD-MUA-SaaS.md](../BRD-MUA-SaaS.md).

Setiap fitur punya satu dokumen detail di [`features/`](features/) dengan format seragam (lihat [conventions.md](conventions.md)).

## Dokumen Fondasi
| Dokumen | Isi |
|---------|-----|
| [business-model.md](business-model.md) | **Kepemilikan (User & Tenant; Paket A = 1 user:1 tenant) & monetisasi (langganan tier kuota per order)** |
| [conventions.md](conventions.md) | Skema ID, legenda status, template dokumen fitur |
| [architecture.md](architecture.md) | Arsitektur tingkat tinggi, multi-tenancy, pemisahan dana |
| [data-model.md](data-model.md) | Entitas, relasi, dan kepemilikan tenant |
| [roadmap.md](roadmap.md) | **Peta jalan implementasi (Fase 0–4), stack, & pemilik agent** |

## Peta Fitur
| ID | Fitur | Rilis | Modul PRD | Kebutuhan Bisnis | Dependensi |
|----|-------|-------|-----------|------------------|------------|
| [F01](features/F01-onboarding-tenant.md) | Onboarding Tenant & Setup Awal | R1 | §6.1 | BR-1, BR-7 | — |
| [F02](features/F02-storefront-publik.md) | Storefront / Form Publik | R1 | §6.2 | BR-1, BR-2, BR-10 | F01, F03 |
| [F03](features/F03-katalog-layanan.md) | Katalog Layanan, Transport & Custom Field | R1 | §6.3 | BR-1 | F01 |
| [F04](features/F04-booking-mandiri.md) | Booking Mandiri oleh Klien | R1 | §6.4 | BR-2, BR-3 | F02, F03, F05 |
| [F05](features/F05-kalender-anti-bentrok.md) | Kalender & Anti-Bentrok | R1 | §6.5 | BR-3, RULE-3 | F01 |
| [F06](features/F06-pembayaran-klien-manual.md) | Pembayaran Klien → MUA (Manual, Non-Kustodi) | R2 | §6.6 / Bab 7 | BR-4, RULE-1 | F04 |
| [F07](features/F07-langganan-midtrans.md) | Langganan Tier Kuota per Tenant (Midtrans Otomatis) | R2 | §6.7 / Bab 8 | BR-7, RULE-2*, RULE-6 | F01 |
| [F08](features/F08-notifikasi.md) | Notifikasi Otomatis (WhatsApp/Email) | R1–R2 | §6.8, §9 | BR-5 | F04, F06, F07 |
| [F09](features/F09-manajemen-order-klien.md) | Manajemen Order & Data Klien | R1 | §6.9 | BR-6 | F04 |
| [F10](features/F10-laporan-pendapatan.md) | Laporan & Pendapatan | R3 | §6.10 | BR-6 | F06, F09 |
| [F11](features/F11-ulasan-rating.md) | Ulasan & Rating | R3 | §6.11 | BR-10 | F09 |
| [F12](features/F12-admin-moderasi.md) | Konsol Admin & Moderasi | R3 | §6.12 | RULE-4, BR-10 | semua |

## Catatan Lingkup
- **Kepemilikan:** User & Tenant terpisah; **Paket A (MVP) = 1 user : 1 tenant**; billing per tenant. Multi-tenant per user = paket masa depan. Lihat [business-model.md](business-model.md).
- **Monetisasi:** langganan **tier kuota berbasis volume order** per tenant — revisi RULE-2 (tetap langganan, bukan komisi). Ditandai `RULE-2*`.
- **Nol kustodi dana klien** (RULE-1): aliran DP/pelunasan klien → MUA bersifat manual, tidak melewati platform (lihat [F06](features/F06-pembayaran-klien-manual.md)).
- **Langganan** adalah satu-satunya aliran dana yang disentuh platform, via Midtrans (lihat [F07](features/F07-langganan-midtrans.md)).
- Marketplace/discovery lintas tenant **di luar MVP** (Fase 4).
