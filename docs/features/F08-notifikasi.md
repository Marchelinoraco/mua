# F08 — Notifikasi Otomatis (WhatsApp / Email)

| Atribut | Nilai |
|---------|-------|
| **ID** | F08 |
| **Rilis** | R1–R2 |
| **Modul PRD** | §6.8, §9 |
| **Kebutuhan Bisnis** | BR-5 |
| **Status** | Draft |
| **Dependensi** | F04, F06, F07 |

## 1. Tujuan
Mengirim notifikasi otomatis untuk konfirmasi, pengingat, dan status pembayaran/langganan — WhatsApp sebagai kanal utama, email sebagai fallback — mengurangi komunikasi manual MUA.

## 2. User Stories
- **US-F08-1:** Sebagai MUA, saya otomatis diberi tahu saat ada booking baru.
- **US-F08-2:** Sebagai klien, saya menerima instruksi DP & konfirmasi via WA.
- **US-F08-3:** Sebagai klien & MUA, saya menerima reminder acara H-1.
- **US-F08-4:** Sebagai klien, saya menerima reminder pelunasan.
- **US-F08-5:** Sebagai MUA, saya diberi tahu bila pembayaran langganan gagal/masuk grace.

## 3. Kebutuhan Fungsional (FR)
- **FR-F08-1:** Integrasi **WhatsApp Business API** (penyedia patuh) + **email** fallback.
- **FR-F08-2:** Template berbahasa Indonesia dengan variabel (nama, tanggal, nominal, link).
- **FR-F08-3:** Pemicu event: booking masuk, instruksi DP, bukti diterima, dikonfirmasi/ditolak, reminder acara H-1, reminder pelunasan, status langganan.
- **FR-F08-4:** **Fallback otomatis ke email** bila WA gagal/limit.
- **FR-F08-5:** Catat tiap pengiriman di `Notification` (status terkirim/gagal).
- **FR-F08-6:** **Nonaktif saat tenant `restricted`** (lihat [F07](F07-langganan-midtrans.md)).
- **FR-F08-7:** Hindari spam: dedup & rate-limit per penerima.

## 4. Matriks Notifikasi
| Pemicu | Kanal | Penerima | Isi |
|--------|-------|----------|-----|
| Booking baru | WA/email | MUA | Detail + link konfirmasi |
| Instruksi DP | WA/email | Klien | Nominal, rekening/QRIS, batas waktu |
| Bukti diterima | WA | MUA | Minta verifikasi |
| Dikonfirmasi/ditolak | WA/email | Klien | Status + langkah berikut |
| Reminder acara H-1 | WA | Klien & MUA | Tanggal, jam, lokasi |
| Reminder pelunasan | WA/email | Klien | Sisa + instruksi |
| Langganan gagal/grace/restricted | WA/email | MUA | Status + CTA bayar |

## 5. Aturan & Logika Bisnis
- WA utama; email fallback bila WA gagal atau nomor tidak valid.
- Reminder dijadwalkan oleh worker (H-3/H-1 sesuai jenis).
- Saat `restricted`, hanya notifikasi terkait billing yang boleh terkirim ke MUA.

## 6. Data Terkait
`Notification`, `Booking` (F04), `Payment` (F06), `Subscription` (F07), `Client`.

## 7. API / Endpoint (indikatif)
- Internal: `enqueue_notification(event, target, payload)`
- `GET /notifications` (riwayat per tenant)
- Webhook status pengiriman dari penyedia WA/email.

## 8. Status / State Machine
`Notification.status`: `queued → sent → delivered | failed → fallback_email`.

## 9. Edge Case
- WA limit/template ditolak kebijakan → fallback email + alert internal.
- Nomor WA tidak valid → tandai & gunakan email.
- Event ganda (mis. webhook ganda) → dedup notifikasi.

## 10. Kriteria Penerimaan (AC)
- **AC-F08-1:** Setiap event pemicu menghasilkan notifikasi sesuai matriks.
- **AC-F08-2:** Kegagalan WA otomatis jatuh ke email.
- **AC-F08-3:** Notifikasi non-billing tidak terkirim saat tenant `restricted`.

## 11. Di Luar Lingkup Fitur
- Chat in-app real-time.
- Push notification native/PWA.

## 12. Metrik
Delivery rate WA vs email, % fallback, keterlambatan reminder, opt-out.
