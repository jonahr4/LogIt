# Adding New Sports Leagues

> **Last updated:** 2026-04-02
> **Changes:**
> - 2026-04-02: Expanded doc with full SportConfig reference, season derivation guide, venue enrichment explanation, standalone CLI scripts pattern, logging conventions, and complete file checklist including `api/scripts/`.
> - 2026-04-02: NHL implemented — `sync-nhl.ts`, `backfill-nhl.ts`, `nhl-venues.ts` (32 arenas). Cron at 6:10 AM UTC. Date-range backfill (Oct–Jun). Split-year season format (`2025-26`).
> - 2026-04-02: Marked season_type/round as implemented. Corrected ESPN headline examples (ordinals: '1st Round'). Added UI badge mapping table (R1/R2/R3/FIN) and search API enrichment docs.
> - 2026-03-31: Added ESPN playoff/season metadata reference, planned `season_type` + `round` fields, and comprehensive testing strategy.
> - 2026-03-31: Initial document. Documents the pattern for adding NFL as the second sport, establishing the reusable workflow for future leagues.

## Overview

Each sport in LogIt follows a repeatable pattern: **ESPN sync script → Supabase events/sports_events → client-side team browse**. The shared utility (`server-lib/espn.ts`) handles all common ESPN logic; each sport only provides a thin config.

---

## File Checklist

When adding a new sport, create/modify these files:

### Server-Side (Vercel cron handlers)

| # | File | Type | Purpose |
|---|---|---|---|
| 1 | `server-lib/{sport}-venues.ts` | NEW | Static venue mapping (all teams → arena/stadium + lat/lng) |
| 2 | `api/cron/sync-{sport}.ts` | NEW | Daily sync handler (thin Vercel wrapper around `espn.ts`) |
| 3 | `api/cron/backfill-{sport}.ts` | NEW | Historical backfill handler (manual-only, not cron-scheduled) |
| 4 | `server-lib/espn.ts` | — | No changes needed (shared utility handles all sports) |

### Standalone CLI Scripts (for local/manual execution)

| # | File | Type | Purpose |
|---|---|---|---|
| 5 | `api/scripts/sync-{sport}.ts` | NEW | Standalone sync runner — `npx tsx api/scripts/sync-{sport}.ts` |
| 6 | `api/scripts/backfill-{sport}.ts` | NEW | Standalone backfill runner — `npx tsx api/scripts/backfill-{sport}.ts 2024,2025` |

### Client-Side + Config

| # | File | Type | Purpose |
|---|---|---|---|
| 7 | `app/(tabs)/add-log.tsx` | MODIFY | Add team array + flip `active: true` in `SUPPORTED_SPORTS` |
| 8 | `vercel.json` | MODIFY | Add cron schedule + function `maxDuration` config |
| 9 | This doc (`docs/event-types/sports.md`) | MODIFY | Record the new sport's config, cron schedule, season format |

---

## Step-by-Step

### 1. Create Venue Mapping

File: `server-lib/{sport}-venues.ts`

Map ESPN team abbreviation → home venue info. Example shape:
```ts
export const NFL_VENUES: Record<string, { stadium: string; city: string; state: string; lat: number; lng: number }> = {
  ARI: { stadium: 'State Farm Stadium', city: 'Glendale', state: 'AZ', lat: 33.5276, lng: -112.2626 },
  // ...32 teams
};
```

> **Note:** The venue file is for seeding quality data. At runtime, `findOrCreateVenue()` + auto-enrichment in `venue-lookup.ts` handles everything — including neutral-site games, international venues, etc.

### 2. Create Sync Script

File: `api/cron/sync-{sport}.ts`

Import from `server-lib/espn.ts` and define a `SportConfig`:
```ts
import { fetchESPNScoreboard, upsertESPNGame, mapESPNStatus, type SportConfig } from '../../server-lib/espn';

const NHL_CONFIG: SportConfig = {
  sport: 'hockey',       // ESPN sport slug
  league: 'NHL',         // stored in sports_events.league
  espnPath: 'hockey/nhl', // used in ESPN API URL
  venueType: 'arena',    // passed to findOrCreateVenue()
  deriveSeason: deriveNHLSeason, // converts event date → season string
};
```

#### `SportConfig` fields explained

