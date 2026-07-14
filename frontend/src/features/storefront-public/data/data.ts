// Daftar font "aman" yang sudah dimuat lewat Google Fonts `<link>` di
// `index.html` (lihat `src/config/fonts.ts`). Untuk MVP kita SENGAJA tidak
// fetch Google Fonts secara runtime berdasarkan input tenant — itu berarti
// request jaringan tak terduga + FOUC untuk tiap storefront berbeda, buruk
// untuk target "muat < 2 detik di 4G". `theme.font` dari API hanya dipetakan
// bila cocok (case-insensitive) dengan salah satu entri di sini; selain itu
// fallback ke font stack default aplikasi (`--font-sans` / Inter).
const STOREFRONT_SAFE_FONTS: Record<string, string> = {
  inter: "'Inter', sans-serif",
  manrope: "'Manrope', sans-serif",
}

export function resolveSafeFontFamily(
  font: string | null | undefined
): string | undefined {
  if (!font) return undefined
  return STOREFRONT_SAFE_FONTS[font.trim().toLowerCase()]
}

// Validasi warna sebelum dipakai sebagai CSS custom property inline. Nilai
// `warnaPrimer`/`warnaSekunder` datang dari data tenant (Theme) — bukan input
// pengguna anonim, tapi tetap divalidasi sebagai lapisan pertahanan agar
// string yang tidak berbentuk warna tidak pernah masuk ke `style` (mis.
// mencegah nilai aneh menutup deklarasi CSS lebih awal).
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/
const RGB_COLOR_RE =
  /^rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(,\s*[\d.]+\s*)?\)$/
const HSL_COLOR_RE =
  /^hsla?\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(,\s*[\d.]+\s*)?\)$/

export function isSafeCssColor(
  value: string | null | undefined
): value is string {
  if (!value) return false
  const v = value.trim()
  return HEX_COLOR_RE.test(v) || RGB_COLOR_RE.test(v) || HSL_COLOR_RE.test(v)
}
