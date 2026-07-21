import { useEffect, useState } from 'react'

/**
 * Debounces a value by `delayMs` — dipakai untuk memperlambat request server
 * (mis. pencarian `q` di F09 Order & Klien) tanpa mengorbankan responsivitas
 * ketikan pada input (input tetap bind ke state lokal/URL yang instan; hanya
 * NILAI YANG DIPAKAI UNTUK QUERY yang menunggu jeda ketik berhenti).
 *
 * @example
 * const debouncedQ = useDebouncedValue(search.q ?? '', 300)
 * useQuery({ queryKey: ['orders', 'list', { ...filters, q: debouncedQ }], ... })
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
