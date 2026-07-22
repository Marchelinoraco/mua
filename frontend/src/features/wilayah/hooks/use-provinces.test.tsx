import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { useProvinces } from './use-provinces'

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

describe('useProvinces', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
  })

  it('fetches GET /wilayah/provinces and exposes the list', async () => {
    const data = [
      { id: '1', kode: '11', nama: 'Aceh' },
      { id: '2', kode: '12', nama: 'Sumatera Utara' },
    ]
    apiGetMock.mockResolvedValueOnce({ data })

    const { result } = await renderHook(() => useProvinces(), {
      wrapper: createWrapper(),
    })

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGetMock).toHaveBeenCalledWith('/wilayah/provinces')
    expect(result.current.data).toEqual(data)
  })

  it('exposes an error state when the request fails', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('network error'))

    const { result } = await renderHook(() => useProvinces(), {
      wrapper: createWrapper(),
    })

    await vi.waitFor(() => expect(result.current.isError).toBe(true))
  })
})
