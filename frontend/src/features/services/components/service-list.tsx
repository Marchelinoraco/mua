import { Car, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrencyIDR } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SERVICE_AKTIF_BADGE_CLASS } from '../data/data'
import type { Service } from '../data/types'
import { useServices, useToggleServiceAktif } from '../hooks/use-services'
import { useServiceDialogs } from './service-provider'

function ServiceListSkeleton() {
  return (
    <div className='space-y-2'>
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className='h-12 w-full rounded-md' />
      ))}
    </div>
  )
}

function ServiceDpCell({ service }: { service: Service }) {
  if (service.dpTipe === 'PERSEN') {
    return <span>{service.dpNilai}%</span>
  }
  return <span>{formatCurrencyIDR(service.dpNilai)}</span>
}

export function ServiceList() {
  const { t } = useTranslation('services')
  const { data, isLoading, isError } = useServices()
  const { setOpen, setCurrentRow } = useServiceDialogs()
  const toggleAktif = useToggleServiceAktif()

  function handleEdit(service: Service) {
    setCurrentRow(service)
    setOpen('edit')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('list.title')}</CardTitle>
        <CardDescription>{t('list.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className='py-8 text-center text-sm text-destructive'>
            {t('list.loadError')}
          </p>
        ) : isLoading || !data ? (
          <ServiceListSkeleton />
        ) : data.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>
            {t('list.empty')}
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('list.columns.nama')}</TableHead>
                  <TableHead>{t('list.columns.tipe')}</TableHead>
                  <TableHead className='text-right'>
                    {t('list.columns.harga')}
                  </TableHead>
                  <TableHead>{t('list.columns.durasi')}</TableHead>
                  <TableHead>{t('list.columns.dp')}</TableHead>
                  <TableHead className='text-center'>
                    {t('list.columns.transport')}
                  </TableHead>
                  <TableHead>{t('list.columns.status')}</TableHead>
                  <TableHead className='text-right'>
                    {t('list.columns.aksi')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className='font-medium'>
                      {service.nama}
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>
                        {t(`tipeOptions.${service.tipe}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {formatCurrencyIDR(service.harga)}
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>
                      {t('list.durasiValue', { count: service.durasi })}
                    </TableCell>
                    <TableCell>
                      <ServiceDpCell service={service} />
                    </TableCell>
                    <TableCell className='text-center'>
                      {service.butuhTransport && (
                        <Car
                          className='mx-auto h-4 w-4 text-muted-foreground'
                          aria-label={t('list.transportRequired')}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          SERVICE_AKTIF_BADGE_CLASS[
                            service.aktif ? 'true' : 'false'
                          ]
                        }
                      >
                        {service.aktif
                          ? t('list.statusAktif')
                          : t('list.statusNonaktif')}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-3'>
                        <Switch
                          checked={service.aktif}
                          disabled={toggleAktif.isPending}
                          aria-label={t('list.toggleAktifLabel', {
                            nama: service.nama,
                          })}
                          onCheckedChange={(checked) =>
                            toggleAktif.mutate({
                              id: service.id,
                              aktif: checked,
                            })
                          }
                        />
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleEdit(service)}
                        >
                          <Pencil className='h-4 w-4' />
                          <span className='sr-only'>{t('list.edit')}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
