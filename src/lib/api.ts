import type { AuditData, Cauldron, Market } from './types';
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
