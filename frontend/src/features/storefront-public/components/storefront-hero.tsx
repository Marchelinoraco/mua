import { MapPin } from 'lucide-react'
import type { StorefrontActiveResponse } from '../data/types'

type StorefrontHeroProps = {
  data: StorefrontActiveResponse
}

export function StorefrontHero({ data }: StorefrontHeroProps) {
  const { namaBisnis, kota, theme } = data

  return (
    <div>
      <div
        className='h-36 w-full sm:h-48'
        style={
          theme.bannerUrl
            ? {
                backgroundImage: `url(${theme.bannerUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {
                background:
                  'linear-gradient(135deg, var(--sf-primary), var(--sf-secondary))',
              }
        }
      />
      <div className='px-4 sm:px-6'>
        <div className='-mt-10 sm:-mt-12'>
          <div className='h-20 w-20 overflow-hidden rounded-full border-4 border-background bg-muted shadow-md sm:h-24 sm:w-24'>
            {theme.logoUrl ? (
              <img
                src={theme.logoUrl}
                alt={namaBisnis}
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground'>
                {namaBisnis.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div className='mt-3 pb-4'>
          <h1 className='text-xl font-bold sm:text-2xl'>{namaBisnis}</h1>
          {kota && (
            <p className='mt-1 flex items-center gap-1 text-sm text-muted-foreground'>
              <MapPin className='h-4 w-4' />
              {kota}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
