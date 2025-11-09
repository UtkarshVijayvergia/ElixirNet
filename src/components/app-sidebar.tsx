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
            <Link href="/" legacyBehavior passHref>
              <SidebarMenuButton isActive={pathname === '/'} tooltip="Dashboard">
                <Home />
                Dashboard
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
             <Link href="/visualizations" legacyBehavior passHref>
              <SidebarMenuButton isActive={pathname === '/visualizations'} tooltip="Visualizations">
                <BarChart2 />
                Visualizations
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
