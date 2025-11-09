import { getAuditData, getCauldrons, getMarket } from '@/lib/api';
import DashboardClient from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  const [auditData, cauldrons, market] = await Promise.all([
    getAuditData(),
    getCauldrons(),
    getMarket(),
  ]);

  return (
    <DashboardClient 
      auditData={auditData}
      cauldrons={cauldrons}
      market={market}
    />
  );
}
