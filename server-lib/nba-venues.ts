/**
 * Log It — NBA Team Venue Data
 * Static mapping of BDL team IDs to arena/venue information.
 * NBA has 30 teams with fixed home arenas — this never changes mid-season.
 */

export interface NBAVenue {
  arena: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

/**
 * Map of Ball Don't Lie team ID → venue info
 * Source: NBA.com + Google Maps coordinates
 */
export const NBA_VENUES: Record<number, NBAVenue> = {
  1:  { arena: 'State Farm Arena', city: 'Atlanta', state: 'GA', lat: 33.7573, lng: -84.3963 },
  2:  { arena: 'TD Garden', city: 'Boston', state: 'MA', lat: 42.3662, lng: -71.0621 },
  3:  { arena: 'Barclays Center', city: 'Brooklyn', state: 'NY', lat: 40.6826, lng: -73.9754 },
  4:  { arena: 'Spectrum Center', city: 'Charlotte', state: 'NC', lat: 35.2251, lng: -80.8392 },
  5:  { arena: 'United Center', city: 'Chicago', state: 'IL', lat: 41.8807, lng: -87.6742 },
  6:  { arena: 'Rocket Mortgage FieldHouse', city: 'Cleveland', state: 'OH', lat: 41.4965, lng: -81.6882 },
  7:  { arena: 'American Airlines Center', city: 'Dallas', state: 'TX', lat: 32.7905, lng: -96.8103 },
  8:  { arena: 'Ball Arena', city: 'Denver', state: 'CO', lat: 39.7487, lng: -105.0077 },
  9:  { arena: 'Little Caesars Arena', city: 'Detroit', state: 'MI', lat: 42.3411, lng: -83.0553 },
  10: { arena: 'Chase Center', city: 'San Francisco', state: 'CA', lat: 37.7680, lng: -122.3877 },
  11: { arena: 'Toyota Center', city: 'Houston', state: 'TX', lat: 29.7508, lng: -95.3621 },
  12: { arena: 'Gainbridge Fieldhouse', city: 'Indianapolis', state: 'IN', lat: 39.7640, lng: -86.1555 },
  13: { arena: 'Intuit Dome', city: 'Inglewood', state: 'CA', lat: 33.9425, lng: -118.3414 },
  14: { arena: 'Crypto.com Arena', city: 'Los Angeles', state: 'CA', lat: 34.0430, lng: -118.2673 },
  15: { arena: 'FedExForum', city: 'Memphis', state: 'TN', lat: 35.1382, lng: -90.0505 },
  16: { arena: 'Kaseya Center', city: 'Miami', state: 'FL', lat: 25.7814, lng: -80.1870 },
  17: { arena: 'Fiserv Forum', city: 'Milwaukee', state: 'WI', lat: 43.0451, lng: -87.9174 },
  18: { arena: 'Target Center', city: 'Minneapolis', state: 'MN', lat: 44.9795, lng: -93.2761 },
  19: { arena: 'Smoothie King Center', city: 'New Orleans', state: 'LA', lat: 29.9490, lng: -90.0821 },
  20: { arena: 'Madison Square Garden', city: 'New York', state: 'NY', lat: 40.7505, lng: -73.9934 },
  21: { arena: 'Paycom Center', city: 'Oklahoma City', state: 'OK', lat: 35.4634, lng: -97.5151 },
  22: { arena: 'Amway Center', city: 'Orlando', state: 'FL', lat: 28.5392, lng: -81.3839 },
  23: { arena: 'Wells Fargo Center', city: 'Philadelphia', state: 'PA', lat: 39.9012, lng: -75.1720 },
  24: { arena: 'Footprint Center', city: 'Phoenix', state: 'AZ', lat: 33.4457, lng: -112.0712 },
  25: { arena: 'Moda Center', city: 'Portland', state: 'OR', lat: 45.5316, lng: -122.6668 },
  26: { arena: 'Golden 1 Center', city: 'Sacramento', state: 'CA', lat: 38.5802, lng: -121.4997 },
  27: { arena: 'Frost Bank Center', city: 'San Antonio', state: 'TX', lat: 29.4270, lng: -98.4375 },
  28: { arena: 'Scotiabank Arena', city: 'Toronto', state: 'ON', lat: 43.6435, lng: -79.3791 },
  29: { arena: 'Delta Center', city: 'Salt Lake City', state: 'UT', lat: 40.7683, lng: -111.9011 },
  30: { arena: 'Capital One Arena', city: 'Washington', state: 'DC', lat: 38.8981, lng: -77.0209 },
};

/**
 * Get venue info for a home team.
 * Returns the home team's arena details, or a fallback with just the city.
 */
export function getVenueForTeam(teamId: number, fallbackCity: string): NBAVenue {
  return NBA_VENUES[teamId] || {
    arena: '',
    city: fallbackCity,
    state: '',
    lat: 0,
    lng: 0,
  };
}
