'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { ComparisonChartData, Cauldron, AuditData } from '@/lib/types'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { getAuditData, processComparisonData } from '@/lib/api'
import { SidebarTrigger } from '../ui/sidebar'
import { Skeleton } from '../ui/skeleton'

interface VisualizationClientProps {
  cauldrons: Cauldron[];
}

const LoadingSkeleton = () => (
    <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Skeleton className="h-7 w-64 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="h-10 w-[280px] mt-4 sm:mt-0" />
            </div>
        </CardHeader>
        <CardContent className="h-[500px]">
            <Skeleton className="w-full h-full" />
        </CardContent>
    </Card>
)

export default function VisualizationClient({ cauldrons }: VisualizationClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [data, setData] = useState<ComparisonChartData[]>([])
  const [date, setDate] = useState<Date | undefined>(() => {
      const dateParam = searchParams.get('date');
      return dateParam ? new Date(dateParam + 'T00:00:00') : new Date();
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('date', dateString);
      router.push(`${pathname}?${newSearchParams.toString()}`);
    }
  };

  const fetchData = useCallback(async (selectedDate: Date) => {
    setLoading(true);
    setError(null);
    try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const auditData = await getAuditData();
        
        const comparisonData = processComparisonData(auditData, cauldrons, dateString);
        setData(comparisonData);

    } catch (e) {
      console.error(e);
      setError('Failed to load visualization data. Please ensure the local audit server is running.');
    } finally {
      setLoading(false);
    }
  }, [cauldrons]);

  useEffect(() => {
    if (date) {
      fetchData(date);
    }
  }, [date, fetchData]);
  
  return (
    <div className="flex flex-col min-h-screen">
       <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:h-auto md:border-0 md:bg-transparent md:px-6">
          <SidebarTrigger className="md:hidden" />
          {/* Spacer for mobile */}
          <div className="w-full flex-1 md:hidden" />
          <h1 className="hidden text-2xl font-bold md:block font-headline">Visualizations</h1>
      </header>
      <main className="flex-1 space-y-8 p-4 md:p-6">
        {error && <div className="p-4 text-center text-destructive">{error}</div>}
        {loading && <LoadingSkeleton />}
        {!loading && !error && (
            <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Comparative Analysis</CardTitle>
                    <CardDescription>Actual vs. Reported Potion Drain by Cauldron</CardDescription>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-[280px] justify-start text-left font-normal mt-4 sm:mt-0",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                </div>
            </CardHeader>
            <CardContent className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barGap={0}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cauldron_id" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} unit="L" />
                    <Tooltip 
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))'
                    }}
                    />
                    <Legend />
                    <Bar dataKey="reported" fill="hsl(var(--primary))" name="Reported Drain" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" fill="hsl(var(--accent))" name="Actual Drain" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>
        )}
      </main>
    </div>
  )
}
