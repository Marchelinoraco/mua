# Changelog

Semua perubahan penting pada proyek ini dicatat di file ini.
Format mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.1.0/): entri terbaru di atas, dikelompokkan **Ditambahkan / Diubah / Dihapus / Diperbaiki**.

> **Catatan untuk agent:** setiap kali membuat perubahan pada repo (dokumen, kode, konfigurasi), tambahkan entri ke bagian `[Belum Dirilis]` di bawah — pada tanggal yang sama — **sebelum menutup tugas**.

## [Belum Dirilis]

### 2026-07-22 — QA: validasi milestone F06 sebelum commit

#### Ditambahkan
- **`backend/src/payments/blob-storage.service.spec.ts`** (10 kasus, baru) — `BlobStorageService` sebelumnya di-mock habis di semua spec F06 lain (`payments.service.spec.ts`, `payments.service.integration.spec.ts`), jadi perilaku sebenarnya (pathname `payments/{bookingId}/{uuid}.{ext}`, argumen ke `put()` — `access: 'public'`, `addRandomSuffix: false`, `contentType` sesuai mime — dan pembungkusan error jadi `InternalServerErrorException`) tidak pernah teruji sama sekali. `@vercel/blob` di-mock via `jest.mock` (bukan token asli) — tetap tidak menyentuh Vercel sungguhan, murni memverifikasi logika wrapper. Backend: **149 → 159 test, tetap 100% hijau** (13 → 14 suite).

#### Diperiksa (verifikasi QA F06)
- `cd backend && npm test` — **159/159 lulus** (14 suite). `grep -rn "orders.*confirm\b" src` dikonfirmasi nol pemanggil aktif `POST /orders/:id/confirm`/`OrdersService.confirm()` — hanya komentar historis yang tersisa (`booking-transitions.service.ts` header comment sedikit basi, masih menyebut endpoint itu sebagai "dipakai bersama", padahal sudah dihapus — kosmetik, tidak fungsional).
- Klaim pemindahan cakupan test (157→149, dipindah ke `booking-transitions.service.spec.ts` + `payments.service.spec.ts`) **dikonfirmasi akurat** — skenario `AWAITING_DP→CONFIRMED` (sukses, guard 409, no-double-increment) tercakup penuh di kedua file.
- FE: nol referensi tersisa ke endpoint yang dihapus (`useConfirmOrder`, `/orders/:id/confirm`) — `OrderActionDialogType` tidak lagi punya varian `'confirm'`, `OrdersDialogs`/`OrderDetailSheet` sudah diganti `OrderPaymentSection`.
- **AC-F06-1** (nol saldo kustodi) — `grep -rniE "saldo|wallet|ledger|settlement|escrow|balance"` di seluruh `backend/src` = nol hasil. `PaymentsService`/`BlobStorageService` hanya mencatat `jumlah` (Decimal metadata) & URL gambar bukti, tidak pernah menjumlah/proses transfer. **Terverifikasi kuat.**
- **AC-F06-2** (slot terkunci permanen hanya via konfirmasi DP) — `grep` seluruh `src/` untuk penulisan `statusBooking: BookingStatus.CONFIRMED` = **satu titik masuk**, `BookingTransitionsService.confirmDpWithinTx`. **Terverifikasi.**
- **AC-F06-3** (audit status pembayaran) — `confirmPayment`/`rejectPayment`/`markCash` konsisten mencatat `status` + `catatanMua` + `confirmedAt` (saat relevan). Keputusan sadar tanpa model `AuditLog` terpisah (Paket A 1 user:1 tenant) diterapkan seragam di ketiga method. **Konsisten.**
- **AC-F06-4** (disclaimer non-kustodi) — `<NonCustodialDisclaimer>` dikonfirmasi benar-benar dirender (bukan cuma dibuat) di `booking-status-detail.tsx` (halaman publik status booking) dan `payment-profile-form.tsx` (dashboard). Untuk storefront F04 (`storefront-booking-success.tsx`, yang menampilkan instruksi bank pasca-submit): dikonfirmasi **file ini TIDAK bagian dari diff F06 sesi ini** (sudah di-commit terpisah di riwayat git sebelumnya, tidak disentuh) dan disclaimer **belum** dirender di sana — gap nyata tapi **sudah didokumentasikan sebagai keputusan sadar** di entri F06 Frontend sebelumnya ("di luar lingkup tugas F06 ini, storefront-public sedang aktif dikerjakan sesi lain"). Direkomendasikan sebagai item fast-follow, bukan blocker commit ini.
- **Edge case §9** ("PaymentProfile belum diisi → blokir publish") — dikonfirmasi **belum diimplementasikan** (tidak ada konsep "publish"/gating di backend sama sekali). Booking tetap bisa dibuat tanpa `PaymentProfile`; FE & BE degradasi dengan baik (`paymentProfile: null` + pesan "belum diisi", bukan crash). Bukan salah satu dari 4 AC formal F06 — dinilai **backlog terpisah, bukan blocker**.
- **Race condition** — `payments.service.integration.spec.ts` dikonfirmasi benar-benar terhadap Neon dev nyata (`DATABASE_URL`, bukan mock): dua `Payment(DP, SUBMITTED)` dikonfirmasi bersamaan via `Promise.allSettled` → tepat satu sukses, `Client.totalBooking` tidak double-increment. **Terverifikasi kuat.**
- **Gap coverage FE** (temuan baru, non-blocking): nol file `*.test.tsx` untuk komponen UI F06 (`payment-profile-form.tsx`, `booking-status-payment-history.tsx`, `booking-status-payment-upload-form.tsx`, `order-payment-section.tsx`, `order-payment-reject-dialog.tsx`, `order-mark-cash-dialog.tsx`) — hanya logika murni (`schema.ts`, `payment-form-state.ts`) yang diuji, bukan rendering komponennya. Tidak ditemukan bug perilaku lewat pembacaan kode manual (loading/error/disclaimer semua benar), tapi coverage rendering (loading/error/empty state UI sesuai prinsip QA) = 0% untuk permukaan yang secara eksplisit jadi fokus milestone ini. Direkomendasikan sebagai fast-follow test debt, bukan blocker.
- Risiko **`BLOB_READ_WRITE_TOKEN` belum diset**: dinilai risiko **rendah-menengah, dapat diterima untuk commit** — (1) app boot & seluruh endpoint non-upload tetap berfungsi penuh (diverifikasi via 159 test unit/integration termasuk `blob-storage.service.spec.ts` baru yang membuktikan wrapper error-handling bekerja benar saat `put()` gagal), (2) satu-satunya jalur yang gagal adalah upload bukti sungguhan (500 dengan pesan jelas, bukan crash/silent-fail), (3) sudah didokumentasikan eksplisit di `.env.example` & changelog F06 Frontend sebagai gap yang diketahui. Rekomendasi: provisioning token + satu kali verifikasi manual upload nyata di browser sebelum rilis ke produksi (bukan sebelum commit dev).
- `cd frontend && npx vitest run` — dijalankan penuh (browser mode headless); baseline pre-existing ~68 test timeout Playwright (didokumentasikan sebelumnya di entri F06 Frontend) dikonfirmasi ulang sebagai bukan regresi. Lihat detail hasil di laporan QA.

### 2026-07-22 — F06: pensiunkan jembatan manual `OrdersService.confirm` (celah audit)

#### Dihapus
- **`backend/src/orders/orders.controller.ts`** — endpoint `POST /orders/:id/confirm` dihapus. Endpoint ini adalah "jembatan manual" F09 yang mengonfirmasi booking (`AWAITING_DP`→`CONFIRMED`) **tanpa mencatat row `Payment` sama sekali**, yang sejak F06 dibangun bertentangan dengan FR-F06-8/AC-F06-3 (setiap perubahan status pembayaran wajib ter-audit). FE sudah tidak memanggilnya (diganti tombol "Tandai Bayar Tunai" yang mencatat `Payment` beraudit); verifikasi memastikan tidak ada pemanggil lain sebelum dihapus.
- **`backend/src/orders/orders.service.ts`** — method `confirm()` dihapus (satu-satunya pemanggil adalah controller di atas). Logika transisi (`AWAITING_DP`→`CONFIRMED`, increment atomik `Client.totalBooking`) tetap tersedia via `BookingTransitionsService.confirmDpWithinTx`, kini hanya dipicu lewat `PaymentsService.confirmPayment`/`markCash` (F06) — satu jalur, selalu beraudit.
- **`backend/src/orders/orders.service.spec.ts`** — 8 test khusus `OrdersService.confirm` dihapus; cakupan logika transisi tetap penuh via `booking-transitions.service.spec.ts` + `payments.service.spec.ts` (149/149 test tetap hijau setelah pembersihan, turun dari 157 sesuai jumlah test yang dihapus, bukan kehilangan cakupan).

### 2026-07-22 — F06 Frontend: Pembayaran Klien → MUA (Manual, Non-Kustodi)

RULE-1 mutlak dijaga di seluruh UI: platform tidak pernah menahan/memproses dana — hanya menampilkan instruksi transfer, form unggah bukti, dan status konfirmasi MUA.

#### Ditambahkan
- **Bagian 1 — Pengaturan `PaymentProfile` (dashboard, edit kapan saja)**: sub-halaman baru `src/features/settings/payment/` (`index.tsx`, `payment-profile-form.tsx`, `data/types.ts`, `hooks/use-payment-profile.ts`) + rute `src/routes/_authenticated/settings/payment.tsx`, menu baru di `SidebarNav` settings (`navigation.json` `payment`). Skema/tipe form (`paymentProfileSchema`/`PaymentProfileFormValues`) **DI-REUSE** dari `features/onboarding/data/schema.ts` (sesuai instruksi — tidak ada duplikasi tipe), hanya field GET response (`id`/`updatedAt`) yang baru. Pola form (GET saat mount → `form.reset` via `useEffect` → PUT saat submit) mengikuti `AvailabilityEditor` (`features/schedule`), bukan pola baru.
- **Reusable `<NonCustodialDisclaimer>`** (`src/components/non-custodial-disclaimer.tsx`, key `common.json` `nonCustodialDisclaimer`) — memenuhi FR-F06-9, dipakai di halaman status booking publik & form pengaturan payment profile; disiapkan supaya form booking F04 bisa ikut memakainya nanti (belum diwire di sana — di luar lingkup tugas F06 ini, storefront-public sedang aktif dikerjakan sesi lain).
- **Tipe domain bersama `Payment`/`PaymentStatus`/`PaymentTipe`** ditambahkan ke `features/dashboard/data/types.ts` (satu sumber kebenaran, pola sama dengan `BookingStatus`), di-reexport oleh `features/orders/data/types.ts` (`OrderDetail.payments`) dan `features/booking-status/data/types.ts` (`BookingStatusDetail.payments`). Badge warna status pembayaran: `PAYMENT_STATUS_BADGE_CLASS` di `features/dashboard/data/status.ts`.
- **Util bersama `src/lib/payment-proof.ts`** (`isPdfProofUrl`) — deteksi bukti PDF vs gambar dari ekstensi URL (backend selalu menambah ekstensi sesuai mimetype, lihat `BlobStorageService`), dipakai di preview bukti (booking-status publik & orders dashboard).
- **Bagian 2 — Halaman status booking publik** (`features/booking-status/`): `BookingStatusPaymentHistory` (riwayat, badge status/tipe, thumbnail gambar klik-buka-tab-baru atau link "Lihat PDF" untuk PDF, alasan tolak bila `REJECTED`) dan `BookingStatusPaymentUploadForm` (field jumlah + file + catatan, `FormData`, validasi client-side ukuran ≤5MB & whitelist mime lewat `paymentUploadFormSchema` baru di `data/schema.ts`). Visibilitas form (DP saat `AWAITING_DP` tanpa payment aktif, pelunasan saat `CONFIRMED` tanpa payment aktif, mode unggah-ulang saat `REJECTED`) diekstrak jadi fungsi murni testable `resolvePaymentFormState` (`lib/payment-form-state.ts`, 7 test kasus). Hook `hooks/use-upload-payment.ts` (`POST /bookings/:kode/payments`, error 400/404/409/429 ditangani beda pesan, invalidate query `['booking-status', kode]` via prefix-match).
- **Bagian 3 — Order detail sheet dashboard** (`features/orders/`): `OrderPaymentSection` (riwayat pembayaran + tombol Konfirmasi/Tolak per `Payment` `SUBMITTED` + tombol "Tandai Bayar Tunai"), `OrderPaymentRejectDialog` (alasan wajib 5–500, `rejectPaymentFormSchema`), `OrderMarkCashDialog` (`markCashPaymentFormSchema`, tipe & jumlah default diturunkan otomatis dari `statusBooking` — DP saat `AWAITING_DP` default `dpAmount`, pelunasan saat `CONFIRMED` default `totalHarga - dpAmount`). Mutations baru `hooks/use-payments.ts` (`useConfirmPayment`/`useRejectPayment`/`useMarkCashPayment`, invalidate list+detail order, toast sukses/pesan 409 server apa adanya).
- Unit test baru: `booking-status/data/schema.test.ts` (+8 kasus `paymentUploadFormSchema`, termasuk file lewat `DataTransfer`), `booking-status/lib/payment-form-state.test.ts` (7 kasus), `orders/data/schema.test.ts` (+7 kasus `rejectPaymentFormSchema`/`markCashPaymentFormSchema`), `lib/payment-proof.test.ts` (4 kasus).
- i18n: extend `orders.json` (`payments.*`) & `booking-status.json` (`payments.*`, `uploadForm.*`) id/en (bukan namespace baru, sesuai instruksi); `settings.json` (`payment.*`) & `navigation.json` (`payment`) id/en untuk Bagian 1; `common.json` (`nonCustodialDisclaimer`) id/en.

