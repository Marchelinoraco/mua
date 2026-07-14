import { useTranslation } from 'react-i18next'
import { formatCurrencyIDR } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { StorefrontTransport } from '../data/types'

type StorefrontTransportSectionProps = {
  transport: StorefrontTransport | null
}

export function StorefrontTransportSection({
  transport,
}: StorefrontTransportSectionProps) {
  const { t } = useTranslation('storefront')

  if (!transport) return null

  return (
    <section className='px-4 py-6 sm:px-6'>
      <h2 className='mb-3 text-lg font-semibold'>{t('transport.title')}</h2>
      {transport.mode === 'FLAT' ? (
        <p className='text-sm'>
          {t('transport.flatDesc', {
            nominal: formatCurrencyIDR(transport.flatNominal ?? 0),
          })}
        </p>
      ) : (
        <div className='overflow-x-auto rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('transport.zona')}</TableHead>
                <TableHead className='text-right'>
                  {t('transport.nominal')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(transport.zona ?? []).map((zona) => (
                <TableRow key={zona.nama}>
                  <TableCell>{zona.nama}</TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {formatCurrencyIDR(zona.nominal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}
