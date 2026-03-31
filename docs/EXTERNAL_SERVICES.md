# Log It — External Services & Data Ingestion

> **Last updated:** 2026-03-31
> **Changes:**
> - 2026-03-31: NFL ingestion implemented via shared ESPN integration (`server-lib/espn.ts`). Updated ingestion map to show NFL as MVP. Added NFL sync section.
> - 2026-03-29: Added Strategy C — client-side ESPN live score fetch for non-completed sports events.
> - 2026-03-29: Fixed stale BDL section headers and env var references to match ESPN-only ingestion.
> - 2026-03-29: Replaced Ball Dont Lie with ESPN API entirely for both NBA game data and high-res sports team logos. Added Wikipedia venue scraping for static photo mappings.
> The definitive reference for how LogIt sources event data. Each event type has a different ingestion strategy depending on data volume, API cost, and nature of the data.

## Design Principles

1. **Canonical events are shared** — Every event a user logs must map to a record in our `events` table so multiple users can reference the same real-world event.
2. **Choose the right ingestion strategy per event type** — Finite, scheduled data (sports) should be pre-ingested. Unbounded, on-demand data (restaurants) should be fetched live.
3. **Minimize external API calls** — Pre-ingest where possible. Cache aggressively. Never call an external API on every user keystroke.
4. **Deduplication via `external_id`** — Every event has an `external_id` + `external_source` pair. If an event already exists in our DB, we reuse it.
5. **Graceful fallback** — If an API is down or a result isn't found, users can always create a manual event (`event_type = 'manual'`).

---

## Ingestion Strategies

There are three patterns used across event types:

### Strategy A: Pre-Ingest via Cron (Store Everything)

```
Vercel Cron → External API → Supabase events table
User searches → Supabase (our own DB)
```

**Best for:** Data with a **finite, known schedule** (sports seasons, movie release calendars).

| Advantage | Detail |
|---|---|
| Fast search | Users query our Postgres with full-text search — no external API latency |
| Low API usage | 1 cron call/day vs. hundreds of user searches |
| Reliable | Search works even if external API goes down |
| Shared events | Events exist before anyone logs them — perfect for "shared attendance" |

**Trade-off:** Slightly more DB storage (negligible — e.g. ~1,230 NBA games/season).

**Data freshness note:** The nightly cron captures final scores. For **live score display**, see Strategy C below.

---

### Strategy B: On-Demand via Live API (Store on Log)

```
User searches → Vercel API → External API → results shown
User logs → Vercel API → upsert into Supabase events table
```

**Best for:** Data that is **unbounded or location-specific** (restaurants, nightlife venues).

| Advantage | Detail |
|---|---|
| No storage overhead | Only stores events users actually log |
| Location-aware | Can pass user's city/coordinates to external API |
| Always fresh | Results come directly from the source |

**Trade-off:** Slower search (external API round-trip), higher API usage, search breaks if external API is down.

---

### Strategy C: Client-Side Live Fetch (Display Overlay Only)

```
User opens event detail → App fetches ESPN directly → Score overlaid on UI (no DB write)
Nightly cron → Writes final score into DB
```

**Best for:** Surfacing **live or recently concluded** scores for pre-ingested events without requiring a server round-trip.

| Advantage | Detail |
|---|---|
| No server needed | Client calls ESPN's public, unauthenticated API directly |
| No API key exposed | ESPN scoreboard/summary APIs require no credentials |
| Zero DB load | Display-only — never writes back |
| Seamless UX | User sees the real score immediately when opening a log |

**How it works in LogIt:** When a user opens `EventDetailModal` for a sports event that is not yet marked `FINAL` in our DB, the app fires a one-shot `fetch` to `site.api.espn.com/apis/site/v2/sports/{sport}/{league}/summary?event={external_id}`. The fresh score and status (e.g. `"4th QTR 2:30"` or `"FINAL"`) are merged on top of the DB data — display only. The nightly cron job eventually persists the final result into the DB. If the fetch fails, the UI silently falls back to the DB data.

**Condition for trigger:** `status !== 'FINAL' && external_id is present && event is sports type`

---

## Event Types — Ingestion Map

| Event Type | Strategy | External API | Status | DB Table |
|---|---|---|---|---|
| **Sports (NBA)** | A Pre-Ingest | ESPN API | **Implemented** | `events` + `sports_events` |
| **Sports (NFL)** | A Pre-Ingest | ESPN API | **Implemented** | `events` + `sports_events` |
| **Sports (MLB/NHL)** | A Pre-Ingest | ESPN API | v1.5 | `events` + `sports_events` |
| **Movies** | 🅰️ Pre-Ingest | TMDB | v2.0 | `events` + `movie_events` |
| **Concerts** | 🅱️ On-Demand | Ticketmaster Discovery | v2.0 | `events` + `concert_events` |
| **Restaurants** | 🅱️ On-Demand | Google Places / Foursquare | v2.0 | `events` + `restaurant_events` |
| **Nightlife** | 🅱️ On-Demand | Google Places / Yelp | v2.0 | `events` + `nightlife_events` |
| **Manual / Custom** | N/A | None | v2.0 | `events` only |

