'use client'

import type { AuditSummary } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Droplets, CheckCircle2, XCircle, Beaker, Ghost, Recycle } from "lucide-react"

interface SummaryCardsProps {
  summary: AuditSummary
}

const StatCard = ({ title, value, icon: Icon, note }: { title: string, value: string | number, icon: React.ElementType, note?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </CardContent>
  </Card>
)

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard 
        title="Missing Potion" 
        value={`${summary.potentially_missing_potion.toLocaleString('en-US', { maximumFractionDigits: 2 })} L`}
        icon={Droplets}
        note="Total potential loss"
      />
      <StatCard 
        title="Unlogged Drains" 
        value={summary.unlogged_drains}
        icon={Beaker}
        note="Drains without tickets"
      />
      <StatCard 
        title="Ticket Mismatches" 
        value={summary.mismatches}
        icon={XCircle}
        note="Volume discrepancies"
      />
      <StatCard 
        title="Ticket Matches" 
        value={summary.matches}
        icon={CheckCircle2}
        note="Correctly logged volumes"
      />
      <StatCard 
        title="Ghost Tickets" 
        value={summary.ghost_tickets}
        icon={Ghost}
        note="Tickets with no drain event"
      />
      <StatCard 
        title="Recovered" 
        value={summary.recovered_previous_day}
        icon={Recycle}
        note="From previous day's audit"
      />
    </div>
  )
}
