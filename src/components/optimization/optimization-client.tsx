'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import type { Cauldron, Market, OptimizationData, RouteStep, Witch } from '@/lib/types'
import MapGL, { Marker, Popup, Source, Layer, MapRef } from 'react-map-gl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, FlaskConical, AlertTriangle, Users } from 'lucide-react'
import { SidebarTrigger } from '../ui/sidebar';
import { Skeleton } from '../ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { format, parseISO } from 'date-fns';

interface OptimizationClientProps {
  cauldrons: Cauldron[]
  market: Market | null
}

const WITCH_COLORS = [
    'hsl(347, 77%, 50%)', // Red
    'hsl(203, 72%, 45%)', // Blue
    'hsl(150, 60%, 40%)', // Green
    'hsl(39, 92%, 55%)',  // Yellow
    'hsl(260, 70%, 55%)', // Purple
    'hsl(25, 85%, 50%)',  // Orange
];

const LoadingSkeleton = () => (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-10 w-1/2" />
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
            <Skeleton className="w-full h-64" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
            <Skeleton className="w-full h-96" />
        </CardContent>
      </Card>
    </div>
  );

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

export default function OptimizationClient({ cauldrons, market }: OptimizationClientProps) {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  const [selected, setSelected] = useState<Cauldron | Market | null>(null)
  const mapRef = useRef<MapRef>(null);

  const [optimizationData, setOptimizationData] = useState<OptimizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function getOptimizationData() {
        try {
            const response = await fetch('http://localhost:8000/api/optimization/run');
            if (!response.ok) {
                throw new Error(`Failed to fetch optimization data: ${response.statusText}`);
            }
            const data = await response.json();
            setOptimizationData(data);
        } catch (error) {
            console.error('Could not fetch optimization data:', error);
            setError('Failed to load optimization data. Please ensure the local optimization server is running.');
        } finally {
            setLoading(false);
        }
    }
    getOptimizationData();
  }, [])


  const nodeMap = useMemo(() => {
    const map = new Map<string, { latitude: number; longitude: number; name: string }>();
    cauldrons.forEach(c => map.set(c.id, { latitude: c.latitude, longitude: c.longitude, name: c.name }));
    if (market) {
      map.set(market.id, { latitude: market.latitude, longitude: market.longitude, name: market.name });
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
    
    const size = 150;
    const arrow = new Image(size, size);
    arrow.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='white' stroke='none'%3E%3Cpath d='M12 2L2 22h20L12 2z'/%3E%3C/svg%3E";
    arrow.onload = () => {
      if (!map.hasImage('arrow')) {
        map.addImage('arrow', arrow, { sdf: true });
      }
    };
  };

  const lineGeoJsonFeatures = useMemo(() => {
    if (!optimizationData || nodeMap.size === 0) {
      return [];
    }
  
    return optimizationData.witches.flatMap((witch, witchIndex) => {
        let currentNode = witch.current_node;
        return witch.route.map((step, stepIndex) => {
            const fromNode = nodeMap.get(currentNode);
            // In the data, the 'type' field is 'market_unload' not 'unload'
            const toNodeId = step.type === 'collect' ? step.cauldron_id : (step.type === 'market_unload' ? step.market_node : '');
            if (!toNodeId) return null;
            const toNode = nodeMap.get(toNodeId);

            currentNode = toNodeId; // Update current node for next step

            if (!fromNode || !toNode) return null;

            return {
                type: 'Feature',
                properties: {
                    witchId: witch.id,
                    color: WITCH_COLORS[witchIndex % WITCH_COLORS.length],
                },
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [fromNode.longitude, fromNode.latitude],
                        [toNode.longitude, toNode.latitude],
                    ],
                },
            };
        }).filter((feature): feature is GeoJSON.Feature<GeoJSON.LineString> => feature !== null);
    });
  }, [optimizationData, nodeMap]);

  if (loading) {
    return (
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:h-auto md:border-0 md:bg-transparent md:px-6">
              <SidebarTrigger className="md:hidden" />
              <div className="w-full flex-1 md:hidden" />
              <h1 className="hidden text-2xl font-bold md:block font-headline">Optimization</h1>
          </header>
          <main className="flex-1 space-y-8 p-4 md:p-6">
            <LoadingSkeleton />
          </main>
        </div>
      )
  }

  if (error || !optimizationData) {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:h-auto md:border-0 md:bg-transparent md:px-6">
                <SidebarTrigger className="md:hidden" />
                <div className="w-full flex-1 md:hidden" />
                <h1 className="hidden text-2xl font-bold md:block font-headline">Optimization</h1>
            </header>
            <main className="flex-1 p-4 md:p-6 text-center text-destructive">{error}</main>
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:h-auto md:border-0 md:bg-transparent md:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1 md:hidden" />
          <h1 className="hidden text-2xl font-bold md:block font-headline">Courier Route Optimization</h1>
      </header>
      <main className="flex-1 space-y-8 p-4 md:p-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Minimum Witches Required</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{optimizationData.num_witches}</div>
                <p className="text-xs text-muted-foreground">To maintain network stability</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Optimized Routes</CardTitle>
                <CardDescription>Step-by-step route for each witch to prevent cauldron overflow.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                {optimizationData.witches.map((witch, index) => (
                    <AccordionItem value={`item-${witch.id}`} key={witch.id}>
                    <AccordionTrigger>
                        <span className="flex items-center gap-3">
                            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: WITCH_COLORS[index % WITCH_COLORS.length]}}></span>
                            Witch #{witch.id}
                        </span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Step</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Node</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Start Time</TableHead>
                                <TableHead>End Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {witch.route.map((step, stepIndex) => (
                                    <TableRow key={stepIndex}>
                                        <TableCell>{stepIndex + 1}</TableCell>
                                        <TableCell>
                                        <Badge variant={step.type === 'collect' ? 'default' : 'secondary'}>
                                            {step.type === 'collect' ? 'Collect' : 'Unload'}
                                        </Badge>
                                        </TableCell>
                                        <TableCell>{nodeMap.get(step.type === 'collect' ? step.cauldron_id : step.market_node)?.name}</TableCell>
                                        <TableCell>{(step.type === 'collect' ? step.amount : step.amount_unloaded).toFixed(2)} L</TableCell>
                                        <TableCell>{format(parseISO(step.start), 'Pp')}</TableCell>
                                        <TableCell>{format(parseISO(step.end), 'Pp')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Cauldron Forecast</CardTitle>
                <CardDescription>Projected status for each cauldron based on current rates.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-auto rounded-md border" style={{maxHeight: '400px'}}>
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted/50">
                            <TableRow>
                                <TableHead>Cauldron</TableHead>
                                <TableHead className="text-right">Time to Overflow (min)</TableHead>
                                <TableHead className="text-right">Current Level (L)</TableHead>
                                <TableHead className="text-right">Fill Rate (L/min)</TableHead>
                                <TableHead className="text-right">Drain Rate (L/min)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(optimizationData.forecast_summary).map(([cauldronId, forecast]) => (
                                <TableRow key={cauldronId}>
                                    <TableCell className="font-medium">{nodeMap.get(cauldronId)?.name || cauldronId}</TableCell>
                                    <TableCell className="text-right">{Math.round(forecast.time_to_overflow_min).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{forecast.current_level.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{forecast.fill_rate_per_min.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{forecast.drain_rate_per_min.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
        
        <div className="h-[600px] w-full rounded-lg overflow-hidden border">
            {accessToken ? (
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
                    <Marker longitude={market.longitude} latitude={market.latitude} onClick={e => { e.originalEvent.stopPropagation(); handleMarkerClick(market)}}>
                        <button className="transform transition-transform hover:scale-110 focus:outline-none">
                            <Store className="h-8 w-8 text-accent-foreground fill-accent" />
                        </button>
                    </Marker>
                    )}
                    {cauldrons.map((cauldron) => (
                    <Marker key={cauldron.id} longitude={cauldron.longitude} latitude={cauldron.latitude} onClick={e => { e.originalEvent.stopPropagation(); handleMarkerClick(cauldron); }}>
                        <button className="transform transition-transform hover:scale-110 focus:outline-none">
                            <FlaskConical className="h-8 w-8 text-primary/80 fill-primary/20" />
                        </button>
                    </Marker>
                    ))}
                    {selected && 'longitude' in selected && (
                    <Popup longitude={selected.longitude} latitude={selected.latitude} onClose={handleClosePopup} anchor="bottom" closeButton={false} offset={40}>
                        <div className="p-1">
                            <h3 className="font-bold text-card-foreground">{selected.name}</h3>
                            <p className="text-sm text-muted-foreground">{'max_volume' in selected ? `Max Vol: ${selected.max_volume}L` : selected.description}</p>
                        </div>
                    </Popup>
                    )}

                    <Source id="witch-routes" type="geojson" data={{ type: 'FeatureCollection', features: lineGeoJsonFeatures }}>
                        <Layer
                            id="line-layer"
                            type="line"
                            paint={{
                                'line-color': ['get', 'color'],
                                'line-width': 3,
                                'line-opacity': 0.8
                            }}
                        />
                        <Layer
                            id="arrow-layer"
                            type="symbol"
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
                                "icon-color": ['get', 'color'],
                            }}
                        />
                    </Source>
                </MapGL>
            ) : <MissingTokenCard />}
        </div>
      </main>
    </div>
  )
}

    