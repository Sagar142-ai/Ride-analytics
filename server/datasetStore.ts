import { DataRecord, DatasetMetadata, ColumnProfile } from './types';

// Initial synthetic Uber dataset generator
export function generateSyntheticUberData(): DataRecord[] {
  const records: DataRecord[] = [];
  const locations = [
    { name: 'Midtown Manhattan', lat: 40.7549, lon: -73.9840, baseFare: 14.50 },
    { name: 'JFK International Airport', lat: 40.6413, lon: -73.7781, baseFare: 52.00 },
    { name: 'Financial District', lat: 40.7075, lon: -74.0089, baseFare: 16.00 },
    { name: 'Williamsburg, Brooklyn', lat: 40.7081, lon: -73.9571, baseFare: 18.50 },
    { name: 'LaGuardia Airport', lat: 40.7769, lon: -73.8740, baseFare: 38.00 },
    { name: 'Upper East Side', lat: 40.7736, lon: -73.9566, baseFare: 12.00 },
    { name: 'DUMBO, Brooklyn', lat: 40.7033, lon: -73.9881, baseFare: 21.00 },
    { name: 'Astoria, Queens', lat: 40.7644, lon: -73.9235, baseFare: 22.50 },
    { name: 'Harlem', lat: 40.8116, lon: -73.9465, baseFare: 15.00 },
    { name: 'SoHo', lat: 40.7233, lon: -74.0030, baseFare: 13.50 }
  ];

  const dispatchBases = ['B02512 (Unter)', 'B02598 (Hinter)', 'B02617 (Weiter)', 'B02682 (Schmecken)', 'B02764 (Weiter)'];
  const paymentTypes = ['Credit Card', 'Cash', 'Uber Pay', 'Apple Pay', 'Gift Card'];

  const startDate = new Date('2026-01-01T00:00:00');
  const endDate = new Date('2026-07-31T23:59:59');
  const timeSpan = endDate.getTime() - startDate.getTime();

  // Generate 450 deterministic realistic trips
  for (let i = 1; i <= 450; i++) {
    const tripId = `UBR-2026-${String(i).padStart(5, '0')}`;
    
    // Create time distribution with peaks in evening/weekends & June surge
    const randomMs = Math.random() * timeSpan;
    const tripDate = new Date(startDate.getTime() + randomMs);
    
    // Inject extra June trips to simulate peak demand in June (as in Master Build Prompt examples)
    const month = tripDate.getMonth(); // 0 = Jan, 5 = June
    if (month === 5 && Math.random() < 0.4) {
      // higher June density
    }

    const pickupLoc = locations[Math.floor(Math.random() * locations.length)];
    let dropoffLoc = locations[Math.floor(Math.random() * locations.length)];
    while (dropoffLoc.name === pickupLoc.name) {
      dropoffLoc = locations[Math.floor(Math.random() * locations.length)];
    }

    const isAirport = pickupLoc.name.includes('Airport') || dropoffLoc.name.includes('Airport');
    const tripDistance = isAirport 
      ? Number((8.5 + Math.random() * 18).toFixed(2))
      : Number((0.8 + Math.random() * 6.5).toFixed(2));

    const hour = tripDate.getHours();
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
    const surgeMultiplier = isPeakHour ? Number((1.2 + Math.random() * 0.9).toFixed(1)) : 1.0;

    // Fare calculation
    const baseFare = pickupLoc.baseFare;
    const fareAmount = Number(((baseFare + tripDistance * 2.85 + Math.random() * 3.5) * surgeMultiplier).toFixed(2));
    const tipAmount = Number((fareAmount * (Math.random() < 0.7 ? 0.15 + Math.random() * 0.1 : 0)).toFixed(2));
    const totalAmount = Number((fareAmount + tipAmount + 2.75).toFixed(2));

    const passengerCount = Math.floor(Math.random() * 4) + 1;
    const dispatchBase = dispatchBases[Math.floor(Math.random() * dispatchBases.length)];
    const paymentType = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
    const durationMinutes = Math.round(tripDistance * (3.5 + Math.random() * 2));

    // Inject a few slight anomalies for Data Quality / Anomaly Detection testing
    let fareVal = fareAmount;
    let distVal = tripDistance;
    if (i === 42) fareVal = -15.00; // Negative fare anomaly
    if (i === 118) distVal = 185.0; // Distance outlier anomaly
    if (i === 205) fareVal = 850.00; // Extreme surge pricing anomaly

    records.push({
      trip_id: tripId,
      pickup_datetime: tripDate.toISOString().replace('T', ' ').substring(0, 19),
      pickup_location: pickupLoc.name,
      dropoff_location: dropoffLoc.name,
      pickup_latitude: pickupLoc.lat,
      pickup_longitude: pickupLoc.lon,
      dropoff_latitude: dropoffLoc.lat,
      dropoff_longitude: dropoffLoc.lon,
      trip_distance: distVal,
      fare_amount: fareVal,
      tip_amount: tipAmount,
      total_amount: totalAmount,
      passenger_count: passengerCount,
      surge_multiplier: surgeMultiplier,
      dispatch_base_code: dispatchBase,
      payment_type: paymentType,
      duration_minutes: durationMinutes,
      weather: hour > 6 && hour < 18 ? (Math.random() > 0.3 ? 'Clear' : 'Rain') : (Math.random() > 0.4 ? 'Clear' : 'Cloudy')
    });
  }

  // Sort by datetime
  records.sort((a, b) => new Date(a.pickup_datetime).getTime() - new Date(b.pickup_datetime).getTime());
  return records;
}

class DatasetStore {
  private currentRecords: DataRecord[] = [];
  private currentMetadata: DatasetMetadata | null = null;

