import { EarthquakeRecord } from '../types';

/**
 * Extracts and cleans province and municipality from a record or its location string.
 */
export function getRecordLocationDetails(record: EarthquakeRecord): {
  province: string;
  municipality: string;
} {
  let province = record.province?.trim() || '';
  let municipality = record.municipality?.trim() || '';

  if (!province || !municipality) {
    const loc = record.location || '';
    const parenMatches = [...loc.matchAll(/\(([^()]+)\)/g)];
    if (parenMatches.length > 0) {
      if (!province) {
        province = parenMatches[parenMatches.length - 1][1].trim();
      }
      if (!municipality) {
        const beforeLastParen = loc.substring(0, loc.lastIndexOf('(')).trim();
        const ofMatch = beforeLastParen.match(/\bof\s+(.+)$/i);
        if (ofMatch) {
          municipality = ofMatch[1].replace(/\s*\([^)]*\)\s*$/, '').trim();
        } else {
          municipality = beforeLastParen;
        }
      }
    }
  }

  // Clean out common prefixes like "Municipality of", "City of" if needed or keep standard
  return {
    province: province || 'Unspecified',
    municipality: municipality || 'Unspecified',
  };
}

/**
 * Gets standardized ISO date YYYY-MM-DD from an EarthquakeRecord.
 */
export function getRecordDateIso(record: EarthquakeRecord): string {
  if (record.date && /^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
    return record.date;
  }

  // Fallback parse from timePHT e.g. "Sep 24, 2026 10:08 PM" or "Apr 23, 2025"
  if (record.timePHT) {
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const m = record.timePHT.match(/([a-zA-Z]{3})\s+(\d{1,2}),?\s+(\d{4})/i);
    if (m) {
      const monthStr = m[1].toLowerCase();
      const month = months[monthStr] || '01';
      const day = m[2].padStart(2, '0');
      const year = m[3];
      return `${year}-${month}-${day}`;
    }
  }

  return new Date().toISOString().slice(0, 10);
}

/**
 * Checks if a record falls within the specified date range.
 */
export function isRecordInDateRange(
  record: EarthquakeRecord,
  startDate?: string,
  endDate?: string
): boolean {
  if (!startDate && !endDate) return true;

  const recordDate = getRecordDateIso(record);

  if (startDate && recordDate < startDate) {
    return false;
  }
  if (endDate && recordDate > endDate) {
    return false;
  }

  return true;
}
