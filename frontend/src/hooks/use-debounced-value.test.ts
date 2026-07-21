import { describe, expect, it } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { sleep } from '@/lib/utils'
import { useDebouncedValue } from './use-debounced-value'

/**
 * Pakai jeda waktu NYATA (bukan `vi.useFakeTimers`) — di browser mode
 * (Playwright/Chromium sungguhan), React 19 menjadwalkan flush effect lewat
 * `MessageChannel`, bukan `setTimeout`, sehingga `vi.advanceTimersByTimeAsync`
 * tidak memicu re-render setelah `rerender()`. Delay dibuat kecil (30ms) agar
 * tes tetap cepat.
 */
const DELAY_MS = 30

describe('useDebouncedValue', () => {
  it('mengembalikan nilai awal segera', async () => {
    const { result } = await renderHook(() =>
      useDebouncedValue('a', DELAY_MS)
    )
    expect(result.current).toBe('a')
  })

  it('menunda pembaruan nilai sampai jeda selesai', async () => {
    const { result, rerender } = await renderHook(
      (props?: { value: string }) =>
        useDebouncedValue(props?.value ?? '', DELAY_MS),
      { initialProps: { value: 'a' } }
    )

    await rerender({ value: 'ab' })
    // Belum berubah sebelum jeda selesai
    expect(result.current).toBe('a')

    await sleep(DELAY_MS * 3)
    expect(result.current).toBe('ab')
  })

  it('hanya memakai nilai TERAKHIR bila berubah beberapa kali dalam satu jeda', async () => {
    const { result, rerender } = await renderHook(
      (props?: { value: string }) =>
        useDebouncedValue(props?.value ?? '', DELAY_MS),
      { initialProps: { value: 'a' } }
    )

    await rerender({ value: 'ab' })
    await sleep(DELAY_MS / 3)
    await rerender({ value: 'abc' })
    await sleep(DELAY_MS / 3)
    await rerender({ value: 'abcd' })

    // Total waktu sejak perubahan terakhir belum mencapai satu jeda penuh
    expect(result.current).toBe('a')

    await sleep(DELAY_MS * 3)
    expect(result.current).toBe('abcd')
  })
})
