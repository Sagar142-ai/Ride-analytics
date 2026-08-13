import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Compass, Layers, ShieldAlert, Sparkles, Car, TrendingUp, DollarSign, ExternalLink, Info } from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim().length > 10;

// Major NYC TLC Spatial Hubs
export interface SpatialHub {
  id: string;
  name: string;
  borough: 'Manhattan' | 'Queens' | 'Brooklyn' | 'New Jersey / Outer';
  type: 'airport' | 'commercial' | 'transit' | 'residential';
  lat: number;
  lng: number;
  trips24h: number;
  avgFare: number;
  surgeMultiplier: number;
  driverDensityScore: number; // 1-100
  popularDestination: string;
  xPct: number; // SVG representation percentage for interactive fallback map
  yPct: number;
}

const NYC_HUBS: SpatialHub[] = [
  {
    id: 'jfk',
    name: 'JFK International Airport',
    borough: 'Queens',
    type: 'airport',
    lat: 40.6413,
    lng: -73.7781,
    trips24h: 1240,
    avgFare: 70.00,
    surgeMultiplier: 2.8,
    driverDensityScore: 92,
    popularDestination: 'Midtown Manhattan',
    xPct: 78,
    yPct: 72,
  },
  {
    id: 'lga',
    name: 'LaGuardia Airport (LGA)',
    borough: 'Queens',
    type: 'airport',
    lat: 40.7769,
    lng: -73.8740,
    trips24h: 890,
    avgFare: 42.50,
    surgeMultiplier: 1.9,
    driverDensityScore: 84,
    popularDestination: 'Financial District',
    xPct: 68,
    yPct: 32,
  },
  {
    id: 'midtown',
    name: 'Midtown Manhattan & Times Square',
    borough: 'Manhattan',
    type: 'commercial',
    lat: 40.7580,
    lng: -73.9855,
    trips24h: 2450,
    avgFare: 22.80,
    surgeMultiplier: 2.4,
    driverDensityScore: 98,
    popularDestination: 'JFK Airport',
    xPct: 42,
    yPct: 40,
  },
  {
    id: 'fidi',
    name: 'Financial District & Wall Street',
    borough: 'Manhattan',
    type: 'commercial',
    lat: 40.7075,
    lng: -74.0089,
    trips24h: 1680,
    avgFare: 26.40,
    surgeMultiplier: 2.1,
    driverDensityScore: 88,
    popularDestination: 'LaGuardia Airport',
    xPct: 36,
    yPct: 62,
  },
  {
    id: 'dumbo',
    name: 'DUMBO & Downtown Brooklyn',
    borough: 'Brooklyn',
    type: 'transit',
    lat: 40.7033,
    lng: -73.9881,
    trips24h: 1120,
    avgFare: 24.10,
    surgeMultiplier: 1.6,
    driverDensityScore: 78,
    popularDestination: 'Midtown Manhattan',
    xPct: 44,
    yPct: 66,
  },
  {
    id: 'ewr',
    name: 'Newark Liberty Airport (EWR)',
    borough: 'New Jersey / Outer',
    type: 'airport',
    lat: 40.6895,
    lng: -74.1745,
    trips24h: 540,
    avgFare: 85.00,
    surgeMultiplier: 2.2,
    driverDensityScore: 70,
    popularDestination: 'Midtown Manhattan',
    xPct: 12,
    yPct: 68,
  },
  {
    id: 'ues',
    name: 'Upper East Side & Central Park',
    borough: 'Manhattan',
    type: 'residential',
    lat: 40.7736,
    lng: -73.9566,
    trips24h: 1350,
    avgFare: 19.50,
    surgeMultiplier: 1.4,
    driverDensityScore: 82,
    popularDestination: 'Financial District',
    xPct: 48,
    yPct: 30,
  },
  {
    id: 'astoria',
    name: 'Astoria & Long Island City',
    borough: 'Queens',
    type: 'residential',
    lat: 40.7644,
    lng: -73.9235,
    trips24h: 960,
    avgFare: 18.20,
    surgeMultiplier: 1.3,
    driverDensityScore: 75,
    popularDestination: 'Midtown Manhattan',
    xPct: 56,
    yPct: 36,
  }
];