---

## Detailed Breakdown by Event Type

### 🏀 Sports — NBA (MVP)

| Detail | Value |
|---|---|
| **API** | ESPN API |
| **Strategy** | Pre-Ingest via Vercel cron |
| **Env key** | N/A (unauthenticated) |
| **Free tier** | Yes — free, undocumented API |
| **SDK** | Built-in native `fetch` |
| **Data volume** | ~1,230 games/season |
| **Season field** | Derived from the date or ESPN scoreboard endpoint |

#### Cron Job: Daily NBA Sync

| Field | Value |
|---|---|
| **Schedule** | Every day at 6:00 AM UTC (`0 6 * * *`) |
| **Endpoint** | `api/cron/sync-nba.ts` |
| **Logic** | Fetch games for today ± 7 days from ESPN. Upsert into `events` + `sports_events`. Update scores for completed games. |
| **Dedup key** | `external_id = ESPN game ID`, `external_source = 'espn'` |

#### ESPN API → LogIt Mapping

| ESPN Field | LogIt Field | Table |
|---|---|---|
| `id` | `external_id` | `events` |
| `'espn'` | `external_source` | `events` |
| `name` | `title` | `events` |
| `date` | `event_date` | `events` |
| `status.type.state` ("post" / "in" / "pre") | `status` | `events` |
| `home_team.city` | `venue_city` | `events` |
| `home_team.id` | `home_team_id` | `sports_events` |
| `visitor_team.id` | `away_team_id` | `sports_events` |
| `home_team.full_name` | `home_team_name` | `sports_events` |
| `visitor_team.full_name` | `away_team_name` | `sports_events` |
| `home_team_score` | `home_score` | `sports_events` |
| `visitor_team_score` | `away_score` | `sports_events` |
| `season` | `season` (formatted as `"2025-26"`) | `sports_events` |
| `'basketball'` | `sport` | `sports_events` |
| `'NBA'` | `league` | `sports_events` |

#### ESPN Endpoints Used

| Endpoint | Purpose | Tier |
|---|---|---|
| `GET /apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD` | Get games by date (scores, status, teams) | Free |
| `GET /apis/site/v2/sports/basketball/nba/summary?event=ID` | Get detailed box score for a game | Free |
| `GET /apis/site/v2/sports/basketball/nba/teams` | Get all NBA teams (logos, names, IDs) | Free |

#### User Search Flow (MVP)

```
User types "Celtics" in Add Log
  → Full-text search on our events table (title, venue)
  → Results: all Celtics games already in our DB
  → User taps a game → opens Edit Log Modal
  → User saves → creates user_event_log row
```

---

### 🏈 Sports — NFL (Implemented)

| Detail | Value |
|---|---|
| **API** | ESPN API |
| **Strategy** | Pre-Ingest via Vercel cron |
| **Env key** | N/A (unauthenticated) |
| **Free tier** | Yes — free, undocumented API |
| **Data volume** | ~272 games/season |
| **Shared logic** | `server-lib/espn.ts` (same `fetchAndUpsertGames` as NBA) |

#### Cron Job: Daily NFL Sync

| Field | Value |
|---|---|
| **Schedule** | Every day at 6:00 AM UTC (`0 6 * * *`) |
| **Endpoint** | `api/cron/sync-nfl.ts` |
| **Logic** | Same pattern as NBA — fetch games from ESPN, upsert via shared `espn.ts`. Uses `server-lib/nfl-venues.ts` for 32-team venue mapping. |
| **Dedup key** | `external_id = ESPN game ID`, `external_source = 'espn'` |

#### Backfill: `api/cron/backfill-nfl.ts`

One-time historical backfill for full NFL season. Run manually via `npx tsx api/cron/backfill-nfl.ts`.

---

### ⚾🏒 Sports — MLB / NHL (v1.5)

