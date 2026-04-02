# Adding New Sports Leagues

> **Last updated:** 2026-04-02
> **Changes:**
> - 2026-04-02: NHL implemented — `sync-nhl.ts`, `backfill-nhl.ts`, `nhl-venues.ts` (32 arenas). Cron at 6:10 AM UTC. Date-range backfill (Oct–Jun). Split-year season format (`2025-26`).
> - 2026-03-31: Added ESPN playoff/season metadata reference, planned `season_type` + `round` fields, and comprehensive testing strategy.
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

See the **Testing Strategy** section below. At minimum:

1. **Sync first:** Run the sync script and verify games appear in admin portal
2. **Season types:** Verify preseason, regular season, and postseason games all sync correctly
3. **App browse:** Sports → tap league → team grid → tap team → games load
4. **Box score:** Open a completed game detail → expand box score → verify stats render
5. **Backfill:** Only after sync is confirmed working across all season types

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

---

## Implemented Sports

- [x] **NBA** — `sync-nba.ts` (2026-03-28)
- [x] **NFL** — `sync-nfl.ts` (2026-03-31)
- [ ] MLB
- [x] **NHL** — `sync-nhl.ts` (2026-04-02)
- [ ] MLS
- [ ] Premier League

---

## ESPN Playoff & Season Metadata

> **Status:** Documented, not yet implemented. When implemented, add `season_type` and `round` columns to `sports_events` and update the sync/backfill scripts.

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

### Notes Headline Examples (Postseason)

The `competitions[0].notes[0].headline` field contains the specific round/game name:

| Sport | Example Headlines |
|---|---|
| NFL | `"Wild Card"`, `"Divisional"`, `"NFC Championship"`, `"Super Bowl LX"` |
| NBA | `"Western Conf Semis - Game 3"`, `"NBA Finals - Game 7"` |
| MLB | `"ALDS - Game 5"`, `"World Series - Game 1"` |
| NHL | `"Stanley Cup Final - Game 4"` |

### Planned Schema Changes

Two new columns on `sports_events`:

```sql
ALTER TABLE sports_events
  ADD COLUMN season_type INTEGER,  -- 1=preseason, 2=regular, 3=postseason
  ADD COLUMN round TEXT;           -- from notes headline, e.g. "Super Bowl LX"
```

### Planned UI Changes

On the Event Detail Modal, replace the existing league/status info pills with a **season type pill**:

- Regular season games: no extra pill (default)
- Preseason: show `Preseason` pill
- Postseason: show the round name, e.g. `Super Bowl LX`, `NBA Finals - Game 3`, `ALDS - Game 5`

The league name ("NFL", "NBA") and final status are already visible from the score bug and team logos, so those pills can be removed to reduce redundancy.

### Sync/Backfill Changes

In `server-lib/espn.ts`, update `upsertESPNGame()` to extract and store:
```ts
const seasonType = game.season?.type || 2;
const round = game.competitions?.[0]?.notes?.[0]?.headline || null;
```

This is sport-agnostic — no per-sport parsing needed.

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
