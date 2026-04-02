/**
 * Log It — NHL Arena Mapping
 * Static mapping of all 32 NHL home arenas by ESPN team abbreviation.
 * Used for venue seeding — auto-enrichment handles the rest.
 */

export interface NHLVenue {
  arena: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export const NHL_VENUES: Record<string, NHLVenue> = {
  ANA: { arena: 'Honda Center', city: 'Anaheim', state: 'CA', lat: 33.8078, lng: -117.8765 },
  ARI: { arena: 'Mullett Arena', city: 'Tempe', state: 'AZ', lat: 33.4255, lng: -111.9325 },
  BOS: { arena: 'TD Garden', city: 'Boston', state: 'MA', lat: 42.3662, lng: -71.0621 },
  BUF: { arena: 'KeyBank Center', city: 'Buffalo', state: 'NY', lat: 42.8750, lng: -78.8764 },
  CGY: { arena: 'Scotiabank Saddledome', city: 'Calgary', state: 'AB', lat: 51.0374, lng: -114.0519 },
  CAR: { arena: 'PNC Arena', city: 'Raleigh', state: 'NC', lat: 35.8033, lng: -78.7220 },
  CHI: { arena: 'United Center', city: 'Chicago', state: 'IL', lat: 41.8807, lng: -87.6742 },
  COL: { arena: 'Ball Arena', city: 'Denver', state: 'CO', lat: 39.7487, lng: -105.0077 },
  CBJ: { arena: 'Nationwide Arena', city: 'Columbus', state: 'OH', lat: 39.9691, lng: -83.0061 },
  DAL: { arena: 'American Airlines Center', city: 'Dallas', state: 'TX', lat: 32.7905, lng: -96.8103 },
  DET: { arena: 'Little Caesars Arena', city: 'Detroit', state: 'MI', lat: 42.3411, lng: -83.0553 },
  EDM: { arena: 'Rogers Place', city: 'Edmonton', state: 'AB', lat: 53.5469, lng: -113.4979 },
  FLA: { arena: 'Amerant Bank Arena', city: 'Sunrise', state: 'FL', lat: 26.1584, lng: -80.3256 },
  LA: { arena: 'Crypto.com Arena', city: 'Los Angeles', state: 'CA', lat: 34.0430, lng: -118.2673 },
  MIN: { arena: 'Xcel Energy Center', city: 'Saint Paul', state: 'MN', lat: 44.9448, lng: -93.1011 },
  MTL: { arena: 'Bell Centre', city: 'Montreal', state: 'QC', lat: 45.4961, lng: -73.5693 },
  NSH: { arena: 'Bridgestone Arena', city: 'Nashville', state: 'TN', lat: 36.1592, lng: -86.7785 },
  NJ: { arena: 'Prudential Center', city: 'Newark', state: 'NJ', lat: 40.7334, lng: -74.1712 },
  NYI: { arena: 'UBS Arena', city: 'Elmont', state: 'NY', lat: 40.7172, lng: -73.7265 },
  NYR: { arena: 'Madison Square Garden', city: 'New York', state: 'NY', lat: 40.7505, lng: -73.9934 },
  OTT: { arena: 'Canadian Tire Centre', city: 'Ottawa', state: 'ON', lat: 45.2969, lng: -75.9272 },
  PHI: { arena: 'Wells Fargo Center', city: 'Philadelphia', state: 'PA', lat: 39.9012, lng: -75.1720 },
  PIT: { arena: 'PPG Paints Arena', city: 'Pittsburgh', state: 'PA', lat: 40.4395, lng: -79.9890 },
  SJ: { arena: 'SAP Center', city: 'San Jose', state: 'CA', lat: 37.3327, lng: -121.9010 },
  SEA: { arena: 'Climate Pledge Arena', city: 'Seattle', state: 'WA', lat: 47.6221, lng: -122.3541 },
  STL: { arena: 'Enterprise Center', city: 'Saint Louis', state: 'MO', lat: 38.6268, lng: -90.2026 },
  TB: { arena: 'Amalie Arena', city: 'Tampa', state: 'FL', lat: 27.9427, lng: -82.4519 },
  TOR: { arena: 'Scotiabank Arena', city: 'Toronto', state: 'ON', lat: 43.6435, lng: -79.3791 },
  UTA: { arena: 'Delta Center', city: 'Salt Lake City', state: 'UT', lat: 40.7683, lng: -111.9011 },
  VAN: { arena: 'Rogers Arena', city: 'Vancouver', state: 'BC', lat: 49.2778, lng: -123.1089 },
  VGK: { arena: 'T-Mobile Arena', city: 'Las Vegas', state: 'NV', lat: 36.1029, lng: -115.1783 },
  WSH: { arena: 'Capital One Arena', city: 'Washington', state: 'DC', lat: 38.8981, lng: -77.0209 },
  WPG: { arena: 'Canada Life Centre', city: 'Winnipeg', state: 'MB', lat: 49.8928, lng: -97.1437 },
};
