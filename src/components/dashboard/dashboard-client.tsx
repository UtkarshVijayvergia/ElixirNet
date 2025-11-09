'use client'

import type { AuditData, Cauldron, Market } from '@/lib/types'
import {
  SidebarTrigger,
} from '@/components/ui/sidebar'
import SummaryCards from './summary-cards'
import DiscrepancyTables from './discrepancy-tables'
import PotionNetworkMap from './potion-network-map'

interface DashboardClientProps {
  auditData: AuditData;
  cauldrons: Cauldron[];
  market: Market | null;
}

export default function DashboardClient({ auditData, cauldrons, market }: DashboardClientProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:h-auto md:border-0 md:bg-transparent md:px-6">
          <SidebarTrigger className="md:hidden" />
          {/* Spacer for mobile */}
          <div className="w-full flex-1 md:hidden" />
          <h1 className="hidden text-2xl font-bold md:block font-headline">Dashboard</h1>
      </header>
      <main className="flex-1 space-y-8 p-4 md:p-6">
        <SummaryCards summary={auditData.summary} />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <DiscrepancyTables 
              dailyAudit={auditData.daily_audit} 
              mismatchedTickets={auditData.mismatched_tickets} 
            />
          </div>
          <div className="lg:col-span-2">
            <PotionNetworkMap cauldrons={cauldrons} market={market} />
          </div>
        </div>
      </main>
    </div>
  )
}
