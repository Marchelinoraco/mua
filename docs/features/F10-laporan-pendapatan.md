# F10 — Laporan & Pendapatan

| Atribut | Nilai |
|---------|-------|
| **ID** | F10 |
| **Rilis** | R3 |
| **Modul PRD** | §6.10 |
| **Kebutuhan Bisnis** | BR-6 |
| **Status** | Draft |
| **Dependensi** | F06, F09 |

## 1. Tujuan
Memberi MUA ringkasan keuangan & operasional sederhana: pendapatan tercatat, jumlah booking, layanan terlaris, dan rasio DP vs pelunasan — berbasis pembayaran yang **dikonfirmasi MUA** (bukan rekonsiliasi bank, karena non-kustodi).

## 2. User Stories
- **US-F10-1:** Sebagai MUA, saya melihat total pendapatan per rentang waktu.
- **US-F10-2:** Sebagai MUA, saya melihat jumlah booking & statusnya.
- **US-F10-3:** Sebagai MUA, saya melihat layanan terlaris.
- **US-F10-4:** Sebagai MUA, saya melihat DP terkumpul vs pelunasan tertunda.

## 3. Kebutuhan Fungsional (FR)
- **FR-F10-1:** Ringkasan pendapatan = Σ `Payment` ber-status `CONFIRMED` (DP + pelunasan) pada rentang waktu.
- **FR-F10-2:** Filter rentang (minggu/bulan/kustom).
- **FR-F10-3:** Metrik: jumlah booking per status, layanan terlaris (dari `BookingItem`), DP vs sisa.
- **FR-F10-4:** Catatan jelas: angka berbasis konfirmasi MUA, **bukan** saldo bank.
- **FR-F10-5:** Ekspor sederhana (CSV) opsional.

## 4. Aturan & Logika Bisnis
- Hanya pembayaran `CONFIRMED`/`tunai ditandai` yang dihitung sebagai pendapatan.
- Booking `EXPIRED`/`CANCELED` tidak dihitung.
- Pelunasan tertunda = booking `CONFIRMED` belum `PAID`.

## 5. Data Terkait
`Payment` (F06), `Booking`, `BookingItem` (F03/F09).

## 6. API / Endpoint (indikatif)
- `GET /reports/summary?from=&to=`
- `GET /reports/top-services?from=&to=`
- `GET /reports/export?from=&to=` (CSV)

## 7. Edge Case
- Rentang tanpa data → tampilkan state kosong.
- Pembayaran tunai tanpa bukti tetap dihitung jika ditandai MUA.
- Zona waktu konsisten dengan kota tenant.

## 8. Kriteria Penerimaan (AC)
- **AC-F10-1:** Pendapatan hanya mencakup pembayaran terkonfirmasi pada rentang dipilih.
- **AC-F10-2:** Layanan terlaris & rasio DP/pelunasan akurat terhadap data order.
- **AC-F10-3:** Laporan ter-scope tenant; tidak ada kebocoran lintas tenant.

## 9. Di Luar Lingkup Fitur
- Akuntansi penuh / integrasi pajak.
- Rekonsiliasi otomatis dengan mutasi rekening.

## 10. Metrik
Frekuensi akses laporan, ekspor, korelasi laporan↔retensi tenant.
