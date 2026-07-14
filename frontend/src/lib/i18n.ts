import enAuth from '@/locales/en/auth.json'
// EN
import enCommon from '@/locales/en/common.json'
import enDashboard from '@/locales/en/dashboard.json'
import enErrors from '@/locales/en/errors.json'
import enNavigation from '@/locales/en/navigation.json'
import enSchedule from '@/locales/en/schedule.json'
import enServices from '@/locales/en/services.json'
import enSettings from '@/locales/en/settings.json'
import enStorefront from '@/locales/en/storefront.json'
import enTasks from '@/locales/en/tasks.json'
import enUsers from '@/locales/en/users.json'
import idAuth from '@/locales/id/auth.json'
// ID
import idCommon from '@/locales/id/common.json'
import idDashboard from '@/locales/id/dashboard.json'
import idErrors from '@/locales/id/errors.json'
import idNavigation from '@/locales/id/navigation.json'
import idSchedule from '@/locales/id/schedule.json'
import idServices from '@/locales/id/services.json'
import idSettings from '@/locales/id/settings.json'
import idStorefront from '@/locales/id/storefront.json'
import idTasks from '@/locales/id/tasks.json'
import idUsers from '@/locales/id/users.json'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

export const defaultNS = 'common'

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    errors: enErrors,
    navigation: enNavigation,
    schedule: enSchedule,
    services: enServices,
    settings: enSettings,
    storefront: enStorefront,
    tasks: enTasks,
    users: enUsers,
  },
  id: {
    common: idCommon,
    auth: idAuth,
    dashboard: idDashboard,
    errors: idErrors,
    navigation: idNavigation,
    schedule: idSchedule,
    services: idServices,
    settings: idSettings,
    storefront: idStorefront,
    tasks: idTasks,
    users: idUsers,
  },
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: 'id',
    supportedLngs: ['id', 'en'],
    interpolation: {
      escapeValue: false, // React already handles XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18next-language',
    },
  })

export default i18n
