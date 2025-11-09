'use client'

import { useState, useEffect } from 'react'
import type { AuditData, Cauldron, Market } from '@/lib/types'
import { getAuditData } from '@/lib/api'
import {
  SidebarTrigger,
} from '@/components/ui/sidebar'
import SummaryCards from './summary-cards'
import DiscrepancyTables from './discrepancy-tables'
import PotionNetworkMap from './potion-network-map'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '../ui/card'

interface DashboardClientProps {
  cauldrons: Cauldron[];
  market: Market | null;
}

const LoadingSkeleton = () => (
  <div className="space-y-8">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <div className="p-6">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/2 mt-1" />
          </div>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Card className="h-full">
           <div className="p-6">
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card className="h-full">
          <div className="p-6">
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-[450px] w-full" />
          </div>
        </Card>
      </div>
    </div>
  </div>
);


export default function DashboardClient({ cauldrons, market }: DashboardClientProps) {
  const [auditData, setAuditData] = useState<AuditData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        const data = await getAuditData()
        setAuditData(data)
      } catch (e) {
        console.error(e)
        setError('Failed to load audit data. Please ensure the local audit server is running.')
      }
    }
    fetchAuditData()
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:h-auto md:border-0 md:bg-transparent md:px-6">
          <SidebarTrigger className="md:hidden" />
          {/* Spacer for mobile */}
          <div className="w-full flex-1 md:hidden" />
          <h1 className="hidden text-2xl font-bold md:block font-headline">Dashboard</h1>
      </header>
      <main className="flex-1 space-y-8 p-4 md:p-6">
        {error && <div className="p-4 text-center text-destructive">{error}</div>}
        {!auditData && !error && <LoadingSkeleton />}
        {auditData && (
          <>
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
          </>
        )}
      </main>
    </div>
  )
}
