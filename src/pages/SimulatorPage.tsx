import React, { useState, useEffect } from 'react';
import { Play, Pause, Zap, Activity, RefreshCw, Car, Flame, ArrowUpRight, CheckCircle2, Shield } from 'lucide-react';

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

const LOCATIONS = ['JFK Airport', 'Midtown Manhattan', 'LaGuardia Airport', 'Financial District', 'Downtown Brooklyn', 'Upper East Side', 'Astoria'];

export const SimulatorPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);
  const [trips, setTrips] = useState<SimulatedTrip[]>([]);
  const [surgeMultipliers, setSurgeMultipliers] = useState({
    manhattan: 2.4,
    brooklyn: 1.5,
    queens: 1.8,
    jfk: 2.8,
  });

  // Generate initial stream data
  useEffect(() => {
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

  const totalStreamRevenue = trips.reduce((acc, t) => acc + t.fare, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
              <Zap className="w-4 h-4 animate-bounce" />
            </span>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Real-time Event Stream Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Live TLC Trip Stream & Surge Simulator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Simulate real-time NYC ride-hailing request streams, live surge multiplier spikes across boroughs, and streaming revenue calculations.
          </p>
        </div>

        {/* Controls */}
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

      {/* Surge Heat Index Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Manhattan Surge</span>
          <div className="text-xl font-black text-rose-400">{surgeMultipliers.manhattan}x</div>
          <span className="text-[10px] text-slate-500">Midtown & Wall St</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">JFK Airport Surge</span>
          <div className="text-xl font-black text-indigo-400">{surgeMultipliers.jfk}x</div>
          <span className="text-[10px] text-slate-500">Flat Rate + Surge</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Brooklyn Surge</span>
          <div className="text-xl font-black text-emerald-400">{surgeMultipliers.brooklyn}x</div>
          <span className="text-[10px] text-slate-500">DUMBO & Williamsburg</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Queens & LGA</span>
          <div className="text-xl font-black text-amber-400">{surgeMultipliers.queens}x</div>
          <span className="text-[10px] text-slate-500">Astoria & LaGuardia</span>
        </div>
      </div>

      {/* Stream Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Live Trip Stream Ticker</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Streaming Active
            </span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            Stream Volume: <b className="text-emerald-400">${totalStreamRevenue.toFixed(2)}</b> ({trips.length} Events)
          </span>
        </div>

        {/* Table */}
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