export const NycMapPage: React.FC = () => {
  const [selectedHub, setSelectedHub] = useState<SpatialHub | null>(NYC_HUBS[2]); // Default Midtown
  const [originHub, setOriginHub] = useState<SpatialHub>(NYC_HUBS[2]); // Midtown
  const [destinationHub, setDestinationHub] = useState<SpatialHub>(NYC_HUBS[0]); // JFK
  const [activeFilter, setActiveFilter] = useState<'all' | 'airport' | 'commercial' | 'high_surge'>('all');

  const filteredHubs = NYC_HUBS.filter(hub => {
    if (activeFilter === 'airport') return hub.type === 'airport';
    if (activeFilter === 'commercial') return hub.type === 'commercial' || hub.type === 'transit';
    if (activeFilter === 'high_surge') return hub.surgeMultiplier >= 2.0;
    return true;
  });

  // Calculate route metrics
  const routeDistanceKm = Math.hypot((originHub.lat - destinationHub.lat) * 111, (originHub.lng - destinationHub.lng) * 85);
  const routeDistanceMiles = routeDistanceKm * 0.621371;
  const estimatedFare = Math.max(15, Math.round(routeDistanceMiles * 3.5 + 8 + (originHub.surgeMultiplier * 4)));
  const estimatedTimeMins = Math.max(10, Math.round(routeDistanceMiles * 3.2 + 12));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
              <MapPin className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Google Maps Spatial Analytics
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>NYC Spatial Density & Trip Corridors</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Real-time geospatial pickup/dropoff density map across NYC Boroughs, major international airports (JFK, LGA, EWR), and high-yield surge corridors.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All NYC Hubs
          </button>
          <button
            onClick={() => setActiveFilter('airport')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeFilter === 'airport' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Airports
          </button>
          <button
            onClick={() => setActiveFilter('high_surge')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeFilter === 'high_surge' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            High Surge (2.0x+)
          </button>
        </div>
      </div>

      {/* Main Map & Route Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization Viewport (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-[520px]">
          {/* Map Header Status Bar */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs px-5">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>NYC Spatial Viewport</span>
              <span className="text-[10px] text-slate-500 font-mono">({filteredHubs.length} Active Hubs)</span>
            </div>
            {hasValidKey ? (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Google Maps API Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                <Info className="w-3 h-3" />
                Interactive Spatial Mode (API Key Optional)
              </span>
            )}
          </div>

          {/* Map Content View */}
          <div className="flex-1 relative bg-slate-950 min-h-[460px] flex flex-col justify-center">
            {hasValidKey ? (
              <APIProvider apiKey={API_KEY} version="weekly">
                <Map
                  defaultCenter={{ lat: 40.730610, lng: -73.935242 }} // Centered on NYC
                  defaultZoom={11}
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%', minHeight: '460px' }}
                >
                  {filteredHubs.map((hub) => (
                    <AdvancedMarker
                      key={hub.id}
                      position={{ lat: hub.lat, lng: hub.lng }}
                      onClick={() => setSelectedHub(hub)}
                    >
                      <Pin
                        background={hub.type === 'airport' ? '#6366F1' : hub.surgeMultiplier >= 2.0 ? '#EF4444' : '#10B981'}
                        glyphColor="#FFFFFF"
                      />
                    </AdvancedMarker>
                  ))}

                  {selectedHub && (
                    <InfoWindow
                      position={{ lat: selectedHub.lat, lng: selectedHub.lng }}
                      onCloseClick={() => setSelectedHub(null)}
                    >
                      <div className="p-2 text-slate-900 text-xs font-sans space-y-1">
                        <strong className="text-sm font-extrabold block text-indigo-900">{selectedHub.name}</strong>
                        <div className="text-[11px] text-slate-600">Borough: {selectedHub.borough}</div>
                        <div className="text-[11px] font-bold text-emerald-700">24h Trips: {selectedHub.trips24h.toLocaleString()}</div>
                        <div className="text-[11px] font-bold text-indigo-700">Avg Fare Yield: ${selectedHub.avgFare.toFixed(2)}</div>
                        <div className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold inline-block">
                          Surge Index: {selectedHub.surgeMultiplier}x
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            ) : (
              /* High-Resolution Interactive Vector Spatial Map */
              <div className="relative w-full h-full min-h-[460px] p-4 bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
                {/* SVG Visual Spatial Density Canvas */}
                <div className="relative w-full h-[420px] rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex items-center justify-center overflow-hidden shadow-inner">
                  {/* Subtle Map Background Grid */}
                  <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6366F1" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>

                  {/* Route Polyline SVG connection between Origin & Destination */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <line
                      x1={`${originHub.xPct}%`}
                      y1={`${originHub.yPct}%`}
                      x2={`${destinationHub.xPct}%`}
                      y2={`${destinationHub.yPct}%`}
                      stroke="#818CF8"
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      className="animate-pulse"
                    />
                  </svg>

                  {/* NYC Borough & Hub Markers */}
                  {filteredHubs.map((hub) => {
                    const isSelected = selectedHub?.id === hub.id;
                    const isOrigin = originHub.id === hub.id;
                    const isDest = destinationHub.id === hub.id;

                    return (
                      <button
                        key={hub.id}
                        onClick={() => setSelectedHub(hub)}
                        style={{ left: `${hub.xPct}%`, top: `${hub.yPct}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all z-20 cursor-pointer ${
                          isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                        }`}
                      >
                        <div className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-lg border backdrop-blur ${
                          isOrigin
                            ? 'bg-emerald-600 text-white border-emerald-400 ring-4 ring-emerald-500/20'
                            : isDest
                            ? 'bg-indigo-600 text-white border-indigo-400 ring-4 ring-indigo-500/20'
                            : hub.surgeMultiplier >= 2.0
                            ? 'bg-rose-950/90 text-rose-300 border-rose-500/50'
                            : 'bg-slate-900/90 text-slate-200 border-slate-700'
                        }`}>
                          <MapPin className={`w-3.5 h-3.5 ${hub.surgeMultiplier >= 2.0 ? 'text-rose-400' : 'text-indigo-400'}`} />
                          <span className="hidden sm:inline truncate max-w-[110px]">{hub.name.split(' ')[0]}</span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-950/80 font-mono text-slate-300">
                            {hub.surgeMultiplier}x
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Spatial Hub Details & Route Simulator Panel (1 col) */}
        <div className="space-y-6">
          {/* Selected Hub Card */}
          {selectedHub && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    Selected NYC Spatial Hub
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">{selectedHub.name}</h3>
                  <span className="text-xs text-slate-400">{selectedHub.borough} Borough</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                  selectedHub.surgeMultiplier >= 2.0
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {selectedHub.surgeMultiplier}x Surge
                </span>
              </div>

              {/* Hub Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium">24h Trip Volume</span>
                  <div className="text-sm font-bold text-slate-100">{selectedHub.trips24h.toLocaleString()}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium">Avg Fare Yield</span>
                  <div className="text-sm font-bold text-emerald-400">${selectedHub.avgFare.toFixed(2)}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium">Driver Density</span>
                  <div className="text-sm font-bold text-indigo-400">{selectedHub.driverDensityScore}/100</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium">Top Destination</span>
                  <div className="text-xs font-bold text-slate-200 truncate">{selectedHub.popularDestination}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setOriginHub(selectedHub)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  Set as Origin
                </button>
                <button
                  onClick={() => setDestinationHub(selectedHub)}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  Set as Destination
                </button>
              </div>
            </div>
          )}

          {/* Route Corridor Calculator Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Navigation className="w-4 h-4 text-indigo-400" />
              <span>Route Corridor Estimator</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Origin Hub:</label>
                <select
                  value={originHub.id}
                  onChange={(e) => {
                    const found = NYC_HUBS.find(h => h.id === e.target.value);
                    if (found) setOriginHub(found);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 font-medium cursor-pointer"
                >
                  {NYC_HUBS.map(h => (
                    <option key={h.id} value={h.id}>{h.name} ({h.borough})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Destination Hub:</label>
                <select
                  value={destinationHub.id}
                  onChange={(e) => {
                    const found = NYC_HUBS.find(h => h.id === e.target.value);
                    if (found) setDestinationHub(found);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 font-medium cursor-pointer"
                >
                  {NYC_HUBS.map(h => (
                    <option key={h.id} value={h.id}>{h.name} ({h.borough})</option>
                  ))}
                </select>
              </div>

              {/* Corridor Calculation Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mt-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Est. Distance:</span>
                  <span className="font-bold text-slate-100">{routeDistanceMiles.toFixed(1)} miles</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Est. Travel Time:</span>
                  <span className="font-bold text-slate-100">{estimatedTimeMins} mins</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800 pt-2 font-bold text-sm">
                  <span className="text-slate-200">Est. Corridor Fare:</span>
                  <span className="text-emerald-400">${estimatedFare}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