| Field | Purpose | Examples |
|---|---|---|
| `sport` | ESPN sport slug, stored in `sports_events.sport` | `'basketball'`, `'football'`, `'hockey'` |
| `league` | League identifier, stored in `sports_events.league` | `'NBA'`, `'NFL'`, `'NHL'` |
| `espnPath` | URL path segment for ESPN API | `'basketball/nba'`, `'football/nfl'`, `'hockey/nhl'` |
| `venueType` | Passed to `findOrCreateVenue()` for venue categorization | `'arena'`, `'stadium'` |
| `deriveSeason` | Function converting an event date string → display season | `'2025-26'` (split-year) or `'2025'` (single-year) |

The handler calls `fetchESPNScoreboard(config.espnPath)` → loops games → `upsertESPNGame(supabase, game, config)`. See `sync-nhl.ts` for the most recent reference.

#### Logging Convention

All sync scripts should include verbose per-game logging:
```ts
// Start banner
console.log(`\n🏒 ── NHL Sync Starting ──────────────────────────`);
console.log(`  Fetching ESPN scoreboard (±7 days)...`);
console.log(`  📡 ESPN returned ${allGames.length} games\n`);

// Per-game detail
const icon = result === 'inserted' ? '✅' : result === 'updated' ? '🔄' : '⏭️';
console.log(`  ${icon} ${date} │ ${title} │ ${scoreStr} │ ${status} │ ${result}`);

// Summary
console.log(`  📊 ${synced} inserted │ ${updated} updated │ ${skipped} skipped │ ${total} total`);
```

Use `mapESPNStatus(game.status.type.state)` to convert ESPN state (`'post'`/`'in'`/`'pre'`) to LogIt status for display.

### 3. Create Backfill Script

File: `api/cron/backfill-{sport}.ts`

Manual-only endpoint — **not scheduled as a cron job.** Iterates through historical dates and fetches ESPN data day-by-day or week-by-week.

**Do not run until the sync script is verified working.**

#### Iteration strategies by sport

| Sport | Strategy | Date Range | Notes |
|---|---|---|---|
| NBA | 7-day windows | Oct 1 → Jun 30 | ~1,230 games/season |
| NFL | 7-day windows | Aug 1 → Feb 20 | ~272 games/season |
| NHL | 7-day windows | Sep 15 → Jun 30 | ~1,312 games/season |
| MLB | 7-day windows | Feb 20 → Nov 5 | ~2,430 games/season (many per day) |

> **Pro tip:** Use 7-day date windows (`?dates=YYYYMMDD-YYYYMMDD`) for all sports. ESPN supports this consistently, and it avoids the ESPN season/week API which can return 500 errors for some sports.

### 4. Create Standalone CLI Scripts

Files: `api/scripts/sync-{sport}.ts` + `api/scripts/backfill-{sport}.ts`

These are **standalone Node scripts** for local terminal execution. They follow a different pattern than the Vercel handlers:

| Difference | `api/cron/` (Vercel handler) | `api/scripts/` (CLI runner) |
|---|---|---|
| Entry point | `export default handler(req, res)` | `main()` function, self-executing |
| Env loading | Vercel injects env vars | `dotenv.config({ path: '.env.local' })` |
| Supabase client | `getSupabaseAdmin()` | Direct `createClient()` with env vars |
| Args | `req.query.seasons` | `process.argv[2]` |
| Output | `res.json()` | `console.log()` only |

#### Running locally

```bash
# Sync (±7 days from today)
npx tsx api/scripts/sync-nba.ts
npx tsx api/scripts/sync-nfl.ts
npx tsx api/scripts/sync-nhl.ts

# Backfill (specify season start years)
npx tsx api/scripts/backfill-nba.ts 2024,2025
npx tsx api/scripts/backfill-nfl.ts 2023,2024,2025
npx tsx api/scripts/backfill-nhl.ts 2024,2025
```

There is also a unified runner at `scripts/run-cron.ts` that wraps the Vercel handlers with a fake req/res:
```bash
npx tsx scripts/run-cron.ts sync-nhl
npx tsx scripts/run-cron.ts backfill-nhl --seasons 2024,2025
```

### 5. Add Client-Side Team Data

In `app/(tabs)/add-log.tsx`:

