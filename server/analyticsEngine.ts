import { DataRecord, DatasetMetadata } from './types';

export interface KPIOverview {
  totalTrips: number;
  avgFare: number;
  totalRevenue: number;
  avgDistance: number;
  avgPassengers: number;
  peakHour: string;
  busiestLocation: string;
  avgTip: number;
}

export interface MonthlyTrendItem {
  month: string;
  monthName: string;
  trips: number;
  revenue: number;
  avgFare: number;
}

export interface LocationStatItem {
  location: string;
  trips: number;
  revenue: number;
  percentage: number;
}

export interface HourlyStatItem {
  hour: number;
  hourLabel: string;
  trips: number;
  avgFare: number;
}

export interface WeekdayStatItem {
  type: 'Weekday' | 'Weekend';
  trips: number;
  avgFare: number;
  totalRevenue: number;
}

export class AnalyticsEngine {
  public static calculateKPIs(records: DataRecord[], metadata: DatasetMetadata): KPIOverview {
    if (!records || records.length === 0) {
      return {
        totalTrips: 0,
        avgFare: 0,
        totalRevenue: 0,
        avgDistance: 0,
        avgPassengers: 0,
        peakHour: 'N/A',
        busiestLocation: 'N/A',
        avgTip: 0
      };
    }

    const totalTrips = records.length;
    const fareCol = metadata.schemaMapping['fare'] || 'fare_amount';
    const distCol = metadata.schemaMapping['distance'] || 'trip_distance';
    const paxCol = metadata.schemaMapping['passenger_count'] || 'passenger_count';
    const locCol = metadata.schemaMapping['pickup_location'] || 'pickup_location';
    const dateCol = metadata.schemaMapping['datetime'] || 'pickup_datetime';

    // Fares
    const validFares = records.map(r => Number(r[fareCol])).filter(f => !isNaN(f) && f >= 0);
    const totalRevenue = validFares.reduce((a, b) => a + b, 0);
    const avgFare = validFares.length > 0 ? totalRevenue / validFares.length : 0;

    // Distance
    const validDist = records.map(r => Number(r[distCol])).filter(d => !isNaN(d) && d >= 0);
    const avgDistance = validDist.length > 0 ? validDist.reduce((a, b) => a + b, 0) / validDist.length : 0;

    // Passengers
    const validPax = records.map(r => Number(r[paxCol])).filter(p => !isNaN(p) && p > 0);
    const avgPassengers = validPax.length > 0 ? validPax.reduce((a, b) => a + b, 0) / validPax.length : 1;

    // Tips
    const validTips = records.map(r => Number(r.tip_amount)).filter(t => !isNaN(t) && t >= 0);
    const avgTip = validTips.length > 0 ? validTips.reduce((a, b) => a + b, 0) / validTips.length : 0;

    // Busiest location
    const locCounts: Record<string, number> = {};
    records.forEach(r => {
      const loc = r[locCol] || 'Unknown';
      locCounts[loc] = (locCounts[loc] || 0) + 1;
    });
    const busiestLocation = Object.entries(locCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Peak Hour
    const hourCounts: Record<number, number> = {};
    records.forEach(r => {
      const dtStr = r[dateCol];
      if (dtStr) {
        const h = new Date(dtStr).getHours();
        if (!isNaN(h)) hourCounts[h] = (hourCounts[h] || 0) + 1;
      }
    });
    const topHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    const peakHour = topHour ? `${String(topHour[0]).padStart(2, '0')}:00` : '18:00';

    return {
      totalTrips,
      avgFare: Number(avgFare.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      avgDistance: Number(avgDistance.toFixed(2)),
      avgPassengers: Number(avgPassengers.toFixed(1)),
      peakHour,
      busiestLocation,
      avgTip: Number(avgTip.toFixed(2))
    };
  }

  public static getMonthlyTrend(records: DataRecord[], metadata: DatasetMetadata): MonthlyTrendItem[] {
    const dateCol = metadata.schemaMapping['datetime'] || 'pickup_datetime';
    const fareCol = metadata.schemaMapping['fare'] || 'fare_amount';

    const monthMap: Record<string, { trips: number; revenue: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    records.forEach(r => {
      const dt = r[dateCol];
      if (dt) {
        const d = new Date(dt);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (!monthMap[key]) monthMap[key] = { trips: 0, revenue: 0 };
          monthMap[key].trips++;
          const fare = Number(r[fareCol]);
          if (!isNaN(fare) && fare > 0) monthMap[key].revenue += fare;
        }
      }
    });

    const result = Object.entries(monthMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([monthKey, stat]) => {
        const mIdx = parseInt(monthKey.split('-')[1], 10) - 1;
        return {
          month: monthKey,
          monthName: monthNames[mIdx] || monthKey,
          trips: stat.trips,
          revenue: Number(stat.revenue.toFixed(2)),
          avgFare: Number((stat.trips > 0 ? stat.revenue / stat.trips : 0).toFixed(2))
        };
      });

    return result;
  }

  public static getTopLocations(records: DataRecord[], metadata: DatasetMetadata, limit = 8): LocationStatItem[] {
    const locCol = metadata.schemaMapping['pickup_location'] || 'pickup_location';
    const fareCol = metadata.schemaMapping['fare'] || 'fare_amount';

    const locMap: Record<string, { trips: number; revenue: number }> = {};
    const total = records.length;

    records.forEach(r => {
      const loc = String(r[locCol] || 'Other');
      if (!locMap[loc]) locMap[loc] = { trips: 0, revenue: 0 };
      locMap[loc].trips++;
      const fare = Number(r[fareCol]);
      if (!isNaN(fare) && fare > 0) locMap[loc].revenue += fare;
    });

    return Object.entries(locMap)
      .sort((a, b) => b[1].trips - a[1].trips)
      .slice(0, limit)
      .map(([loc, stat]) => ({
        location: loc,
        trips: stat.trips,
        revenue: Number(stat.revenue.toFixed(2)),
        percentage: Number(((stat.trips / total) * 100).toFixed(1))
      }));
  }

  public static getHourlyDistribution(records: DataRecord[], metadata: DatasetMetadata): HourlyStatItem[] {
    const dateCol = metadata.schemaMapping['datetime'] || 'pickup_datetime';
    const fareCol = metadata.schemaMapping['fare'] || 'fare_amount';

    const hourStats: Record<number, { trips: number; revenue: number }> = {};
    for (let h = 0; h < 24; h++) hourStats[h] = { trips: 0, revenue: 0 };

    records.forEach(r => {
      const dt = r[dateCol];
      if (dt) {
        const h = new Date(dt).getHours();
        if (!isNaN(h) && h >= 0 && h < 24) {
          hourStats[h].trips++;
          const fare = Number(r[fareCol]);
          if (!isNaN(fare) && fare > 0) hourStats[h].revenue += fare;
        }
      }
    });

    return Object.entries(hourStats).map(([hStr, stat]) => {
      const h = parseInt(hStr, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      return {
        hour: h,
        hourLabel: `${displayHour} ${ampm}`,
        trips: stat.trips,
        avgFare: Number((stat.trips > 0 ? stat.revenue / stat.trips : 0).toFixed(2))
      };
    });
  }

  public static getWeekdayVsWeekend(records: DataRecord[], metadata: DatasetMetadata): WeekdayStatItem[] {
    const dateCol = metadata.schemaMapping['datetime'] || 'pickup_datetime';
    const fareCol = metadata.schemaMapping['fare'] || 'fare_amount';

    const stats = {
      Weekday: { trips: 0, revenue: 0 },
      Weekend: { trips: 0, revenue: 0 }
    };

    records.forEach(r => {
      const dt = r[dateCol];
      if (dt) {
        const day = new Date(dt).getDay(); // 0 = Sun, 6 = Sat
        const type = (day === 0 || day === 6) ? 'Weekend' : 'Weekday';
        stats[type].trips++;
        const fare = Number(r[fareCol]);
        if (!isNaN(fare) && fare > 0) stats[type].revenue += fare;
      }
    });

    return [
      {
        type: 'Weekday',
        trips: stats.Weekday.trips,
        totalRevenue: Number(stats.Weekday.revenue.toFixed(2)),
        avgFare: Number((stats.Weekday.trips > 0 ? stats.Weekday.revenue / stats.Weekday.trips : 0).toFixed(2))
      },
      {
        type: 'Weekend',
        trips: stats.Weekend.trips,
        totalRevenue: Number(stats.Weekend.revenue.toFixed(2)),
        avgFare: Number((stats.Weekend.trips > 0 ? stats.Weekend.revenue / stats.Weekend.trips : 0).toFixed(2))
      }
    ];
  }

  public static computeCorrelations(records: DataRecord[], metadata: DatasetMetadata) {
    const numericCols = metadata.columns.filter(c => c.type === 'number').map(c => c.name);
    const correlations: { pair: string; correlation: number }[] = [];

    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const colA = numericCols[i];
        const colB = numericCols[j];

        const pairs: [number, number][] = [];
        records.forEach(r => {
          const valA = Number(r[colA]);
          const valB = Number(r[colB]);
          if (!isNaN(valA) && !isNaN(valB)) pairs.push([valA, valB]);
        });

        if (pairs.length > 5) {
          const meanA = pairs.reduce((acc, p) => acc + p[0], 0) / pairs.length;
          const meanB = pairs.reduce((acc, p) => acc + p[1], 0) / pairs.length;

          let num = 0, denA = 0, denB = 0;
          pairs.forEach(p => {
            const diffA = p[0] - meanA;
            const diffB = p[1] - meanB;
            num += diffA * diffB;
            denA += diffA * diffA;
            denB += diffB * diffB;
          });

          const den = Math.sqrt(denA * denB);
          const rVal = den > 0 ? num / den : 0;
          correlations.push({
            pair: `${colA} vs ${colB}`,
            correlation: Number(rVal.toFixed(3))
          });
        }
      }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }
}
