'use client'

import { useState } from 'react'
import type { Cauldron, Market } from '@/lib/types'
import Map, { Marker, Popup } from 'react-map-gl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, FlaskConical, AlertTriangle } from 'lucide-react'
import { SidebarTrigger } from '../ui/sidebar';

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

  const mapCenter = market 
    ? { latitude: market.latitude, longitude: market.longitude } 
    : (cauldrons.length > 0 ? { latitude: cauldrons[0].latitude, longitude: cauldrons[0].longitude } : { latitude: 33.2148, longitude: -97.13 });

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
          <Map
            mapboxAccessToken={accessToken}
            initialViewState={{
              longitude: mapCenter.longitude,
              latitude: mapCenter.latitude,
              zoom: 12
            }}
            style={{width: '100%', height: '100%'}}
            mapStyle="mapbox://styles/mapbox/dark-v11"
          >
            {market && (
              <Marker 
                longitude={market.longitude}
                latitude={market.latitude}
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setSelected(market);
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
                  setSelected(cauldron);
                }}
              >
                 <button className="transform transition-transform hover:scale-110 focus:outline-none">
                   <FlaskConical className="h-8 w-8 text-primary/80 fill-primary/20" />
                 </button>
              </Marker>
            ))}
            
            {selected && (
              <Popup
                longitude={selected.longitude}
                latitude={selected.latitude}
                onClose={() => setSelected(null)}
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
          </Map>
        </div>
      </main>
    </div>
  )
}