#### Diubah
- **Keputusan arsitektur — tombol "Konfirmasi" generik order dihapus dari UI** (`OrderDetailSheet`, `OrdersDialogs`, `OrderActionDialogType` di `orders-provider.tsx`; hook `useConfirmOrder` dihapus dari `hooks/use-orders.ts`). Sebelum F06, `POST /orders/:id/confirm` adalah "jembatan manual" yang mengonfirmasi `AWAITING_DP → CONFIRMED` **tanpa jejak `Payment` sama sekali** — bertentangan dengan FR-F06-8/AC-F06-3 (setiap perubahan status pembayaran wajib teraudit). F06 menyediakan pengganti yang sama-sama tanpa-bukti tapi **beraudit**: "Tandai Bayar Tunai" (membuat `Payment` `CONFIRMED` beserta `catatanMua`). Endpoint backend `POST /orders/:id/confirm` **sengaja tidak disentuh/dihapus** (instruksi: jangan ubah backend) — hanya tidak lagi dipanggil dari FE. Helper `handleOrderMutationError`/`useInvalidateAfterMutation` di `use-orders.ts` diekspor (sebelumnya privat) supaya dipakai bersama `use-payments.ts`. **Perlu konfirmasi tech-lead**: apakah keputusan ini sudah tepat, atau endpoint lama sebaiknya tetap punya tombol UI untuk skenario tertentu (mis. migrasi data lama).
- `orders.json`/`en` — hapus key basi yang merujuk fitur F06 sebagai "akan menyusul" (`detail.confirmNote`, `confirmDialog.*`, `actions.confirm`, `toast.confirmSuccess`/`confirmConflict`) karena F06 sudah rilis; digantikan `payments.*`.
- `features/settings/payment/hooks/use-payment-profile.ts` — `GET /payment-profile` mengembalikan **404** ("PaymentProfile belum dikonfigurasi") bukan objek kosong saat MUA belum pernah mengisi rekening (ditemukan lewat uji manual E2E, bukan cuma dugaan dari baca kode) — `usePaymentProfile()` menangkap 404 dan mengembalikan `null` (state valid "belum diisi", render form kosong), BUKAN diperlakukan sebagai `isError` (yang sebelumnya akan menampilkan pesan gagal-muat keliru untuk kasus yang sebenarnya normal).

#### Diperiksa (verifikasi)
- `npx tsc -b`, `npm run build` (`tsc -b && vite build`) — bersih, exit 0. `routeTree.gen.ts` ter-regenerasi otomatis (rute `/settings/payment` terdaftar).
- `npx eslint .` — nol error/warning baru dari file yang disentuh tugas ini (diverifikasi lewat lint bertarget pada seluruh file baru/ubah, lalu dikonfirmasi ulang lint penuh repo tidak memuat satu pun path yang disentuh tugas ini di daftar error).
- `npx vitest run --browser.headless` — 22/36 file & 193/261 test lulus; 14 file gagal (68 test) **seluruhnya pre-existing & di luar lingkup F06** (`auth/sign-in`, `auth/sign-up`, `auth/forgot-password`, `auth/otp`, `users/*`, `tasks/*`, `context/search-provider`, `components/config-drawer`, `components/sign-out-dialog`) — pola kegagalan seragam timeout ~15000ms per interaksi Playwright, konsisten dengan baseline pre-existing yang sudah didokumentasikan di entri rebrand 2026-07-22 sebelumnya (lingkungan sandbox, bukan regresi dari perubahan ini). Empat file test baru/diperluas milik tugas ini dijalankan terisolasi untuk kepastian: `npx vitest run` pada `booking-status/data/schema.test.ts`, `orders/data/schema.test.ts`, `booking-status/lib/payment-form-state.test.ts`, `lib/payment-proof.test.ts` → **4/4 file, 41/41 test lulus**.
- **Uji manual E2E via `curl` langsung ke `start:dev` (backend) + Neon dev**, tanpa Playwright sesuai instruksi: register tenant baru → `PUT /payment-profile` → buat service → set `availability` → `POST /s/:slug/bookings` (booking publik) → `GET /bookings/:kode?phone=` (mengonfirmasi field `payments: []` cocok persis dengan tipe `BookingStatusDetail` FE) → `POST /orders/:id/payments/mark-cash` tipe `DP` (statusBooking `AWAITING_DP → CONFIRMED`) → `POST /orders/:id/payments/mark-cash` tipe `PELUNASAN` (statusBooking `CONFIRMED → PAID`, `dpAmount`+sisa sesuai formula yang dipakai `OrderMarkCashDialog`) → percobaan mark-cash DP ulang pada booking yang sudah lewat `AWAITING_DP` → **409** seperti diharapkan. Semua bentuk respons JSON dicocokkan manual terhadap tipe TypeScript yang ditulis (`Payment`, `OrderDetail.payments`, `BookingStatusDetail.payments`) — sama persis.
- **Belum diverifikasi (gap)**: `BLOB_READ_WRITE_TOKEN` tidak tersedia di `backend/.env` lokal (dikonfirmasi ulang saat tugas ini) — alur unggah bukti **sungguhan** (`POST /bookings/:kode/payments` dengan file asli dari `BookingStatusPaymentUploadForm`, lalu render thumbnail/PDF-nya di `OrderPaymentSection`/`BookingStatusPaymentHistory`) tidak sempat diuji end-to-end nyata; hanya diverifikasi lewat tsc/lint/unit test + pembacaan kode kontrak (`multipart/form-data`, override header `Content-Type: undefined` pada request axios — dijelaskan di komentar `use-upload-payment.ts` — supaya browser yang menyusun boundary, bukan axios yang men-stringify `FormData` jadi JSON karena default header instance `application/json`). Rekomendasi: verifikasi manual via UI browser setelah `BLOB_READ_WRITE_TOKEN` diprovisikan.
- Data uji coba (`tenant slug f06-verify-tester`, booking `GB-20260723-RQ81`, dll) sengaja dibiarkan di database Neon dev (bukan file di repo) — tidak ada skrip sementara yang ditinggalkan di repo.

### 2026-07-22 — F06 Backend: Pembayaran Klien → MUA (Manual, Non-Kustodi)

#### Ditambahkan
- **Modul baru `backend/src/payments/`** — implementasi F06, RULE-1 mutlak (platform TIDAK PERNAH menahan/menyalurkan dana klien; hanya mencatat status berdasar bukti + konfirmasi MUA):
  - `PaymentsUploadController` (**publik**, prefix `bookings/:kode/payments`) — `POST /api/bookings/:kode/payments`: unggah bukti transfer `multipart/form-data` (`tipe`, `jumlah`, `phone` untuk verifikasi kepemilikan booking — pola sama dengan `GET /bookings/:kode?phone=` F04, `catatanKlien?`, file `bukti`). Booking tidak ditemukan ATAU `phone` tidak cocok → **404 seragam** (bukan 403) — sengaja konsisten dengan pola privasi `BookingService.getBookingStatus` supaya `kodeBooking` saja tak cukup mengonfirmasi eksistensi booking orang lain. Throttle 10/menit/IP.
  - `PaymentsController` (**dashboard**, `JwtAuthGuard` + tenant-scoped via `@CurrentTenant()`, prefix `orders/:id/payments`): `POST /api/orders/:id/payments/:paymentId/confirm`, `POST /api/orders/:id/payments/:paymentId/reject` (body `{alasan}` 5–500 karakter), `POST /api/orders/:id/payments/mark-cash` (body `{tipe, jumlah, catatanMua?}`, FR-F06-7 — catat pembayaran tunai tanpa bukti unggahan, `Payment` langsung `CONFIRMED`).
  - `PaymentsService` — validasi file (whitelist mime `image/jpeg|jpg|png|webp`, `application/pdf`; maks 5MB, pesan 400 jelas per pelanggaran), state machine `Payment`/`Booking` (DP hanya dari `AWAITING_DP`, pelunasan hanya dari `CONFIRMED`, reject hanya dari `SUBMITTED`, 409 di luar itu), dan orkestrasi **SATU `$transaction`** per aksi (update `Payment` + transisi `Booking` sukses/gagal bersama — race pada `Payment` maupun `Booking` diguard via `updateMany` dengan status asal di `WHERE`, bukan baca-lalu-tulis).
  - `BlobStorageService` — bungkus tipis `@vercel/blob` `put()` (dependency baru `@vercel/blob@^2.6.1`), simpan bukti transfer ke path `payments/{bookingId}/{uuid}.{ext}`, `access: 'public'`. `BLOB_READ_WRITE_TOKEN` dibaca otomatis oleh SDK dari `process.env` (tidak divalidasi `getOrThrow` di constructor) — app tetap bisa boot & endpoint non-upload (mark-cash/confirm/reject) tetap jalan meski token belum dikonfigurasi; hanya upload sungguhan yang gagal (500 dengan pesan jelas) sampai token diisi.
  - DTO baru di `backend/src/payments/dto/`: `create-payment-upload.dto.ts`, `reject-payment.dto.ts`, `mark-cash-payment.dto.ts`, `payment-response.dto.ts`.
  - Dependency baru: `@vercel/blob@^2.6.1` (dependencies), `@types/multer@^2.2.0` (devDependencies, untuk tipe `Express.Multer.File` dipakai `FileInterceptor`/`@UploadedFile()`).
- **`BookingTransitionsService`** (`backend/src/orders/booking-transitions.service.ts`, diekspor dari `OrdersModule`) — **SATU sumber logika** transisi status `Booking` yang dipicu konfirmasi pembayaran, dipakai bersama oleh `OrdersService.confirm` (F09, jembatan manual) DAN `PaymentsService` (F06): `confirmDpWithinTx` (Payment DP CONFIRMED → `AWAITING_DP`→`CONFIRMED`, clear `holdUntil`, increment `Client.totalBooking` atomik) dan `confirmPelunasanWithinTx` (**transisi BARU**: Payment PELUNASAN CONFIRMED → `CONFIRMED`→`PAID`). Kedua method menerima `tx: Prisma.TransactionClient` milik pemanggil (pola sama dengan `SlotsService.reserveSlotOrThrow`) dan guard atomik via `updateMany` dengan status asal di `WHERE` — mencegah race, termasuk mencegah **double-increment** bila dua `Payment(tipe=DP)` untuk booking yang sama somehow keduanya dicoba dikonfirmasi (yang kedua menemukan booking sudah bukan `AWAITING_DP` → seluruh transaksinya roll back, termasuk update `Payment.status`-nya).
- Field baru **`payments: [...]`** (riwayat pembayaran, urut `createdAt` asc) ditambahkan ke dua response existing (satu query, hindari N+1):
  - `GET /api/orders/:id` (F09, `OrdersService.detail`) — dashboard, selalu tampil.
  - `GET /api/bookings/:kode?phone=` (F04, `BookingService.getBookingStatus`) — publik, **hanya saat `phone` cocok** (`requiresOtp: false`), konsisten dengan aturan privasi F04.
- Unit test: `backend/src/payments/payments.service.spec.ts` (32 kasus, Prisma & `BlobStorageService`/`@vercel/blob` di-mock) — validasi file (mime whitelist tiap tipe, ukuran tepat-di-batas & lebih-dari-5MB, file tidak dikirim), 404 seragam booking-tidak-ada vs phone-tidak-cocok (`uploadBukti`), state machine per aksi (`confirm` hanya dari `SUBMITTED`, `reject` hanya dari `SUBMITTED`, `mark-cash` hanya dari status booking yang sesuai tipe), isolasi tenant (`findFirst` dengan `{id, tenantId, bookingId}` sekaligus), guard race (Payment `updateMany` count=0, transisi Booking ditolak di dalam tx → seluruh transaksi batal). `backend/src/orders/booking-transitions.service.spec.ts` (6 kasus) — guard `WHERE` status asal & pesan 409 per transisi, memastikan `Client.totalBooking` TIDAK ter-increment bila guard gagal.
- Integration test **`backend/src/payments/payments.service.integration.spec.ts`** (DB Neon dev nyata via `DATABASE_URL`, `describeIfDb`, `BlobStorageService` di-mock — tidak menyentuh `uploadBukti`): `markCash` DP→PELUNASAN pada booking yang sama benar-benar tersimpan (`statusBooking` CONFIRMED lalu PAID, `holdUntil` null, `Client.totalBooking` +1 hanya sekali), **dua `Payment(DP, SUBMITTED)` untuk booking yang sama dikonfirmasi BERSAMAAN (`Promise.allSettled`) → tepat satu sukses, satu `ConflictException`, `Client.totalBooking` TIDAK double-increment** (guard atomik `BookingTransitionsService` teruji lintas transaksi paralel sungguhan, bukan mock), dan `rejectPayment` (Booking status tidak berubah).

