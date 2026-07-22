import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
// Perlu diimpor eksplisit di sini karena test ini me-render <SignUpForm />
// langsung (tanpa melalui main.tsx yang biasanya menginisialisasi i18next
// di level aplikasi). `i18n.changeLanguage('id')` dipanggil di bawah untuk
// mengunci locale ke Bahasa Indonesia (locale utama proyek) — tanpa ini,
// `LanguageDetector` memilih bahasa dari `navigator.language` runtime
// browser Playwright (biasanya `en-US`), membuat assertion teks Indonesia
// gagal secara tidak deterministik tergantung environment CI.
import i18n from '@/lib/i18n'
import { SignUpForm } from './sign-up-form'

const PROVINCES = [
  { id: 'p1', kode: '31', nama: 'DKI Jakarta' },
  { id: 'p2', kode: '32', nama: 'Jawa Barat' },
]

const REGENCIES_BY_PROVINCE: Record<
  string,
  { id: string; kode: string; nama: string }[]
> = {
  p1: [{ id: 'r1', kode: '3171', nama: 'Kota Jakarta Selatan' }],
  p2: [{ id: 'r2', kode: '3273', nama: 'Kota Bandung' }],
}

const navigate = vi.fn()
const setAuthMock = vi.fn()
const setJustRegisteredMock = vi.fn()

const apiGetMock = vi.hoisted(() => vi.fn())
const apiPostMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', () => ({
  api: { get: apiGetMock, post: apiPostMock },
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    auth: {
      setAuth: setAuthMock,
      setJustRegistered: setJustRegisteredMock,
    },
  }),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

const toastPromise = vi.hoisted(() =>
  vi.fn((p: Promise<unknown>, opts: { success?: (v: unknown) => unknown }) => {
    p.then((v) => opts.success?.(v))
  })
)

