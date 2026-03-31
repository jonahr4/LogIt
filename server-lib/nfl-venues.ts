/**
 * Log It — NFL Stadium Mapping
 * Static mapping of all 32 NFL home stadiums by ESPN team abbreviation.
 * Used for venue seeding — auto-enrichment handles the rest.
 */

export interface NFLVenue {
  stadium: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export const NFL_VENUES: Record<string, NFLVenue> = {
  ARI: { stadium: 'State Farm Stadium', city: 'Glendale', state: 'AZ', lat: 33.5276, lng: -112.2626 },
  ATL: { stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', state: 'GA', lat: 33.7554, lng: -84.4010 },
  BAL: { stadium: 'M&T Bank Stadium', city: 'Baltimore', state: 'MD', lat: 39.2780, lng: -76.6227 },
  BUF: { stadium: 'Highmark Stadium', city: 'Orchard Park', state: 'NY', lat: 42.7738, lng: -78.7870 },
  CAR: { stadium: 'Bank of America Stadium', city: 'Charlotte', state: 'NC', lat: 35.2258, lng: -80.8528 },
  CHI: { stadium: 'Soldier Field', city: 'Chicago', state: 'IL', lat: 41.8623, lng: -87.6167 },
  CIN: { stadium: 'Paycor Stadium', city: 'Cincinnati', state: 'OH', lat: 39.0955, lng: -84.5161 },
  CLE: { stadium: 'Cleveland Browns Stadium', city: 'Cleveland', state: 'OH', lat: 41.5061, lng: -81.6995 },
  DAL: { stadium: 'AT&T Stadium', city: 'Arlington', state: 'TX', lat: 32.7473, lng: -97.0945 },
  DEN: { stadium: 'Empower Field at Mile High', city: 'Denver', state: 'CO', lat: 39.7439, lng: -105.0201 },
  DET: { stadium: 'Ford Field', city: 'Detroit', state: 'MI', lat: 42.3400, lng: -83.0456 },
  GB: { stadium: 'Lambeau Field', city: 'Green Bay', state: 'WI', lat: 44.5013, lng: -88.0622 },
  HOU: { stadium: 'NRG Stadium', city: 'Houston', state: 'TX', lat: 29.6847, lng: -95.4107 },
  IND: { stadium: 'Lucas Oil Stadium', city: 'Indianapolis', state: 'IN', lat: 39.7601, lng: -86.1639 },
  JAX: { stadium: 'EverBank Stadium', city: 'Jacksonville', state: 'FL', lat: 30.3239, lng: -81.6373 },
  KC: { stadium: 'GEHA Field at Arrowhead Stadium', city: 'Kansas City', state: 'MO', lat: 39.0489, lng: -94.4839 },
  LV: { stadium: 'Allegiant Stadium', city: 'Las Vegas', state: 'NV', lat: 36.0909, lng: -115.1833 },
  LAC: { stadium: 'SoFi Stadium', city: 'Inglewood', state: 'CA', lat: 33.9535, lng: -118.3392 },
  LAR: { stadium: 'SoFi Stadium', city: 'Inglewood', state: 'CA', lat: 33.9535, lng: -118.3392 },
  MIA: { stadium: 'Hard Rock Stadium', city: 'Miami Gardens', state: 'FL', lat: 25.9580, lng: -80.2389 },
  MIN: { stadium: 'U.S. Bank Stadium', city: 'Minneapolis', state: 'MN', lat: 44.9736, lng: -93.2575 },
  NE: { stadium: 'Gillette Stadium', city: 'Foxborough', state: 'MA', lat: 42.0909, lng: -71.2643 },
  NO: { stadium: 'Caesars Superdome', city: 'New Orleans', state: 'LA', lat: 29.9511, lng: -90.0812 },
  NYG: { stadium: 'MetLife Stadium', city: 'East Rutherford', state: 'NJ', lat: 40.8128, lng: -74.0742 },
  NYJ: { stadium: 'MetLife Stadium', city: 'East Rutherford', state: 'NJ', lat: 40.8128, lng: -74.0742 },
  PHI: { stadium: 'Lincoln Financial Field', city: 'Philadelphia', state: 'PA', lat: 39.9008, lng: -75.1675 },
  PIT: { stadium: 'Acrisure Stadium', city: 'Pittsburgh', state: 'PA', lat: 40.4468, lng: -80.0158 },
  SF: { stadium: "Levi's Stadium", city: 'Santa Clara', state: 'CA', lat: 37.4033, lng: -121.9694 },
  SEA: { stadium: 'Lumen Field', city: 'Seattle', state: 'WA', lat: 47.5952, lng: -122.3316 },
  TB: { stadium: 'Raymond James Stadium', city: 'Tampa', state: 'FL', lat: 27.9759, lng: -82.5033 },
  TEN: { stadium: 'Nissan Stadium', city: 'Nashville', state: 'TN', lat: 36.1664, lng: -86.7713 },
  WSH: { stadium: 'Northwest Stadium', city: 'Landover', state: 'MD', lat: 38.9076, lng: -76.8645 },
};