#### Diubah
- **`OrdersService.confirm`** (`backend/src/orders/orders.service.ts`) — direfaktor memakai `BookingTransitionsService.confirmDpWithinTx` (bukan lagi duplikasi `updateMany`+`client.update` inline). Endpoint `POST /orders/:id/confirm` **dipertahankan** sebagai jembatan manual (bukan dihapus) untuk kasus DP diterima di luar alur unggah-bukti; komentar kode diperbarui menjelaskan hubungannya dengan `PaymentsService.confirmPayment`/`markCash`.
- **`OrdersModule`** — mendaftarkan & **mengekspor** `OrdersService` dan `BookingTransitionsService` (dipakai `PaymentsModule`; arah dependensi satu arah, `OrdersModule` tidak mengimpor apa pun dari `PaymentsModule`).
- **`app.module.ts`** — mendaftarkan `PaymentsModule`.
- `backend/src/orders/dto/order-response.dto.ts` — tambah `OrderPaymentDto` + field `payments: OrderPaymentDto[]` di `OrderDetailResponseDto`.
- `backend/src/booking/dto/booking-response.dto.ts` — tambah `BookingPaymentResponseDto` + field `payments: BookingPaymentResponseDto[]` di `BookingStatusDetailResponseDto`.
- `backend/src/orders/orders.service.spec.ts` & `backend/src/booking/booking.service.spec.ts` — disesuaikan dengan constructor/field baru (fixture `payments: []`, `BookingTransitionsService` dipakai apa adanya — bukan mock — karena method-nya hanya mengoperasikan `tx` yang dioper, jadi assertion terhadap `mockTx` tetap valid persis seperti sebelum logika diekstrak).
- `backend/.env.example` — tambah dokumentasi `BLOB_READ_WRITE_TOKEN` (opsional saat boot, wajib untuk upload bukti sungguhan; cara provisioning via `vercel blob store create`).

#### Diperiksa (tanpa perubahan / verifikasi)
- `npx tsc --noEmit`, `npm run build` (`nest build`) — bersih, exit 0.
- `npx jest` — **13 suite / 157 test lulus** (naik dari 11 suite/122 test sebelum tugas ini), nol regresi. Termasuk 3 test integration F06 di atas jalan sukses terhadap Neon dev nyata.
- **`BLOB_READ_WRITE_TOKEN` BELUM tersedia** di `backend/.env` maupun `.env.vercel.local` lokal — verifikasi upload bukti sungguhan (`POST /bookings/:kode/payments`) ke Vercel Blob **tertunda** sampai token diprovisikan (mis. `vercel blob store create` + `vercel env pull`). Jalur lain (mark-cash, confirm, reject, validasi file, state machine, race condition) sudah diverifikasi lengkap lewat unit + integration test terhadap Neon dev nyata tanpa bergantung pada token tsb.

### 2026-07-22 — Rebrand Frontend: GlowBook → MuaGlow + rute storefront publik `/@slug`

#### Diubah
- **Rebrand teks "GlowBook" → "MuaGlow"** di seluruh frontend (11 file + `index.html`): `src/locales/{id,en}/storefront.json` (`footer.poweredBy`), `src/locales/{id,en}/auth.json` (judul sign-up, pesan sukses register, judul onboarding, disclaimer pembayaran), `src/features/booking-status/index.tsx` & `src/features/storefront-public/index.tsx` (`document.title`), `src/features/dashboard/data/mock-stats.ts` (lokasi mock), `src/features/onboarding/components/onboarding-payment-step.tsx` (komentar kode), `src/components/layout/app-title.tsx` (logo sidebar), `src/components/layout/data/sidebar-data.ts` (nama team + email mock `mua@glowbook.id` → `mua@muaglow.id`), `index.html` (`<title>`, meta `title`/`og:title`/`og:description` context/`twitter:title`, serta `og:url`/`twitter:url` dari `https://glowbook.id` → `https://muaglow.com` sesuai domain baru yang sudah dibeli). Grep akhir case-insensitive di seluruh `frontend/` (di luar `node_modules`/`dist`) mengonfirmasi nol sisa "glowbook" kecuali satu tempat yang sengaja dipertahankan (lihat poin cookie di bawah).
- **Keputusan: nama cookie auth TIDAK diganti.** `src/stores/auth-store.ts` — `COOKIE_KEY = 'glowbook_access_token'` dipertahankan apa adanya, dengan komentar baru yang menjelaskan alasan. Ini pengenal teknis internal (bukan branding user-facing); mengganti nilainya akan membuat cookie lama tak terbaca dan otomatis me-logout semua user yang sedang login, butuh migrasi sesi terpisah yang di luar lingkup tugas rebrand teks ini. Keputusan sadar untuk tidak mengubahnya — bisa direvisit terpisah bila tech-lead ingin membersihkan penamaan internal sekalian (risikonya kecil karena user real ~0 saat ini, tapi tidak dieksekusi di sini karena di luar scope yang diminta).
- **Rute storefront publik `/s/:slug` → `/@:slug`** (mis. `muaglow.com/@sarahmua`, sesuai `docs/architecture.md`). File route baru `src/routes/@{$slug}/index.tsx` memakai sintaks **prefix param** TanStack Router (`createFileRoute('/@{$slug}/')` — literal `@` sebagai prefix di segmen yang sama dengan param `$slug`, BUKAN dua segmen terpisah). Ini fitur resmi router (`{$paramName}` untuk pola prefix/suffix dalam satu segmen path, didukung sejak beberapa minor version lalu di `@tanstack/router-core`/`router-generator` versi terpasang saat ini, `^1.168.22`/`^1.167.22`) — dikonfirmasi lewat pembacaan source `router-generator`/`router-core` (fungsi `toVariableSafeChar` bahkan punya case eksplisit untuk karakter `@` → `'At'`) dan skill doc bawaan paket (`path-params/SKILL.md`, bagian "Prefix and Suffix Patterns"). Endpoint API backend **tidak disentuh** — tetap `/api/s/:slug` dkk, hanya rute halaman frontend yang berubah.
- **Redirect rute lama dipertahankan**: `src/routes/s/$slug/index.tsx` diubah dari komponen storefront menjadi redirect (`beforeLoad` → `throw redirect({ to: '/@{$slug}', params: { slug }, replace: true })`) ke rute baru. Diputuskan menambahkan redirect ini (bukan menghapus rute lama) karena biayanya murah (satu file, tanpa state tambahan) dan mencegah tautan lama (mis. yang mungkin sudah sempat dibagikan di bio IG) menjadi mati, meski produksi baru rilis dan kemungkinan link tersebar masih kecil.
- Digrep ulang seluruh `frontend/src` untuk pemakaian internal path `/s/`/`s/$slug` di luar rute itu sendiri: hanya ditemukan di 4 hook (`use-storefront.ts`, `use-storefront-slots.ts`, `use-create-booking.ts`, `use-storefront-report.ts`) yang memanggil **API backend** `/s/${slug}...` — sengaja **tidak diubah** sesuai instruksi (kontrak API tidak boleh disentuh). Tidak ditemukan tempat lain (dashboard "Storefront" masih halaman stub "Segera hadir", belum menampilkan link storefront ke MUA) yang perlu diperbarui.

#### Diperiksa (tanpa perubahan)
- `npx tsc -b` — bersih, exit 0 (memvalidasi juga string `to: '/@{$slug}'` pada redirect cocok dengan `routeTree.gen.ts` yang sudah diregenerasi).
- `npm run build` (`tsc -b && vite build`) — bersih; `routeTree.gen.ts` ter-regenerate otomatis oleh plugin router saat build (registrasi baru `/@{$slug}/` + `/s/$slug/` tetap ada sebagai redirect), sesuai instruksi untuk tidak mengedit file itu manual.
- `npx eslint .` — 0 error baru terkait perubahan ini (satu warning `react-refresh/only-export-components` pada `src/routes/@{$slug}/index.tsx`, pola sama persis dengan route file lain yang sudah ada sebelumnya, mis. `booking-status/$kode/index.tsx`). Error/warning lain di output berasal dari file pre-existing yang tidak disentuh tugas ini (`.agents/skills/...`, `onboarding/index.tsx`, dll).
- `npx vitest run --browser.headless` pada `storefront-public` + `booking-status` — 7 suite/72 test lulus. Full `npx vitest run --browser.headless` — hasil sejalan dengan baseline pre-existing yang sudah didokumentasikan sebelumnya (entri F04 2026-07-19: kegagalan hanya pada suite browser-mode pre-existing tak terkait yang memang sudah merah, mis. `sign-up-form.test.tsx` dkk) — nol regresi baru dari perubahan rebrand/routing ini.
- Verifikasi tidak memakai Playwright/browser automation manual sesuai instruksi; verifikasi cukup lewat `tsc -b`, `npm run build`, `vitest run`, dan pembacaan kode/source router.

### 2026-07-22 — Rilis: promosi `dev` → `main` (F04 booking mandiri klien + F09 manajemen order & klien)

#### Diubah
- Branch `main` (production) di-merge dengan `dev` (`7c13690`), mempromosikan milestone **F04** (booking mandiri klien di storefront publik, form multi-step, hold slot 120 menit, halaman status booking publik) dan **F09** (manajemen order & data klien di dashboard: filter/list order, konfirmasi/selesai/batal/reschedule dengan state machine status, agregasi klien) ke production.
- `main` dan `dev` sudah divergen sejak commit `682aa35` — `main` menyimpan salinan hasil rebase F05+F02 dengan hash commit berbeda dari commit asli di `dev` (rilis sebelumnya, lihat entri `2026-07-19` di bawah), ditambah satu commit kosmetik PR test `fix/bugs-1` (`f5c833e`, ubah teks judul SVG logo). `git merge dev` di `main` karena itu menghasilkan konflik pada ~24 file — **diverifikasi satu per satu** (`schema.prisma`, `app.module.ts`, `slots.service.ts`, `storefront.service.ts`, `changelog.md`, dan seluruh file `storefront-public`/`booking-status`) bahwa setiap perbedaan murni aditif: sisi `dev` selalu superset dari sisi `main`, tidak ada baris unik `main` yang hilang. Diselesaikan dengan `git merge -X theirs dev` (mengambil versi `dev` pada tiap konflik), lalu dikonfirmasi pohon kerja hasil merge identik dengan `dev` (satu-satunya beda: teks kosmetik judul logo dari PR test tsb, tidak berdampak fungsional). SHA `main` setelah push: `a0aa7eb` (merge commit, BUKAN fast-forward, BUKAN force-push).
- Push ke `main` memicu Vercel Production build + `prisma migrate deploy` ke Neon production, menerapkan migrasi `20260721164405_f09_booking_cancel_fields` (kolom `Booking.alasanBatal`, `Booking.canceledAt`, keduanya nullable/aditif) beserta migrasi F04 sebelumnya bila belum berjalan.
- `dev` disinkronkan kembali dengan `git merge main` (merge commit `a22c3c1`) supaya kedua branch tidak divergen — satu-satunya perubahan yang masuk ke `dev`: teks kosmetik judul logo dari PR `fix/bugs-1` di atas.

### 2026-07-22 — F09 Backend: Manajemen Order & Data Klien (dashboard MUA)

