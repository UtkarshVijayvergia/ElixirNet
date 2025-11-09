import type { AuditData, Cauldron, Market, UnloggedDrainChartData, NetworkData, OptimizationData } from './types';

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

export function processUnloggedDrainData(auditData: AuditData, cauldrons: Cauldron[], date: string): UnloggedDrainChartData[] {
  const cauldronNameMap = cauldrons.reduce((acc, cauldron) => {
    acc[cauldron.id] = cauldron.name;
    return acc;
  }, {} as Record<string, string>);

  const dataMap = new Map<string, { unlogged: number }>();

  // Initialize with all cauldrons to ensure they appear in the chart
  cauldrons.forEach(c => {
    dataMap.set(c.name, { unlogged: 0 });
  });

  // Process `daily_audit` for 'Unlogged Drain' events for the selected date.
  auditData.daily_audit
    .filter(d => d.date === date && d.type === 'Unlogged Drain')
    .forEach(entry => {
      const cauldronName = cauldronNameMap[entry.cauldron_id] || entry.cauldron_id;
      const current = dataMap.get(cauldronName) || { unlogged: 0 };
      dataMap.set(cauldronName, {
        unlogged: current.unlogged + entry.volume
      });
    });

  const chartData: UnloggedDrainChartData[] = Array.from(dataMap.entries()).map(([cauldron_id, values]) => ({
    cauldron_id,
    ...values
  }));

  // Filter out entries where unlogged is 0 to keep the chart clean
  return chartData.filter(d => d.unlogged > 0);
}


export async function getNetworkData(): Promise<NetworkData | null> {
  try {
    const response = await fetch('/api/network');
    if (!response.ok) {
      console.error(`Failed to fetch network data: ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Could not fetch network data:', error);
    return null;
  }
}
