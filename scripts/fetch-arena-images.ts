import fs from 'fs';
import path from 'path';
import { NBA_VENUES } from '../server-lib/nba-venues';

async function fetchWikipediaImage(arenaName: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    arenaName
  )}&prop=pageimages&format=json&pithumbsize=1000`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query?.pages;
    if (pages) {
      for (const key of Object.keys(pages)) {
        if (pages[key].thumbnail?.source) {
          return pages[key].thumbnail.source;
        }
      }
    }
  } catch (err) {
    console.error(`Failed to fetch Wikipedia image for ${arenaName}`, err);
  }
  return null;
}

async function main() {
  console.log('Fetching arena images from Wikipedia...');
  const updatedVenues: Record<string, any> = {};

  for (const [abbr, venue] of Object.entries(NBA_VENUES)) {
    // Some arenas might need manual query tuning, but this works for 95%
    let searchName = venue.arena;
    if (searchName === 'Madison Square Garden') searchName = 'Madison Square Garden';
    
    process.stdout.write(`Fetching ${searchName}... `);
    const imgUrl = await fetchWikipediaImage(searchName);
    
    const finalUrl = imgUrl || venue.image_url;
    updatedVenues[abbr] = { ...venue, image_url: finalUrl };
    
    if (imgUrl) console.log('✅ Found!');
    else console.log('❌ Not found (keeping fallback)');
    
    // Tiny delay to respect Wikipedia guidelines
    await new Promise((r) => setTimeout(r, 200));
  }

  // Generate the new file content
  const fileContent = `export interface NBAVenue {
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
export const NBA_VENUES: Record<string, NBAVenue> = ${JSON.stringify(updatedVenues, null, 2)};

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
`;

  const targetPath = path.resolve(process.cwd(), 'server-lib', 'nba-venues.ts');
  fs.writeFileSync(targetPath, fileContent, 'utf8');
  console.log(`\nSuccessfully updated ${targetPath} with absolute Wikipedia URLs!`);
}

main().catch(console.error);
