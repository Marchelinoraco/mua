import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { cn } from '@/lib/utils'
import type { AuthSubscription, AuthTenant, AuthUser } from '@/stores/auth-store'
import { useAuthStore } from '@/stores/auth-store'
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

interface LoginResponse {
  accessToken: string
  user: AuthUser
  tenant: AuthTenant | null
  subscription: AuthSubscription | null
}

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const { t } = useTranslation(['auth', 'common'])

  const formSchema = z.object({
    email: z.email({
      error: (iss) =>
        iss.input === '' ? t('signIn.validation.emailRequired') : undefined,
    }),
    password: z
      .string()
      .min(1, t('signIn.validation.passwordRequired'))
      .min(8, t('signIn.validation.passwordMinLength')),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    const loginPromise = api
      .post<LoginResponse>('/auth/login', {
        email: data.email,
        password: data.password,
      })
      .then((res) => {
        const { accessToken, user, tenant, subscription } = res.data
        auth.setAuth(accessToken, user, tenant, subscription)
        const targetPath = redirectTo ?? '/'
        navigate({ to: targetPath, replace: true })
        return t('signIn.welcomeBack', { email: data.email })
      })
      .catch((err: unknown) => {
        handleServerError(err)
        throw err
      })
      .finally(() => {
        setIsLoading(false)
      })

    toast.promise(loginPromise, {
      loading: t('signIn.submitting'),
      success: (msg) => msg as string,
      error: t('common:error'),
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('signIn.email')}</FormLabel>
              <FormControl>
                <Input placeholder={t('signIn.emailPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>{t('signIn.password')}</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder={t('signIn.passwordPlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='absolute inset-e-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75'
              >
                {t('signIn.forgotPassword')}
              </Link>
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          {t('signIn.submit')}
        </Button>
      </form>
    </Form>
  )
}
