import type { AuditData, Cauldron, Market, ComparisonChartData } from './types';
import { mockAuditData, mockCauldronData, mockMarketData } from './mock-data';

// In a real application, you would fetch from the API endpoint.
// For this example, we are using mock data as localhost is not accessible during build.
export async function getAuditData(): Promise<AuditData> {
  try {
    const response = await fetch('http://localhost:8000/api/audit/run', { cache: 'no-store' });
    if (!response.ok) {
      console.error('Failed to fetch audit data, using mock data as fallback.');
      return mockAuditData;
    }
    return response.json();
  } catch (error) {
    console.error('Could not fetch audit data, using mock data instead:', error);
    return mockAuditData;
  }
}

export async function getCauldrons(): Promise<Cauldron[]> {
  try {
    const response = await fetch('https://hackutd2025.eog.systems/api/Information/cauldrons', { next: { revalidate: 3600 } });
    if (!response.ok) {
       console.error(`Failed to fetch cauldron data: ${response.statusText}, using mock data.`);
       return mockCauldronData;
    }
    return response.json();
  } catch (error) {
    console.error('Could not fetch cauldron data, using mock data instead:', error);
    return mockCauldronData;
  }
}

export async function getMarket(): Promise<Market | null> {
  try {
    const response = await fetch('https://hackutd2025.eog.systems/api/Information/market', { next: { revalidate: 3600 } });
    if (!response.ok) {
      console.error(`Failed to fetch market data: ${response.statusText}, using mock data.`);
      return mockMarketData;
    }
    return response.json();
  } catch (error) {
    console.error('Could not fetch market data, using mock data instead:', error);
    return mockMarketData;
  }
}

export async function getComparisonData(date: string): Promise<ComparisonChartData[]> {
  const auditData = await getAuditData();
  const cauldrons = await getCauldrons();

  const cauldronNameMap = cauldrons.reduce((acc, cauldron) => {
    acc[cauldron.id] = cauldron.name;
    return acc;
  }, {} as Record<string, string>);

  const dataMap = new Map<string, { reported: number, actual: number }>();

  // Initialize with all cauldrons
  cauldrons.forEach(c => {
    dataMap.set(c.name, { reported: 0, actual: 0 });
  });

  // From mismatched tickets for the given date (assuming date filtering on mismatched_tickets is needed)
  // For this example we are not filtering by date from mismatched_tickets
  auditData.mismatched_tickets.forEach(ticket => {
    const cauldronName = cauldronNameMap[ticket.cauldron_id] || ticket.cauldron_id;
    if (dataMap.has(cauldronName)) {
      const current = dataMap.get(cauldronName)!;
      dataMap.set(cauldronName, {
        reported: current.reported + ticket.ticket_volume,
        actual: current.actual + ticket.detected_volume
      });
    } else {
       dataMap.set(cauldronName, {
        reported: ticket.ticket_volume,
        actual: ticket.detected_volume
      });
    }
  });

  // From daily audit for the given date for unlogged drains (actual drain)
  auditData.daily_audit.filter(d => d.date === date && d.type === 'Unlogged Drain').forEach(entry => {
      const cauldronName = cauldronNameMap[entry.cauldron_id] || entry.cauldron_id;
      if (dataMap.has(cauldronName)) {
        const current = dataMap.get(cauldronName)!;
        dataMap.set(cauldronName, {
          ...current,
          actual: current.actual + entry.volume
        });
      } else {
        dataMap.set(cauldronName, { reported: 0, actual: entry.volume });
      }
  });

  const chartData: ComparisonChartData[] = Array.from(dataMap.entries()).map(([cauldron_id, values]) => ({
    cauldron_id,
    ...values
  }));

  // Filter out entries where both reported and actual are 0
  return chartData.filter(d => d.reported > 0 || d.actual > 0);
}