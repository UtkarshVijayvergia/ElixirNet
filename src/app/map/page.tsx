import { getCauldrons, getMarket } from '@/lib/api';
import MapClient from '@/components/map/map-client';

export default async function MapPage() {
  const [cauldrons, market] = await Promise.all([
    getCauldrons(),
    getMarket(),
  ]);

  return (
    <MapClient 
      cauldrons={cauldrons}
      market={market}
    />
  );
}
