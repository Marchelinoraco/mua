import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

// Nama cookie adalah pengenal teknis internal, bukan branding produk —
// SENGAJA tidak diubah saat rebrand GlowBook → MuaGlow. Mengganti nilai ini
// akan membuat cookie lama tidak terbaca lagi dan otomatis me-logout semua
// user yang sedang login (butuh migrasi sesi terpisah jika ingin diganti).
const COOKIE_KEY = 'glowbook_access_token'

// ── Domain types ────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  phone?: string
  timezone?: string
}

export interface AuthTenant {
  id: string
  slug: string
  namaBisnis: string
  kota: string
  status: string
}

export interface AuthSubscription {
  status: string
  currentPeriodEnd: string
  ordersUsedPeriod: number
}

// ── Store shape ──────────────────────────────────────────────────────────────

interface AuthState {
  auth: {
    // Core token
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void

    // User profile
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void

    // Tenant
    tenant: AuthTenant | null

    // Subscription
    subscription: AuthSubscription | null

    // Flag set right after register — cleared once wizard completes
    justRegistered: boolean
    setJustRegistered: (value: boolean) => void

    // Convenience: set everything at once (login / register response)
    setAuth: (
      token: string,
      user: AuthUser,
      tenant: AuthTenant | null,
      subscription: AuthSubscription | null
    ) => void

    // Full reset (sign-out)
    reset: () => void
  }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()((set) => {
  const cookieState = getCookie(COOKIE_KEY)
  const initToken = cookieState ? (JSON.parse(cookieState) as string) : ''

  return {
    auth: {
      // ── token ──────────────────────────────────────────────────────────
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          setCookie(COOKIE_KEY, JSON.stringify(accessToken))
          return { auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(COOKIE_KEY)
          return { auth: { ...state.auth, accessToken: '' } }
        }),

      // ── user ───────────────────────────────────────────────────────────
      user: null,
      setUser: (user) => set((state) => ({ auth: { ...state.auth, user } })),

      // ── tenant / subscription ──────────────────────────────────────────
      tenant: null,
      subscription: null,

      // ── wizard flag ────────────────────────────────────────────────────
      justRegistered: false,
      setJustRegistered: (value) =>
        set((state) => ({ auth: { ...state.auth, justRegistered: value } })),

      // ── setAuth ────────────────────────────────────────────────────────
      setAuth: (token, user, tenant, subscription) =>
        set((state) => {
          setCookie(COOKIE_KEY, JSON.stringify(token))
          return {
            auth: {
              ...state.auth,
              accessToken: token,
              user,
              tenant,
              subscription,
            },
          }
        }),

      // ── reset ──────────────────────────────────────────────────────────
      reset: () =>
        set((state) => {
          removeCookie(COOKIE_KEY)
          return {
            auth: {
              ...state.auth,
              accessToken: '',
              user: null,
              tenant: null,
              subscription: null,
              justRegistered: false,
            },
          }
        }),
    },
  }
})
