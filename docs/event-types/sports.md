# Adding New Sports Leagues

> **Last updated:** 2026-03-31
> **Changes:**
> - 2026-03-31: Initial document. Documents the pattern for adding NFL as the second sport, establishing the reusable workflow for future leagues.

## Overview

Each sport in LogIt follows a repeatable pattern: **ESPN sync script → Supabase events/sports_events → client-side team browse**. The shared utility (`server-lib/espn.ts`) handles all common ESPN logic; each sport only provides a thin config.

---

## File Checklist

When adding a new sport, create/modify these files:

| # | File | Type | Purpose |
|---|---|---|---|
| 1 | `server-lib/{sport}-venues.ts` | NEW | Static venue mapping (stadiums/arenas for the league) |
| 2 | `api/cron/sync-{sport}.ts` | NEW | Daily sync script (thin wrapper around `espn.ts`) |
| 3 | `api/cron/backfill-{sport}.ts` | NEW | One-time historical backfill (run manually after sync is verified) |
| 4 | `server-lib/espn.ts` | — | No changes needed (shared utility) |
| 5 | `app/(tabs)/add-log.tsx` | MODIFY | Add team array + flip `active: true` in `SUPPORTED_SPORTS` |
| 6 | `vercel.json` | MODIFY | Add cron job + function config |
| 7 | This doc (`docs/event-types/sports.md`) | MODIFY | Record the new sport's config details |

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
const NFL_CONFIG: SportConfig = {
  sport: 'football',
  league: 'NFL',
  espnPath: 'football/nfl',
  venueType: 'stadium',
  deriveSeason: deriveNFLSeason,
};
```

The handler calls `fetchESPNScoreboard(config.espnPath)` → loops through games → `upsertESPNGame(supabase, game, config)`. See `sync-nfl.ts` for reference.

### 3. Create Backfill Script

File: `api/cron/backfill-{sport}.ts`

Uses ESPN's season/week params to fetch historical data. **Do not run until the sync script is verified.** Pattern:
- NFL: iterate seasontype (1-3) × weeks
- NBA: iterate by date range (already done via BDL)
- MLB: iterate by date range (many games per day)

### 4. Add Client-Side Team Data

In `app/(tabs)/add-log.tsx`:

1. Add team array (name, short, abbrev, logo URL):
   ```ts
   const NFL_TEAMS = [
     { name: 'Arizona Cardinals', short: 'Cardinals', abbrev: 'ari' },
     // ...
   ].map(t => ({ ...t, logo: `https://a.espncdn.com/i/teamlogos/nfl/500/${t.abbrev}.png` }));
   ```

2. Flip `active: true` for the sport in `SUPPORTED_SPORTS`

3. In the team grid rendering, select the right array:
   ```ts
   const teams = selectedSport === 'nfl' ? NFL_TEAMS : NBA_TEAMS;
   ```

### 5. Configure Vercel

In `vercel.json`, add:
- Function config: `"api/cron/sync-{sport}.ts": { "maxDuration": 60 }`
- Cron: `{ "path": "/api/cron/sync-{sport}", "schedule": "X 6 * * *" }`

Offset cron times by 5 minutes per sport to avoid parallel runs.

### 6. Test

1. **Sync first:** `curl http://localhost:3000/api/cron/sync-{sport}` — verify games appear in admin portal
2. **App browse:** Sports → tap league → team grid → tap team → games load
3. **Backfill:** Only after sync is confirmed working

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

---

## Implemented Sports

- [x] **NBA** — `sync-nba.ts` (2026-03-28)
- [x] **NFL** — `sync-nfl.ts` (2026-03-31)
- [ ] MLB
- [ ] NHL
- [ ] MLS
- [ ] Premier League