| Detail | Value |
|---|---|
| **API** | [TheSportsDB](https://www.thesportsdb.com/api.php) (free JSON) or [API-Sports](https://api-sports.io/) |
| **Strategy** | Pre-Ingest (same as NBA) |
| **Data volume** | MLB ~2,430 games, NFL ~272, NHL ~1,312 per season |
| **Implementation** | Separate cron job per league, same `events` + `sports_events` tables |

> Same pattern as NBA. Each league gets its own cron job with league-specific API mapping. The `sport` and `league` fields on `sports_events` distinguish them.

---

### 🎬 Movies (v2.0)

| Detail | Value |
|---|---|
| **API** | [TMDB](https://developer.themoviedb.org/docs) |
| **Strategy** | **Pre-Ingest** — movie release schedules are finite and published ahead of time |
| **Free tier** | Yes — free API key |
| **Data volume** | ~200-300 major releases/year (can filter by popularity) |
| **Cron schedule** | Weekly sync of upcoming + recently released movies |
| **Images** | Poster URLs via `https://image.tmdb.org/t/p/w500/{poster_path}` (free, on-demand) |

> Movies are a good fit for pre-ingest because the catalog of "movies currently in theaters" is small and well-defined. We sync popular/upcoming movies from TMDB weekly.

---

### 🎵 Concerts (v2.0)

| Detail | Value |
|---|---|
| **API** | [Ticketmaster Discovery](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) |
| **Strategy** | **On-Demand** — millions of events, highly location-dependent |
| **Free tier** | Yes — 5,000 calls/day |
| **Why on-demand** | Concert data is too large and location-specific to pre-ingest. A user in NYC doesn't need concerts in Tokyo. |
| **Search flow** | User searches → Vercel function calls Ticketmaster with query + location → results shown → on log, upsert event into DB |
| **Supplement** | [Setlist.fm](https://api.setlist.fm/docs/1.0/) for setlist data after concerts |

---

### 🍽️ Restaurants (v2.0)

| Detail | Value |
|---|---|
| **API** | [Google Places API](https://developers.google.com/maps/documentation/places/web-service) or [Foursquare](https://docs.foursquare.com/) |
| **Strategy** | **On-Demand** — millions of restaurants, entirely location-dependent |
| **Free tier** | Google: $200/month free credit. Foursquare: 10k calls/month free. |
| **Why on-demand** | Impossible to pre-ingest all restaurants. Must search by user's location. |
| **Search flow** | User types restaurant name → Vercel function queries Google Places with text + lat/lng → results shown → on log, upsert into DB |

> **Note:** Restaurant "events" are unique — they're more like venue visits than time-bound events. The `event_date` is when the user went, not a scheduled event. No child table fields map to an API "event" — the Places API provides venue metadata (cuisine, price, photos).

---

### 🍸 Nightlife (v2.0)

| Detail | Value |
|---|---|
| **API** | [Google Places](https://developers.google.com/maps/documentation/places/web-service) / [Yelp Fusion](https://docs.developer.yelp.com/docs/fusion-intro) |
| **Strategy** | **On-Demand** — same reasoning as restaurants |
| **Free tier** | Google: $200/month free credit. Yelp: 500 calls/day free. |
| **Search flow** | Same as restaurants — search by venue name + location |

---

### ✏️ Manual / Custom (v2.0)

| Detail | Value |
|---|---|
| **API** | None |
| **Strategy** | N/A — user enters all data manually |
| **Use case** | Fallback when no API result matches, or for event types we don't support yet |
| **Implementation** | Creates an `events` row with `event_type = 'manual'`, no child table row |

---

## Media / Images

Event images are sourced separately from event data. Strategy varies:

| Category | Source | Strategy |
|---|---|---|
| **Sports team logos** | ESPN API | Fetched directly dynamically (no storage costs) |
| **Sports venues** | Wikipedia Images | Local static mapping holding Wikipedia CDN links |
| **Movie posters** | TMDB | On-demand via `image.tmdb.org` URL (free, no storage needed) |
| **Concert/artist photos** | Ticketmaster / Muzooka | On-demand via API URLs |
| **Restaurant/venue photos** | Google Places / Foursquare | On-demand via API URLs |
| **Fallback** | Unsplash API | Generic imagery (50 req/hr free) |
| **User-uploaded photos** | Supabase Storage | Stored per log in `user_event_logs.photos[]` |

---

## Environment Variables

| Variable | Used By | Required For |
|---|---|---|
| _(none for ESPN)_ | ESPN API is unauthenticated | NBA game sync (MVP) |
| `TMDB_API_KEY` | Vercel API (server-side) | Movie sync (v2.0) |
| `TICKETMASTER_API_KEY` | Vercel API (server-side) | Concert search (v2.0) |
| `GOOGLE_PLACES_API_KEY` | Vercel API (server-side) | Restaurant/nightlife search (v2.0) |
| `FOURSQUARE_API_KEY` | Vercel API (server-side) | Restaurant search alt (v2.0) |

> **All API keys are server-side only** (no `EXPO_PUBLIC_` prefix). External APIs are never called from the client — always through Vercel functions.

---

## Cost Summary

| Event Type | API Calls/Day (estimated) | Monthly Cost |
|---|---|---|
| **Sports (NBA)** | ~1 cron call/day | **$0** (free tier) |
| **Sports (all 4 leagues)** | ~4 cron calls/day | **$0** |
| **Movies** | ~1 cron call/week | **$0** |
| **Concerts** | User-driven (~50-200/day at scale) | **$0** (5k/day free) |
| **Restaurants** | User-driven (~50-200/day at scale) | **$0** ($200/mo credit) |
| **Nightlife** | User-driven (~20-50/day at scale) | **$0** |
| **Total at MVP** | ~1/day | **$0/month** |
| **Total at scale (v2.0)** | ~500/day | **$0/month** (within free tiers) |
