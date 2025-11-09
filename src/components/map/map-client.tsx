'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import type { Cauldron, Market, NetworkData } from '@/lib/types'
import MapGL, { Marker, Popup, Source, Layer, MapRef } from 'react-map-gl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, FlaskConical, AlertTriangle } from 'lucide-react'
import { SidebarTrigger } from '../ui/sidebar';
import { getNetworkData } from '@/lib/api';

interface MapClientProps {
  cauldrons: Cauldron[]
  market: Market | null
}

const MissingTokenCard = () => (
  <Card className="h-full flex flex-col items-center justify-center bg-muted/50">
    <CardHeader className="text-center">
      <div className="mx-auto bg-destructive/20 text-destructive rounded-full p-3 w-fit">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <CardTitle className="mt-4">Mapbox Access Token Missing</CardTitle>
      <CardDescription>
        Please add your access token to view the map.
      </CardDescription>
    </CardHeader>
    <CardContent className="text-center text-sm">
      <p>Create a <code className="bg-primary/10 text-primary p-1 rounded-sm">.env.local</code> file in the root of your project and add the following line:</p>
      <pre className="mt-2 bg-background p-2 rounded-md text-left">
        <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="YOUR_TOKEN"</code>
      </pre>
    </CardContent>
  </Card>
)

export default function MapClient({ cauldrons, market }: MapClientProps) {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  const [selected, setSelected] = useState<Cauldron | Market | null>(null)
  const [accentColor, setAccentColor] = useState('');
  const [network, setNetwork] = useState<NetworkData | null>(null);
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const colorValue = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const [h, s, l] = colorValue.split(' ');
      setAccentColor(`hsl(${h}, ${s}, ${l})`);
    }
  }, []);
  
  useEffect(() => {
    async function fetchNetworkData() {
      const data = await getNetworkData();
      setNetwork(data);
    }
    fetchNetworkData();
  }, []);

  const nodeMap = useMemo(() => {
    const map = new Map<string, { latitude: number; longitude: number }>();
    cauldrons.forEach(c => map.set(c.id, c));
    if (market) {
      map.set(market.id, market);
    }
    return map;
  }, [cauldrons, market]);

  const mapCenter = market 
    ? { latitude: market.latitude, longitude: market.longitude } 
    : (cauldrons.length > 0 ? { latitude: cauldrons[0].latitude, longitude: cauldrons[0].longitude } : { latitude: 33.2148, longitude: -97.13 });
  
  const handleMarkerClick = (item: Cauldron | Market) => {
    setSelected(item);
  }

  const handleClosePopup = () => {
    setSelected(null);
  }

  const handleMapLoad = () => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    // Create a white triangle SVG icon. Mapbox can color this dynamically.
    const size = 150;
    const arrow = new Image(size, size);
    arrow.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='white' stroke='none'%3E%3Cpath d='M12 2L2 22h20L12 2z'/%3E%3C/svg%3E";
    arrow.onload = () => {
      if (!map.hasImage('arrow')) {
        map.addImage('arrow', arrow, { sdf: true });
      }
    };
  };

  const lineGeoJson: GeoJSON.FeatureCollection<GeoJSON.LineString> = useMemo(() => {
    if (!network?.edges || nodeMap.size === 0) {
      return { type: 'FeatureCollection', features: [] };
    }
  
    const features: GeoJSON.Feature<GeoJSON.LineString>[] = network.edges.map(edge => {
      const origin = nodeMap.get(edge.from);
      const destination = nodeMap.get(edge.to);
  
      if (!origin || !destination) return null;
  
      return {
        type: 'Feature',
        properties: {
          travel_time: edge.travel_time_minutes
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [origin.longitude, origin.latitude],
            [destination.longitude, destination.latitude],
          ],
        },
      };
    }).filter((feature): feature is GeoJSON.Feature<GeoJSON.LineString> => feature !== null);
  
    return { type: 'FeatureCollection', features };
  }, [network, nodeMap]);
  
  if (!accessToken) {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:h-auto md:border-0 md:bg-transparent md:px-6">
                <SidebarTrigger className="md:hidden" />
                <div className="w-full flex-1 md:hidden" />
                <h1 className="hidden text-2xl font-bold md:block font-headline">Map</h1>
            </header>
            <main className="flex-1 p-4 md:p-6">
                <MissingTokenCard />
            </main>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:h-auto md:border-0 md:bg-transparent md:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1 md:hidden" />
          <h1 className="hidden text-2xl font-bold md:block font-headline">Map</h1>
      </header>
      <main className="flex-1 p-4 md:p-6 md:pt-0 flex">
        <div className="w-full h-full rounded-lg overflow-hidden border">
          <MapGL
            ref={mapRef}
            mapboxAccessToken={accessToken}
            initialViewState={{
              longitude: mapCenter.longitude,
              latitude: mapCenter.latitude,
              zoom: 12
            }}
            style={{width: '100%', height: '100%'}}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            onClick={handleClosePopup}
            onLoad={handleMapLoad}
          >
            {market && (
              <Marker 
                longitude={market.longitude}
                latitude={market.latitude}
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  handleMarkerClick(market)
                }}
              >
                <button className="transform transition-transform hover:scale-110 focus:outline-none">
                  <Store className="h-8 w-8 text-accent-foreground fill-accent" />
                </button>
              </Marker>
            )}

            {cauldrons.map((cauldron) => (
              <Marker
                key={cauldron.id}
                longitude={cauldron.longitude}
                latitude={cauldron.latitude}
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  handleMarkerClick(cauldron);
                }}
              >
                 <button className="transform transition-transform hover:scale-110 focus:outline-none">
                   <FlaskConical className="h-8 w-8 text-primary/80 fill-primary/20" />
                 </button>
              </Marker>
            ))}
            
            {selected && 'longitude' in selected && (
              <Popup
                longitude={selected.longitude}
                latitude={selected.latitude}
                onClose={handleClosePopup}
                anchor="bottom"
                closeButton={false}
                offset={40}
              >
                <div className="p-1">
                    <h3 className="font-bold text-card-foreground">
                      {selected.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {'max_volume' in selected ? `Max Vol: ${selected.max_volume}L` : selected.description}
                    </p>
                  </div>
              </Popup>
            )}

            {accentColor && <Source id="lines" type="geojson" data={lineGeoJson}>
              <Layer
                id="line-layer"
                type="line"
                paint={{
                  'line-color': accentColor,
                  'line-width': 2,
                  'line-opacity': 0.8
                }}
              />
               <Layer
                id="arrow-layer"
                type="symbol"
                source="lines"
                layout={{
                  "symbol-placement": "line",
                  "symbol-spacing": 75,
                  "icon-image": "arrow",
                  "icon-size": 0.1,
                  "icon-allow-overlap": true,
                  "icon-ignore-placement": true,
                  "icon-rotate": 90,
                  "icon-rotation-alignment": "map",
                }}
                 paint={{
                    "icon-color": accentColor,
                 }}
              />
            </Source>}
          </MapGL>
        </div>
      </main>
    </div>
  )
}
