'use client'

import type { DailyAuditEntry, MismatchedTicket } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface DiscrepancyTablesProps {
  dailyAudit: DailyAuditEntry[];
  mismatchedTickets: MismatchedTicket[];
}

export default function DiscrepancyTables({ dailyAudit, mismatchedTickets }: DiscrepancyTablesProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Discrepancy Log</CardTitle>
        <CardDescription>Detailed audit events and ticket mismatches.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily-audit">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily-audit">Daily Audit</TabsTrigger>
            <TabsTrigger value="mismatched-tickets">Mismatched Tickets</TabsTrigger>
          </TabsList>
          <TabsContent value="daily-audit" className="mt-4">
            <div className="overflow-auto rounded-md border" style={{maxHeight: '400px'}}>
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50">
                  <TableRow>
                    <TableHead>Cauldron ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Volume (L)</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyAudit.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{entry.cauldron_id}</TableCell>
                      <TableCell>
                        <Badge variant={entry.type.includes('Unlogged') ? 'destructive' : 'secondary'}>
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{entry.volume.toFixed(2)}</TableCell>
                      <TableCell>{entry.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="mismatched-tickets" className="mt-4">
             <div className="overflow-auto rounded-md border" style={{maxHeight: '400px'}}>
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50">
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Cauldron ID</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead className="text-right">Difference (L)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mismatchedTickets.map((ticket) => (
                    <TableRow key={ticket.ticket_id}>
                      <TableCell className="font-medium">{ticket.ticket_id}</TableCell>
                      <TableCell>{ticket.cauldron_id}</TableCell>
                      <TableCell>
                        <Badge variant={ticket.direction.includes('Over') ? 'destructive' : 'outline'}>
                          {ticket.direction}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{ticket.difference.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
