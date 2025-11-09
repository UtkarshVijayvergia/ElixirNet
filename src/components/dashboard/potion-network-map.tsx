'use client'

import { useState } from 'react'
import type { Cauldron, Market } from '@/lib/types'
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, Cauldron as CauldronIcon, AlertTriangle } from 'lucide-react'

interface PotionNetworkMapProps {
  cauldrons: Cauldron[]
  market: Market | null
}

const MissingApiKeyCard = () => (
  <Card className="h-full flex flex-col items-center justify-center bg-muted/50">
    <CardHeader className="text-center">
      <div className="mx-auto bg-destructive/20 text-destructive rounded-full p-3 w-fit">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <CardTitle className="mt-4">Google Maps API Key Missing</CardTitle>
      <CardDescription>
        Please add your API key to view the map.
      </CardDescription>
    </CardHeader>
    <CardContent className="text-center text-sm">
      <p>Create a <code className="bg-primary/10 text-primary p-1 rounded-sm">.env.local</code> file in the root of your project and add the following line:</p>
      <pre className="mt-2 bg-background p-2 rounded-md text-left">
        <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_API_KEY"</code>
      </pre>
    </CardContent>
  </Card>
)

export default function PotionNetworkMap({ cauldrons, market }: PotionNetworkMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [selected, setSelected] = useState<string | null>(null)

  const mapCenter = market 
    ? { lat: market.latitude, lng: market.longitude } 
    : (cauldrons.length > 0 ? { lat: cauldrons[0].latitude, lng: cauldrons[0].longitude } : { lat: 33.2148, lng: -97.13 });

  if (!apiKey) {
    return <MissingApiKeyCard />
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Potion Network</CardTitle>
        <CardDescription>Live locations of all cauldrons and the market.</CardDescription>
      </CardHeader>
      <CardContent className="h-[450px] p-0">
        <div className="w-full h-full rounded-b-lg overflow-hidden">
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={mapCenter}
              defaultZoom={9}
              gestureHandling={'greedy'}
              disableDefaultUI={true}
              mapId="potion-track-map"
              mapTypeControl={false}
            >
              {market && (
                <AdvancedMarker 
                  position={{ lat: market.latitude, lng: market.longitude }}
                  onClick={() => setSelected(market.id)}
                >
                  <button className="transform transition-transform hover:scale-110 focus:outline-none">
                    <Store className="h-8 w-8 text-accent-foreground fill-accent" />
                  </button>
                </AdvancedMarker>
              )}

              {cauldrons.map((cauldron) => (
                <AdvancedMarker
                  key={cauldron.id}
                  position={{ lat: cauldron.latitude, lng: cauldron.longitude }}
                  onClick={() => setSelected(cauldron.id)}
                >
                   <button className="transform transition-transform hover:scale-110 focus:outline-none">
                     <CauldronIcon className="h-8 w-8 text-primary/80 fill-primary/20" />
                   </button>
                </AdvancedMarker>
              ))}

              {selected && (
                <InfoWindow
                  position={
                    (cauldrons.find(c => c.id === selected) && { lat: cauldrons.find(c => c.id === selected)!.latitude, lng: cauldrons.find(c => c.id === selected)!.longitude }) ||
                    (market && market.id === selected && { lat: market.latitude, lng: market.longitude }) || undefined
                  }
                  onCloseClick={() => setSelected(null)}
                >
                  <div className="p-2">
                    <h3 className="font-bold">
                      {cauldrons.find(c => c.id === selected)?.name || market?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {cauldrons.find(c => c.id === selected) ? `Max Vol: ${cauldrons.find(c => c.id === selected)!.max_volume}L` : market?.description}
                    </p>
                  </div>
                </InfoWindow>
              )}

            </Map>
          </APIProvider>
        </div>
      </CardContent>
    </Card>
  )
}
