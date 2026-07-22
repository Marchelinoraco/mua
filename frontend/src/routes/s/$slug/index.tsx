import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Rute lama storefront publik `/s/:slug` (pra-rebrand MuaGlow).
 * Dipertahankan sebagai redirect permanen ke `/@:slug` agar tautan lama
 * yang mungkin sudah dibagikan (mis. bio IG) tidak mati.
 */
export const Route = createFileRoute('/s/$slug/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/@{$slug}',
      params: { slug: params.slug },
      replace: true,
    })
  },
})
