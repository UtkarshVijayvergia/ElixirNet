import OptimizationClient from '@/components/optimization/optimization-client';
import { getCauldrons, getMarket } from '@/lib/api';

export default async function OptimizationPage() {
  const [cauldrons, market] = await Promise.all([
    getCauldrons(),
    getMarket(),
  ]);

  return (
    <OptimizationClient 
      cauldrons={cauldrons}
      market={market}
    />
  );
}
