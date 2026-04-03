/**
 * Log It — Static Reference: WNBA Venues
 * Used by ESPN sync script when automatically creating new venues.
 * Includes all 13 active WNBA team arenas (2025 season).
 */

export const WNBA_VENUES: Record<string, { arena: string; city: string; state: string; lat: number; lng: number }> = {
  ATL:  { arena: 'Gateway Center Arena', city: 'College Park', state: 'GA', lat: 33.6438, lng: -84.4476 },
  CHI:  { arena: 'Wintrust Arena', city: 'Chicago', state: 'IL', lat: 41.8561, lng: -87.6164 },
  CONN: { arena: 'Mohegan Sun Arena', city: 'Uncasville', state: 'CT', lat: 41.4270, lng: -72.0962 },
  DAL:  { arena: 'College Park Center', city: 'Arlington', state: 'TX', lat: 32.7309, lng: -97.1078 },
  GS:   { arena: 'Chase Center', city: 'San Francisco', state: 'CA', lat: 37.7679, lng: -122.3877 },
  IND:  { arena: 'Gainbridge Fieldhouse', city: 'Indianapolis', state: 'IN', lat: 39.7640, lng: -86.1555 },
  LVA:  { arena: 'Michelob Ultra Arena', city: 'Las Vegas', state: 'NV', lat: 36.0908, lng: -115.1784 },
  LA:   { arena: 'Crypto.com Arena', city: 'Los Angeles', state: 'CA', lat: 34.0430, lng: -118.2673 },
  MIN:  { arena: 'Target Center', city: 'Minneapolis', state: 'MN', lat: 44.9795, lng: -93.2761 },
  NY:   { arena: 'Barclays Center', city: 'Brooklyn', state: 'NY', lat: 40.6826, lng: -73.9754 },
  PHX:  { arena: 'Footprint Center', city: 'Phoenix', state: 'AZ', lat: 33.4457, lng: -112.0712 },
  SEA:  { arena: 'Climate Pledge Arena', city: 'Seattle', state: 'WA', lat: 47.6222, lng: -122.3540 },
  WSH:  { arena: 'Entertainment & Sports Arena', city: 'Washington', state: 'DC', lat: 38.8690, lng: -76.9720 },
};
