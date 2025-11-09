'use client'

import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import PotionTrackLogo from '@/components/icons/potion-track-logo'
import { Home, BarChart2 } from 'lucide-react'
import Link from 'next/link'

export default function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <PotionTrackLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/">
              <SidebarMenuButton asChild isActive={pathname === '/'} tooltip="Dashboard">
                <span>
                  <Home />
                  Dashboard
                </span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
             <Link href="/visualizations">
              <SidebarMenuButton asChild isActive={pathname === '/visualizations'} tooltip="Visualizations">
                <span>
                  <BarChart2 />
                  Visualizations
                </span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
