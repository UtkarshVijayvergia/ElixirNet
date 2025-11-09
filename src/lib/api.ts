import type { AuditData, Cauldron, Market, ComparisonChartData } from './types';

// In a real application, you would fetch from the API endpoint.
export async function getAuditData(): Promise<AuditData> {
  const response = await fetch('http://localhost:8000/api/audit/run', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch audit data');
  }
  return response.json();
}

export async function getCauldrons(): Promise<Cauldron[]> {
  try {
    const response = await fetch('https://hackutd2025.eog.systems/api/Information/cauldrons', { next: { revalidate: 3600 } });
    if (!response.ok) {
       console.error(`Failed to fetch cauldron data: ${response.statusText}`);
       return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Could not fetch cauldron data:', error);
    return [];
  }
}

export async function getMarket(): Promise<Market | null> {
  try {
    const response = await fetch('https://hackutd2025.eog.systems/api/Information/market', { next: { revalidate: 3600 } });
    if (!response.ok) {
      console.error(`Failed to fetch market data: ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Could not fetch market data:', error);
    return null;
  }
}

export function processComparisonData(auditData: AuditData, cauldrons: Cauldron[], date: string): ComparisonChartData[] {
  const cauldronNameMap = cauldrons.reduce((acc, cauldron) => {
    acc[cauldron.id] = cauldron.name;
    return acc;
  }, {} as Record<string, string>);

  const dataMap = new Map<string, { reported: number, actual: number }>();

  // Initialize with all cauldrons to ensure they appear in the chart
  cauldrons.forEach(c => {
    dataMap.set(c.name, { reported: 0, actual: 0 });
  });

  // Process mismatched tickets for the selected date
  auditData.mismatched_tickets
    .filter(ticket => ticket.date === date)
    .forEach(ticket => {
      const cauldronName = cauldronNameMap[ticket.cauldron_id] || ticket.cauldron_id;
      const current = dataMap.get(cauldronName) || { reported: 0, actual: 0 };
      dataMap.set(cauldronName, {
        reported: current.reported + ticket.ticket_volume,
        actual: current.actual + ticket.detected_volume
      });
    });

  // Process daily audit for unlogged drains on the selected date
  auditData.daily_audit
    .filter(d => d.date === date && d.type === 'Unlogged Drain')
    .forEach(entry => {
      const cauldronName = cauldronNameMap[entry.cauldron_id] || entry.cauldron_id;
      const current = dataMap.get(cauldronName) || { reported: 0, actual: 0 };
      dataMap.set(cauldronName, {
        ...current,
        actual: current.actual + entry.volume
      });
  });

  const chartData: ComparisonChartData[] = Array.from(dataMap.entries()).map(([cauldron_id, values]) => ({
    cauldron_id,
    ...values
  }));

  // Filter out entries where both reported and actual are 0 to keep the chart clean
  return chartData.filter(d => d.reported > 0 || d.actual > 0);
}

export async function getComparisonData(date: string): Promise<ComparisonChartData[]> {
  const [auditData, cauldrons] = await Promise.all([
    getAuditData(),
    getCauldrons(),
  ]);
  return processComparisonData(auditData, cauldrons, date);
}
