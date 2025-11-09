import type { AuditData, Cauldron, Market, ComparisonChartData } from './types';
import { mockAuditData } from './mock-data';

// In a real application, you would fetch from the API endpoint.
// For this example, we are using mock data as localhost is not accessible during build.
export async function getAuditData(): Promise<AuditData> {
  try {
    // const response = await fetch('http://localhost:8000/api/audit/run', { cache: 'no-store' });
    // if (!response.ok) {
    //   throw new Error('Failed to fetch audit data');
    // }
    // return response.json();
    return Promise.resolve(mockAuditData);
  } catch (error) {
    console.error('Could not fetch audit data, using mock data instead:', error);
    // Returning mock data as a fallback in case of an error
    return mockAuditData;
  }
}

export async function getCauldrons(): Promise<Cauldron[]> {
  try {
    const response = await fetch('https://hackutd2025.eog.systems/api/Information/cauldrons', { next: { revalidate: 3600 } });
    if (!response.ok) {
      throw new Error(`Failed to fetch cauldron data: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Could not fetch cauldron data:', error);
    return [];
  }
}

export async function getMarket(): Promise<Market | null> {
  try {
    const response = await fetch('https://hackutd2025.eog.systems/api/Information/market', { next: { revalidate: 3600 } });
    if (!response.ok) {
      throw new Error(`Failed to fetch market data: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Could not fetch market data:', error);
    return null;
  }
}

export async function getComparisonData(date: string): Promise<ComparisonChartData[]> {
  // This is a mock implementation. In a real app, you'd fetch this from your API.
  const auditData = await getAuditData();
  const cauldrons = await getCauldrons();
  
  const cauldronNameMap = cauldrons.reduce((acc, cauldron) => {
    acc[cauldron.id] = cauldron.name;
    return acc;
  }, {} as Record<string, string>);

  const dataForDate = auditData.mismatched_tickets
    .map(ticket => ({
        cauldron_id: cauldronNameMap[ticket.cauldron_id] || ticket.cauldron_id,
        reported: ticket.ticket_volume,
        actual: ticket.detected_volume,
    }));
    
  // Add some mock data for other cauldrons for a fuller chart
  const otherCauldrons = cauldrons.filter(c => !dataForDate.some(d => d.cauldron_id === c.name)).slice(0, 5);
  otherCauldrons.forEach(c => {
    const reported = Math.random() * 500 + 50;
    dataForDate.push({
        cauldron_id: c.name,
        reported: reported,
        actual: reported - (Math.random() * 50 - 25), // a little variation
    });
  });

  return dataForDate;
}
