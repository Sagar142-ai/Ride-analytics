import { DataRecord, DataQualityReport, QualityCheckResult, AnomalyItem, DatasetMetadata } from './types';

export class DataQualityEngine {
  public static evaluateQuality(records: DataRecord[], metadata: DatasetMetadata): DataQualityReport {
    const checks: QualityCheckResult[] = [];
    let totalDeductions = 0;

    if (!records || records.length === 0) {
      return {
        score: 0,
        status: 'Poor',
        checks: [],
        summary: 'Dataset is empty or unreadable.',
        recommendations: ['Upload a valid CSV or XLSX dataset with trip records.']
      };
    }

    // Check 1: Missing values check
    let missingCellCount = 0;
    const totalCells = records.length * metadata.columnCount;
    metadata.columns.forEach(col => missingCellCount += col.nullCount);
    const missingPct = (missingCellCount / totalCells) * 100;

    if (missingPct === 0) {
      checks.push({
        category: 'Completeness',
        check: 'Null Value Check',
        status: 'passed',
        scoreImpact: 0,
        details: '100% of data cells are fully populated with valid values.',
        affectedCount: 0
      });
    } else if (missingPct < 5) {
      const deduction = Math.round(missingPct * 1.5);
      totalDeductions += deduction;
      checks.push({
        category: 'Completeness',
        check: 'Null Value Check',
        status: 'warning',
        scoreImpact: deduction,
        details: `${missingPct.toFixed(1)}% missing cells detected across dataset columns.`,
        affectedCount: missingCellCount
      });
    } else {
      const deduction = Math.min(25, Math.round(missingPct * 2));
      totalDeductions += deduction;
      checks.push({
        category: 'Completeness',
        check: 'Null Value Check',
        status: 'failed',
        scoreImpact: deduction,
        details: `High missingness: ${missingPct.toFixed(1)}% missing values. Missing values reduce statistical precision.`,
        affectedCount: missingCellCount
      });
    }

    // Check 2: Duplicate rows check
    const serializedRows = new Set<string>();
    let duplicateCount = 0;
    records.forEach(r => {
      const s = JSON.stringify(r);
      if (serializedRows.has(s)) duplicateCount++;
      else serializedRows.add(s);
    });

    if (duplicateCount === 0) {
      checks.push({
        category: 'Uniqueness',
        check: 'Duplicate Records',
        status: 'passed',
        scoreImpact: 0,
        details: 'Zero duplicate rows detected. Every record represents a unique entry.',
        affectedCount: 0
      });
    } else {
      const deduction = Math.min(15, duplicateCount * 2);
      totalDeductions += deduction;
      checks.push({
        category: 'Uniqueness',
        check: 'Duplicate Records',
        status: 'warning',
        scoreImpact: deduction,
        details: `${duplicateCount} identical duplicate records found in dataset.`,
        affectedCount: duplicateCount
      });
    }

    // Check 3: Date validity check
    const dateCol = metadata.schemaMapping['datetime'];
    if (dateCol) {
      let invalidDateCount = 0;
      records.forEach(r => {
        const val = r[dateCol];
        if (!val || isNaN(Date.parse(String(val)))) invalidDateCount++;
      });

      if (invalidDateCount === 0) {
        checks.push({
          category: 'Validity',
          check: 'Datetime Formatting',
          status: 'passed',
          scoreImpact: 0,
          details: '100% of datetime values parse correctly into valid ISO timestamps.',
          affectedCount: 0
        });
      } else {
        const deduction = Math.min(20, invalidDateCount * 3);
        totalDeductions += deduction;
        checks.push({
          category: 'Validity',
          check: 'Datetime Formatting',
          status: 'failed',
          scoreImpact: deduction,
          details: `${invalidDateCount} records contain unparseable or corrupted datetime values.`,
          affectedCount: invalidDateCount
        });
      }
    }

    // Check 4: Fare & Numerical Sanity check (Negative or extreme zero values)
    const fareCol = metadata.schemaMapping['fare'] || 'fare_amount';
    if (records[0] && fareCol in records[0]) {
      let negativeFareCount = 0;
      records.forEach(r => {
        const val = Number(r[fareCol]);
        if (!isNaN(val) && val < 0) negativeFareCount++;
      });

      if (negativeFareCount === 0) {
        checks.push({
          category: 'Sanity',
          check: 'Fare Sanity Check',
          status: 'passed',
          scoreImpact: 0,
          details: 'All fare records contain non-negative amounts.',
          affectedCount: 0
        });
      } else {
        const deduction = Math.min(15, negativeFareCount * 3);
        totalDeductions += deduction;
        checks.push({
          category: 'Sanity',
          check: 'Fare Sanity Check',
          status: 'failed',
          scoreImpact: deduction,
          details: `${negativeFareCount} records exhibit negative fare values (e.g. invalid charge adjustments or test errors).`,
          affectedCount: negativeFareCount
        });
      }
    }

    // Check 5: Distance sanity check
    const distCol = metadata.schemaMapping['distance'] || 'trip_distance';
    if (records[0] && distCol in records[0]) {
      let extremeDistCount = 0;
      records.forEach(r => {
        const val = Number(r[distCol]);
        if (!isNaN(val) && (val > 100 || val < 0)) extremeDistCount++;
      });

      if (extremeDistCount === 0) {
        checks.push({
          category: 'Sanity',
          check: 'Distance Range Check',
          status: 'passed',
          scoreImpact: 0,
          details: 'All trip distances lie within plausible metropolitan ranges (0-100 miles).',
          affectedCount: 0
        });
      } else {
        const deduction = Math.min(10, extremeDistCount * 2);
        totalDeductions += deduction;
        checks.push({
          category: 'Sanity',
          check: 'Distance Range Check',
          status: 'warning',
          scoreImpact: deduction,
          details: `${extremeDistCount} records have extreme distances (>100 mi or negative).`,
          affectedCount: extremeDistCount
        });
      }
    }

    const finalScore = Math.max(0, 100 - totalDeductions);
    let status: DataQualityReport['status'] = 'Excellent';
    if (finalScore < 70) status = 'Poor';
    else if (finalScore < 85) status = 'Fair';
    else if (finalScore < 95) status = 'Good';

    const recommendations: string[] = [];
    checks.filter(c => c.status !== 'passed').forEach(c => {
      if (c.check.includes('Null')) recommendations.push('Impute missing categorical fields with "Unknown" or mean values for numeric metrics.');
      if (c.check.includes('Duplicate')) recommendations.push('Remove identical duplicate trip entries before calculating total trip counts.');
      if (c.check.includes('Fare')) recommendations.push('Filter out negative fare amounts prior to revenue & average fare calculations.');
      if (c.check.includes('Distance')) recommendations.push('Cap distance outliers (>100 miles) or inspect for unit conversion errors.');
    });

    if (recommendations.length === 0) {
      recommendations.push('Data quality is high. Ready for accurate statistical modeling and executive reporting.');
    }

    return {
      score: finalScore,
      status,
      checks,
      summary: `Overall dataset health is rated ${status} (${finalScore}/100). Passed ${checks.filter(c => c.status === 'passed').length} of ${checks.length} automated quality audits.`,
      recommendations
    };
  }

