/**
 * Log It — Static Reference: MLB Venues
 * Used by ESPN sync script when automatically creating new venues.
 * Includes all 30 active team stadiums.
 */

export const MLB_VENUES: Record<string, { stadium: string; city: string; state: string; lat: number; lng: number }> = {
  // AL East
  BAL: { stadium: 'Oriole Park at Camden Yards', city: 'Baltimore', state: 'MD', lat: 39.2839, lng: -76.6216 },
  BOS: { stadium: 'Fenway Park', city: 'Boston', state: 'MA', lat: 42.3466, lng: -71.0972 },
  NYY: { stadium: 'Yankee Stadium', city: 'Bronx', state: 'NY', lat: 40.8296, lng: -73.9261 },
  TB: { stadium: 'Tropicana Field', city: 'St. Petersburg', state: 'FL', lat: 27.7682, lng: -82.6533 },
  TOR: { stadium: 'Rogers Centre', city: 'Toronto', state: 'ON', lat: 43.6414, lng: -79.3893 },

  // AL Central
  CWS: { stadium: 'Guaranteed Rate Field', city: 'Chicago', state: 'IL', lat: 41.8299, lng: -87.6337 },
  CLE: { stadium: 'Progressive Field', city: 'Cleveland', state: 'OH', lat: 41.4962, lng: -81.6852 },
  DET: { stadium: 'Comerica Park', city: 'Detroit', state: 'MI', lat: 42.3389, lng: -83.0485 },
  KC: { stadium: 'Kauffman Stadium', city: 'Kansas City', state: 'MO', lat: 39.0516, lng: -94.4803 },
  MIN: { stadium: 'Target Field', city: 'Minneapolis', state: 'MN', lat: 44.9817, lng: -93.2777 },

  // AL West
  HOU: { stadium: 'Minute Maid Park', city: 'Houston', state: 'TX', lat: 29.7572, lng: -95.3555 },
  LAA: { stadium: 'Angel Stadium', city: 'Anaheim', state: 'CA', lat: 33.8003, lng: -117.8827 },
  OAK: { stadium: 'Sutter Health Park', city: 'West Sacramento', state: 'CA', lat: 38.5803, lng: -121.5205 }, // The Athletics moving to Sacramento
  SEA: { stadium: 'T-Mobile Park', city: 'Seattle', state: 'WA', lat: 47.5914, lng: -122.3325 },
  TEX: { stadium: 'Globe Life Field', city: 'Arlington', state: 'TX', lat: 32.7472, lng: -97.0819 },

  // NL East
  ATL: { stadium: 'Truist Park', city: 'Atlanta', state: 'GA', lat: 33.8907, lng: -84.4676 },
  MIA: { stadium: 'loanDepot park', city: 'Miami', state: 'FL', lat: 25.7783, lng: -80.2195 },
  NYM: { stadium: 'Citi Field', city: 'Queens', state: 'NY', lat: 40.7570, lng: -73.8458 },
  PHI: { stadium: 'Citizens Bank Park', city: 'Philadelphia', state: 'PA', lat: 39.9060, lng: -75.1664 },
  WSH: { stadium: 'Nationals Park', city: 'Washington', state: 'DC', lat: 38.8730, lng: -77.0074 },

  // NL Central
  CHC: { stadium: 'Wrigley Field', city: 'Chicago', state: 'IL', lat: 41.9484, lng: -87.6553 },
  CIN: { stadium: 'Great American Ball Park', city: 'Cincinnati', state: 'OH', lat: 39.0979, lng: -84.5071 },
  MIL: { stadium: 'American Family Field', city: 'Milwaukee', state: 'WI', lat: 43.0279, lng: -87.9711 },
  PIT: { stadium: 'PNC Park', city: 'Pittsburgh', state: 'PA', lat: 40.4468, lng: -80.0056 },
  STL: { stadium: 'Busch Stadium', city: 'St. Louis', state: 'MO', lat: 38.6226, lng: -90.1928 },

  // NL West
  ARI: { stadium: 'Chase Field', city: 'Phoenix', state: 'AZ', lat: 33.4455, lng: -112.0666 },
  COL: { stadium: 'Coors Field', city: 'Denver', state: 'CO', lat: 39.7558, lng: -104.9941 },
  LAD: { stadium: 'Dodger Stadium', city: 'Los Angeles', state: 'CA', lat: 34.0738, lng: -118.2399 },
  SD: { stadium: 'Petco Park', city: 'San Diego', state: 'CA', lat: 32.7076, lng: -117.1569 },
  SF: { stadium: 'Oracle Park', city: 'San Francisco', state: 'CA', lat: 37.7785, lng: -122.3892 },
};