#### Ditambahkan
- **Modul baru `backend/src/orders/`** — endpoint dashboard F09, seluruhnya `@UseGuards(JwtAuthGuard)` + tenant-scoped via `@CurrentTenant()`:
  - `OrdersController`/`OrdersService` (prefix **`/api/orders`**, BUKAN `/api/bookings`): `GET /orders` (filter `status` multi-value via comma, `from`/`to` tanggal acara, `q` cari kodeBooking/nama/phone klien case-insensitive, `page`/`limit` default 1/20 maks 100, urut `tanggalAcara` desc), `GET /orders/:id` (detail lengkap: items, client, customValues ter-join label, alasanBatal/canceledAt), `POST /orders/:id/confirm`, `POST /orders/:id/complete`, `POST /orders/:id/cancel` (body `{alasan}` 5–500 karakter), `POST /orders/:id/reschedule` (body `{tanggalAcara, jamMulai}`).
  - `ClientsController`/`ClientsService` (prefix `/api/clients`, dibundel di modul yang sama — riwayat & agregasi klien sepenuhnya diturunkan dari data Booking): `GET /clients` (cari nama/phone, urut nama asc, `jumlahBookingAktif` dihitung via satu query `groupBy` per halaman — bukan N+1), `GET /clients/:id` (profil + riwayat maks 50 booking terbaru), `PUT /clients/:id/notes` (body `{catatan: string|null}` maks 2000 karakter).
  - `orders.util.ts` — helper murni `parsePagination`/`parseStatusFilter` dipakai bersama kedua service.
  - DTO baru di `backend/src/orders/dto/`: `cancel-order.dto.ts`, `reschedule-order.dto.ts`, `order-response.dto.ts`, `update-client-notes.dto.ts`, `client-response.dto.ts`. Semua `Decimal` Prisma (totalHarga/dpAmount/hargaSnapshot) dikonversi eksplisit ke `number`; `tenantId` tidak pernah bocor ke response.
  - **State machine status booking ditegakkan** (409 + pesan jelas bila dilanggar): `confirm` hanya dari `AWAITING_DP`; `complete` hanya dari `CONFIRMED`/`PAID`; `cancel`/`reschedule` dari `AWAITING_DP`/`CONFIRMED`/`PAID`; status terminal (`COMPLETED`/`CANCELED`/`EXPIRED`) menolak semua aksi. Transisi status dieksekusi via `updateMany` dengan `where.statusBooking` sebagai guard atomik (bukan update polos) — melindungi dari race condition antara pembacaan status awal dan commit (double-klik, dua tab, dsb).
  - **`confirm`**: dalam SATU transaksi Prisma — `statusBooking->CONFIRMED`, `holdUntil->null` (kunci permanen, FR-F05-6), dan **increment `Client.totalBooking` atomik** (`{increment: 1}`, bukan baca-lalu-tulis — item wajib roadmap handoff). Komentar `// TODO(F06)` jelas di service: endpoint ini jembatan manual sampai konfirmasi DP otomatis (F06) tersedia.
  - **`cancel`**: set `alasanBatal`, `canceledAt=now`, `holdUntil->null`. `Client.totalBooking` **TIDAK di-decrement** — didokumentasikan sebagai keputusan desain (counter lifetime booking terkonfirmasi, bukan booking aktif saat ini) di komentar `cancel()`/`confirm()`.
  - **`reschedule`**: WAJIB lolos anti-bentrok (AC-F09-2) via `SlotsService.reserveSlotOrThrow` di dalam transaksi yang sama dengan update `tanggalAcara`; durasi = Σ `BookingItem.durasi` booking ini.
- **`OrdersModule`** didaftarkan di `backend/src/app.module.ts`, meng-import `SlotsModule` untuk injeksi `SlotsService`.
- Unit test: `backend/src/orders/orders.service.spec.ts` (36 kasus gabungan dengan clients) — filter list (status/tanggal/q/pagination), isolasi tenant (`findFirst({id,tenantId})` → 404, bukan `findUnique` lalu cek tenant), setiap transisi status valid & yang ditolak per state machine, increment `totalBooking` atomik pada `confirm`, `cancel` TIDAK memanggil `client.update`, reschedule sukses (assert `reserveSlotOrThrow` dipanggil dengan `excludeBookingId=id`) & reschedule ditolak saat `reserveSlotOrThrow` throw (slot penuh) atau status terminal. `backend/src/orders/clients.service.spec.ts` — list dengan agregasi `jumlahBookingAktif` (groupBy, bukan N+1, di-skip bila hasil kosong), isolasi tenant di detail, update notes (termasuk set `null`).

#### Diperbaiki
- **BUG korektness anti-bentrok — self-conflict pada reschedule** (`backend/src/slots/slots.service.ts`): `reserveSlotOrThrow` sebelumnya menghitung SEMUA booking aktif di tanggal target TERMASUK booking yang sedang di-reschedule itu sendiri — reschedule ke jam lain di tanggal yang sama dengan rentang lama yang beririsan akan **false-conflict** (booking bentrok dengan dirinya sendiri, ditolak 409 padahal seharusnya berhasil). **Fix**: tambah parameter opsional `excludeBookingId?: string` ke `reserveSlotOrThrow` dan `findActiveBookingCandidates` (filter `id: {not: excludeBookingId}` langsung di `where` Prisma, bukan filter in-memory) — parameter opsional, default `undefined`, **TIDAK mengubah perilaku pemanggil lama** (`BookingService.createBooking`, F04, tidak disentuh). `OrdersService.reschedule` mengirim `excludeBookingId=id` booking yang sedang diproses.
- Integration test baru di `backend/src/slots/slots.service.integration.spec.ts` (DB Neon dev nyata, `describeIfDb`) — suite `SlotsService.reserveSlotOrThrow — self-conflict reschedule (F09, AC-F09-2)`: (1) TANPA `excludeBookingId` → membuktikan bug ada (booking 09:00 durasi 120m ditolak saat re-cek reservasi ke 10:00 tanggal sama, kapasitas 1); (2) DENGAN `excludeBookingId` → reschedule ke 10:00 **BERHASIL** & tersimpan. Total suite `slots` naik dari 1 → 3 test.

#### Diperiksa (tanpa perubahan / verifikasi)
- `npm run build` (`nest build`) — bersih, exit 0.
- `npx jest` — **10 suite / 117 test lulus**, nol regresi (naik dari 8 suite/79 test sebelum tugas ini).
- Verifikasi manual `start:dev` terhadap Neon dev (tenant baru `f09manual1784653299`): alur penuh register → service → availability → booking publik → `GET /orders` (list + `q` search) → `GET /orders/:id` → `POST .../complete` ditolak 409 (`AWAITING_DP` bukan `CONFIRMED`/`PAID`) → `POST .../confirm` sukses (`holdUntil` jadi `null`, `Client.totalBooking` 0→1 terverifikasi via `GET /clients/:id`) → `POST .../confirm` kedua kali ditolak 409 (`CONFIRMED` tidak bisa dikonfirmasi lagi) → **`POST .../reschedule` ke jam beririsan di tanggal SAMA berhasil 201** (bukti langsung fix self-conflict bekerja di DB nyata, bukan cuma di integration test) → `POST .../cancel` sukses (`alasanBatal`/`canceledAt` terisi) → `GET /clients?q=` menunjukkan `totalBooking` tetap 1 (tidak di-decrement) & `jumlahBookingAktif=0` → `POST .../cancel` kedua kali ditolak 409 (status terminal) → `PUT /clients/:id/notes` sukses. Semua sesuai kontrak yang direncanakan.

### 2026-07-22 — F09 DB: field pembatalan di `Booking` + review index daftar order

#### Ditambahkan
- **`Booking.alasanBatal`** (`String?`) dan **`Booking.canceledAt`** (`DateTime?`) — `backend/prisma/schema.prisma`. Menyimpan alasan pembatalan + timestamp saat `statusBooking` → `CANCELED` (F09, FR-F09-3 §5: "Pembatalan menyimpan alasan + catatan refund"; catatan refund manual ditulis ke `alasanBatal` karena refund terjadi di luar platform, RULE-1 non-kustodi F06). `canceledAt` untuk audit & metrik rasio batal (F09 §12). Keduanya nullable, tidak mengubah field/index lain.
- Migrasi Prisma `20260721164405_f09_booking_cancel_fields` (dijalankan hanya ke Neon `dev`; `main`/production ikut otomatis saat rilis via `prisma migrate deploy` pada `vercel-build`) — `ALTER TABLE "Booking" ADD COLUMN "alasanBatal" TEXT, ADD COLUMN "canceledAt" TIMESTAMP(3)`.

#### Diperiksa (tanpa perubahan)
- **Index `Booking`** untuk pola query F09 `GET /bookings?status=&from=&to=&q=`: **diputuskan TIDAK menambah** composite `[tenantId, statusBooking, tanggalAcara]`. Alasan: (1) `statusBooking` hanya 6 nilai (kardinalitas rendah) — di skala MVP (ratusan–ribuan baris/tenant), composite `[tenantId, tanggalAcara]` yang sudah ada (atau bahkan `[tenantId]` saja) sudah cukup selektif, sisa filter status difilter in-memory dengan biaya diabaikan; (2) `statusBooking` berubah sangat sering sepanjang siklus hidup booking (AWAITING_DP→CONFIRMED→PAID→COMPLETED/CANCELED/EXPIRED, plus reschedule) — index tambahan yang memuat kolom ini menambah write amplification pada setiap transisi status untuk manfaat baca yang belum terbukti nyata di skala ini. Filter `q` (nama klien via relasi `Client.nama`) memakai `ILIKE`/substring, tidak terbantu B-tree — di luar lingkup index ini (butuh `pg_trgm`/GIN bila nanti diperlukan, bukan sekarang). Kesimpulan: index existing (`[tenantId]`, `[tanggalAcara]`, `[statusBooking]`, `[tenantId, tanggalAcara]`) tetap dipertahankan apa adanya.
- **Index `Client`** untuk `GET /clients` (list per tenant + sort nama/createdAt + cari nama): **diputuskan TIDAK menambah** index baru. `@@unique([tenantId, phone])` sudah berfungsi sebagai index dengan `tenantId` sebagai leading column (dipakai planner untuk query tenant-scoped), ditambah `@@index([tenantId])` eksplisit yang sudah ada; sort by `nama`/`createdAt` pada set data hasil filter tenant (ratusan baris di MVP) cukup cepat lewat in-memory sort tanpa index composite tambahan. Catatan sampingan (bukan perubahan): `@@index([tenantId])` sedikit redundan dengan prefix `@@unique([tenantId, phone])` — sudah ada sebelum tugas ini, di luar lingkup, dicatat untuk pertimbangan cleanup terpisah bila diperlukan.
- `npx prisma migrate status` — bersih, "Database schema is up to date!" (6 migrasi). `npx prisma generate` sukses. `npm run build` (`nest build`) — hijau, exit 0.
- `docs/data-model.md` (entri `Booking`, bagian "Booking & Klien") diperbarui menambahkan `alasan_batal?, canceled_at?` beserta catatan kapan diisi.

### 2026-07-19 — F02 Backend: tutup gap kontrak — expose `CustomField` di `GET /api/s/:slug`

#### Ditambahkan
- `StorefrontCustomFieldDto` (`backend/src/storefront/dto/storefront-profile-response.dto.ts`): `{ id, label, tipe, opsi, wajib, urutan }` — metadata custom field tenant untuk FE me-render form booking dinamis (F04). Ditambahkan **hanya** ke varian `status: 'ACTIVE'` union `StorefrontProfileResponseDto` sebagai `customFields: StorefrontCustomFieldDto[]`; varian `INACTIVE` (tenant RESTRICTED) sengaja **tidak** menyertakan key ini sama sekali, konsisten dengan pola "tidak bocor field lain" yang sudah ada (AC-F02-3).

#### Diubah
- `StorefrontService.getProfile` (`backend/src/storefront/storefront.service.ts`): query `customField.findMany` (`select: id/label/tipe/opsi/wajib/urutan`, `orderBy: { urutan: 'asc' }`) dijalankan **paralel** (`Promise.all`) dengan query tenant utama — difilter lewat relasi `tenant: { slug }` (bukan `tenant.id`, yang belum diketahui sebelum query tenant selesai) supaya benar-benar satu round-trip bersamaan, bukan berurutan. Kolom `opsi` (`Json?` di Prisma) di-cast aman ke `string[] | null` lewat mapper baru `toCustomFieldDto`, pola sama dengan cast `zona` transport yang sudah ada.
- `storefront.service.spec.ts`: mock Prisma ditambah `customField.findMany` (default `[]`); 2 kasus baru — response ACTIVE menyertakan `customFields` terurut sesuai `urutan` (assert `orderBy: { urutan: 'asc' }` di call Prisma), dan response INACTIVE (RESTRICTED) TIDAK memiliki key `customFields` sama sekali. Total naik dari 9 → 11 test di file ini.

#### Diperiksa (tanpa perubahan)
- `npm run build` bersih; `npx jest storefront` — 11/11 lulus; full `npx jest` — 8 suite/79 test lulus, nol regresi.
- Verifikasi manual `start:dev` terhadap tenant dev nyata `f04manual1784453170080` (sudah punya `CustomField` wajib "Adat Pernikahan", dibuat sesi F04 sebelumnya — tidak perlu buat data baru, tidak ada data yang dihapus): `GET /api/s/f04manual1784453170080` mengembalikan `customFields: [{ id, label: "Adat Pernikahan", tipe: "text", opsi: null, wajib: true, urutan: 1 }]`; 404 untuk slug tak ada masih berfungsi. Konteks: gap ini pertama kali ditemukan frontend-engineer saat membangun F04 (lihat entri "F04 Frontend" di bawah, bagian "Keterbatasan MVP") — booking submit untuk tenant dengan custom field wajib akan selalu 400 tanpa fix ini.

