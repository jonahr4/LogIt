# Log It — External Services & Data Ingestion

> **Last updated:** 2026-03-28
> The definitive reference for how LogIt sources event data. Each event type has a different ingestion strategy depending on data volume, API cost, and nature of the data.

## Design Principles

1. **Canonical events are shared** — Every event a user logs must map to a record in our `events` table so multiple users can reference the same real-world event.
2. **Choose the right ingestion strategy per event type** — Finite, scheduled data (sports) should be pre-ingested. Unbounded, on-demand data (restaurants) should be fetched live.
3. **Minimize external API calls** — Pre-ingest where possible. Cache aggressively. Never call an external API on every user keystroke.
4. **Deduplication via `external_id`** — Every event has an `external_id` + `external_source` pair. If an event already exists in our DB, we reuse it.
5. **Graceful fallback** — If an API is down or a result isn't found, users can always create a manual event (`event_type = 'manual'`).

---

## Ingestion Strategies

There are two patterns used across event types:

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

## Event Types — Ingestion Map

| Event Type | Strategy | External API | Status | DB Table |
|---|---|---|---|---|
| **Sports (NBA)** | 🅰️ Pre-Ingest | Ball Don't Lie | **MVP** | `events` + `sports_events` |
| **Sports (MLB/NFL/NHL)** | 🅰️ Pre-Ingest | TheSportsDB / API-Sports | v1.5 | `events` + `sports_events` |
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
| **API** | [Ball Don't Lie](https://docs.balldontlie.io) |
| **Strategy** | Pre-Ingest via Vercel cron |
| **Env key** | `BALL_DONT_LIE_API` |
| **Free tier** | Yes — API key required, generous rate limits |
| **SDK** | `@balldontlie/sdk` (npm) or raw REST |
| **Data volume** | ~1,230 games/season (~15/day during season) |
| **Season field** | BDL uses start year (e.g. `2025` = the 2025-26 season) |

#### Cron Job: Daily NBA Sync

| Field | Value |
|---|---|
| **Schedule** | Every day at 6:00 AM UTC (`0 6 * * *`) |
| **Endpoint** | `api/cron/sync-nba.ts` |
| **Logic** | Fetch games for today ± 7 days from BDL. Upsert into `events` + `sports_events`. Update scores for completed games. |
| **Dedup key** | `external_id = BDL game ID`, `external_source = 'balldontlie'` |

#### BDL API → LogIt Mapping

| BDL Field | LogIt Field | Table |
|---|---|---|
| `id` | `external_id` | `events` |
| `'balldontlie'` | `external_source` | `events` |
| `home_team.full_name + " vs " + visitor_team.full_name` | `title` | `events` |
| `datetime` | `event_date` | `events` |
| `status` ("Final" / "In Progress" / future date) | `status` | `events` |
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

#### BDL Endpoints Used

| Endpoint | Purpose | Tier |
|---|---|---|
| `GET /v1/teams` | Get all NBA teams (for ID→name mapping) | Free |
| `GET /v1/games?dates[]=YYYY-MM-DD` | Get games by date | Free |
| `GET /v1/games?team_ids[]=ID` | Get games by team | Free |
| `GET /v1/games/:id` | Get single game (score updates) | Free |

#### User Search Flow (MVP)

```
User types "Celtics" in Add Log
  → Full-text search on our events table (title, venue)
  → Results: all Celtics games already in our DB
  → User taps a game → opens Edit Log Modal
  → User saves → creates user_event_log row
```

---

### ⚾🏈🏒 Sports — MLB / NFL / NHL (v1.5)

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
| **Sports team logos** | TheSportsDB / API-Sports | Download once → store in Supabase Storage (finite set of ~120 teams) |
| **Movie posters** | TMDB | On-demand via `image.tmdb.org` URL (free, no storage needed) |
| **Concert/artist photos** | Ticketmaster / Muzooka | On-demand via API URLs |
| **Restaurant/venue photos** | Google Places / Foursquare | On-demand via API URLs |
| **Fallback** | Unsplash API | Generic imagery (50 req/hr free) |
| **User-uploaded photos** | Supabase Storage | Stored per log in `user_event_logs.photos[]` |

---

## Environment Variables

| Variable | Used By | Required For |
|---|---|---|
| `BALL_DONT_LIE_API` | Vercel API (server-side) | NBA game sync (MVP) |
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
