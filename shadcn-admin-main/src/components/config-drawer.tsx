import {
  Root as RadioGroup,
  Item as RadioItem,
} from '@radix-ui/react-radio-group'
import { Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  useLayout,
  type BorderRadius,
  type Collapsible,
  type NavbarBehavior,
  type PageLayout,
  type Variant,
} from '@/context/layout-provider'
import { useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useSidebar } from './ui/sidebar'

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function SectionTitle({ title }: { title: string }) {
  return <p className='mb-2 text-sm font-medium text-foreground'>{title}</p>
}

type SegmentOption<T extends string> = { value: T; label: string }

function SegmentControl<T extends string>({
  value,
  options,
  onValueChange,
  cols,
}: {
  value: T
  options: SegmentOption<T>[]
  onValueChange: (v: T) => void
  cols?: number
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      className={cn(
        'grid w-full gap-2',
        cols === 2 && 'grid-cols-2',
        cols === 3 && 'grid-cols-3',
        !cols && options.length === 2 && 'grid-cols-2',
        !cols && options.length === 3 && 'grid-cols-3'
      )}
    >
      {options.map((opt) => (
        <RadioItem
          key={opt.value}
          value={opt.value}
          aria-label={opt.label}
          className={cn(
            'cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors outline-none',
            'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            'data-[state=checked]:border-transparent data-[state=checked]:bg-accent data-[state=checked]:text-foreground',
            'focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          {opt.label}
        </RadioItem>
      ))}
    </RadioGroup>
  )
}

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

function ThemeModeSection() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation(['common', 'settings'])
  return (
    <div>
      <SectionTitle title={t('common:themeMode')} />
      <SegmentControl
        value={theme}
        onValueChange={setTheme}
        options={[
          { value: 'light', label: t('settings:appearance.light') },
          { value: 'dark', label: t('settings:appearance.dark') },
          { value: 'system', label: t('settings:appearance.system') },
        ]}
      />
    </div>
  )
}

function PageLayoutSection() {
  const { pageLayout, setPageLayout } = useLayout()
  const { t } = useTranslation()
  return (
    <div>
      <SectionTitle title={t('pageLayout')} />
      <SegmentControl<PageLayout>
        value={pageLayout}
        onValueChange={setPageLayout}
        options={[
          { value: 'centered', label: t('centered') },
          { value: 'full-width', label: t('fullWidth') },
        ]}
      />
    </div>
  )
}

function NavbarBehaviorSection() {
  const { navbarBehavior, setNavbarBehavior } = useLayout()
  const { t } = useTranslation()
  return (
    <div>
      <SectionTitle title={t('navbarBehavior')} />
      <SegmentControl<NavbarBehavior>
        value={navbarBehavior}
        onValueChange={setNavbarBehavior}
        options={[
          { value: 'sticky', label: t('sticky') },
          { value: 'scroll', label: t('scroll') },
        ]}
      />
    </div>
  )
}

function SidebarStyleSection() {
  const { variant, setVariant } = useLayout()
  const { t } = useTranslation()
  return (
    <div className='max-md:hidden'>
      <SectionTitle title={t('sidebarStyle')} />
      <SegmentControl<Variant>
        value={variant}
        onValueChange={setVariant}
        options={[
          { value: 'inset', label: t('inset') },
          { value: 'sidebar', label: t('sidebar') },
          { value: 'floating', label: t('floating') },
        ]}
      />
    </div>
  )
}

function SidebarCollapseModeSection() {
  const { open, setOpen } = useSidebar()
  const { collapsible, setCollapsible } = useLayout()
  const { t } = useTranslation()
  const radioValue: string = open ? 'default' : collapsible

  return (
    <div className='max-md:hidden'>
      <SectionTitle title={t('sidebarCollapseMode')} />
      <SegmentControl<string>
        value={radioValue}
        onValueChange={(v) => {
          if (v === 'default') {
            setOpen(true)
            return
          }
          setOpen(false)
          setCollapsible(v as Collapsible)
        }}
        options={[
          { value: 'icon', label: t('icon') },
          { value: 'offcanvas', label: t('offCanvas') },
        ]}
      />
    </div>
  )
}

function BorderRadiusSection() {
  const { borderRadius, setBorderRadius } = useLayout()
  const { t } = useTranslation()
  return (
    <div>
      <SectionTitle title={t('borderRadius')} />
      <SegmentControl<BorderRadius>
        value={borderRadius}
        onValueChange={setBorderRadius}
        options={[
          { value: '0', label: '0' },
          { value: '0.25', label: '0.25' },
          { value: '0.5', label: '0.5' },
          { value: '0.75', label: '0.75' },
          { value: '1', label: '1' },
        ]}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main drawer
// ---------------------------------------------------------------------------

export function ConfigDrawer() {
  const { setOpen } = useSidebar()
  const { resetTheme } = useTheme()
  const { resetLayout } = useLayout()
  const { t } = useTranslation()

  const handleRestoreDefaults = () => {
    setOpen(true)
    resetTheme()
    resetLayout()
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size='icon'
          variant='ghost'
          aria-label={t('themeSettings')}
          className='rounded-lg'
        >
          <Settings aria-hidden='true' />
        </Button>
      </SheetTrigger>
      <SheetContent className='flex flex-col gap-0'>
        <SheetHeader className='pb-4 text-start'>
          <SheetTitle>{t('themeSettings')}</SheetTitle>
          <SheetDescription>{t('themeSettingsDesc')}</SheetDescription>
        </SheetHeader>

        <div className='flex flex-col gap-6 overflow-y-auto px-4 pb-4'>
          <ThemeModeSection />
          <PageLayoutSection />
          <NavbarBehaviorSection />
          <SidebarStyleSection />
          <SidebarCollapseModeSection />
          <BorderRadiusSection />
        </div>

        <SheetFooter className='px-4 pt-2'>
          <Button
            variant='outline'
            className='w-full'
            onClick={handleRestoreDefaults}
            aria-label={t('restoreDefaults')}
          >
            {t('restoreDefaults')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