### 2026-07-19 — F04 Frontend: Booking Mandiri oleh Klien

#### Ditambahkan
- **`frontend/src/features/storefront-public/`** — form booking mandiri (F04) menggantikan **isi** placeholder `storefront-booking-dialog.tsx` ("Booking Online Segera Hadir") dengan wizard 4 langkah di dalam `Sheet` (bottom, mobile-first), dipicu dari tombol CTA yang sama (`storefront-cta.tsx`, tidak diubah mekanismenya):
  - **Step 1 — Layanan**: checkbox list dari `services` (context storefront F02/F03, sudah tersedia di halaman); bila ada layanan `butuhTransport` → tampilkan pilihan zona (mode `ZONA`, `RadioGroup`) atau info flat fee otomatis (mode `FLAT`); ringkasan real-time (subtotal, biaya transport, total, estimasi DP).
  - **Step 2 — Tanggal & Slot**: **reuse** `DatePicker` + hook `use-storefront-slots.ts` yang sudah ada (F05 preview) — tidak duplikasi query. Chip jam yang `tersedia=true` bisa diklik; slot yang cukup panjang untuk total durasi layanan terpilih (menggabungkan window `tersedia` berurutan) diberi badge "Cukup untuk durasi Anda" (hint visual saja, BE tetap validasi final).
  - **Step 3 — Data Diri**: RHF+Zod (`nama`, `phone` — pola sama persis dengan `PHONE_PATTERN` backend, `email` opsional, `lokasiAcara` opsional, `catatan` opsional). **Custom field dinamis TIDAK dirender** — lihat gap di bawah.
  - **Step 4 — Ringkasan & Submit**: rekap semua pilihan + total + DP: tombol "Booking Sekarang" dengan loading state; error 409 (slot bentrok) menampilkan **pesan server apa adanya** via toast, mengembalikan wizard ke Step 2, dan meng-invalidate query slot supaya daftar ter-refresh; 429/404/400 lain ditangani dengan pesan sesuai.
  - **Layar konfirmasi** (201) dalam Sheet yang sama (tidak redirect): `kodeBooking` besar + tombol salin (`navigator.clipboard`), hitung mundur hold (`holdUntil`, update tiap detik), instruksi pembayaran DP dari `paymentProfile` (atau pesan "MUA belum mengatur info pembayaran" bila `null`), tombol "Lihat status booking →" (tab baru) ke halaman status.
  - File baru: `storefront-booking-step-services.tsx`, `storefront-booking-step-schedule.tsx`, `storefront-booking-step-details.tsx`, `storefront-booking-step-summary.tsx`, `storefront-booking-success.tsx`; `hooks/use-create-booking.ts` (mutation + helper klasifikasi error 409/429/404 + ekstraksi pesan server yang menangani `message` berupa string ATAU array class-validator); `lib/booking-pricing.ts` (estimasi subtotal/transport/total/DP, **mirror persis** `computeDpAmount`/`computeTransportFee`/`computeBookingTotals` backend — BE tetap source of truth final); `lib/slot-fit.ts` (helper "cukup durasi"); `lib/slot-date.ts` (ekstraksi `toApiDateString`/`isPastDate` dari `storefront-availability.tsx`, di-reuse di kedua tempat, bukan duplikasi); `lib/naive-datetime.ts` (lihat bug-fix di bawah).
  - **Keputusan wizard state**: step 1/2 (pilih layanan, tanggal, slot) pakai `useState` biasa di coordinator (bukan RHF) — ini seleksi UI, bukan form bertipe; hanya Step 3 (data diri) pakai RHF+Zod. Reset wizard saat dialog dibuka ulang dilakukan lewat **remount berkunci** (`key` pada komponen wizard, pola React "resetting state when a prop changes"), BUKAN `useEffect` yang memanggil banyak `setState` — supaya tidak melanggar `react-hooks/set-state-in-effect` (ditemukan saat lint).
- **`frontend/src/features/booking-status/`** — fitur baru: halaman status booking publik, route `src/routes/booking-status/$kode/index.tsx` (dipilih ketimbang `bookings/$kode` untuk menghindari ambiguitas dengan `_authenticated/bookings` dashboard yang direservasi F-lain). State awal: form verifikasi ringan nomor WA (disclaimer "Verifikasi lengkap via WhatsApp menyusul" — **bukan** OTP asli, `POST /verify-otp` backend selalu 501 sampai F08) + info minimal (`kodeBooking`, badge status, tanggal saja). Setelah verifikasi nomor cocok → detail penuh (layanan, total, DP, lokasi, catatan, instruksi pembayaran, reuse `BOOKING_STATUS_BADGE_CLASS` dari `@/features/dashboard/data/status`). 404 → halaman ramah "Booking Tidak Ditemukan". Query pakai `placeholderData: keepPreviousData` supaya form verifikasi tidak "flash" ke skeleton penuh saat submit ulang.
- **`frontend/src/locales/{id,en}/storefront.json`** — bagian `booking` diperluas total (step titles, validasi, error, success) menggantikan 3 key placeholder lama.
- **`frontend/src/locales/{id,en}/booking-status.json`** — namespace baru, didaftarkan di `src/lib/i18n.ts`.
- Unit test baru: `data/schema.test.ts` (storefront-public, +9 kasus `bookingDetailsFormSchema`), `lib/booking-pricing.test.ts` (mirror kasus `pricing.util.spec.ts` backend), `lib/slot-fit.test.ts`, `lib/naive-datetime.test.ts` (lihat bug di bawah), `booking-status/data/schema.test.ts` (`verifyPhoneFormSchema`) — total 48 test lulus di kedua fitur.

#### Diperbaiki (ditemukan saat uji manual E2E, sebelum dianggap selesai)
- **CSS custom property tema tenant tidak sampai ke dialog booking**: `--sf-primary`/`--sf-secondary` sebelumnya hanya di-set lewat inline `style` di div lokal storefront (`index.tsx`). Sejak F04, `StorefrontDialogs` (Sheet booking, Radix Portal ke `document.body`) butuh variable yang sama, tapi CSS custom property hanya mengalir lewat ancestry DOM **nyata**, bukan React tree — konten yang di-portal-kan tidak pernah mewarisi variable yang di-scope ke div lokal. Akibatnya chip slot terpilih tampil **putih-di-atas-transparan (tak terlihat)** dan elemen ber-tema lain di dalam dialog jatuh ke warna default. **Fix**: `--sf-primary`/`--sf-secondary` di-set di `document.documentElement` (`:root`) lewat `useEffect` (di-lepas saat unmount), bukan hanya di div lokal — terverifikasi benar via screenshot sebelum/sesudah.
- **`tanggalAcara` booking tampil bergeser sesuai timezone browser**: field ini disimpan backend sebagai "tanggal naive UTC" (jam wall-clock tenant apa adanya di komponen UTC, BUKAN instant UTC sungguhan — konvensi yang sama dengan `slots.util`/`booking.util` backend). Memformat langsung lewat `date-fns` (yang selalu pakai getter lokal browser) membuat jam bergeser sesuai offset klien (diverifikasi: slot "11:00" tampil sebagai "19:00" di lingkungan uji WITA/+8). **Fix**: `lib/naive-datetime.ts` (`toNaiveLocalDate`) mengonversi komponen UTC datetime menjadi `Date` lokal yang setara sebelum diformat `date-fns`; diterapkan di `booking-status-detail.tsx` dan `booking-status-verify-form.tsx`. **Catatan untuk tech-lead**: pola serupa (`formatDate(tanggalMulai/...)` tanpa koreksi) kemungkinan juga ada di `features/schedule/components/blocked-dates-list.tsx` (F05) — di luar lingkup tugas ini, perlu diperiksa terpisah.

#### Keterbatasan MVP / Gap yang perlu keputusan tech-lead
- **Custom field dinamis tidak bisa direnderkan di form booking publik**: dikonfirmasi dengan membaca `backend/src/storefront/dto/storefront-profile-response.dto.ts` — `GET /api/s/:slug` (kontrak F02) **tidak** menyertakan daftar `CustomField` aktif tenant (memang sengaja tidak disebutkan di kontrak F02 lama). Step 3 form booking karena itu SKIP custom field sepenuhnya (tidak ada UI untuk mengisinya). **Dampak nyata terverifikasi**: tenant uji manual (`f04manual...`) punya `CustomField` "Adat Pernikahan" (`wajib=true`) — booking lewat FE akan **selalu ditolak 400** ("Adat Pernikahan wajib diisi.") untuk tenant mana pun yang punya custom field wajib, sampai salah satu dari: (a) `GET /api/s/:slug` diperluas menyertakan daftar `CustomField` aktif, atau (b) keputusan lain dari tech-lead. Perlu koordinasi dengan backend-engineer sebelum step ini bisa diaktifkan.

#### Diperiksa (tanpa perubahan)
- `npx tsc -b`, `npm run build`, `npx eslint` (0 error; 1 warning `react-refresh/only-export-components` pada route file — pola sama persis `s/$slug/index.tsx` yang sudah ada), `npx prettier --check` — semua bersih.
- `npx vitest run --browser.headless` pada `storefront-public` + `booking-status` — 6 suite/48 test lulus. Full `npm run test` menunjukkan kegagalan hanya pada suite pre-existing tak terkait (`sign-up-form.test.tsx` dkk, timeout browser mode di sandbox ini, sama seperti sesi F02) — nol regresi baru.
- Verifikasi manual E2E penuh (`backend start:dev` + `frontend npm run dev`, Neon dev, Playwright headless viewport iPhone 13) terhadap tenant uji `f04manual1784453170080`: alur lengkap Step 1→4 (pilih layanan+zona, pilih tanggal/slot, isi data diri, ringkasan) → submit sukses (201, `kodeBooking` format `GB-YYYYMMDD-XXXX`, hold countdown, instruksi pembayaran DP tampil benar) → buka halaman status dengan kode tsb → verifikasi nomor salah (pesan mismatch) → verifikasi nomor benar (detail penuh tampil, badge status, total/DP/lokasi/catatan/instruksi pembayaran benar) → kode acak → 404 ramah. **Uji error 409** (dua "klien" simultan memperebutkan slot sama, klien kedua via cURL langsung mensimulasikan booking pertama): submit klien pertama (state FE basi) → toast "Slot baru saja terisi." (pesan server apa adanya) → wizard kembali ke Step 2 → daftar slot ter-refresh (slot yang baru terisi hilang dari daftar). `CustomField.wajib` tenant uji di-toggle sementara ke `false` untuk menuntaskan uji alur sukses/409 di atas (gap custom field membuat submit selalu 400 bila wajib), lalu **dikembalikan ke `true`** setelah selesai — tidak ada perubahan data permanen selain 2 row `Booking` uji yang tertinggal di tenant test (`GB-20260720-G3H1`, `GB-20260720-FSUR`).

### 2026-07-19 — F04 Backend: Booking Mandiri oleh Klien

