import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { useRegencies } from './use-regencies'

const apiGetMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', () => ({
  api: { get: apiGetMock },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useRegencies', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
  })

  it('does not call the API when provinceId is undefined', async () => {
    const { result } = await renderHook(() => useRegencies(undefined), {
      wrapper: createWrapper(),
    })

    expect(apiGetMock).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches GET /wilayah/regencies?provinceId= once a province is given', async () => {
    const data = [
      { id: '10', kode: '1101', nama: 'Kab. Aceh Selatan' },
      { id: '11', kode: '1102', nama: 'Kab. Aceh Tenggara' },
    ]
    apiGetMock.mockResolvedValueOnce({ data })

    const { result } = await renderHook(() => useRegencies('1'), {
      wrapper: createWrapper(),
    })

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGetMock).toHaveBeenCalledWith('/wilayah/regencies', {
      params: { provinceId: '1' },
    })
    expect(result.current.data).toEqual(data)
  })

  it('refetches with the new provinceId when the province changes', async () => {
    apiGetMock.mockResolvedValueOnce({ data: [] })

    const { result, rerender } = await renderHook(
      (props?: { provinceId: string }) => useRegencies(props?.provinceId),
      { wrapper: createWrapper(), initialProps: { provinceId: '1' } }
    )

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true))

    apiGetMock.mockResolvedValueOnce({
      data: [{ id: '20', kode: '3101', nama: 'Kota Jakarta Selatan' }],
    })
    await rerender({ provinceId: '2' })

    await vi.waitFor(() =>
      expect(result.current.data).toEqual([
        { id: '20', kode: '3101', nama: 'Kota Jakarta Selatan' },
      ])
    )
    expect(apiGetMock).toHaveBeenLastCalledWith('/wilayah/regencies', {
      params: { provinceId: '2' },
    })
  })

  it('exposes an error state when the request fails', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('network error'))

    const { result } = await renderHook(() => useRegencies('1'), {
      wrapper: createWrapper(),
    })

    await vi.waitFor(() => expect(result.current.isError).toBe(true))
  })
})
