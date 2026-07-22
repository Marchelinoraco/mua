import {
  Monitor,
  Bell,
  Palette,
  Settings,
  Wrench,
  UserCog,
  LayoutDashboard,
  Store,
  CalendarCheck,
  CalendarClock,
  Users,
  Scissors,
  BarChart3,
  CreditCard,
  Sparkles,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'MUA',
    email: 'mua@muaglow.id',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'MuaGlow',
      logo: Sparkles,
      plan: 'Pro',
    },
  ],
  navGroups: [
    {
      title: 'Utama',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Storefront',
          url: '/storefront',
          icon: Store,
        },
        {
          title: 'Booking & Order',
          url: '/bookings',
          icon: CalendarCheck,
        },
        {
          title: 'Jadwal',
          url: '/availability',
          icon: CalendarClock,
        },
        {
          title: 'Klien',
          url: '/clients',
          icon: Users,
        },
        {
          title: 'Layanan',
          url: '/services',
          icon: Scissors,
        },
      ],
    },
    {
      title: 'Bisnis',
      items: [
        {
          title: 'Laporan',
          url: '/reports',
          icon: BarChart3,
        },
        {
          title: 'Langganan',
          url: '/subscription',
          icon: CreditCard,
        },
      ],
    },
    {
      title: 'Lainnya',
      items: [
        {
          title: 'Pengaturan',
          icon: Settings,
          items: [
            {
              title: 'Profil',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Akun',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Tampilan',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifikasi',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Layar',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
      ],
    },
  ],
}
