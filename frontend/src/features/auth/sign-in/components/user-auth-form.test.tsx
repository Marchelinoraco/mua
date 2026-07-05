import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import { UserAuthForm } from './user-auth-form'

const navigate = vi.fn()
const setAuthMock = vi.fn()

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    auth: {
      setAuth: setAuthMock,
    },
  }),
}))

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(() =>
      Promise.resolve({
        data: {
          accessToken: 'mock-access-token',
          user: { id: '1', email: 'a@b.com' },
          tenant: null,
          subscription: null,
        },
      })
    ),
  },
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
    Link: ({
      children,
      to,
      className,
      ...rest
    }: {
      children?: React.ReactNode
      to: string
      className?: string
    }) => (
      <a href={to} className={className} {...rest}>
        {children}
      </a>
    ),
  }
})

describe('UserAuthForm', () => {
  describe('Rendering without redirectTo', () => {
    let screen: RenderResult
    let emailInput: Locator
    let passwordInput: Locator
    let signInButton: Locator
    let forgotPasswordLink: Locator

    beforeEach(async () => {
      vi.clearAllMocks()
      screen = await render(<UserAuthForm />)
      emailInput = screen.getByRole('textbox', { name: /^Email$/i })
      passwordInput = screen.getByLabelText(/^Kata Sandi$/i)
      signInButton = screen.getByRole('button', { name: /^Masuk$/i })
      forgotPasswordLink = screen.getByText(/^Lupa kata sandi\?$/i)
    })

    it('renders fields, submit button, and forgot password link', async () => {
      await expect.element(emailInput).toBeInTheDocument()
      await expect.element(passwordInput).toBeInTheDocument()
      await expect.element(signInButton).toBeInTheDocument()
      await expect.element(forgotPasswordLink).toBeInTheDocument()
    })

    it('shows validation messages when submitting empty form', async () => {
      await userEvent.click(signInButton)

      await expect
        .element(screen.getByText('Email wajib diisi.'))
        .toBeInTheDocument()
      await expect
        .element(screen.getByText('Kata Sandi wajib diisi.'))
        .toBeInTheDocument()
    })

    it('calls setAuth and navigates to default route on success', async () => {
      await userEvent.fill(emailInput, 'a@b.com')
      await userEvent.fill(passwordInput, '12345678')

      await userEvent.click(signInButton)

      await vi.waitFor(() => expect(setAuthMock).toHaveBeenCalledOnce())
      expect(setAuthMock).toHaveBeenCalledWith(
        'mock-access-token',
        expect.objectContaining({ email: 'a@b.com' }),
        null,
        null
      )

      await vi.waitFor(() =>
        expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true })
      )
    })
  })

  it('navigates to redirectTo when provided', async () => {
    vi.clearAllMocks()

    const { getByRole, getByLabelText } = await render(
      <UserAuthForm redirectTo='/settings' />
    )

    await userEvent.fill(getByRole('textbox', { name: /Email/i }), 'a@b.com')
    await userEvent.fill(getByLabelText(/Kata Sandi/i), '12345678')

    await userEvent.click(getByRole('button', { name: /Masuk/i }))

    await vi.waitFor(() => expect(setAuthMock).toHaveBeenCalledOnce())

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/settings',
        replace: true,
      })
    )
  })
})
