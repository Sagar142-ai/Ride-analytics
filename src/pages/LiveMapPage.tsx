import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, Layers, Zap, Play, Pause, Flame, Activity, ShieldCheck, Sparkles, AlertTriangle, ArrowRight, Car, Compass as CompassIcon, RotateCcw } from 'lucide-react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

interface LocationHub {
  id: string;
  name: string;
  borough: string;
  x: number; // relative SVG % coordinate (0-100)
  y: number; // relative SVG % coordinate (0-100)
  lat: number;
  lng: number;
  surgeMultiplier: number;
  volumeShare: string;
  isAirport: boolean;
  type: string;
  zoneCode: string;
}

interface SimulatedTrip {
  id: string;
  time: string;
  pickup: string;
  dropoff: string;
  distanceMiles: number;
  fare: number;
  surgeMultiplier: number;
  passengerCount: number;
  paymentType: 'Credit Card' | 'Cash';
  status: 'Completed' | 'In Transit';
}

const NYC_HUBS: LocationHub[] = [
  { id: 'midtown', name: 'Midtown Manhattan', borough: 'Manhattan', x: 38, y: 35, lat: 40.7549, lng: -73.9840, surgeMultiplier: 2.4, volumeShare: '34.2%', isAirport: false, type: 'Commercial Core', zoneCode: 'ZONE-A1' },
  { id: 'fidi', name: 'Financial District / Wall St', borough: 'Manhattan', x: 35, y: 55, lat: 40.7075, lng: -74.0089, surgeMultiplier: 1.9, volumeShare: '11.8%', isAirport: false, type: 'Financial Hub', zoneCode: 'ZONE-A2' },
  { id: 'ues', name: 'Upper East Side', borough: 'Manhattan', x: 42, y: 22, lat: 40.7736, lng: -73.9566, surgeMultiplier: 1.4, volumeShare: '8.3%', isAirport: false, type: 'Residential Corridor', zoneCode: 'ZONE-A3' },
  { id: 'jfk', name: 'JFK Airport', borough: 'Queens', x: 80, y: 75, lat: 40.6413, lng: -73.7781, surgeMultiplier: 2.8, volumeShare: '18.4%', isAirport: true, type: 'Airport Hub', zoneCode: 'HUB-JFK' },
  { id: 'lga', name: 'LaGuardia Airport (LGA)', borough: 'Queens', x: 62, y: 28, lat: 40.7769, lng: -73.8740, surgeMultiplier: 1.8, volumeShare: '12.1%', isAirport: true, type: 'Airport Hub', zoneCode: 'HUB-LGA' },
  { id: 'ewr', name: 'Newark Liberty Airport (EWR)', borough: 'New Jersey', x: 12, y: 65, lat: 40.6895, lng: -74.1745, surgeMultiplier: 2.1, volumeShare: '6.5%', isAirport: true, type: 'Regional Airport', zoneCode: 'HUB-EWR' },
  { id: 'bk_dumbo', name: 'Downtown Brooklyn & DUMBO', borough: 'Brooklyn', x: 48, y: 62, lat: 40.7028, lng: -73.9872, surgeMultiplier: 1.5, volumeShare: '7.2%', isAirport: false, type: 'Outer Borough Hub', zoneCode: 'ZONE-B1' },
  { id: 'astoria', name: 'Astoria & Long Island City', borough: 'Queens', x: 56, y: 38, lat: 40.7644, lng: -73.9235, surgeMultiplier: 1.3, volumeShare: '4.8%', isAirport: false, type: 'Emerging Demand', zoneCode: 'ZONE-Q1' },
];

const LOCATIONS = ['JFK Airport', 'Midtown Manhattan', 'LaGuardia Airport', 'Financial District', 'Downtown Brooklyn', 'Upper East Side', 'Astoria'];

