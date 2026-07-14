import { useEffect, type CSSProperties } from 'react'
import { StorefrontAvailabilityPreview } from './components/storefront-availability'
import { StorefrontBookingCta } from './components/storefront-cta'
import { StorefrontDialogs } from './components/storefront-dialogs'
import { StorefrontFooter } from './components/storefront-footer'
import { StorefrontHero } from './components/storefront-hero'
import { StorefrontInactive } from './components/storefront-inactive'
import { StorefrontLoadError } from './components/storefront-load-error'
import { StorefrontNotFound } from './components/storefront-not-found'
import { StorefrontProvider } from './components/storefront-provider'
import { StorefrontServices } from './components/storefront-services'
import { StorefrontSkeleton } from './components/storefront-skeleton'
import { StorefrontTransportSection } from './components/storefront-transport'
import { isSafeCssColor, resolveSafeFontFamily } from './data/data'
import type { StorefrontActiveResponse } from './data/types'
import {
  isStorefrontNotFoundError,
  useStorefront,
} from './hooks/use-storefront'

type StorefrontPublicProps = {
  slug: string
}

// Fallback warna default — selaras dengan token `--primary`/`--accent` app —
// dipakai bila tenant belum mengatur warna tema atau nilainya tidak valid.
const DEFAULT_PRIMARY = 'oklch(0.6231 0.188 259.8145)'
const DEFAULT_SECONDARY = 'oklch(0.9514 0.025 236.8242)'

function StorefrontActivePage({ data }: { data: StorefrontActiveResponse }) {
  useEffect(() => {
    document.title = `${data.namaBisnis} — GlowBook`
  }, [data.namaBisnis])

  const primary = isSafeCssColor(data.theme.warnaPrimer)
    ? data.theme.warnaPrimer
    : DEFAULT_PRIMARY
  const secondary = isSafeCssColor(data.theme.warnaSekunder)
    ? data.theme.warnaSekunder
    : DEFAULT_SECONDARY
  const fontFamily = resolveSafeFontFamily(data.theme.font)

  // ── Catatan keamanan ──────────────────────────────────────────────────
  // `data.theme.customCss` SENGAJA TIDAK PERNAH dirender/di-inject di sini
  // (bukan lewat <style>, dangerouslySetInnerHTML, atau cara lain). CSS bebas
  // dari tenant yang dirender ke halaman publik adalah vektor serangan (mis.
  // overlay phishing, exfiltrasi via `background: url(...)`, dsb).
  // Menunggu keputusan tech-lead soal sanitizer sebelum fitur ini diaktifkan.

  const themeStyle = {
    '--sf-primary': primary,
    '--sf-secondary': secondary,
    ...(fontFamily ? { fontFamily } : {}),
  } as CSSProperties

  return (
    <StorefrontProvider>
      <div
        className='mx-auto flex min-h-svh max-w-xl flex-col bg-background'
        style={themeStyle}
      >
        <div className='flex-1'>
          <StorefrontHero data={data} />
          <StorefrontServices services={data.services} />
          <StorefrontTransportSection transport={data.transport} />
          <StorefrontAvailabilityPreview slug={data.slug} />
          <StorefrontFooter />
        </div>
        <StorefrontBookingCta />
      </div>
      <StorefrontDialogs slug={data.slug} />
    </StorefrontProvider>
  )
}

/** Halaman storefront publik `/s/:slug` — tanpa auth, mobile-first. */
export function StorefrontPublic({ slug }: StorefrontPublicProps) {
  const { data, isLoading, isError, error } = useStorefront(slug)

  if (isLoading) return <StorefrontSkeleton />

  if (isError) {
    if (isStorefrontNotFoundError(error)) return <StorefrontNotFound />
    return <StorefrontLoadError />
  }

  if (!data) return null

  if (data.status === 'INACTIVE') {
    return <StorefrontInactive namaBisnis={data.namaBisnis} />
  }

  return <StorefrontActivePage data={data} />
}