  public static detectAnomalies(records: DataRecord[], metadata: DatasetMetadata): AnomalyItem[] {
    const anomalies: AnomalyItem[] = [];

    if (!records || records.length === 0) return anomalies;

    const fareCol = metadata.schemaMapping['fare'] || 'fare_amount';
    const distCol = metadata.schemaMapping['distance'] || 'trip_distance';

    // 1. Fare Outliers (Z-score > 3.0 or Negative)
    if (records[0] && fareCol in records[0]) {
      const fares = records.map(r => Number(r[fareCol])).filter(f => !isNaN(f));
      if (fares.length > 10) {
        const mean = fares.reduce((a, b) => a + b, 0) / fares.length;
        const stdDev = Math.sqrt(fares.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / fares.length);

        records.forEach((r, idx) => {
          const fare = Number(r[fareCol]);
          if (fare < 0) {
            anomalies.push({
              id: `anom-fare-neg-${idx}`,
              type: 'Fare Anomaly',
              severity: 'High',
              description: `Negative fare amount ($${fare.toFixed(2)}) detected at record #${idx + 1}.`,
              value: `$${fare.toFixed(2)}`,
              expectedRange: '≥ $2.50',
              recordIndex: idx
            });
          } else if (stdDev > 0 && (fare - mean) / stdDev > 3.5) {
            anomalies.push({
              id: `anom-fare-high-${idx}`,
              type: 'Surge Outlier',
              severity: 'Medium',
              description: `Extremely high fare ($${fare.toFixed(2)}) compared to average fare of $${mean.toFixed(2)}.`,
              value: `$${fare.toFixed(2)}`,
              expectedRange: `$0.00 - $${(mean + 3 * stdDev).toFixed(2)}`,
              recordIndex: idx
            });
          }
        });
      }
    }

    // 2. Distance Outliers (> 100 miles)
    if (records[0] && distCol in records[0]) {
      records.forEach((r, idx) => {
        const dist = Number(r[distCol]);
        if (dist > 100) {
          anomalies.push({
            id: `anom-dist-${idx}`,
            type: 'Unusual Distance',
            severity: 'High',
            description: `Unusually large trip distance (${dist} miles) recorded at trip #${r.trip_id || idx + 1}.`,
            value: `${dist} miles`,
            expectedRange: '0.1 - 45.0 miles',
            recordIndex: idx
          });
        }
      });
    }

    // 3. Hourly Demand Spikes
    const dateCol = metadata.schemaMapping['datetime'] || 'pickup_datetime';
    if (records[0] && dateCol in records[0]) {
      const hourlyCounts: Record<string, number> = {};
      records.forEach(r => {
        const dt = r[dateCol];
        if (dt) {
          const dateStr = String(dt).substring(0, 13); // e.g. "2026-06-15 18"
          hourlyCounts[dateStr] = (hourlyCounts[dateStr] || 0) + 1;
        }
      });

      const counts = Object.values(hourlyCounts);
      if (counts.length > 5) {
        const meanCount = counts.reduce((a, b) => a + b, 0) / counts.length;
        const maxHour = Object.entries(hourlyCounts).sort((a, b) => b[1] - a[1])[0];
        if (maxHour && maxHour[1] > meanCount * 3) {
          anomalies.push({
            id: `anom-spike-hour`,
            type: 'Demand Spike',
            severity: 'Medium',
            description: `Sudden trip spike of ${maxHour[1]} trips recorded during hour ${maxHour[0]}:00 (3x hourly average of ${meanCount.toFixed(1)} trips).`,
            value: `${maxHour[1]} trips/hr`,
            expectedRange: `1 - ${Math.round(meanCount * 2)} trips/hr`
          });
        }
      }
    }

    return anomalies.slice(0, 10);
  }
}
