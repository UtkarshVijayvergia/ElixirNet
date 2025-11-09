import { getCauldrons, getMarket, getNetworkData } from '@/lib/api';
import MapClient from '@/components/map/map-client';

export default async function MapPage() {
  const [cauldrons, market, network] = await Promise.all([
    getCauldrons(),
    getMarket(),
    getNetworkData(),
  ]);

  return (
    <MapClient 
      cauldrons={cauldrons}
      market={market}
      network={network}
    />
  );
}
