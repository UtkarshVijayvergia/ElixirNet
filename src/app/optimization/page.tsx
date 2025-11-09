import OptimizationClient from '@/components/optimization/optimization-client';
import { getCauldrons, getMarket, getOptimizationData } from '@/lib/api';

export default async function OptimizationPage() {
  const [optimizationData, cauldrons, market] = await Promise.all([
    getOptimizationData(),
    getCauldrons(),
    getMarket(),
  ]);

  return (
    <OptimizationClient 
      optimizationData={optimizationData}
      cauldrons={cauldrons}
      market={market}
    />
  );
}