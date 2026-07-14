/**
 * Cookie utility functions using manual document.cookie approach
 * Replaces js-cookie dependency for better consistency
 */

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift()
    return cookieValue
  }
  return undefined
}

/**
 * Set a cookie with name, value, and optional max age.
 *
 * Keamanan (temuan audit M-2): selalu set `SameSite=Lax` untuk mitigasi CSRF,
 * dan `Secure` bila halaman dilayani via HTTPS. `Secure` sengaja diskip pada
 * `http:` (mis. `npm run dev` di localhost) karena browser menolak menyimpan
 * cookie `Secure` di konteks non-HTTPS — tanpa pengecualian ini, login akan
 * gagal di dev lokal.
 */
export function setCookie(
  name: string,
  value: string,
  maxAge: number = DEFAULT_MAX_AGE
): void {
  if (typeof document === 'undefined') return

  const isHttps =
    typeof location !== 'undefined' && location.protocol === 'https:'
  const secureAttr = isHttps ? '; Secure' : ''

  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${secureAttr}`
}

/**
 * Remove a cookie by setting its max age to 0
 */
export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return

  document.cookie = `${name}=; path=/; max-age=0`
}
