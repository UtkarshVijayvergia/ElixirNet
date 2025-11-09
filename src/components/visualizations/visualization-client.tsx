'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { ComparisonChartData } from '@/lib/types'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { getComparisonData } from '@/lib/api'
import { SidebarTrigger } from '../ui/sidebar'

interface VisualizationClientProps {
  initialData: ComparisonChartData[];
  initialDate: string;
}

export default function VisualizationClient({ initialData, initialDate }: VisualizationClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [data, setData] = useState(initialData)
  // Add 'T00:00:00' to ensure the date is parsed in UTC to avoid timezone issues.
  const [date, setDate] = useState<Date | undefined>(new Date(`${initialDate}T00:00:00`))

  useEffect(() => {
    if (date) {
      const newDate = format(date, 'yyyy-MM-dd')
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      
      if (newDate !== initialDate) {
        current.set('date', newDate);
        const search = current.toString();
        const query = search ? `?${search}` : "";
        
        // Fetch new data when date changes and update URL
        getComparisonData(newDate).then(newData => {
          setData(newData);
          router.push(`${pathname}${query}`);
        });
      }
    }
  }, [date, pathname, router, searchParams, initialDate])

  return (
    <div className="flex flex-col min-h-screen">
       <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:h-auto md:border-0 md:bg-transparent md:px-6">
          <SidebarTrigger className="md:hidden" />
          {/* Spacer for mobile */}
          <div className="w-full flex-1 md:hidden" />
          <h1 className="hidden text-2xl font-bold md:block font-headline">Visualizations</h1>
      </header>
      <main className="flex-1 space-y-8 p-4 md:p-6">
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
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
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
      </main>
    </div>
  )
}
