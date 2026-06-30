# F11 — Ulasan & Rating

| Atribut | Nilai |
|---------|-------|
| **ID** | F11 |
| **Rilis** | R3 |
| **Modul PRD** | §6.11 |
| **Kebutuhan Bisnis** | BR-10 |
| **Status** | Draft |
| **Dependensi** | F09 |

## 1. Tujuan
Membangun kredibilitas storefront melalui ulasan & rating dari klien yang booking-nya selesai — sekaligus menjadi sinyal kualitas untuk moderasi dan fondasi data untuk marketplace (Fase 4).

## 2. User Stories
- **US-F11-1:** Sebagai klien, saya diminta memberi rating & ulasan setelah acara selesai.
- **US-F11-2:** Sebagai pengunjung storefront, saya melihat rating ringkas & ulasan.
- **US-F11-3:** Sebagai MUA, saya melihat ulasan yang masuk.
- **US-F11-4:** Sebagai pengguna/MUA, saya bisa melaporkan ulasan tidak pantas.

## 3. Kebutuhan Fungsional (FR)
- **FR-F11-1:** Permintaan ulasan otomatis saat booking `COMPLETED` (via [F08](F08-notifikasi.md)).
- **FR-F11-2:** Ulasan tertaut booking nyata (`Review.booking_id`) untuk keaslian.
- **FR-F11-3:** Rating 1–5 + komentar opsional.
- **FR-F11-4:** Tayang otomatis di storefront ([F02](F02-storefront-publik.md)); dapat di-`flag` → moderasi ([F12](F12-admin-moderasi.md)).
- **FR-F11-5:** Agregasi rating rata-rata per tenant.

## 4. Aturan & Logika Bisnis
- Hanya klien dari booking `COMPLETED` yang dapat memberi ulasan (anti-ulasan palsu).
- Satu ulasan per booking.
- Ulasan `FLAGGED` disembunyikan sambil menunggu tinjauan admin.

## 5. Data Terkait
`Review`, `Booking` (F09), `Tenant` (agregat rating).

## 6. API / Endpoint (indikatif)
- `POST /bookings/{kode}/review` (klien, via tautan)
- `GET /s/{slug}/reviews` (publik)
- `POST /reviews/{id}/flag`

## 7. Status / State Machine
`Review.status`: `published ↔ flagged → hidden` (oleh admin).

## 8. Edge Case
- Klien mencoba mengulas booking belum selesai → ditolak.
- Ulasan ganda untuk booking sama → ditolak/diperbarui.
- Ulasan kasar/spam → flag + moderasi.

## 9. Kriteria Penerimaan (AC)
- **AC-F11-1:** Hanya booking selesai yang bisa menghasilkan ulasan, satu per booking.
- **AC-F11-2:** Rating rata-rata tampil benar di storefront.
- **AC-F11-3:** Ulasan ter-flag tersembunyi sampai ditinjau admin.

## 10. Di Luar Lingkup Fitur
- Balasan MUA terhadap ulasan (iterasi berikut).
- Verifikasi foto hasil/portofolio dari ulasan.

## 11. Metrik
Response rate ulasan, rata-rata rating tenant, jumlah flag.
