# Log It — Admin Dashboard

> **Last updated:** 2026-03-31
> **Changes:**
> - 2026-03-31: Updated for multi-sport support (NFL). League filters now dynamically include NFL alongside NBA.
> - 2026-03-31: Initial document.

## Overview

The admin dashboard is a **static HTML/CSS/JS portal** located in `admin/index.html`. No build tools, no npm — just open the file in a browser. It connects directly to Supabase via the JS CDN client and the project's anon key.

> **Security:** Uses the Supabase anon key. Events and venues are readable by anon role (migration 013). User data, logs, and companions are still protected by authenticated-only RLS policies.

---

## Setup

1. Copy `admin/config.example.js` → `admin/config.js`
2. Fill in your Supabase URL and anon key
3. Open `admin/index.html` in any browser

`config.js` is **gitignored** — credentials never get committed.

---

## Features

### Venues Tab

Displays all venues from the `venues` table.

| Column | Description |
|---|---|
| Name | Venue name |
| City | City |
| State | State |
| Lat / Lng | Coordinates (green = populated, red = null) |
| Image | Thumbnail preview (or red "null") |
| Type | `arena`, `stadium`, etc. |
| Source | `nba` for seeded arenas, `—` for auto-created |
| Enriched | 🟢 complete, 🟡 partial, 🔴 missing |

**Filter chips:**
- **Enrichment:** All / Complete / Partial / Missing
- **Source:** All / nba / nfl / none (dynamically populated from venue data)

### Games Tab

Displays all events joined with `sports_events` child data.

| Column | Description |
|---|---|
| Title | Game title (e.g., "Lakers at Celtics") |
| Date | Formatted event date |
| Venue | Venue name |
| City | Venue city |
| Status | Pill: upcoming (green), in_progress (red), completed (orange) |
| Score | Away – Home (from `sports_events`) |
| League | NBA, etc. |
| Season | e.g., 2025-26 |
| Ext. ID | ESPN external game ID |

**Filter chips:**
- **Status:** All / upcoming / in_progress / completed
- **League:** All / NBA / NFL / (dynamically populated as leagues are added)
- **Score:** All / Has Score / No Score
- **City:** Top 8 cities by game count

### Shared Features

- **Search:** Free-text search across all visible fields
- **Sort:** Click any column header to sort (ascending/descending, indicated by ▲/▼)
- **Pagination:** 50 rows per page with full navigation (first/prev/next/last + page numbers)

---

## Venue Auto-Enrichment

When any sync script (NBA, NFL, or future sports) discovers a new venue, `findOrCreateVenue()` in `server-lib/venue-lookup.ts` automatically enriches it:

| Data | Source | Method |
|---|---|---|
| **Lat/Lng** | Nominatim (OpenStreetMap) | Geocode from venue name + city + state |
| **Image** | Wikimedia Commons | Search for venue photo, return 1280px thumbnail |

Both APIs are **free** and require **no API key**. Nominatim requires a `User-Agent` header and 1 req/sec rate limiting.

### Failure Handling

- If geocoding or image lookup fails → venue is still created with null fields
- Logged as warning: `⚠ Could not enrich venue: {name}, {city}`
- Stays in the "unenriched" pool for backfill retry

### Backfill Script

```bash
npx tsx api/scripts/backfill-venues.ts
```

- Queries venues where `lat IS NULL OR image_url IS NULL`
- **Never overwrites** existing data
- Rate-limited at 1.1s between calls (Nominatim requirement)
- Logs summary: `Enriched 34/42 venues (8 could not be found)`

---

## Files

| File | Purpose |
|---|---|
| `admin/index.html` | Main dashboard UI |
| `admin/config.js` | Supabase credentials (gitignored) |
| `admin/config.example.js` | Template for config.js |
| `server-lib/espn.ts` | Shared ESPN fetch/parse/upsert (used by NBA + NFL sync) |
| `server-lib/venue-lookup.ts` | `findOrCreateVenue()` + `enrichVenueMetadata()` |
| `api/scripts/backfill-venues.ts` | One-time venue backfill script |
| `supabase/migrations/013_anon_events_read.sql` | Anon SELECT policies on events + sports_events |

---

## RLS Policies

Migration 013 adds the following policies for admin portal access:

| Table | Policy | Role | Effect |
|---|---|---|---|
| `events` | `events_select_anon` | anon | SELECT all |
| `sports_events` | `sports_events_select_anon` | anon | SELECT all |
| `venues` | (no RLS) | — | Public by default |

User data (`user_event_logs`, `log_companions`, `users`) remains protected by `authenticated`-only policies.
