import { getCauldrons, getMarket } from '@/lib/api';
import DashboardClient from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  const [cauldrons, market] = await Promise.all([
    getCauldrons(),
    getMarket(),
  ]);

  return (
    <DashboardClient 
      cauldrons={cauldrons}
      market={market}
    />
  );
}