#### Ditambahkan
- **`backend/src/booking/`** — modul baru `BookingModule` (endpoint PUBLIK, tanpa `JwtAuthGuard` kecuali workaround `?phone=` di bawah), terdaftar di `app.module.ts`; mengimpor `SlotsModule` untuk menginjeksi `SlotsService.reserveSlotOrThrow` (primitif anti-bentrok F05):
  - `POST /api/s/:slug/bookings` — buat booking + hold slot 120 menit (FR-F04-5). Alur: resolve tenant by slug (404 bila tak ada/`CANCELED`/`RESTRICTED`) → load `Service` by id+tenantId+`aktif=true` (400 bila ada yang tak ketemu) → hitung `durasiTotal`, transport fee (`computeTransportFee`, sekali per booking, hanya bila salah satu service `butuhTransport`), `totalHarga`+`dpAmount` (`computeBookingTotals`, reuse `computeDpAmount` per Service) → validasi `CustomField` wajib **sebelum** transaksi dimulai (`validateWajibCustomFields`) → gabungkan `tanggalAcara`+`jamMulai` jadi timestamp UTC (`buildTanggalAcaraUtc`) → panggil `SlotsService.reserveSlotOrThrow` **di dalam** `prisma.$transaction` sebelum `booking.create` (WAJIB, kunci anti-bentrok F05) → upsert `Client` by `[tenantId, phone]` (tidak mengubah data klien existing, tidak increment `totalBooking` — tugas F06 saat `CONFIRMED`) → generate `kodeBooking` format `GB-YYYYMMDD-XXXX` (`crypto.randomInt`, bukan `Math.random`) dengan **retry-seluruh-transaksi** hingga 5x bila P2002 (unique constraint kodeBooking) — bukan `SAVEPOINT` manual, karena satu statement gagal di transaksi Postgres membuat seluruh transaksi "aborted"; `ConflictException` dari `reserveSlotOrThrow` (slot penuh/diblokir) **tidak** di-retry, langsung propagate sebagai 409. Balas **201** `{ kodeBooking, statusBooking, tanggalAcara, holdUntil, totalHarga, dpAmount, paymentProfile|null, items[] }` (FR-F04-6, instruksi pembayaran langsung; `paymentProfile` `null` bila MUA belum mengisi). Throttle 10/menit per IP.
  - `GET /api/bookings/:kode` — status booking publik (FR-F04-7). Default: **404** bila kode tak ada; selain itu hanya info minimal `{ kodeBooking, statusBooking, tanggalAcara, requiresOtp: true }` — **tidak** membocorkan nama klien/harga/lokasi (kodeBooking saja tidak cukup untuk mengintip booking orang lain). **Workaround sementara** (didokumentasikan jelas di kode + laporan tech-lead, TODO F08): query opsional `?phone=` dicocokkan dengan `booking.client.phone` — bila cocok, balas detail penuh (`requiresOtp: false` + `client`, `items`, `totalHarga`, `dpAmount`, `paymentProfile`, dll). Ini BUKAN OTP asli, hanya verifikasi ringan by phone match; throttle 20/menit per IP untuk membatasi brute-force nomor telepon.
  - `POST /api/bookings/:kode/verify-otp` — mengikuti pola `auth.controller.ts` (H-2): **selalu 501** `NotImplementedException` ("Verifikasi OTP belum tersedia — fitur WA menyusul") karena integrasi WhatsApp Business API (F08) belum ada — **tidak** membuat OTP palsu yang selalu sukses. Throttle 5/menit.
  - `src/booking/booking.util.ts` — pure functions (tanpa Prisma/NestJS DI): `buildTanggalAcaraUtc` (reuse `parseDateOnlyUtc` dari `slots.util`), `generateKodeBooking` (+ `KODE_BOOKING_PATTERN`), `computeBookingTotals` (reuse `computeDpAmount` dari `common/pricing`), `validateWajibCustomFields`.
  - `src/booking/dto/` — `CreateBookingDto` (+ `BookingClientInputDto`, `BookingCustomValueInputDto`), `booking-response.dto.ts` (union `BookingStatusMinimalResponseDto`/`BookingStatusDetailResponseDto`), `VerifyBookingOtpDto`.
  - **Keputusan desain DP**: `dpAmount` = Σ `computeDpAmount(hargaSnapshot, dpTipe, dpNilai)` **per Service** (masing-masing Service punya `dpTipe`/`dpNilai` sendiri, F03) — **bukan** dihitung dari `totalHarga` gabungan. `transportFee` **tidak** dikenakan DP, hanya menambah `totalHarga` (DP hanya atas harga jasa).
- **`backend/src/booking/booking.util.spec.ts`** — 17 unit test pure function: `buildTanggalAcaraUtc` (format valid/invalid, rentang `jamMulai`), `generateKodeBooking` (format `GB-YYYYMMDD-XXXX`, keacakan), `computeBookingTotals` (DP per-service, transport tidak kena DP, array kosong), `validateWajibCustomFields` (lolos/tolak wajib kosong/whitespace, tolak `customFieldId` bukan milik tenant).
- **`backend/src/booking/booking.service.spec.ts`** — 15 unit test `BookingService` (Prisma & `SlotsService` di-mock, pola sama `storefront.service.spec.ts`): 404 tenant tak ada/`CANCELED`/`RESTRICTED`, 400 service tak ketemu, 400 custom field wajib kosong (memverifikasi `reserveSlotOrThrow` tidak dipanggil sebelum transaksi), happy path (kontrak response lengkap + `paymentProfile` null/terisi), transport fee sekali & tidak kena DP, `ConflictException` dari `reserveSlotOrThrow` propagate 409 tanpa retry, retry kodeBooking sukses di percobaan ke-2 saat P2002, 500 setelah 5x collision berturut-turut, `getBookingStatus` (404, minimal tanpa/`phone` salah, detail penuh saat `phone` cocok).
- **`backend/src/booking/booking.service.integration.spec.ts`** — integration test AC-F04-1 end-to-end (pola sama `slots.service.integration.spec.ts`, DB Neon dev nyata, di-skip otomatis bila `DATABASE_URL` tak ada): dua panggilan `BookingService.createBooking` paralel pada tanggal+jam+kapasitas(1) yang sama → tepat satu sukses, satu 409 "Slot baru saja terisi.", tidak ada double-book di DB — membuktikan F04 benar-benar memanggil `reserveSlotOrThrow` di dalam transaksi.

#### Diperiksa (tanpa perubahan)
- `npm run build` (Nest) — 0 error. `npm test` — 8 suite / 77 test lulus (32 existing + 45 baru F04), termasuk 2 suite integrasi Neon dev (F05 + F04 baru).
- Verifikasi manual via `start:dev` terhadap tenant dev khusus yang dibuat untuk pengujian ini (`Availability` kapasitas 1, `Service` `butuhTransport=true` + `TransportRule` ZONA, `CustomField` wajib, `PaymentProfile`): `POST /bookings` sukses → `kodeBooking` format `GB-YYYYMMDD-XXXX` benar & unik, `totalHarga`/`dpAmount` sesuai keputusan desain (transport masuk total, tidak masuk DP), row `Booking`+`BookingItem`+`Client`+`CustomFieldValue` terverifikasi ada di DB via query langsung; `GET /bookings/:kode` tanpa/`phone` salah → minimal (`requiresOtp: true`), `phone` cocok → detail penuh; `POST /verify-otp` → 501; booking kedua pada slot sama → 409 tanpa membuat row; tanpa custom field wajib → 400; slug tak ada → 404 — semua tanpa menyisakan row yatim (atomicity transaksi terbukti benar, percobaan yang ditolak tidak meninggalkan data parsial).

### 2026-07-19 — Rilis: promosi `dev` → `main` (F05 kalender & anti-bentrok + F02 storefront publik)

#### Diubah
- Branch `main` (production) di-fast-forward-kan ke commit `dev` terbaru (`7f3bf8b`), mempromosikan milestone **F05** (jam kerja, tanggal diblokir, kalender bulanan, slot engine anti-bentrok, hardening keamanan: rate-limit, verify-otp 501, anti-enumeration register, JWT tanpa email, cookie `SameSite=Lax`+`Secure`) dan **F02** (storefront publik `/s/:slug` + endpoint report pelanggaran, model `StorefrontReport`) ke production.
- Sebelum push, `origin/main` ternyata sudah maju dengan PR #2 (`fix(frontend): update logo component title text`, merge commit `e454fe0`) yang tidak ada di riwayat lokal — push awal ditolak (non-fast-forward). Diselesaikan dengan `git pull --rebase origin main` (tanpa konflik, file berbeda) lalu `git push origin main` sebagai fast-forward murni (bukan force-push). SHA `main` setelah push: `2141516`.
- Push ke `main` memicu Vercel Production build + `prisma migrate deploy` ke Neon production, menerapkan migrasi `20260714141740_f05_availability_blocked_date` dan `20260714170534_f02_storefront_report`.

### 2026-07-15 — F02 Frontend: Halaman Storefront Publik `/s/$slug`

#### Ditambahkan
- **`frontend/src/routes/s/$slug/index.tsx`** — route publik baru **di luar** `_authenticated` (tanpa guard/token), thin wrapper yang merender fitur `StorefrontPublic` berdasarkan `$slug` dari URL.
- **`frontend/src/features/storefront-public/`** — fitur baru mengikuti pola template (`index.tsx`, `components/`, `data/`, `hooks/`), mengonsumsi kontrak F02 backend (`GET /api/s/:slug`, `GET /api/s/:slug/slots`, `POST /api/s/:slug/report`) via TanStack Query:
  - **Hero**: banner (fallback gradien `warnaPrimer→warnaSekunder`), logo bulat overlap (fallback inisial nama), `namaBisnis`, kota (ikon pin, `null`-safe).
  - **Theming**: `warnaPrimer`/`warnaSekunder` diterapkan sebagai CSS custom properties (`--sf-primary`/`--sf-secondary`) inline di container halaman, divalidasi lewat `isSafeCssColor()` (hex/rgb/hsl) sebelum dipakai — nilai tak valid fallback ke token app default. `font`: hanya dipetakan bila cocok daftar aman (`Inter`/`Manrope`, sudah dimuat via `index.html`) lewat `resolveSafeFontFamily()`; tidak ada fetch Google Fonts runtime. **`theme.customCss` sengaja TIDAK PERNAH dirender/di-inject** (dicatat di komentar kode) — menunggu keputusan tech-lead soal sanitizer.
  - **Daftar layanan**: card per layanan (nama, deskripsi, durasi, harga `formatCurrencyIDR`, badge tipe, badge DP persen/nominal, ikon transport bila `butuhTransport`), state kosong ramah.
  - **Seksi transport**: FLAT → satu baris nominal; ZONA → tabel zona+nominal. Tersembunyi bila tenant belum punya `TransportRule`.
  - **Cek ketersediaan (preview read-only)**: date picker (reuse `@/components/date-picker`) + `GET /s/:slug/slots` → chip jam tersedia (`menitKeHHmm`); bukan bagian alur booking.
  - **CTA "Booking"**: tombol sticky-bottom mobile → dialog placeholder "Booking Online Segera Hadir" (F04 belum ada; tidak ada form booking dibuat).
  - **Footer**: link "Laporkan halaman ini" → dialog report (RHF+Zod: `alasan` 10–1000 char, `kontak` opsional maks 200 char) → `toast` sukses/error, 429 ditangani khusus ("Terlalu banyak percobaan").
  - **Status INACTIVE** (tenant `RESTRICTED`): halaman "「namaBisnis」 sedang tidak menerima booking untuk sementara" — bukan error.
  - **404**: halaman ramah "Storefront Tidak Ditemukan" tanpa menu dashboard.
  - **Skeleton** loading state; fallback generik untuk error non-404 (5xx/jaringan).
  - State dialog dikelola via `StorefrontProvider`/`useStorefrontDialogs` (context, pola sama `<name>-provider.tsx` template) + `StorefrontDialogs` koordinator.
- **`frontend/src/locales/{id,en}/storefront.json`** — namespace i18n baru, didaftarkan di `src/lib/i18n.ts`; default Bahasa Indonesia.
- **`frontend/src/features/storefront-public/data/{data,schema}.test.ts`** — unit test util (`isSafeCssColor`, `resolveSafeFontFamily`) & skema Zod (`reportFormSchema`); 11 kasus, semua lulus.

#### Diperiksa (tanpa perubahan)
- `npx tsc -b` dan `npm run build` — 0 error. `npx vitest run --browser.headless src/features/storefront-public` — 2 suite/11 test lulus.
- Verifikasi manual (`backend start:dev` + `frontend npm run dev`, Neon dev) via Playwright headless: storefront `ACTIVE` (tema warna, layanan, badge DP, transport ZONA) tampil benar di viewport mobile 390px; slug tak ada → halaman 404 ramah; tenant `RESTRICTED` (sementara di-toggle lalu dikembalikan) → halaman nonaktif sesuai teks yang diminta; dialog report berhasil kirim → toast sukses; dialog booking placeholder tampil sesuai spesifikasi; preview slot tanggal menampilkan chip jam tersedia dengan warna tema. Data uji sementara (transport rule, status tenant, report) dibersihkan/dikembalikan setelah verifikasi — tidak ada perubahan permanen ke Neon dev.
- Full `npm run test` menunjukkan kegagalan hanya pada suite pre-existing tak terkait (`sign-up-form.test.tsx` dkk — timeout locator browser mode di lingkungan sandbox ini); nol regresi baru dari perubahan F02 frontend.

### 2026-07-15 — F02 Backend: Storefront Publik (profil + report/flag)

