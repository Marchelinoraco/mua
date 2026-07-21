import enAuth from '@/locales/en/auth.json'
import enBookingStatus from '@/locales/en/booking-status.json'
import enClients from '@/locales/en/clients.json'
// EN
import enCommon from '@/locales/en/common.json'
import enDashboard from '@/locales/en/dashboard.json'
import enErrors from '@/locales/en/errors.json'
import enNavigation from '@/locales/en/navigation.json'
import enOrders from '@/locales/en/orders.json'
import enSchedule from '@/locales/en/schedule.json'
import enServices from '@/locales/en/services.json'
import enSettings from '@/locales/en/settings.json'
import enStorefront from '@/locales/en/storefront.json'
import enTasks from '@/locales/en/tasks.json'
import enUsers from '@/locales/en/users.json'
import idAuth from '@/locales/id/auth.json'
import idBookingStatus from '@/locales/id/booking-status.json'
import idClients from '@/locales/id/clients.json'
// ID
import idCommon from '@/locales/id/common.json'
import idDashboard from '@/locales/id/dashboard.json'
import idErrors from '@/locales/id/errors.json'
import idNavigation from '@/locales/id/navigation.json'
import idOrders from '@/locales/id/orders.json'
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
    bookingStatus: enBookingStatus,
    clients: enClients,
    dashboard: enDashboard,
    errors: enErrors,
    navigation: enNavigation,
    orders: enOrders,
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
    bookingStatus: idBookingStatus,
    clients: idClients,
    dashboard: idDashboard,
    errors: idErrors,
    navigation: idNavigation,
    orders: idOrders,
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