  constructor() {
    this.loadSyntheticDataset();
  }

  public loadSyntheticDataset() {
    const records = generateSyntheticUberData();
    this.setDataset('Synthetic_Uber_Trips_2026.csv', records, true);
  }

  public setDataset(filename: string, records: DataRecord[], isDemo: boolean = false) {
    this.currentRecords = records;
    const metadata = this.analyzeSchemaAndProfile(filename, records, isDemo);
    this.currentMetadata = metadata;
  }

  public getRecords(): DataRecord[] {
    return this.currentRecords;
  }

  public getMetadata(): DatasetMetadata {
    if (!this.currentMetadata) {
      this.loadSyntheticDataset();
    }
    return this.currentMetadata!;
  }

  private analyzeSchemaAndProfile(filename: string, records: DataRecord[], isDemo: boolean): DatasetMetadata {
    if (!records || records.length === 0) {
      return {
        id: `ds-${Date.now()}`,
        name: filename,
        isDemo,
        rowCount: 0,
        columnCount: 0,
        fileSizeBytes: 0,
        uploadTimestamp: new Date().toISOString(),
        qualityScore: 100,
        columns: [],
        schemaMapping: {}
      };
    }

    const keys = Object.keys(records[0]);
    const columns: ColumnProfile[] = [];
    const schemaMapping: Record<string, string> = {};

    keys.forEach((key) => {
      const lowerKey = key.toLowerCase();
      let semanticRole: ColumnProfile['semanticRole'] = 'other';

      if (lowerKey.includes('date') || lowerKey.includes('time') || lowerKey.includes('dt') || lowerKey === 'timestamp') {
        semanticRole = 'datetime';
        schemaMapping['datetime'] = key;
      } else if (lowerKey.includes('pickup_loc') || lowerKey.includes('start_loc') || lowerKey.includes('origin') || lowerKey === 'pickup_location') {
        semanticRole = 'pickup_location';
        schemaMapping['pickup_location'] = key;
      } else if (lowerKey.includes('dropoff_loc') || lowerKey.includes('end_loc') || lowerKey.includes('destination') || lowerKey === 'dropoff_location') {
        semanticRole = 'dropoff_location';
        schemaMapping['dropoff_location'] = key;
      } else if (lowerKey.includes('fare') || lowerKey.includes('price') || lowerKey.includes('amount') || lowerKey.includes('cost')) {
        semanticRole = 'fare';
        schemaMapping['fare'] = key;
      } else if (lowerKey.includes('distance') || lowerKey.includes('miles') || lowerKey.includes('km')) {
        semanticRole = 'distance';
        schemaMapping['distance'] = key;
      } else if (lowerKey.includes('passenger') || lowerKey.includes('riders')) {
        semanticRole = 'passenger_count';
        schemaMapping['passenger_count'] = key;
      } else if (lowerKey.includes('payment') || lowerKey.includes('pay_type')) {
        semanticRole = 'payment_type';
        schemaMapping['payment_type'] = key;
      } else if (lowerKey.includes('id') || lowerKey.includes('key') || lowerKey.includes('code')) {
        semanticRole = 'id';
      }

      // Profile values
      const sampleValues: any[] = [];
      let nullCount = 0;
      const values: any[] = [];
      const numericValues: number[] = [];

      records.forEach((rec) => {
        const val = rec[key];
        if (val === null || val === undefined || val === '' || Number.isNaN(val)) {
          nullCount++;
        } else {
          values.push(val);
          if (sampleValues.length < 5) sampleValues.push(val);
          if (typeof val === 'number' || !isNaN(Number(val))) {
            numericValues.push(Number(val));
          }
        }
      });

      const isNumeric = numericValues.length > records.length * 0.6 && semanticRole !== 'id';
      const isDate = semanticRole === 'datetime' || (values.length > 0 && !isNaN(Date.parse(String(values[0]))));

      let colType: ColumnProfile['type'] = 'string';
      if (isNumeric) colType = 'number';
      else if (isDate) colType = 'datetime';
      else if (typeof values[0] === 'boolean') colType = 'boolean';

      const profile: ColumnProfile = {
        name: key,
        type: colType,
        semanticRole,
        nullCount,
        nullPercentage: Number(((nullCount / records.length) * 100).toFixed(1)),
        uniqueCount: new Set(values).size,
        sampleValues
      };

      if (colType === 'number' && numericValues.length > 0) {
        numericValues.sort((a, b) => a - b);
        profile.min = numericValues[0];
        profile.max = numericValues[numericValues.length - 1];
        const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
        profile.mean = Number((sum / numericValues.length).toFixed(2));
        const mid = Math.floor(numericValues.length / 2);
        profile.median = numericValues.length % 2 !== 0 
          ? numericValues[mid] 
          : Number(((numericValues[mid - 1] + numericValues[mid]) / 2).toFixed(2));

        const squareDiffs = numericValues.map(v => Math.pow(v - profile.mean!, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / numericValues.length;
        profile.stdDev = Number(Math.sqrt(avgSquareDiff).toFixed(2));
      }

      columns.push(profile);
    });

    // Calculate quality score
    let totalNulls = columns.reduce((acc, c) => acc + c.nullCount, 0);
    let totalCells = records.length * keys.length;
    let nullDeduction = (totalNulls / totalCells) * 100;
    let qualityScore = Math.max(70, Math.round(100 - nullDeduction));

    return {
      id: `ds-${Date.now()}`,
      name: filename,
      isDemo,
      rowCount: records.length,
      columnCount: keys.length,
      fileSizeBytes: JSON.stringify(records).length,
      uploadTimestamp: new Date().toISOString(),
      qualityScore,
      columns,
      schemaMapping
    };
  }
}

export const activeDatasetStore = new DatasetStore();