#### Ditambahkan
- **`backend/src/storefront/`** — modul baru `StorefrontModule` (endpoint PUBLIK, tanpa `JwtAuthGuard`), terdaftar di `app.module.ts`:
  - `GET /api/s/:slug` — profil storefront: resolve tenant by slug; **404** ("Storefront tidak ditemukan") bila slug tak ada atau tenant `CANCELED`; **200 `{ status: "INACTIVE", namaBisnis }`** minimal (tanpa field lain) bila tenant `RESTRICTED` (AC-F02-3); selain itu **200 `{ status: "ACTIVE", namaBisnis, kota, slug, theme, services, transport }`** — `services` hanya yang `aktif=true`, urut `nama` asc; `theme` menyertakan `customCss` mentah (FE yang memutuskan render), fallback ke default schema bila tenant belum punya row `Theme`; `transport` `null` bila tenant belum mengatur `TransportRule`. Query `select` Prisma SENGAJA tidak menyertakan `ownerUserId`, relasi `owner`, `subscription`, `paymentProfile`, `clients`, `bookings` — tidak ada jalur bocor data sensitif dari endpoint publik ini. Throttle 60/menit.
  - `POST /api/s/:slug/report` — simpan `StorefrontReport` (status `OPEN` default) dari body `{ alasan (10-1000 char), kontak? (maks 200 char) }`; balas **201 `{ ok: true }`** tanpa id/detail (anti-enumeration); **404** bila slug tak ada. Throttle sangat ketat 3/menit per IP (endpoint tulis publik tanpa auth).
  - Controller berbagi path dasar `/s/:slug` dengan `SlotsController` (F05) tanpa collision route — dipisah modul per tanggung jawab sesuai arahan tech-lead.
  - `src/storefront/dto/storefront-profile-response.dto.ts`, `dto/create-storefront-report.dto.ts` — DTO response (union type `ACTIVE`/`INACTIVE`) & DTO request (`class-validator`).
- **`backend/src/storefront/storefront.service.spec.ts`** — unit test `StorefrontService` (Prisma di-mock, pola sama `blocked-dates.service.spec.ts`): 404 slug tak ada, 404 tenant `CANCELED`, bentuk `INACTIVE` minimal utk `RESTRICTED` (memverifikasi `Object.keys` hanya `status`+`namaBisnis`), profil `ACTIVE` lengkap + hanya service `aktif=true` yang keluar, `select` Prisma tidak mengandung field sensitif, `transport: null` bila belum ada `TransportRule`, penyimpanan report (`kontak` opsional → `null`), 404 saat report ke slug tak ada. 9 kasus, semua lulus.

#### Diperiksa (tanpa perubahan)
- `npm run build` — 0 error. `npm test` — 5 suite / 44 test lulus (35 existing + 9 baru), termasuk integrasi Neon dev yang sudah ada.
- Verifikasi manual via `start:dev` terhadap Neon dev (tenant nyata `f05-test-1784043392`): `GET /api/s/:slug` mengembalikan bentuk `ACTIVE` sesuai kontrak; `GET` slug tak ada → 404; `POST /report` → `201 { ok: true }` dan row `StorefrontReport` (status `OPEN`) benar-benar masuk ke DB (diverifikasi via query langsung); validasi `alasan` < 10 karakter → 400; toggle tenant ke `RESTRICTED` sementara → `GET` mengembalikan `{ status: "INACTIVE", namaBisnis }` persis, lalu dikembalikan ke `TRIAL`; throttle 3/menit pada endpoint report dikonfirmasi aktif (request setelah kuota terpakai → 429). Tidak ada perubahan permanen ke data Neon dev selain satu baris test `StorefrontReport` yang sengaja dibuat untuk verifikasi.

### 2026-07-15 — F02 DB: Model `StorefrontReport` (Report/Flag Storefront Publik)

#### Ditambahkan
- **`backend/prisma/schema.prisma`** — model `StorefrontReport` (tenant-scoped) untuk tombol report/flag storefront publik (F02, FR-F02-5), dikonsumsi alur moderasi reaktif admin (F12, US-F12-2): `id, tenantId, alasan, kontak?, status(ReportStatus @default(OPEN)), createdAt`. Enum baru `ReportStatus { OPEN, REVIEWED, DISMISSED }` (UPPERCASE_ENGLISH sesuai `docs/conventions.md`). FK `tenantId → Tenant.id` dengan `onDelete: Cascade`; index pada `tenantId` dan `status`. Relasi balik `Tenant.storefrontReports`.
- **`backend/prisma/migrations/20260714170534_f02_storefront_report/`** — migrasi Prisma (CreateEnum `ReportStatus`, CreateTable `StorefrontReport`, index, FK) diterapkan ke Neon dev; `prisma migrate status` bersih, `prisma generate` & `npm run build` (Nest) sukses tanpa error.

#### Diubah
- **`docs/data-model.md`** — seksi "Pendukung" ditambah entri `StorefrontReport` (skema ringkas + referensi F02/F12).

#### Ditambahkan
- **`backend/src/blocked-dates/blocked-dates.service.spec.ts`** — unit test (Prisma di-mock) untuk edge case F05 §9 yang sebelumnya tidak diuji: `create()` menolak (409 `ConflictException`) bila rentang blokir beririsan booking `CONFIRMED`/`PAID`; mengizinkan blokir bila tidak ada bentrok; menolak (400 `BadRequestException`) bila `tanggalMulai > tanggalSelesai`; memverifikasi booking `AWAITING_DP` (hold, belum confirmed) TIDAK menghalangi blokir tanggal (hanya status permanen yang menghalangi). 4 kasus, semua lulus.

#### Diperiksa (tanpa perubahan)
- **BE**: `npm test` — 4 suite/35 test lulus (31 existing + 4 baru). Integrasi `slots.service.integration.spec.ts` dikonfirmasi benar-benar berjalan terhadap Neon dev (bukan di-skip) — dua `$transaction` paralel pada slot kapasitas 1 menghasilkan tepat 1 sukses + 1 `ConflictException`, AC-F05-1 tervalidasi nyata (bukan simulasi). `npm run build` — 0 error.
- **AC-F05-2** (hold kedaluwarsa → slot bebas): sudah tercakup eksplisit di `slots.util.spec.ts` (`isBookingActive`) — kasus `holdUntil` di masa depan (memblokir) dan `holdUntil` sudah lewat (bebas, lazy expiry) sama-sama diuji. Tidak perlu tes tambahan.
- **AC-F05-3** (konfirmasi DP mengunci permanen): di luar lingkup F05, didelegasikan ke F06 — tidak dibuat tes di sini.
- **FE**: `npx vitest run src/lib src/features/schedule` — 19/19 lulus, termasuk `time.test.ts` dan `cookies.test.ts` (tidak ada test komponen di `src/features/schedule/` — verifikasi fitur ini murni manual E2E Playwright oleh frontend-engineer, dicatat sebagai gap koverage otomatis, bukan blocker). Full run `npx vitest run` menunjukkan kegagalan hanya pada suite pre-existing tak terkait (`config-drawer`, `users-*-dialog`, `tasks-*-dialog`, `sign-up-form`, `user-auth-form` — timeout locator browser, dikonfirmasi sudah ada sebelum F05); nol regresi baru, nol kegagalan pada file yang disentuh F05.
- Tidak ada perubahan kode produksi — hanya file test baru di atas.

### 2026-07-14 — F05 Frontend: Halaman "Jadwal" (Jam Kerja, Tanggal Diblokir, Kalender) + Fix Keamanan Cookie (M-2)

#### Ditambahkan
- **`frontend/src/features/schedule/`** — fitur "Jadwal" (F05) mengikuti pola template (`provider` + `hooks` TanStack Query + Zod + i18n), terhubung ke API `backend-engineer` yang sudah ada (`/availability`, `/blocked-dates`, `/calendar`):
  - `data/types.ts`, `data/schema.ts` — kontrak `Availability`/`BlockedDate`/`CalendarResponse` persis DTO backend; skema Zod mirror validasi BE (`jamMulai<jamSelesai`, rentang jam ≥ `slotDurasi`, tanggal selesai ≥ mulai untuk rentang blokir).
  - `data/data.ts` — `HARI_TAMPIL_ORDER` (Senin→Minggu untuk tampilan, terpisah dari `hari` 0=Minggu..6=Sabtu punya BE — sengaja tidak diurutkan ulang array dari API).
  - `hooks/use-availability.ts`, `hooks/use-blocked-dates.ts`, `hooks/use-calendar.ts` — query + mutation + invalidation silang (`availability`/`blocked-dates` → invalidate `calendar` juga karena saling memengaruhi tampilan kalender). `useCreateBlockedDate` menangani `409` dari BE (irisan booking `CONFIRMED`/`PAID`) dengan menampilkan pesan server apa adanya ("Pindahkan booking tersebut...").
  - `components/schedule-provider.tsx`, `schedule-dialogs.tsx` — state dialog tambah/hapus tanggal diblokir (pola `ServiceProvider`).
  - `components/availability-editor.tsx` — editor 7 hari (toggle aktif, jam mulai/selesai via `<input type="time">`, slot durasi, kapasitas); simpan = `PUT` array hanya hari aktif (hari nonaktif otomatis "dihapus" sesuai kontrak replace-all BE).
  - `components/blocked-dates-list.tsx`, `blocked-date-form-dialog.tsx` — list + dialog tambah (tanggal tunggal atau rentang via toggle "Rentang beberapa hari", pakai `DatePicker` yang sudah ada) + hapus via `ConfirmDialog` existing.
  - `components/schedule-calendar.tsx`, `schedule-calendar-day.tsx` — grid bulan CSS custom (bukan library eksternal), navigasi prev/next bulan → fetch ulang `GET /calendar` per rentang bulan; per hari: badge "Diblokir" (tooltip alasan) dan hingga 2 badge kode booking (warna status pakai `BOOKING_STATUS_BADGE_CLASS` dari fitur dashboard, label status dari namespace i18n `dashboard`).
  - `index.tsx` — komposisi `ScheduleProvider` + `Tabs` 3 seksi (Kalender/Jam Kerja/Tanggal Diblokir) + `ScheduleDialogs`, mengikuti layout `Header`/`Main` template.
- **`frontend/src/lib/time.ts`** (+ `time.test.ts`) — util bersama `menitKeHHmm`/`hhmmKeMenit` (konversi menit-sejak-00:00 ↔ `"HH:mm"`) dipakai fitur Jadwal untuk merepresentasikan `jamMulai`/`jamSelesai` integer BE sebagai input jam yang lazim dibaca manusia.
- **`frontend/src/locales/{id,en}/schedule.json`** — namespace i18n baru untuk fitur Jadwal, didaftarkan di `src/lib/i18n.ts`.
- Route existing `frontend/src/routes/_authenticated/availability/index.tsx` (placeholder "Segera hadir") disambungkan ke `<Schedule />` — tidak perlu route baru karena placeholder untuk `/availability` sudah ada di sidebar.

#### Diubah
- **`frontend/src/lib/cookies.ts`** (fix audit M-2) — `setCookie` kini menyertakan atribut `SameSite=Lax` (mitigasi CSRF) selalu, dan `Secure` hanya bila `location.protocol === 'https:'` (agar `npm run dev` di `http://localhost` tetap bisa login — browser menolak cookie `Secure` di konteks non-HTTPS).
- **`frontend/src/components/date-picker.tsx`** — `disabled` (fungsi tanggal nonaktif) dan `className` dibuat jadi prop opsional (sebelumnya hardcode untuk kasus tanggal lahir: tak boleh di masa depan) supaya komponen bisa dipakai ulang oleh dialog Tanggal Diblokir (kasus sebaliknya: tak boleh tanggal lampau) tanpa menduplikasi komponen. Pemakaian existing (`account-form.tsx`, field `dob`) tidak berubah perilakunya (default tetap sama).
- **`frontend/src/components/layout/data/sidebar-data.ts`** — label menu "Ketersediaan" → "Jadwal" (cakupan halaman kini lebih luas: jam kerja + tanggal diblokir + kalender, bukan hanya jam kerja).

#### Diperiksa (tanpa perubahan)
- **`frontend/src/stores/auth-store.ts`** — sudah TIDAK men-decode JWT untuk mendapatkan `email`; `user` (termasuk `email`) diisi dari respons `POST /auth/register`/`login` via `setAuth()`, konsisten dengan payload JWT BE yang kini hanya berisi `sub`/`tenantId`. Tidak ditemukan pemakaian decode-JWT lain di `frontend/src`.

#### Verifikasi
- `npx tsc -b` — 0 error. `npm run build` — sukses (bundle baru `availability-*.js` untuk fitur Jadwal, tidak ada error lain).
- `npx eslint` pada seluruh file baru/diubah — 0 error, 0 warning (pre-existing errors di file lain yang tidak disentuh — `sign-up-form.tsx`, `user-auth-form.tsx`, `trial-banner.tsx`, `date.ts`, `onboarding/index.tsx`, `types/i18next.d.ts` — dikonfirmasi sudah ada sebelum perubahan ini, di luar lingkup tugas).
- `npx vitest run src/lib/time.test.ts src/lib/cookies.test.ts` — lulus (termasuk round-trip `menitKeHHmm`/`hhmmKeMenit` dan cookie `Secure`/`SameSite` tidak merusak get/set/remove existing test yang jalan di `http:` browser test-runner).
- Uji manual end-to-end (`npm run start:dev` backend @ Neon dev + `npm run dev` frontend, didorong lewat Playwright headless untuk mengambil screenshot tiap langkah): register akun MUA baru → set Jam Kerja Senin 09:00–17:00/slot 60/kapasitas 1 → **Simpan** → toast "Jam kerja berhasil disimpan." → reload → nilai tetap tersimpan. Tab Tanggal Diblokir → **Tambah Blokir** tanggal besok alasan "Tes libur" → **409** diuji tidak terjadi (tanggal kosong) → sukses, toast "Tanggal berhasil diblokir." → tambah tanggal kedua → hapus salah satu via `ConfirmDialog` (pesan terisi tanggal terformat) → toast "Blokir tanggal berhasil dihapus." Tab Kalender menampilkan grid Juli 2026 dengan badge "Diblokir" pada tanggal yang diblokir via `curl` sebelumnya. Nol error console, nol request gagal di semua langkah.

