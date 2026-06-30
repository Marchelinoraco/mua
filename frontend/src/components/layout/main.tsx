import { cn } from '@/lib/utils'
import { useLayout } from '@/context/layout-provider'

type MainProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Main({ fixed, className, children, ...props }: MainProps) {
  const { pageLayout } = useLayout()

  return (
    <main
      data-layout={fixed ? 'fixed' : 'auto'}
      className={cn(
        'px-4 py-6',

        // Fixed layout: flex + grow + no overflow
        fixed && 'flex grow flex-col overflow-hidden',

        // Centered layout: constrain width
        pageLayout === 'centered' &&
          '@7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl',

        className
      )}
      {...props}
    >
      {children}
    </main>
  )
}