export const LiveMapPage: React.FC = () => {
  const [selectedHub, setSelectedHub] = useState<LocationHub>(NYC_HUBS[0]);
  const [filterType, setFilterType] = useState<'all' | 'airports' | 'surge'>('all');
  const [pickupHubId, setPickupHubId] = useState('jfk');
  const [dropoffHubId, setDropoffHubId] = useState('midtown');
  const [googleMapsKey, setGoogleMapsKey] = useState<string>('');
  const [mapTheme, setMapTheme] = useState<'tactical' | 'cyberpunk' | 'topographic'>('tactical');

  // Live Stream State
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);
  const [trips, setTrips] = useState<SimulatedTrip[]>([]);
  const [surgeMultipliers, setSurgeMultipliers] = useState({
    manhattan: 2.4,
    brooklyn: 1.5,
    queens: 1.8,
    jfk: 2.8,
  });

  useEffect(() => {
    const key = (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';
    setGoogleMapsKey(key);

    const initialTrips: SimulatedTrip[] = Array.from({ length: 8 }, (_, i) => generateRandomTrip(i));
    setTrips(initialTrips);
  }, []);

  // Interval loop for live ride streaming
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.round(2000 / speed);
    const interval = setInterval(() => {
      setTrips(prev => [generateRandomTrip(prev.length), ...prev.slice(0, 19)]);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  function generateRandomTrip(index: number): SimulatedTrip {
    const pickup = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    let dropoff = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    while (dropoff === pickup) {
      dropoff = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    }

    const distanceMiles = parseFloat((Math.random() * 12 + 1.5).toFixed(1));
    const isJfk = pickup.includes('JFK') || dropoff.includes('JFK');
    const surgeMultiplier = parseFloat((Math.random() * 1.5 + 1.1).toFixed(1));
    const fare = isJfk ? 70.00 : parseFloat((distanceMiles * 3.2 + 6.00 * surgeMultiplier).toFixed(2));

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return {
      id: `TLC-${Math.floor(100000 + Math.random() * 900000)}`,
      time: timeStr,
      pickup,
      dropoff,
      distanceMiles,
      fare,
      surgeMultiplier,
      passengerCount: Math.floor(Math.random() * 4) + 1,
      paymentType: Math.random() > 0.3 ? 'Credit Card' : 'Cash',
      status: Math.random() > 0.2 ? 'Completed' : 'In Transit',
    };
  }

  const triggerSurgeSpike = () => {
    setSurgeMultipliers({
      manhattan: parseFloat((Math.random() * 1.2 + 2.5).toFixed(1)),
      brooklyn: parseFloat((Math.random() * 1.0 + 1.8).toFixed(1)),
      queens: parseFloat((Math.random() * 0.8 + 1.5).toFixed(1)),
      jfk: parseFloat((Math.random() * 1.5 + 3.0).toFixed(1)),
    });
  };

  const pickupHub = NYC_HUBS.find(h => h.id === pickupHubId) || NYC_HUBS[3];
  const dropoffHub = NYC_HUBS.find(h => h.id === dropoffHubId) || NYC_HUBS[0];

  const estimatedCorridorMiles = Math.abs(pickupHub.lat - dropoffHub.lat) * 60 + Math.abs(pickupHub.lng - dropoffHub.lng) * 50 + 2.5;
  const estimatedFare = (pickupHub.id === 'jfk' || dropoffHub.id === 'jfk') ? 70.00 : parseFloat((estimatedCorridorMiles * 3.1 + 8.5).toFixed(2));
  const estimatedTimeMins = Math.round(estimatedCorridorMiles * 2.8 + 8);

  const filteredHubs = NYC_HUBS.filter(h => {
    if (filterType === 'airports') return h.isAirport;
    if (filterType === 'surge') return h.surgeMultiplier >= 2.0;
    return true;
  });

  const totalStreamRevenue = trips.reduce((acc, t) => acc + t.fare, 0);

  // SVG Curve Control point calculation for route line
  const midX = (pickupHub.x + dropoffHub.x) / 2 + (dropoffHub.y - pickupHub.y) * 0.2;
  const midY = (pickupHub.y + dropoffHub.y) / 2 - (dropoffHub.x - pickupHub.x) * 0.2;
  const pathD = `M ${pickupHub.x} ${pickupHub.y} Q ${midX} ${midY} ${dropoffHub.x} ${dropoffHub.y}`;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
              <MapPin className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Interactive Route Canvas & Spatial Stream
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Live Map & Route Navigation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Graphical spatial terrain map with point-to-point route navigation, animated vehicle corridors, surge index overlays, and real-time TLC trip streaming.
          </p>
        </div>

        {/* Live Stream Controls */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isPlaying ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Stream' : 'Start Stream'}</span>
          </button>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            {[1, 2, 5].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s as any)}
                className={`px-2 py-1 rounded text-xs font-bold cursor-pointer ${
                  speed === s ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={triggerSurgeSpike}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer ml-1"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Spike Surge</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Map Graphic (2 cols) & Controls/Route Estimator (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphical Map Canvas (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-100">
                <CompassIcon className="w-4 h-4 text-indigo-400" />
                <span>Tactical Spatial Map & Active Corridor</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Map Theme Selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setMapTheme('tactical')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      mapTheme === 'tactical' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Tactical Grid
                  </button>
                  <button
                    onClick={() => setMapTheme('cyberpunk')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      mapTheme === 'cyberpunk' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Cyber Neon
                  </button>
                  <button
                    onClick={() => setMapTheme('topographic')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      mapTheme === 'topographic' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Bermuda Grid
                  </button>
                </div>

                {/* Hub Filter Chips */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2 py-0.5 rounded-lg font-bold text-[10px] cursor-pointer ${
                      filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Hubs
                  </button>
                  <button
                    onClick={() => setFilterType('airports')}
                    className={`px-2 py-0.5 rounded-lg font-bold text-[10px] cursor-pointer ${
                      filterType === 'airports' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Airports
                  </button>
                  <button
                    onClick={() => setFilterType('surge')}
                    className={`px-2 py-0.5 rounded-lg font-bold text-[10px] cursor-pointer ${
                      filterType === 'surge' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    High Surge
                  </button>
                </div>
              </div>
            </div>

            {/* HIGH-RESOLUTION GRAPHICAL MAP CANVAS */}
            <div className={`relative w-full h-[460px] rounded-2xl overflow-hidden border border-slate-800 select-none ${
              mapTheme === 'cyberpunk' ? 'bg-slate-950' : mapTheme === 'topographic' ? 'bg-emerald-950/20' : 'bg-slate-950'
            }`}>
              {/* SVG Graphic Map Engine */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  {/* Grid Pattern */}
                  <pattern id="tactical-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke={mapTheme === 'cyberpunk' ? '#ec4899' : '#6366f1'} strokeWidth="0.15" strokeOpacity="0.2" />
                  </pattern>

                  {/* Linear Gradient for Route Path */}
                  <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>

                  {/* Glow filter */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="0.8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Grid Overlay */}
                <rect width="100" height="100" fill="url(#tactical-grid)" />

                {/* Styled Waterways (Hudson River, East River, Bay Contour) */}
                {/* Hudson River */}
                <path d="M 28 0 Q 30 40 26 70 T 20 100" fill="none" stroke="#1e293b" strokeWidth="6" strokeOpacity="0.8" />
                <path d="M 28 0 Q 30 40 26 70 T 20 100" fill="none" stroke="#0284c7" strokeWidth="2" strokeOpacity="0.4" />

                {/* East River & Long Island Sound */}
                <path d="M 45 10 Q 52 35 44 55 T 70 85" fill="none" stroke="#1e293b" strokeWidth="5" strokeOpacity="0.8" />
                <path d="M 45 10 Q 52 35 44 55 T 70 85" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.4" />

                {/* Manhattan Island Contour */}
                <path d="M 30 5 L 43 12 L 42 52 L 28 50 Z" fill="#334155" fillOpacity="0.15" stroke="#475569" strokeWidth="0.3" />

                {/* Brooklyn / Queens Region Contour */}
                <path d="M 45 20 L 95 15 L 98 85 L 45 80 Z" fill="#1e293b" fillOpacity="0.2" stroke="#334155" strokeWidth="0.3" />

                {/* Major Highway / Bridge Corridors */}
                <line x1="38" y1="35" x2="62" y2="28" stroke="#475569" strokeWidth="0.3" strokeDasharray="0.8 0.8" />
                <line x1="38" y1="35" x2="80" y2="75" stroke="#475569" strokeWidth="0.3" strokeDasharray="0.8 0.8" />
                <line x1="35" y1="55" x2="48" y2="62" stroke="#475569" strokeWidth="0.3" strokeDasharray="0.8 0.8" />

                {/* ACTIVE ROUTE LINE PATH */}
                {pickupHub && dropoffHub && (
                  <>
                    {/* Shadow route glow */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={mapTheme === 'cyberpunk' ? '#ec4899' : '#6366f1'}
                      strokeWidth="1.8"
                      strokeOpacity="0.4"
                      filter="url(#glow)"
                    />

                    {/* Animated dashed line path */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="url(#routeGrad)"
                      strokeWidth="1.2"
                      strokeDasharray="2 1"
                    >
                      <animate attributeName="stroke-dashoffset" from="12" to="0" dur="2s" repeatCount="indefinite" />
                    </path>

                    {/* Midpoint Waypoint Marker */}
                    <circle cx={midX} cy={midY} r="1" fill="#f59e0b" filter="url(#glow)" />
                  </>
                )}

                {/* LOCATION HUB MARKERS */}
                {filteredHubs.map(hub => {
                  const isPickup = hub.id === pickupHubId;
                  const isDropoff = hub.id === dropoffHubId;
                  const isSelected = hub.id === selectedHub.id;

                  let color = '#6366f1';
                  if (isPickup) color = '#10b981'; // Green for Pickup
                  else if (isDropoff) color = '#f43f5e'; // Red for Dropoff
                  else if (hub.isAirport) color = '#3b82f6'; // Blue for Airports

                  return (
                    <g
                      key={hub.id}
                      onClick={() => setSelectedHub(hub)}
                      className="cursor-pointer group"
                    >
                      {/* Pulse Circle for High Surge or Selected */}
                      {(hub.surgeMultiplier >= 2.0 || isPickup || isDropoff) && (
                        <circle cx={hub.x} cy={hub.y} r="3.5" fill={color} fillOpacity="0.25">
                          <animate attributeName="r" values="2;4.5;2" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="fill-opacity" values="0.4;0.05;0.4" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* Main Node Point */}
                      <circle
                        cx={hub.x}
                        cy={hub.y}
                        r={isSelected ? "2.2" : "1.6"}
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth="0.4"
                        filter="url(#glow)"
                      />

                      {/* Pickup / Dropoff Badge Labels */}
                      {isPickup && (
                        <text x={hub.x} y={hub.y - 3} textAnchor="middle" fill="#10b981" fontSize="2.2" fontWeight="bold">
                          ORIGIN
                        </text>
                      )}
                      {isDropoff && (
                        <text x={hub.x} y={hub.y - 3} textAnchor="middle" fill="#f43f5e" fontSize="2.2" fontWeight="bold">
                          DESTINATION
                        </text>
                      )}

                      {/* Hub Label */}
                      <text
                        x={hub.x}
                        y={hub.y + 3.8}
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize="2.0"
                        fontWeight="bold"
                        className="pointer-events-none group-hover:fill-white"
                      >
                        {hub.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* OVERLAY MAP LEGEND & ACTIVE CORRIDOR CARD */}
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1 z-10 max-w-xs">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 font-bold text-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Active Route Corridor</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">${estimatedFare}</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-semibold">From: {pickupHub.name}</span>
                    <button
                      onClick={() => { setPickupHubId(selectedHub.id); }}
                      className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
                    >
                      Set Selected
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-rose-400 font-semibold">To: {dropoffHub.name}</span>
                    <button
                      onClick={() => { setDropoffHubId(selectedHub.id); }}
                      className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer"
                    >
                      Set Selected
                    </button>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80">
                    <span>Distance: <b>{estimatedCorridorMiles.toFixed(1)} mi</b></span>
                    <span>Est Time: <b>{estimatedTimeMins} mins</b></span>
                  </div>
                </div>
              </div>

              {/* MAP BOTTOM LEGEND */}
              <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur border border-slate-800 p-2.5 rounded-xl text-[10px] text-slate-300 flex items-center gap-3 z-10">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Pickup Node</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Dropoff Node</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Airport Hub</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Hub & Route Corridor Estimator (1 Col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Selected Node Performance</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-100 text-sm">{selectedHub.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {selectedHub.zoneCode}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">{selectedHub.borough} Borough • {selectedHub.type}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block">Volume Share</span>
                  <span className="text-lg font-black text-indigo-400">{selectedHub.volumeShare}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block">Surge Index</span>
                  <span className="text-lg font-black text-rose-400">{selectedHub.surgeMultiplier}x</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setPickupHubId(selectedHub.id)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Set as Origin
                </button>
                <button
                  onClick={() => setDropoffHubId(selectedHub.id)}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Set as Destination
                </button>
              </div>
            </div>
          </div>

          {/* Route Corridor Estimator */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Route Corridor Estimator</span>
            </h3>

            <div className="space-y-2">
              <div>
                <label className="text-slate-400 text-[11px] font-medium block mb-1">Origin Node:</label>
                <select
                  value={pickupHubId}
                  onChange={(e) => setPickupHubId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  {NYC_HUBS.map(h => <option key={h.id} value={h.id}>{h.name} ({h.borough})</option>)}
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] font-medium block mb-1">Destination Node:</label>
                <select
                  value={dropoffHubId}
                  onChange={(e) => setDropoffHubId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  {NYC_HUBS.map(h => <option key={h.id} value={h.id}>{h.name} ({h.borough})</option>)}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1 mt-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Estimated Corridor Cost</span>
                <span className="text-2xl font-black text-emerald-400">${estimatedFare}</span>
                <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 pt-1">
                  <span>Distance: <b>~{estimatedCorridorMiles.toFixed(1)} mi</b></span>
                  <span>Est Time: <b>~{estimatedTimeMins} mins</b></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stream Table Ticker */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Live TLC Trip Stream Ticker</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Streaming Active
            </span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            Stream Revenue: <b className="text-emerald-400">${totalStreamRevenue.toFixed(2)}</b> ({trips.length} Events)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <th className="p-3">Time</th>
                <th className="p-3">Trip ID</th>
                <th className="p-3">Pickup Zone</th>
                <th className="p-3">Dropoff Zone</th>
                <th className="p-3">Distance</th>
                <th className="p-3">Surge</th>
                <th className="p-3">Fare Yield</th>
                <th className="p-3">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {trips.map((t, idx) => (
                <tr key={t.id + idx} className={`hover:bg-slate-800/40 transition-colors ${idx === 0 ? 'bg-indigo-500/5' : ''}`}>
                  <td className="p-3 font-mono text-slate-400 text-[11px]">{t.time}</td>
                  <td className="p-3 font-mono font-bold text-slate-200">{t.id}</td>
                  <td className="p-3 font-semibold text-slate-200">{t.pickup}</td>
                  <td className="p-3 font-semibold text-slate-300">{t.dropoff}</td>
                  <td className="p-3 text-slate-400">{t.distanceMiles} mi</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      t.surgeMultiplier >= 2.0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {t.surgeMultiplier}x
                    </span>
                  </td>
                  <td className="p-3 font-bold text-emerald-400">${t.fare.toFixed(2)}</td>
                  <td className="p-3 text-slate-400">{t.paymentType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
