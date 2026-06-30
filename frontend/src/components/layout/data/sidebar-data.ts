import {
  LayoutDashboard,
  Monitor,
  ListTodo,
  Bell,
  Palette,
  Settings,
  Wrench,
  UserCog,
  Users,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'John Doe',
    email: 'johndoe@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'general',
      items: [
        {
          title: 'dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'tasks',
          url: '/tasks',
          icon: ListTodo,
        },
        {
          title: 'users',
          url: '/users',
          icon: Users,
        },
      ],
    },
    {
      title: 'other',
      items: [
        {
          title: 'settings',
          icon: Settings,
          items: [
            {
              title: 'profile',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'account',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'display',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
      ],
    },
  ],
}
