import { createContext, useContext, useEffect, useState } from 'react'
import { getCookie, setCookie } from '@/lib/cookies'

export type Collapsible = 'offcanvas' | 'icon' | 'none'
export type Variant = 'inset' | 'sidebar' | 'floating'
export type PageLayout = 'centered' | 'full-width'
export type NavbarBehavior = 'sticky' | 'scroll'
export type BorderRadius = '0' | '0.25' | '0.5' | '0.75' | '1'

// Cookie constants
const LAYOUT_COLLAPSIBLE_COOKIE_NAME = 'layout_collapsible'
const LAYOUT_VARIANT_COOKIE_NAME = 'layout_variant'
const LAYOUT_PAGE_COOKIE_NAME = 'layout_page'
const LAYOUT_NAVBAR_COOKIE_NAME = 'layout_navbar'
const LAYOUT_BORDER_RADIUS_COOKIE_NAME = 'layout_border_radius'
const LAYOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// Default values
const DEFAULT_VARIANT: Variant = 'inset'
const DEFAULT_COLLAPSIBLE: Collapsible = 'icon'
const DEFAULT_PAGE_LAYOUT: PageLayout = 'centered'
const DEFAULT_NAVBAR_BEHAVIOR: NavbarBehavior = 'sticky'
const DEFAULT_BORDER_RADIUS: BorderRadius = '0.5'

/** The rem values that map to each BorderRadius option. */
export const BORDER_RADIUS_VALUES: Record<BorderRadius, string> = {
  '0': '0rem',
  '0.25': '0.25rem',
  '0.5': '0.5rem',
  '0.75': '0.75rem',
  '1': '1rem',
}

type LayoutContextType = {
  resetLayout: () => void

  defaultCollapsible: Collapsible
  collapsible: Collapsible
  setCollapsible: (collapsible: Collapsible) => void

  defaultVariant: Variant
  variant: Variant
  setVariant: (variant: Variant) => void

  defaultPageLayout: PageLayout
  pageLayout: PageLayout
  setPageLayout: (layout: PageLayout) => void

  defaultNavbarBehavior: NavbarBehavior
  navbarBehavior: NavbarBehavior
  setNavbarBehavior: (behavior: NavbarBehavior) => void

  defaultBorderRadius: BorderRadius
  borderRadius: BorderRadius
  setBorderRadius: (radius: BorderRadius) => void
}

const LayoutContext = createContext<LayoutContextType | null>(null)

type LayoutProviderProps = {
  children: React.ReactNode
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [collapsible, _setCollapsible] = useState<Collapsible>(() => {
    const saved = getCookie(LAYOUT_COLLAPSIBLE_COOKIE_NAME)
    return (saved as Collapsible) || DEFAULT_COLLAPSIBLE
  })

  const [variant, _setVariant] = useState<Variant>(() => {
    const saved = getCookie(LAYOUT_VARIANT_COOKIE_NAME)
    return (saved as Variant) || DEFAULT_VARIANT
  })

  const [pageLayout, _setPageLayout] = useState<PageLayout>(() => {
    const saved = getCookie(LAYOUT_PAGE_COOKIE_NAME)
    return (saved as PageLayout) || DEFAULT_PAGE_LAYOUT
  })

  const [navbarBehavior, _setNavbarBehavior] = useState<NavbarBehavior>(() => {
    const saved = getCookie(LAYOUT_NAVBAR_COOKIE_NAME)
    return (saved as NavbarBehavior) || DEFAULT_NAVBAR_BEHAVIOR
  })

  const [borderRadius, _setBorderRadius] = useState<BorderRadius>(() => {
    const saved = getCookie(LAYOUT_BORDER_RADIUS_COOKIE_NAME)
    return (saved as BorderRadius) || DEFAULT_BORDER_RADIUS
  })

  // Apply --radius-base to <html> whenever borderRadius changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--radius-base',
      BORDER_RADIUS_VALUES[borderRadius]
    )
  }, [borderRadius])

  const setCollapsible = (value: Collapsible) => {
    _setCollapsible(value)
    setCookie(LAYOUT_COLLAPSIBLE_COOKIE_NAME, value, LAYOUT_COOKIE_MAX_AGE)
  }

  const setVariant = (value: Variant) => {
    _setVariant(value)
    setCookie(LAYOUT_VARIANT_COOKIE_NAME, value, LAYOUT_COOKIE_MAX_AGE)
  }

  const setPageLayout = (value: PageLayout) => {
    _setPageLayout(value)
    setCookie(LAYOUT_PAGE_COOKIE_NAME, value, LAYOUT_COOKIE_MAX_AGE)
  }

  const setNavbarBehavior = (value: NavbarBehavior) => {
    _setNavbarBehavior(value)
    setCookie(LAYOUT_NAVBAR_COOKIE_NAME, value, LAYOUT_COOKIE_MAX_AGE)
  }

  const setBorderRadius = (value: BorderRadius) => {
    _setBorderRadius(value)
    setCookie(LAYOUT_BORDER_RADIUS_COOKIE_NAME, value, LAYOUT_COOKIE_MAX_AGE)
  }

  const resetLayout = () => {
    setCollapsible(DEFAULT_COLLAPSIBLE)
    setVariant(DEFAULT_VARIANT)
    setPageLayout(DEFAULT_PAGE_LAYOUT)
    setNavbarBehavior(DEFAULT_NAVBAR_BEHAVIOR)
    setBorderRadius(DEFAULT_BORDER_RADIUS)
  }

  const contextValue: LayoutContextType = {
    resetLayout,

    defaultCollapsible: DEFAULT_COLLAPSIBLE,
    collapsible,
    setCollapsible,

    defaultVariant: DEFAULT_VARIANT,
    variant,
    setVariant,

    defaultPageLayout: DEFAULT_PAGE_LAYOUT,
    pageLayout,
    setPageLayout,

    defaultNavbarBehavior: DEFAULT_NAVBAR_BEHAVIOR,
    navbarBehavior,
    setNavbarBehavior,

    defaultBorderRadius: DEFAULT_BORDER_RADIUS,
    borderRadius,
    setBorderRadius,
  }

  return <LayoutContext value={contextValue}>{children}</LayoutContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}