1. Add team array (name, short, abbrev, logo URL):
   ```ts
   const NHL_TEAMS = [
     { name: 'Boston Bruins', short: 'Bruins', abbrev: 'bos' },
     // ...all teams
   ].map(t => ({ ...t, logo: `https://a.espncdn.com/i/teamlogos/nhl/500/${t.abbrev}.png` }));
   ```

2. Flip `active: true` for the sport in `SUPPORTED_SPORTS`

3. Update `getTeamsForSport()` to return the new array:
   ```ts
   function getTeamsForSport(sport: string | null) {
     if (sport === 'nfl') return NFL_TEAMS;
     if (sport === 'nhl') return NHL_TEAMS;
     return NBA_TEAMS; // default
   }
   ```

### 6. Configure Vercel

In `vercel.json`:
- Sync function: `"api/cron/sync-{sport}.ts": { "maxDuration": 60 }`
- Backfill function: `"api/cron/backfill-{sport}.ts": { "maxDuration": 300 }`
- Cron: `{ "path": "/api/cron/sync-{sport}", "schedule": "X 6 * * *" }`

Offset cron times by 5 minutes per sport to avoid parallel execution.

### 7. Test

See the **Testing Strategy** section below. At minimum:

1. **Sync first:** Run `npx tsx api/scripts/sync-{sport}.ts` — verify games appear in admin portal
2. **Season types:** Verify preseason, regular season, and postseason games all sync correctly
3. **App browse:** Sports → tap league → team grid → tap team → games load
4. **Box score:** Open a completed game detail → expand box score → verify stats render
5. **Backfill:** Only after sync is confirmed — run `npx tsx api/scripts/backfill-{sport}.ts YEAR`

---

## Season Derivation

Each sport needs a `deriveSeason()` function that converts an event date into a season display string. This is critical — it's stored in `sports_events.season` and used for filtering.

### Pattern: Split-Year vs Single-Year

| Format | Sports | Logic | Example |
|---|---|---|---|
| Split-year `YYYY-YY` | NBA, NHL, Premier League | Season starts in fall, ends next year | `2025-26` |
| Single-year `YYYY` | NFL, MLS | Season identified by its start year | `2025` |
| Calendar year `YYYY` | MLB | Season runs within one calendar year | `2026` |

### Reference Implementations

```ts
// NBA / NHL: Oct+ = start year, Jan-Sep = previous year
function deriveNHLSeason(eventDate: string): string {
  const d = new Date(eventDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  const startYear = month >= 9 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

// NFL: Sep+ = that year, Jan-Aug = previous year
function deriveNFLSeason(eventDate: string): string {
  const d = new Date(eventDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  if (month >= 8) return String(year);
  return String(year - 1);
}
```

> **Key gotcha:** The month cutoff differs per sport. NBA/NHL start in **October** (month 9, 0-indexed), NFL starts in **September** (month 8). Get this wrong and January games will be assigned to the wrong season.

---

## Venue Enrichment

When a game is synced, `upsertESPNGame()` calls `findOrCreateVenue()` from `server-lib/venue-lookup.ts`. This is **fully automatic and sport-agnostic** — no per-sport code needed.

### What happens at runtime

1. ESPN response includes a venue name + city in `competition.venue`
2. `findOrCreateVenue()` checks if a row with that name already exists in the `venues` table
3. If not, it **creates** the venue and then **enriches** it automatically:
   - **Coordinates:** Geocoded via [Nominatim](https://nominatim.org/) (free OpenStreetMap API)
   - **Image:** Searched via [Wikimedia Commons](https://commons.wikimedia.org/) API
4. The venue row's `id` is linked to the event via `events.venue_id`

### What the static venue files are for

The `server-lib/{sport}-venues.ts` files (`nba-venues.ts`, `nfl-venues.ts`, `nhl-venues.ts`) are **static reference data** for quality assurance. They are **not imported** by the sync scripts. Runtime venue creation is entirely driven by ESPN API data.

The static files serve as:
- A reference for expected venue names and coordinates
- Potential future use for bulk venue seeding or validation
- Documentation of all team home arenas

### Common enrichment logs

| Log | Meaning |
|---|---|
| `✅ Enriched venue: TD Garden, Boston` | New venue created, coordinates + image found |
| `⚠ Could not enrich venue: Unnamed Arena` | Venue created but Nominatim/Wikimedia returned nothing |
| _(no venue log)_ | Venue already existed in DB — reused existing row |

---

## ESPN API Reference

Base URL: `https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard`

### Supported Paths

| Sport | ESPN Path | Season Format |
|---|---|---|
| NBA | `basketball/nba` | `2025-26` (Oct+ = start year) |
| NFL | `football/nfl` | `2025` (Sep+ = that year) |
| MLB | `baseball/mlb` | `2026` (calendar year) |
| NHL | `hockey/nhl` | `2025-26` (Oct+ = start year) |
| MLS | `soccer/usa.1` | `2026` (calendar year) |
| Premier League | `soccer/eng.1` | `2025-26` (Aug+ = start year) |
| La Liga | `soccer/esp.1` | `2025-26` |
| Bundesliga | `soccer/ger.1` | `2025-26` |
| Serie A | `soccer/ita.1` | `2025-26` |
| Ligue 1 | `soccer/fra.1` | `2025-26` |

### Team Logos

All ESPN logos follow the same CDN pattern:
```
https://a.espncdn.com/i/teamlogos/{sport}/500/{abbrev}.png
```

### Cron Schedule (Current)

| Sport | Schedule (UTC) |
|---|---|
| NBA | `0 6 * * *` (6:00 AM) |
| NFL | `5 6 * * *` (6:05 AM) |
| NHL | `10 6 * * *` (6:10 AM) |
| MLB | `15 6 * * *` (6:15 AM) |
| WNBA | `20 6 * * *` (6:20 AM) |

---

## Implemented Sports

- [x] **NBA** — `sync-nba.ts` (2026-03-28)
- [x] **NFL** — `sync-nfl.ts` (2026-03-31)
- [x] **MLB** — `sync-mlb.ts` (2026-04-02)
- [x] **NHL** — `sync-nhl.ts` (2026-04-02)
- [ ] **WNBA** — `sync-wnba.ts` (2026-04-02)
- [ ] **NCAA Football** — `football/college-football`
- [ ] **NCAA Basketball** — `basketball/mens-college-basketball`
- [ ] **WNCAA Basketball** — `basketball/womens-college-basketball`
- [ ] **NCAA Hockey** — `hockey/mens-college-hockey`
- [ ] **WNCAA Hockey** — `hockey/womens-college-hockey`
- [ ] **NCAA Baseball** — `baseball/college-baseball`
- [ ] **NCAA Softball** — `baseball/college-softball`
- [ ] **MLS** — `soccer/usa.1`
- [ ] **NWSL** — `soccer/usa.nwsl`
- [ ] **English Premier League** — `soccer/eng.1`
- [ ] **Spanish LaLiga** — `soccer/esp.1`
- [ ] **UEFA Champions League** — `soccer/uefa.champions`
- [ ] Premier League

---

## ESPN Playoff & Season Metadata

> **Status:** ✅ Implemented. `season_type` and `round` columns added via migration `015_season_type_round.sql`. Sync/backfill scripts extract these automatically. UI badges render on logbook and add-log cards.

ESPN provides consistent season metadata across all sports via these fields on each scoreboard event:

### Available Fields

| Field | Regular Season | Postseason | Available In |
|---|---|---|---|
| `season.type` | `2` | `3` | ✅ All sports |
| `season.slug` | `"regular-season"` | `"post-season"` | ✅ All sports |
| `competitions[0].notes[0].headline` | `[]` (empty) | Round name (see below) | ✅ All sports |
| `competitions[0].type.abbreviation` | `"STD"` | `"QTR"`, `"SEMI"`, etc. | ✅ All sports |
| `competitions[0].series` | `undefined` | Series data (wins, total) | ✅ Series sports only (MLB, NBA, NHL) |
| `week` | Week number | Playoff week | ⚠️ NFL only |

### Season Type Values

| `season.type` | Meaning |
|---|---|
| `1` | Preseason |
| `2` | Regular Season |
| `3` | Postseason |
| `4` | Offseason |
| `5` | Play-In (NBA-specific) |

### Notes Headline Examples (Actual ESPN Output)

The `competitions[0].notes[0].headline` field uses **ordinal** round names:

| Sport | Example Headlines |
|---|---|
| NFL | `"Wild Card"`, `"Divisional"`, `"NFC Championship"`, `"Super Bowl LX"` |
| NBA | `"East Conf Semifinals - Game 3"`, `"NBA Finals - Game 7"` |
| NHL | `"East 1st Round - Game 1"`, `"West 2nd Round - Game 3"`, `"Stanley Cup Final - Game 4"` |
| MLB | `"ALDS - Game 5"`, `"World Series - Game 1"` |

### Schema (Applied)

Migration `015_season_type_round.sql`:
```sql
ALTER TABLE sports_events
  ADD COLUMN season_type INTEGER DEFAULT 2,  -- 1=preseason, 2=regular, 3=postseason
  ADD COLUMN round TEXT;                     -- from notes headline
```

### UI Badge Mapping

The `getSeasonBadge()` function (in `logbook.tsx` and `add-log.tsx`) maps round strings to compact badges using a **universal R1/R2/R3/FIN** system. Checks are ordered bottom-up (R1→R2→R3→FIN) to avoid substring false positives (e.g. "Semifinals" contains "finals").

| ESPN Round | Badge | Color |
|---|---|---|
| Wild Card / 1st Round / First Round | `R1 G3` | 🟠 orange |
| Divisional / Semis / 2nd Round / ALDS | `R2 G5` | 🟠 orange |
| Conference Championship / Conf Finals | `R3 G4` | 🟠 orange |
| Super Bowl / NBA Finals / Stanley Cup / World Series | `FIN G7` | 🟡 gold |
| Preseason (type 1) | `PRE` | 🟢 green |
| Play-In (type 5) | `PIN` | 🟠 orange |
| Regular season (type 2) | *(no badge)* | — |

### Search API Enrichment

The search API (`api/events/search.ts`) enriches RPC results with `season_type`/`round` from `sports_events` directly if the RPC doesn't return them, ensuring badges always work regardless of RPC function version.

---

## Testing Strategy

When adding a new sport **or modifying sync/display logic**, test across all three season types. ESPN structures its data differently per season type and edge cases vary.

### Required Test Matrix

For each sport, verify all three season types work end-to-end:

| Test | Preseason | Regular Season | Postseason |
|---|---|---|---|
| ESPN API returns data | ✅ | ✅ | ✅ |
| Games sync to Supabase correctly | ✅ | ✅ | ✅ |
| Venue auto-enrichment works | ✅ | ✅ | ✅ |
| Box score loads and renders | ⚠️ (scores may be partial) | ✅ | ✅ |
| Event detail modal displays correctly | ✅ | ✅ | ✅ |
| International/neutral venue handling | — | ✅ (London, Mexico City) | ✅ (Super Bowl, etc.) |

### How to Test Season Types

**Sync script (daily ±7 days):** Depends on time of year. If the sport is in offseason, sync will return 0 games — this is expected.

**Backfill script:** Use date ranges that cover each season type:

| Sport | Preseason Dates | Regular Season Dates | Postseason Dates |
|---|---|---|---|
| NFL | Aug 1 – Sep 5 | Sep 5 – Jan 5 | Jan 5 – Feb 20 |
| NBA | Oct 1 – Oct 20 | Oct 20 – Apr 15 | Apr 15 – Jun 25 |
| MLB | Feb 20 – Mar 25 | Mar 25 – Oct 1 | Oct 1 – Nov 5 |
| NHL | Sep 15 – Oct 10 | Oct 10 – Apr 15 | Apr 15 – Jun 25 |

### Spot-Check Queries

After backfill, verify data in admin portal or Supabase:

```sql
-- Count games by season type (once season_type column is added)
SELECT season_type, COUNT(*) FROM sports_events WHERE league = 'NFL' GROUP BY season_type;

-- Check for playoff games with round names (once round column is added)
SELECT e.title, se.round FROM events e JOIN sports_events se ON se.event_id = e.id
WHERE se.league = 'NFL' AND se.season_type = 3 LIMIT 10;

-- Until those columns exist, verify by date range in admin portal
```

### Box Score Validation

The box score API (`/api/events/box-score`) returns sport-specific stat categories:

| Sport | Categories | Key Labels |
|---|---|---|
| NBA | 1 category | MIN, PTS, REB, AST, STL, BLK |
| NFL | 10 categories | passing (C/ATT, YDS, TD), rushing (CAR, YDS, TD), receiving (REC, YDS, TD), etc. |
| MLB | TBD | batting (AB, R, H, RBI), pitching (IP, H, R, ER, K) |
| NHL | TBD | skating (G, A, PTS, +/-), goaltending (SA, SV, SV%) |

When adding a new sport, expand a box score for at least one completed game and verify the stat table renders correctly with the generic category renderer.
