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

  // `--sf-primary`/`--sf-secondary` WAJIB di-set di `:root` (document-level),
  // BUKAN hanya lewat inline `style` di div lokal di bawah. Alasan: sejak F04,
  // `StorefrontDialogs` (Sheet booking) merender kontennya via Radix Portal ke
  // `document.body` — CSS custom property hanya mengalir lewat ancestry DOM
  // NYATA, bukan lewat React tree, jadi konten yang di-portal-kan TIDAK akan
  // pernah mewarisi variable yang di-scope ke div lokal ini (ditemukan saat
  // uji manual F04: chip slot terpilih tampil putih-di-atas-putih/transparan
  // karena `var(--sf-primary)` invalid di luar subtree div ini). Di-set/lepas
  // via effect supaya tidak bocor ke halaman lain setelah unmount.
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--sf-primary', primary)
    root.style.setProperty('--sf-secondary', secondary)
    return () => {
      root.style.removeProperty('--sf-primary')
      root.style.removeProperty('--sf-secondary')
    }
  }, [primary, secondary])

  const themeStyle = {
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
      <StorefrontDialogs
        slug={data.slug}
        services={data.services}
        transport={data.transport}
        customFields={data.customFields ?? []}
      />
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
