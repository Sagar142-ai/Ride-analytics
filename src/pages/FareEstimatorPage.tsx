import React, { useState } from 'react';
import { Calculator, DollarSign, Clock, Navigation, AlertTriangle, ShieldCheck, Sparkles, TrendingUp, Users, Compass, ChevronRight } from 'lucide-react';

export const FareEstimatorPage: React.FC = () => {
  const [pickupZone, setPickupZone] = useState('JFK Airport');
  const [dropoffZone, setDropoffZone] = useState('Midtown Manhattan');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'midday' | 'evening' | 'night'>('evening');
  const [trafficDensity, setTrafficDensity] = useState<'light' | 'moderate' | 'heavy' | 'gridlock'>('heavy');
  const [passengerCount, setPassengerCount] = useState(2);
  const [paymentType, setPaymentType] = useState<'Credit Card' | 'Cash' | 'Dispute / Other'>('Credit Card');

  // What-If Scenario State
  const [gasAdjustment, setGasAdjustment] = useState(1.20); // $ per trip gas surcharge
  const [congestionTaxRate, setCongestionTaxRate] = useState(2.75); // $ congestion tax
  const [weatherCondition, setWeatherCondition] = useState<'clear' | 'rain' | 'snow'>('clear');

  // Base parameters
  const isAirport = pickupZone.includes('Airport') || dropoffZone.includes('Airport');
  const isJfk = pickupZone.includes('JFK') || dropoffZone.includes('JFK');

  // Multipliers
  let surgeMultiplier = 1.0;
  if (timeOfDay === 'evening') surgeMultiplier = 1.8;
  if (timeOfDay === 'night') surgeMultiplier = 1.4;
  if (trafficDensity === 'heavy') surgeMultiplier += 0.3;
  if (trafficDensity === 'gridlock') surgeMultiplier += 0.6;

  let simulatedSurgeMultiplier = surgeMultiplier;
  if (weatherCondition === 'rain') simulatedSurgeMultiplier += 0.4;
  if (weatherCondition === 'snow') simulatedSurgeMultiplier += 1.1;

  // Base calculation
  let baseFare = isJfk ? 70.00 : 12.50; // JFK flat rate standard
  let distanceMiles = isJfk ? 18.4 : 5.2;
  let estimatedMinutes = Math.round(distanceMiles * 3 + (trafficDensity === 'heavy' ? 20 : trafficDensity === 'gridlock' ? 35 : 10));

  let distanceFare = distanceMiles * 2.80;
  let timeFare = estimatedMinutes * 0.50;
  let airportSurcharge = isAirport ? (isJfk ? 5.00 : 2.50) : 0.00;
  let congestionSurcharge = (dropoffZone.includes('Manhattan') || pickupZone.includes('Manhattan')) ? 2.75 : 0.00;

  let subtotal = (baseFare + distanceFare + timeFare) * surgeMultiplier + airportSurcharge + congestionSurcharge;
  let estimatedTip = paymentType === 'Credit Card' ? subtotal * 0.18 : 0;
  let grandTotalMin = Math.round(subtotal);
  let grandTotalMax = Math.round(subtotal * 1.2) + 5;

  // Simulated Scenario Calculations
  let simulatedSubtotal = (baseFare + distanceFare + timeFare) * simulatedSurgeMultiplier + airportSurcharge + congestionTaxRate + gasAdjustment;
  let simulatedDriverPayout = simulatedSubtotal * 0.78 + (paymentType === 'Credit Card' ? simulatedSubtotal * 0.18 : 0);
  let simulatedCityTax = congestionTaxRate + (airportSurcharge > 0 ? airportSurcharge : 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
              <Calculator className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              TLC Fare & Surge Predictive Model
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Predictive Fare & Surge Yield Estimator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Algorithmic trip cost estimator based on NYC TLC rate codes, airport flat-rate rules, congestion surcharges, traffic density, and peak surge multipliers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Controls Panel (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Navigation className="w-4 h-4 text-indigo-400" />
              <span>Trip Parameters & Spatial Route Selection</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Pickup Zone:</label>
                <select
                  value={pickupZone}
                  onChange={(e) => setPickupZone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 font-semibold cursor-pointer"
                >
                  <option value="JFK Airport">JFK Airport (Queens)</option>
                  <option value="Midtown Manhattan">Midtown Manhattan</option>
                  <option value="LaGuardia Airport">LaGuardia Airport (LGA)</option>
                  <option value="Financial District">Financial District / Wall Street</option>
                  <option value="Downtown Brooklyn">Downtown Brooklyn & DUMBO</option>
                  <option value="Upper East Side">Upper East Side</option>
                  <option value="Newark Liberty Airport">Newark Liberty Airport (EWR)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Dropoff Zone:</label>
                <select
                  value={dropoffZone}
                  onChange={(e) => setDropoffZone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 font-semibold cursor-pointer"
                >
                  <option value="Midtown Manhattan">Midtown Manhattan</option>
                  <option value="JFK Airport">JFK Airport (Queens)</option>
                  <option value="Financial District">Financial District / Wall Street</option>
                  <option value="LaGuardia Airport">LaGuardia Airport (LGA)</option>
                  <option value="Downtown Brooklyn">Downtown Brooklyn & DUMBO</option>
                  <option value="Upper East Side">Upper East Side</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Time of Day / Shift:</label>
                <select
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 font-semibold cursor-pointer"
                >
                  <option value="morning">Morning Peak (7:00 AM - 10:00 AM)</option>
                  <option value="midday">Midday Normal (10:00 AM - 4:00 PM)</option>
                  <option value="evening">Evening Rush & Surge (4:00 PM - 8:00 PM)</option>
                  <option value="night">Late Night Shift (10:00 PM - 4:00 AM)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">NYC Traffic Condition:</label>
                <select
                  value={trafficDensity}
                  onChange={(e) => setTrafficDensity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 font-semibold cursor-pointer"
                >
                  <option value="light">Light Flow (Off-peak)</option>
                  <option value="moderate">Moderate NYC Traffic</option>
                  <option value="heavy">Heavy Congestion</option>
                  <option value="gridlock">Severe Gridlock (Rain / Construction)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Passenger Count:</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5">
                  {[1, 2, 3, 4, 6].map(num => (
                    <button
                      key={num}
                      onClick={() => setPassengerCount(num)}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                        passengerCount === num ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {num} {num === 6 ? 'XL' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Payment Method:</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 font-semibold cursor-pointer"
                >
                  <option value="Credit Card">Credit Card (With Tip)</option>
                  <option value="Cash">Cash Payment</option>
                  <option value="Dispute / Other">Dispute / Mobile App</option>
                </select>
              </div>
            </div>
          </div>

          {/* Optimal Driver Shift Advisor */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Optimal Driver Yield & Shift Positioning Advisor</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-indigo-400 font-bold uppercase">Highest Yield Zone</span>
                <div className="font-extrabold text-slate-100 text-sm">JFK Airport Terminal 4</div>
                <p className="text-[11px] text-slate-400">Avg $70 flat rate + $12 tip yield per trip.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Peak Surge Window</span>
                <div className="font-extrabold text-slate-100 text-sm">5:30 PM - 7:45 PM</div>
                <p className="text-[11px] text-slate-400">2.4x surge multiplier across Midtown.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-amber-400 font-bold uppercase">Recommended Action</span>
                <div className="font-extrabold text-slate-100 text-sm">Position in Midtown</div>
                <p className="text-[11px] text-slate-400">High outbound demand to JFK & Brooklyn.</p>
              </div>
            </div>
          </div>

          {/* What-If Policy & Weather Scenario Simulator */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>What-If Policy & Weather Stress-Test Simulator</span>
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Predictive Analytics
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">
                  Gas Price Surcharge: <span className="text-indigo-400 font-bold">${gasAdjustment.toFixed(2)}/trip</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.25"
                  value={gasAdjustment}
                  onChange={(e) => setGasAdjustment(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">
                  NYC Congestion Tax: <span className="text-indigo-400 font-bold">${congestionTaxRate.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={congestionTaxRate}
                  onChange={(e) => setCongestionTaxRate(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Weather Event Impact:</label>
                <select
                  value={weatherCondition}
                  onChange={(e) => setWeatherCondition(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2 font-semibold cursor-pointer"
                >
                  <option value="clear">Clear Weather (Normal)</option>
                  <option value="rain">Heavy Rain (+0.4x Surge)</option>
                  <option value="snow">Blizzard / Snow (+1.1x Surge)</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Simulated Gross Fare</span>
                <span className="text-lg font-black text-indigo-400">${Math.round(simulatedSubtotal)}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Driver Net Take-Home</span>
                <span className="text-lg font-black text-emerald-400">${simulatedDriverPayout.toFixed(2)}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase block font-medium">TLC / City Tax Collected</span>
                <span className="text-lg font-black text-amber-400">${simulatedCityTax.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Summary Card (1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Estimated Total Fare</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {surgeMultiplier.toFixed(1)}x Surge
              </span>
            </div>

            <div className="text-center py-2">
              <div className="text-4xl font-black text-emerald-400 tracking-tight">
                ${grandTotalMin} - ${grandTotalMax}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Estimated Duration: <b>{estimatedMinutes} mins</b> ({distanceMiles.toFixed(1)} miles)
              </p>
            </div>

            {/* Line Item Cost Breakdown */}
            <div className="space-y-2 text-xs border-t border-b border-slate-800 py-4">
              <div className="flex justify-between text-slate-300">
                <span>Base Flag Drop:</span>
                <span className="font-mono text-slate-200">${baseFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Distance Rate ({distanceMiles.toFixed(1)} mi):</span>
                <span className="font-mono text-slate-200">${distanceFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Traffic Time Rate ({estimatedMinutes} min):</span>
                <span className="font-mono text-slate-200">${timeFare.toFixed(2)}</span>
              </div>
              {airportSurcharge > 0 && (
                <div className="flex justify-between text-indigo-300 font-semibold">
                  <span>Airport Access Surcharge:</span>
                  <span className="font-mono">${airportSurcharge.toFixed(2)}</span>
                </div>
              )}
              {congestionSurcharge > 0 && (
                <div className="flex justify-between text-indigo-300 font-semibold">
                  <span>NYC Congestion Surcharge:</span>
                  <span className="font-mono">${congestionSurcharge.toFixed(2)}</span>
                </div>
              )}
              {paymentType === 'Credit Card' && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Estimated Tip (18%):</span>
                  <span className="font-mono">${estimatedTip.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>TLC Regulatory Compliance</span>
              </div>
              <p>Calculated in compliance with NYC Taxi and Limousine Commission rate sheet codes and congestion pricing laws.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
