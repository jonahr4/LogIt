export interface NBAVenue {
  arena: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  image_url: string;
}

const GENERIC_ARENA = 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80';

/**
 * Map of ESPN team abbreviation → venue info
 * Source: NBA.com + Google Maps coordinates + Wikipedia Images
 */
export const NBA_VENUES: Record<string, NBAVenue> = {
  "ATL": {
    "arena": "State Farm Arena",
    "city": "Atlanta",
    "state": "GA",
    "lat": 33.7573,
    "lng": -84.3963,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/State_Farm_%28Philips%29_Arena%2C_Atlanta%2C_GA_%2846558861525%29_-_2019.jpg/1280px-State_Farm_%28Philips%29_Arena%2C_Atlanta%2C_GA_%2846558861525%29_-_2019.jpg"
  },
  "BOS": {
    "arena": "TD Garden",
    "city": "Boston",
    "state": "MA",
    "lat": 42.3662,
    "lng": -71.0621,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/TD_Garden_%2854960947755%29.jpg/1280px-TD_Garden_%2854960947755%29.jpg"
  },
  "BKN": {
    "arena": "Barclays Center",
    "city": "Brooklyn",
    "state": "NY",
    "lat": 40.6826,
    "lng": -73.9754,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Barclays_Center_-_May_2_2025.jpg/1280px-Barclays_Center_-_May_2_2025.jpg"
  },
  "CHA": {
    "arena": "Spectrum Center",
    "city": "Charlotte",
    "state": "NC",
    "lat": 35.2251,
    "lng": -80.8392,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Spectrum_Center_2018.jpg/1280px-Spectrum_Center_2018.jpg"
  },
  "CHI": {
    "arena": "United Center",
    "city": "Chicago",
    "state": "IL",
    "lat": 41.8807,
    "lng": -87.6742,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/United_Center_1.jpg/1280px-United_Center_1.jpg"
  },
  "CLE": {
    "arena": "Rocket Mortgage FieldHouse",
    "city": "Cleveland",
    "state": "OH",
    "lat": 41.4965,
    "lng": -81.6882,
    "image_url": "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80"
  },
  "DAL": {
    "arena": "American Airlines Center",
    "city": "Dallas",
    "state": "TX",
    "lat": 32.7905,
    "lng": -96.8103,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/American_Airlines_Center_August_2015.jpg/1280px-American_Airlines_Center_August_2015.jpg"
  },
  "DEN": {
    "arena": "Ball Arena",
    "city": "Denver",
    "state": "CO",
    "lat": 39.7487,
    "lng": -105.0077,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Ball_Arena_exterior_2022.jpg/1280px-Ball_Arena_exterior_2022.jpg"
  },
  "DET": {
    "arena": "Little Caesars Arena",
    "city": "Detroit",
    "state": "MI",
    "lat": 42.3411,
    "lng": -83.0553,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Little_Caesars_Arena_panorama.jpg/1280px-Little_Caesars_Arena_panorama.jpg"
  },
  "GS": {
    "arena": "Chase Center",
    "city": "San Francisco",
    "state": "CA",
    "lat": 37.768,
    "lng": -122.3877,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Chase_Center.jpg/1280px-Chase_Center.jpg"
  },
  "HOU": {
    "arena": "Toyota Center",
    "city": "Houston",
    "state": "TX",
    "lat": 29.7508,
    "lng": -95.3621,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Toyota_Center_entr.jpg/1280px-Toyota_Center_entr.jpg"
  },
  "IND": {
    "arena": "Gainbridge Fieldhouse",
    "city": "Indianapolis",
    "state": "IN",
    "lat": 39.764,
    "lng": -86.1555,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Bankers_Life_Fieldhouse%2C_Indian%C3%A1polis%2C_Estados_Unidos%2C_2012-10-22%2C_DD_02.jpg/1280px-Bankers_Life_Fieldhouse%2C_Indian%C3%A1polis%2C_Estados_Unidos%2C_2012-10-22%2C_DD_02.jpg"
  },
  "LAC": {
    "arena": "Intuit Dome",
    "city": "Inglewood",
    "state": "CA",
    "lat": 33.9425,
    "lng": -118.3414,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Intuit_Dome_Fa%C3%A7ade.jpg/1280px-Intuit_Dome_Fa%C3%A7ade.jpg"
  },
  "LAL": {
    "arena": "Crypto.com Arena",
    "city": "Los Angeles",
    "state": "CA",
    "lat": 34.043,
    "lng": -118.2673,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Crypto.com_Arena_exterior_2023.jpg/1280px-Crypto.com_Arena_exterior_2023.jpg"
  },
  "MEM": {
    "arena": "FedExForum",
    "city": "Memphis",
    "state": "TN",
    "lat": 35.1382,
    "lng": -90.0505,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/FedExForum_at_night.jpg/1280px-FedExForum_at_night.jpg"
  },
  "MIA": {
    "arena": "Kaseya Center",
    "city": "Miami",
    "state": "FL",
    "lat": 25.7814,
    "lng": -80.187,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Kaseya_Center_Downtown_Miami_FL%2C_5_April_2024.jpg/1280px-Kaseya_Center_Downtown_Miami_FL%2C_5_April_2024.jpg"
  },
  "MIL": {
    "arena": "Fiserv Forum",
    "city": "Milwaukee",
    "state": "WI",
    "lat": 43.0451,
    "lng": -87.9174,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Milwaukee_Fiserv_Forum.jpg/1280px-Milwaukee_Fiserv_Forum.jpg"
  },
  "MIN": {
    "arena": "Target Center",
    "city": "Minneapolis",
    "state": "MN",
    "lat": 44.9795,
    "lng": -93.2761,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/TargetCenter.jpg/1280px-TargetCenter.jpg"
  },
  "NO": {
    "arena": "Smoothie King Center",
    "city": "New Orleans",
    "state": "LA",
    "lat": 29.949,
    "lng": -90.0821,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/New_Orleans_Arena%2C_exterior_view%2C_10_January_2022_%28cropped%29.jpg/1280px-New_Orleans_Arena%2C_exterior_view%2C_10_January_2022_%28cropped%29.jpg"
  },
  "NY": {
    "arena": "Madison Square Garden",
    "city": "New York",
    "state": "NY",
    "lat": 40.7505,
    "lng": -73.9934,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Madison_Square_Garden_%28MSG%29_-_Full_%2848124330357%29.jpg/1280px-Madison_Square_Garden_%28MSG%29_-_Full_%2848124330357%29.jpg"
  },
  "OKC": {
    "arena": "Paycom Center",
    "city": "Oklahoma City",
    "state": "OK",
    "lat": 35.4634,
    "lng": -97.5151,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Paycom_Center_exterior_aerial_view.jpg/1280px-Paycom_Center_exterior_aerial_view.jpg"
  },
  "ORL": {
    "arena": "Amway Center",
    "city": "Orlando",
    "state": "FL",
    "lat": 28.5392,
    "lng": -81.3839,
    "image_url": "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80"
  },
  "PHI": {
    "arena": "Wells Fargo Center",
    "city": "Philadelphia",
    "state": "PA",
    "lat": 39.9012,
    "lng": -75.172,
    "image_url": "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80"
  },
  "PHX": {
    "arena": "Footprint Center",
    "city": "Phoenix",
    "state": "AZ",
    "lat": 33.4457,
    "lng": -112.0712,
    "image_url": "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80"
  },
  "POR": {
    "arena": "Moda Center",
    "city": "Portland",
    "state": "OR",
    "lat": 45.5316,
    "lng": -122.6668,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Modacenter2019.jpg/1280px-Modacenter2019.jpg"
  },
  "SAC": {
    "arena": "Golden 1 Center",
    "city": "Sacramento",
    "state": "CA",
    "lat": 38.5802,
    "lng": -121.4997,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Golden_1_Center_2017.jpg/1280px-Golden_1_Center_2017.jpg"
  },
  "SA": {
    "arena": "Frost Bank Center",
    "city": "San Antonio",
    "state": "TX",
    "lat": 29.427,
    "lng": -98.4375,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Texasdd.JPG/1280px-Texasdd.JPG"
  },
  "TOR": {
    "arena": "Scotiabank Arena",
    "city": "Toronto",
    "state": "ON",
    "lat": 43.6435,
    "lng": -79.3791,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Scotiabank_Arena_-_2018_%28cropped%29.jpg/1280px-Scotiabank_Arena_-_2018_%28cropped%29.jpg"
  },
  "UTAH": {
    "arena": "Delta Center",
    "city": "Salt Lake City",
    "state": "UT",
    "lat": 40.7683,
    "lng": -111.9011,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Delta_Center_2023.jpg/1280px-Delta_Center_2023.jpg"
  },
  "WSH": {
    "arena": "Capital One Arena",
    "city": "Washington",
    "state": "DC",
    "lat": 38.8981,
    "lng": -77.0209,
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Capital_One_Arena_-_Washington%2C_D.C.jpg/1280px-Capital_One_Arena_-_Washington%2C_D.C.jpg"
  }
};

/**
 * Get venue info for a home team by ESPN abbreviation.
 */
export function getVenueForTeam(teamAbbr: string, fallbackCity: string): NBAVenue {
  const normalized = teamAbbr.toUpperCase();
  return NBA_VENUES[normalized] || {
    arena: '',
    city: fallbackCity,
    state: '',
    lat: 0,
    lng: 0,
    image_url: GENERIC_ARENA,
  };
}
