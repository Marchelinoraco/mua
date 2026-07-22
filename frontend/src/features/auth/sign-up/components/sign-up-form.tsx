import { useCallback, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { CheckCircle2, Loader2, UserPlus, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  useAuthStore,
  type AuthSubscription,
  type AuthTenant,
  type AuthUser,
} from '@/stores/auth-store'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'
import { useProvinces } from '@/features/wilayah/hooks/use-provinces'
import { useRegencies } from '@/features/wilayah/hooks/use-regencies'

// ── Response type from POST /auth/register ───────────────────────────────────

interface RegisterResponse {
  accessToken: string
  user: AuthUser
  tenant: AuthTenant | null
  subscription: AuthSubscription | null
}

// ── Slug availability state ──────────────────────────────────────────────────

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

// ── Zod schemas per step ─────────────────────────────────────────────────────

const step1Schema = z
  .object({
    email: z.string().min(1, 'Email wajib diisi.').email('Email tidak valid.'),
    phone: z
      .string()
      .min(1, 'Nomor WhatsApp wajib diisi.')
      .regex(/^(08|\+628)\d{7,12}$/, 'Format nomor tidak valid.'),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter.'),
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi.'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Kata sandi dan Konfirmasi Kata sandi tidak cocok.',
    path: ['confirmPassword'],
  })

const step2Schema = z.object({
  namaBisnis: z.string().min(1, 'Nama bisnis wajib diisi.'),
  slug: z
    .string()
    .min(1, 'URL storefront wajib diisi.')
    .regex(
      /^[a-z0-9-]{3,30}$/,
      'Hanya huruf kecil, angka, dan tanda hubung (3–30 karakter).'
    ),
  // `provinceId` hanya state UI perantara untuk memfilter dropdown
  // Kota/Kabupaten — TIDAK dikirim ke API (backend hanya butuh `regencyId`,
  // provinsi bisa di-derive dari relasi Regency → Province).
  provinceId: z.string().min(1, 'Provinsi wajib dipilih.'),
  regencyId: z.string().min(1, 'Kota/Kabupaten wajib dipilih.'),
})

const fullSchema = step1Schema.and(step2Schema)
type FormValues = z.infer<typeof fullSchema>

// ── Component ────────────────────────────────────────────────────────────────

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [step, setStep] = useState<1 | 2>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [slugSuggestion, setSlugSuggestion] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const { t } = useTranslation(['auth', 'common'])

  const form = useForm<FormValues>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      namaBisnis: '',
      slug: '',
      provinceId: '',
      regencyId: '',
    },
    mode: 'onTouched',
  })

  // ── Wilayah: dropdown Provinsi → Kota/Kabupaten (kaskade) ────────────────

  const provinceId = useWatch({ control: form.control, name: 'provinceId' })
  const provincesQuery = useProvinces()
  const regenciesQuery = useRegencies(provinceId || undefined)

  // ── Slug real-time check (debounced 500 ms) ─────────────────────────────

  const checkSlug = useCallback(async (value: string) => {
    if (!/^[a-z0-9-]{3,30}$/.test(value)) {
      setSlugStatus('invalid')
      return
    }
    setSlugStatus('checking')
    try {
      const res = await api.get<{ available: boolean; suggestion?: string }>(
        `/tenants/slug-check`,
        { params: { slug: value } }
      )
      if (res.data.available) {
        setSlugStatus('available')
        setSlugSuggestion('')
      } else {
        setSlugStatus('taken')
        setSlugSuggestion(res.data.suggestion ?? '')
      }
    } catch {
      setSlugStatus('idle')
    }
  }, [])

  const handleSlugChange = useCallback(
    (value: string) => {
      setSlugStatus('idle')
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (!value) return
      debounceRef.current = setTimeout(() => {
        void checkSlug(value)
      }, 500)
    },
    [checkSlug]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // ── Step navigation ─────────────────────────────────────────────────────

  async function goToStep2() {
    const valid = await form.trigger([
      'email',
      'phone',
      'password',
      'confirmPassword',
    ])
    if (valid) setStep(2)
  }

  // ── Final submit ────────────────────────────────────────────────────────

  function onSubmit(data: FormValues) {
    if (slugStatus === 'taken' || slugStatus === 'invalid') {
      toast.error(t('auth:signUp.validation.slugInvalid'))
      return
    }

    setIsLoading(true)

    const registerPromise = api
      .post<RegisterResponse>('/auth/register', {
        email: data.email,
        phone: data.phone,
        password: data.password,
        namaBisnis: data.namaBisnis,
        slug: data.slug,
        // `provinceId` sengaja TIDAK dikirim — hanya state UI untuk
        // memfilter dropdown kota, backend cukup butuh `regencyId`.
        regencyId: data.regencyId,
      })
      .then((res) => {
        const { accessToken, user, tenant, subscription } = res.data
        auth.setAuth(accessToken, user, tenant, subscription)
        auth.setJustRegistered(true)
        navigate({ to: '/onboarding', replace: true })
        return t('auth:signUp.accountCreated')
      })
      .catch((err: unknown) => {
        handleServerError(err)
        throw err
      })
      .finally(() => {
        setIsLoading(false)
      })

    toast.promise(registerPromise, {
      loading: t('auth:signUp.submitting'),
      success: (msg) => msg as string,
      error: t('common:error'),
    })
  }

  // ── Slug status icon ────────────────────────────────────────────────────

  function SlugIndicator() {
    if (slugStatus === 'checking')
      return <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
    if (slugStatus === 'available')
      return <CheckCircle2 className='h-4 w-4 text-green-600' />
    if (slugStatus === 'taken' || slugStatus === 'invalid')
      return <XCircle className='h-4 w-4 text-destructive' />
    return null
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        {/* ── Step indicator ── */}
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold',
              step === 1
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            1
          </span>
          <span>{t('auth:signUp.step1Title')}</span>
          <span className='mx-1 h-px flex-1 bg-border' />
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold',
              step === 2
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            2
          </span>
          <span>{t('auth:signUp.step2Title')}</span>
        </div>

        {/* ── Step 1: Akun ── */}
        {step === 1 && (
          <>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:signUp.email')}</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder={t('auth:signUp.emailPlaceholder')}
                      autoComplete='email'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:signUp.phone')}</FormLabel>
                  <FormControl>
                    <Input
                      type='tel'
                      placeholder={t('auth:signUp.phonePlaceholder')}
                      autoComplete='tel'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:signUp.password')}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder={t('auth:signUp.passwordPlaceholder')}
                      autoComplete='new-password'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:signUp.confirmPassword')}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder={t('auth:signUp.passwordPlaceholder')}
                      autoComplete='new-password'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type='button'
              className='mt-2'
              onClick={() => void goToStep2()}
            >
              {t('auth:signUp.next')}
            </Button>
          </>
        )}

        {/* ── Step 2: Profil Bisnis ── */}
        {step === 2 && (
          <>
            <FormField
              control={form.control}
              name='namaBisnis'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:signUp.namaBisnis')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('auth:signUp.namaBisnisPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='slug'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:signUp.slug')}</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        placeholder={t('auth:signUp.slugPlaceholder')}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          handleSlugChange(e.target.value)
                        }}
                        className='pe-8'
                      />
                      <span className='absolute inset-e-2 top-1/2 -translate-y-1/2'>
                        <SlugIndicator />
                      </span>
                    </div>
                  </FormControl>
                  <p className='text-xs text-muted-foreground'>
                    {slugStatus === 'checking' && t('auth:signUp.slugChecking')}
                    {slugStatus === 'available' && (
                      <span className='text-green-600'>
                        {t('auth:signUp.slugAvailable')}
                      </span>
                    )}
                    {slugStatus === 'taken' && (
                      <span className='text-destructive'>
                        {t('auth:signUp.slugTaken', {
                          suggestion: slugSuggestion,
                        })}
                      </span>
                    )}
                    {slugStatus === 'idle' && t('auth:signUp.slugHint')}
                    {slugStatus === 'invalid' && (
                      <span className='text-destructive'>
                        {t('auth:signUp.slugInvalid')}
                      </span>
                    )}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='provinceId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:signUp.provinsi')}</FormLabel>
                  <SelectDropdown
                    isControlled
                    defaultValue={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Reset kota/kabupaten setiap kali provinsi diganti —
                      // pilihan kota lama sudah tidak relevan.
                      form.setValue('regencyId', '', { shouldValidate: false })
                    }}
                    isPending={provincesQuery.isLoading}
                    disabled={provincesQuery.isLoading}
                    placeholder={t('auth:signUp.provinsiPlaceholder')}
                    items={(provincesQuery.data ?? []).map((p) => ({
                      label: p.nama,
                      value: p.id,
                    }))}
                  />
                  {provincesQuery.isError && (
                    <p className='text-xs text-destructive'>
                      {t('auth:signUp.provinsiError')}{' '}
                      <button
                        type='button'
                        className='underline underline-offset-2'
                        onClick={() => void provincesQuery.refetch()}
                      >
                        {t('auth:signUp.retry')}
                      </button>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='regencyId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:signUp.kota')}</FormLabel>
                  <SelectDropdown
                    isControlled
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    isPending={regenciesQuery.isFetching}
                    disabled={!provinceId || regenciesQuery.isFetching}
                    placeholder={
                      provinceId
                        ? t('auth:signUp.kotaPlaceholder')
                        : t('auth:signUp.kotaHintPilihProvinsi')
                    }
                    items={(regenciesQuery.data ?? []).map((r) => ({
                      label: r.nama,
                      value: r.id,
                    }))}
                  />
                  {provinceId && regenciesQuery.isError && (
                    <p className='text-xs text-destructive'>
                      {t('auth:signUp.kotaError')}{' '}
                      <button
                        type='button'
                        className='underline underline-offset-2'
                        onClick={() => void regenciesQuery.refetch()}
                      >
                        {t('auth:signUp.retry')}
                      </button>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='mt-2 flex gap-2'>
              <Button
                type='button'
                variant='outline'
                className='flex-1'
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                {t('auth:signUp.back')}
              </Button>
              <Button
                type='submit'
                className='flex-1'
                disabled={
                  isLoading ||
                  slugStatus === 'taken' ||
                  slugStatus === 'checking'
                }
              >
                {isLoading ? (
                  <Loader2 className='animate-spin' />
                ) : (
                  <UserPlus />
                )}
                {t('auth:signUp.submit')}
              </Button>
            </div>
          </>
        )}
      </form>
    </Form>
  )
}