### 2026-07-14 — F05 Backend: Kalender & Anti-Bentrok (API) + Security Hardening (H-1, H-2, M-1, M-3, L-5)

#### Ditambahkan
- **`backend/src/availability/`** (`AvailabilityModule`) — jam kerja MUA per hari (FR-F05-1):
  - `GET /api/availability` — list aturan tenant, urut `hari` asc.
  - `PUT /api/availability` — bulk upsert **replace-all** dalam satu `$transaction`: body adalah ARRAY langsung (divalidasi per-elemen via `ParseArrayPipe({ items: UpsertAvailabilityItemDto })`, bukan dibungkus objek). Hari yang tidak dikirim (atau dikirim `aktif:false`) **dihapus**; `aktif` bukan kolom DB — hanya sinyal request untuk skip persist. Validasi: `0<=hari<=6`, `0<=jamMulai<jamSelesai<=1440`, `slotDurasi>0`, `kapasitas>=1`, `jamSelesai-jamMulai>=slotDurasi`, tidak boleh ada `hari` duplikat dalam satu payload.
- **`backend/src/blocked-dates/`** (`BlockedDatesModule`) — tanggal/rentang diblokir (FR-F05-2):
  - `GET /api/blocked-dates?from=&to=` — list, filter rentang opsional (overlap).
  - `POST /api/blocked-dates` — buat `{tanggalMulai, tanggalSelesai, alasan?}`; **409 Conflict** bila rentang beririsan dengan booking `CONFIRMED`/`PAID` existing (F05 §9) — pesan minta pindahkan booking dulu.
  - `DELETE /api/blocked-dates/:id` — cek kepemilikan `tenantId` dulu (404 jika bukan milik tenant), baru hapus.
- **`backend/src/slots/`** (`SlotsModule`) — slot engine F05, dipakai storefront publik & disiapkan untuk F04:
  - `slots.util.ts` — fungsi murni testable: `parseDateOnlyUtc`/`toDateOnlyString`/`addDaysUtc`/`diffDaysUtc`/`truncateToDateUtc` (tanggal diperlakukan UTC-naive — belum ada kolom timezone per tenant), `generateSlotWindows` (FR-F05-3), `rangesOverlap`, `isBookingActive` (lazy expiry: `AWAITING_DP` dengan `holdUntil` lewat dianggap bebas tanpa perlu worker — flip status ke `EXPIRED` didelegasikan ke cron terpisah, direncanakan F08), `countOccupancy`.
  - `SlotsController` (`GET /api/s/:slug/slots?date=YYYY-MM-DD`) — **PUBLIK, tanpa `JwtAuthGuard`**: resolve tenant dari slug, hitung slot dari `Availability` dikurangi `BlockedDate` dan okupansi booking aktif (`CONFIRMED`/`PAID`/`AWAITING_DP` belum expired). Response minimal `{ date, slots: [{jamMulai, jamSelesai, tersedia}] }` — tidak membocorkan detail booking/klien. Throttle ketat 30/menit (H-1).
  - `CalendarController` (`GET /api/calendar?from=&to=`, dashboard, auth) — gabungan booking (dengan nama klien + total durasi) + blocked dates + availability tenant, dikelompokkan per tanggal (`days[]`); dibatasi maks 100 hari per request.
  - `SlotsService.reserveSlotOrThrow(tx, tenantId, tanggalAcara, durasiMenit)` — **primitif anti-bentrok (FR-F05-7)**, dipakai F04 nanti: HARUS dipanggil di dalam `prisma.$transaction`. Kunci atomik via `pg_advisory_xact_lock(hashtext(tenantId:tanggal))` (Prisma tagged template `$executeRaw`, terparameterisasi penuh — bukan `SELECT...FOR UPDATE` karena baris booking untuk slot itu mungkin belum eksis sama sekali sehingga `FOR UPDATE` tidak bisa mencegah race pada booking pertama di hari itu). Setelah lock, re-cek availability/blocked-date/okupansi; jika penuh → `ConflictException("Slot baru saja terisi.")`.
- **Test slot engine**:
  - `backend/src/slots/slots.util.spec.ts` — 19 kasus unit murni: parsing tanggal, generate slot window, overlap rentang, lazy expiry hold (AC-F05-2), overlap blocked date (F05 §9), perhitungan okupansi.
  - `backend/src/slots/slots.service.integration.spec.ts` — integrasi terhadap Neon dev nyata (`describe.skip` otomatis bila `DATABASE_URL` tidak ada): dua `$transaction` paralel `reserveSlotOrThrow` + `booking.create` pada slot kapasitas 1 → **tepat satu sukses, satu `ConflictException`** (AC-F05-1), memverifikasi tidak ada double-book tersimpan di DB. Data uji dibersihkan di `afterAll`.
- **`@nestjs/throttler`** (H-1) — rate-limit global `ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 60 }] })` + `APP_GUARD` di `app.module.ts`; `@Throttle` lebih ketat di `POST /auth/register` & `POST /auth/login` (5/menit), `GET /tenants/slug-check` (10/menit), `POST /auth/verify-otp` (5/menit), `GET /s/:slug/slots` (30/menit).

#### Diubah
- **`backend/src/app.setup.ts`** (H-1) — `app.getHttpAdapter().getInstance()` di-cast ke `Application` (express) lalu `.set('trust proxy', 1)` — supaya `ThrottlerGuard` membaca IP klien asli dari `X-Forwarded-For` di belakang proxy Vercel (`1` = percaya satu hop terdekat saja, mitigasi IP-spoofing).
- **`backend/src/auth/auth.controller.ts`** (H-2) — `POST /auth/verify-otp` **tidak lagi** membalas `{ verified: true }` tanpa verifikasi nyata (stub berbahaya) — sekarang selalu melempar `NotImplementedException` (501). Dicek: tidak ada pemakaian `verify-otp`/`verifyOtp` di `frontend/src`, sehingga aman diubah tanpa koordinasi FE. TODO F08 tetap: integrasi WhatsApp Business API nyata.
- **`backend/src/auth/auth.service.ts`** (M-1, M-3) — `register()`: pesan konflik email disamakan jadi generik `"Registrasi gagal. Periksa kembali data Anda."` untuk SEMUA kasus akun sudah ada (anti-enumeration) — sebelumnya membedakan "email sudah terdaftar" vs "akun sudah punya tenant", yang bisa dipakai menebak email terdaftar. Pesan "Slug sudah digunakan" tetap spesifik (slug memang publik). `signToken()` di `register()`/`login()` tidak lagi menyertakan `email` di payload JWT.
- **`backend/src/common/decorators/current-user.decorator.ts`** (M-3) — `JwtPayload` dipangkas jadi `{ sub, tenantId }` saja (hapus `email`) — guard/tenant-scoping hanya butuh keduanya; profil (termasuk email) diambil ulang dari DB via `GET /auth/me` bila FE butuh.
- **`backend/src/auth/dto/register.dto.ts`** (L-5) — regex slug `{3,50}` → `{3,30}`, disamakan dengan `GET /tenants/slug-check` (`{3,30}`).
- **`backend/src/tenant/tenant.controller.ts`** — tambah `@Throttle({ limit: 10, ttl: 60_000 })` di `GET /tenants/slug-check` (H-1).
- **`backend/src/app.module.ts`** — daftarkan `ThrottlerModule` + `APP_GUARD: ThrottlerGuard`, dan modul baru `AvailabilityModule`, `BlockedDatesModule`, `SlotsModule`.
- **`backend/package.json`** — dependensi baru `@nestjs/throttler`.

#### Verifikasi
- `npm run build` (nest build) — 0 error.
- `npm test` — 31/31 lulus (19 unit `slots.util.spec.ts` + 1 integrasi race-condition `slots.service.integration.spec.ts` + 11 existing `pricing.util.spec.ts`).
- `npx eslint` pada seluruh file baru/diubah — 0 error, 0 warning baru (2 error pre-existing tak terkait — `auth.module.ts` unsafe `any` di `JwtModuleOptions`, `main.ts` floating-promise `bootstrap()` — dibiarkan, di luar lingkup tugas ini).
- Uji manual via `npm run start:dev` (Neon dev): register → `PUT /availability` (Selasa 09:00–17:00, slot 60 menit, kapasitas 1) → `GET /s/:slug/slots?date=2026-07-21` menampilkan 8 slot `tersedia:true` → `POST /blocked-dates` tanggal sama → slot berubah `tersedia:false` semua → `DELETE /blocked-dates/:id` → slot kembali `tersedia:true`. `GET /calendar` menampilkan hari terblokir + alasan. `POST /auth/verify-otp` → `501`. Registrasi email duplikat → pesan generik `409`. Payload JWT terverifikasi hanya berisi `sub`/`tenantId` (tanpa `email`). Data uji dibersihkan setelahnya.
- **Kontrak API untuk `frontend-engineer`** — lihat ringkasan endpoint & DTO di bawah (dilaporkan penuh ke tech-lead/frontend-engineer di luar file ini; struktur response persis seperti didefinisikan di masing-masing `dto/*.dto.ts`).

### 2026-07-14 — F05: model `Availability` & `BlockedDate` (jadwal & anti-bentrok)

#### Ditambahkan
- **`backend/prisma/schema.prisma`** — model `Availability` (`tenantId, hari` Int 0=Minggu..6=Sabtu, `jamMulai`/`jamSelesai` Int menit-sejak-tengah-malam, `slotDurasi` Int menit, `kapasitas` Int default 1; `@@unique([tenantId, hari])` — satu window jam kerja per hari per tenant di MVP; `@@index([tenantId])`) dan model `BlockedDate` (`tenantId, tanggalMulai`/`tanggalSelesai` `@db.Date` rentang inklusif, `alasan` opsional; `@@index([tenantId])` + `@@index([tenantId, tanggalMulai, tanggalSelesai])` untuk query overlap). Keduanya relasi `Tenant` `onDelete: Cascade`. Ditambahkan komentar pada model `Booking` menegaskan durasi booking dihitung dari Σ `BookingItem.durasi` dan jendela hari dari `Availability`, bukan kolom terpisah di `Booking`.
- **`backend/prisma/migrations/20260714141740_f05_availability_blocked_date/`** — migrasi Prisma: `CREATE TABLE Availability`, `CREATE TABLE BlockedDate`, index & unique constraint terkait, FK ke `Tenant` (cascade). Diverifikasi terhadap Neon `dev`: `prisma migrate status` bersih, `prisma generate` & `npm run build` (nest build) sukses.

#### Diubah
- **`docs/data-model.md`** §Jadwal — detail tipe & representasi final `Availability`/`BlockedDate` (Int untuk hari/jam, Date untuk rentang blokir) serta catatan bahwa `Booking` tidak menyimpan `jam_mulai`/`jam_selesai` sendiri (diturunkan dari `Availability` + `BookingItem.durasi`).

### 2026-07-14 — Fix konflik peer dependency `i18next` vs TypeScript 6 (Vercel build frontend)

#### Diperbaiki
- **`frontend/package.json`** — upgrade `i18next` `^24.2.3` → `^26.3.6` dan `react-i18next` `^15.7.4` → `^17.0.9`. Versi lama mendeklarasikan `peerDependenciesMeta.typescript` hanya `^5`, bentrok dengan `typescript ~6.0.3` yang sudah dipakai di `devDependencies` frontend → `npm install`/`npm ci` gagal ERESOLVE saat build di Vercel. Versi baru mendukung `typescript ^5 || ^6 || ^7` sehingga resolusi dependency bersih tanpa `--legacy-peer-deps`. Diverifikasi: `npm ci`, `npx tsc -b`, dan `npm run build` sukses; tidak ada perubahan API (`useTranslation`, `initReactI18next`, `i18next-browser-languagedetector`) yang berdampak pada pemakaian di `src/lib/i18n.ts` dan seluruh fitur yang memakai `useTranslation`.

### 2026-07-13 — Rilis pertama GlowBook: merge `dev` → `main`

#### Diubah
- **Branch `main`** di-fast-forward dari `86415ca` ke `402fabe` (merge langsung dari `dev`, sesuai `docs/conventions.md` §Workflow Branch & Rilis) — mempromosikan fondasi F03 (Layanan) beserta fix deploy Vercel (entry serverless, config Neon, `prisma generate` sebelum `nest build`) ke environment Production.

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