vi.mock('sonner', () => ({
  toast: { promise: toastPromise, error: vi.fn() },
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

async function renderSignUpForm() {
  return render(<SignUpForm />, { wrapper: createWrapper() })
}

/** Isi & lewati step 1 (Informasi Akun) dengan data valid, lanjut ke step 2. */
async function goToStep2(screen: RenderResult) {
  await userEvent.fill(
    screen.getByRole('textbox', { name: /^Email$/i }),
    'sari@contoh.com'
  )
  await userEvent.fill(
    screen.getByRole('textbox', { name: /Nomor WhatsApp/i }),
    '081234567890'
  )
  await userEvent.fill(screen.getByLabelText(/^Kata Sandi$/i), '12345678')
  await userEvent.fill(
    screen.getByLabelText(/Konfirmasi Kata Sandi/i),
    '12345678'
  )
  await userEvent.click(screen.getByRole('button', { name: /^Lanjut$/i }))
}

describe('SignUpForm', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('id')
    vi.clearAllMocks()
    apiGetMock.mockImplementation(
      (url: string, config?: { params?: Record<string, string> }) => {
        if (url === '/wilayah/provinces') {
          return Promise.resolve({ data: PROVINCES })
        }
        if (url === '/wilayah/regencies') {
          const provinceId = config?.params?.provinceId ?? ''
          return Promise.resolve({
            data: REGENCIES_BY_PROVINCE[provinceId] ?? [],
          })
        }
        if (url === '/tenants/slug-check') {
          return Promise.resolve({ data: { available: true } })
        }
        return Promise.reject(new Error(`Unhandled GET ${url}`))
      }
    )
    apiPostMock.mockResolvedValue({
      data: {
        accessToken: 'mock-access-token',
        user: { id: 'u1', email: 'sari@contoh.com' },
        tenant: {
          id: 't1',
          slug: 'glam-by-sari',
          namaBisnis: 'Glam by Sari',
          regencyId: 'r1',
          kota: 'Kota Jakarta Selatan',
          provinceId: 'p1',
          provinsi: 'DKI Jakarta',
          status: 'TRIAL',
        },
        subscription: null,
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders step 1 fields and the Lanjut button', async () => {
    const screen = await renderSignUpForm()

    await expect
      .element(screen.getByRole('textbox', { name: /^Email$/i }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('textbox', { name: /Nomor WhatsApp/i }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByLabelText(/^Kata Sandi$/i))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: /^Lanjut$/i }))
      .toBeInTheDocument()
  })

  it('shows validation messages when submitting empty step 1', async () => {
    const screen = await renderSignUpForm()

    await userEvent.click(screen.getByRole('button', { name: /^Lanjut$/i }))

    await expect
      .element(screen.getByText('Email wajib diisi.'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Nomor WhatsApp wajib diisi.'))
      .toBeInTheDocument()
  })

  it('shows a mismatch error when passwords do not match', async () => {
    const screen = await renderSignUpForm()

    await userEvent.fill(
      screen.getByRole('textbox', { name: /^Email$/i }),
      'sari@contoh.com'
    )
    await userEvent.fill(
      screen.getByRole('textbox', { name: /Nomor WhatsApp/i }),
      '081234567890'
    )
    await userEvent.fill(screen.getByLabelText(/^Kata Sandi$/i), '12345678')
    await userEvent.fill(
      screen.getByLabelText(/Konfirmasi Kata Sandi/i),
      '87654321'
    )
    await userEvent.click(screen.getByRole('button', { name: /^Lanjut$/i }))

    await expect
      .element(
        screen.getByText('Kata sandi dan Konfirmasi Kata sandi tidak cocok.')
      )
      .toBeInTheDocument()
  })

  describe('Step 2 — Profil Bisnis (dropdown wilayah)', () => {
    let screen: RenderResult
    let provinsiSelect: Locator
    let kotaSelect: Locator

    beforeEach(async () => {
      screen = await renderSignUpForm()
      await goToStep2(screen)
      provinsiSelect = screen.getByRole('combobox', { name: /Provinsi/i })
      kotaSelect = screen.getByRole('combobox', { name: /Kota\/Kabupaten/i })
    })

    it('renders the Provinsi and Kota/Kabupaten dropdowns, Kota disabled until a province is chosen', async () => {
      await expect.element(provinsiSelect).toBeInTheDocument()
      await expect.element(kotaSelect).toBeInTheDocument()
      await expect.element(kotaSelect).toBeDisabled()
    })

    it('populates Kota/Kabupaten options after a province is selected, then submits with regencyId only', async () => {
      await userEvent.click(provinsiSelect)
      await userEvent.click(screen.getByRole('option', { name: 'DKI Jakarta' }))

      await expect.element(kotaSelect).not.toBeDisabled()

      await userEvent.click(kotaSelect)
      await userEvent.click(
        screen.getByRole('option', { name: 'Kota Jakarta Selatan' })
      )

      await userEvent.fill(
        screen.getByRole('textbox', { name: /Nama Bisnis/i }),
        'Glam by Sari'
      )
      // Field slug tidak dipakai lewat `getByRole(..., { name })` — markup
      // pre-existing membungkus <Input> dalam <div> di dalam FormControl,
      // jadi `FormLabel`'s `htmlFor` menunjuk ke id di <div>, bukan ke
      // elemen input itu sendiri (accessible name tidak ter-derive dari
      // label). Placeholder tetap unik & stabil untuk query di test ini.
      await userEvent.fill(
        screen.getByPlaceholder('contoh: glam-by-sari'),
        'glam-by-sari'
      )

      await userEvent.click(
        screen.getByRole('button', { name: /Mulai Trial Gratis/i })
      )

      await vi.waitFor(() => expect(apiPostMock).toHaveBeenCalledOnce())
      const [, payload] = apiPostMock.mock.calls[0] as [
        string,
        Record<string, unknown>,
      ]
      expect(payload).toMatchObject({
        namaBisnis: 'Glam by Sari',
        slug: 'glam-by-sari',
        regencyId: 'r1',
      })
      expect(payload).not.toHaveProperty('provinceId')
      expect(payload).not.toHaveProperty('kota')

      await vi.waitFor(() => expect(setAuthMock).toHaveBeenCalledOnce())
      expect(navigate).toHaveBeenCalledWith({
        to: '/onboarding',
        replace: true,
      })
    })

    it('resets the selected Kota/Kabupaten when the province is changed', async () => {
      await userEvent.click(provinsiSelect)
      await userEvent.click(screen.getByRole('option', { name: 'DKI Jakarta' }))
      await expect.element(kotaSelect).not.toBeDisabled()

      await userEvent.click(kotaSelect)
      await userEvent.click(
        screen.getByRole('option', { name: 'Kota Jakarta Selatan' })
      )
      await expect.element(kotaSelect).toHaveTextContent(/Kota Jakarta Selatan/)

      // Ganti provinsi — pilihan kota lama harus tereset (kembali ke placeholder)
      await userEvent.click(provinsiSelect)
      await userEvent.click(screen.getByRole('option', { name: 'Jawa Barat' }))

      await expect
        .element(kotaSelect)
        .not.toHaveTextContent(/Kota Jakarta Selatan/)

      await userEvent.click(kotaSelect)
      await userEvent.click(
        screen.getByRole('option', { name: 'Kota Bandung' })
      )
      await expect.element(kotaSelect).toHaveTextContent(/Kota Bandung/)
    })

    it('shows validation messages when submitting step 2 without choosing a province/city', async () => {
      await userEvent.fill(
        screen.getByRole('textbox', { name: /Nama Bisnis/i }),
        'Glam by Sari'
      )
      // Field slug tidak dipakai lewat `getByRole(..., { name })` — markup
      // pre-existing membungkus <Input> dalam <div> di dalam FormControl,
      // jadi `FormLabel`'s `htmlFor` menunjuk ke id di <div>, bukan ke
      // elemen input itu sendiri (accessible name tidak ter-derive dari
      // label). Placeholder tetap unik & stabil untuk query di test ini.
      await userEvent.fill(
        screen.getByPlaceholder('contoh: glam-by-sari'),
        'glam-by-sari'
      )

      await userEvent.click(
        screen.getByRole('button', { name: /Mulai Trial Gratis/i })
      )

      await expect
        .element(screen.getByText('Provinsi wajib dipilih.'))
        .toBeInTheDocument()
      await expect
        .element(screen.getByText('Kota/Kabupaten wajib dipilih.'))
        .toBeInTheDocument()
      expect(apiPostMock).not.toHaveBeenCalled()
    })
  })
})
