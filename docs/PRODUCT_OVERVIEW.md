# Log It — Product Overview

> **Last updated:** 2026-04-02
> **Changes:**
> - 2026-04-02: Merged restaurants & nightlife into "Dining & Nightlife". Added theater. Custom logs will support real venue tagging via Google Places.
> - 2026-03-29: Migrated primary sports data source from Ball Dont Lie to ESPN API for high-resolution team logos and better backend data stability.
> - 2026-03-28: Emphasized that events map to real-world canonical objects (APIs) rather than manual text entry.
> - 2026-03-27: Added nightlife (clubs, bars, nights out) as a future event type.

## One-Line Concept

A mobile-first app for logging the experiences you attend — sports games, concerts, movies, restaurants, and more — with structured event data, a personal logbook, and lightweight social discovery.

---

## Product Vision

Log It turns messy notes into a clean, searchable history of real-life experiences. Instead of manually tracking events in Notes or spreadsheets, users can log structured events, revisit them later, and eventually discover overlap with friends.

## Core Positioning

| Dimension | Detail |
|---|---|
| **Primary use case** | Track the events and experiences you attend |
| **Emotional value** | Memory, collection, identity, fandom |
| **Functional value** | Searchable logbook with filters, stats, and event details |

## Product Personality

The app should feel like:

- 🏛️ A **memory vault** — preserving your live experiences
- 📊 A **personal stats page** — quantifying your attendance
- 📝 A **cleaner, structured version** of keeping notes manually
- 🌍 A **discovery platform** — see what others are experiencing

## Key User Problem

People who attend many events often track them in Notes, spreadsheets, photos, ticket apps, or memory. Those methods are:

- **Fragmented** — scattered across multiple apps
- **Unstructured** — no metadata like score, venue, teams, artists
- **Hard to filter** — can't quickly answer "how many games did I go to this year?"
- **Hard to revisit** — no timeline, no map, no stats

## Why This Is Compelling

1. **Structured, shared event identity** instead of freeform notes. You are linking to a canonical, real-world database object via an API, which allows universal overlaps with friends (e.g., you both tagged the actual `TMDB-12345` movie object). Manual entry is strictly a fallback.
2. **Better browsing** than a notepad
3. **Personal collection feel**, similar to Letterboxd for movies
4. **Natural social layer**: "you and your friend were both at this event"
5. **Built-in metadata** (teams, score, venue, date, artist, etc.) makes the log feel rich immediately
6. **Companion tracking** — remember who you went with

## Implementation Strategy

Build sports first (starting with NBA) to prove the model, then expand across event types. The architecture is designed to be event-type agnostic from day one.

**Core Philosophy:** When adding an event, the user *must* search an API database by default (search TMDB for movies, Google Places for restaurants). They do not just type "I saw a movie" into a blank box. This enforces data cleanliness and powers the social discovery engine.

| Event Type | Data Source | Implementation |
|---|---|---|
| Sports (NBA) | ESPN API | **First implementation** |
| Sports (MLB/NFL/NHL) | ESPN API | Later |
| Movies | TMDB API | v2.0+ |
| Concerts | Ticketmaster API | v2.0+ |
| Theater | Ticketmaster / SeatGeek | v2.0+ |
| Dining & Nightlife | Google Places / Foursquare | v2.0+ |
| Custom | User-created + optional Google Places venue tagging | v2.0+ |

## MVP Goals

1. ✅ Let a user **create an account** and onboard quickly
2. ✅ Let a user **search for an event** from a structured database
3. ✅ Let a user **log that they attended** the event
4. ✅ Let a user **browse all past logs** in a clean personal logbook
5. ✅ Let a user **view event details** with rich context
6. ✅ Let a user optionally **share logs publicly or keep them private**
7. ✅ Let a user see a **lightweight feed** of their own activity and everyone's public logs
8. ✅ Let a user **tag companions** — who they went with
9. ✅ Let a user **comment** on public logs

## MVP Additions

- 📸 **Photo uploads** — Users can attach photos per log entry (stored in Supabase Storage)
- 🔔 **Notifications** — Part of MVP:
  - Upcoming event reminders (configurable timing)
  - Post-event prompt to add photos, rating, and notes
  - Comment and companion tag alerts
- 👥 **Companions** — Tag friends or enter freeform names for who you went with
- 💬 **Comments** — Comment on any public log

## External Media & Data APIs

Event images and data are sourced from free external APIs:

| Category | API | Strategy |
|---|---|---|
| **Sports logos** | ESPN API | Scraped dynamically via ESPN APIs |
| **Sports data/scores** | ESPN API | Ingested via Vercel cron functions (`api/cron/sync-nba`) |
| **Movie posters + data** | TMDB | Fetched on-demand via API |
| **Concert/artist photos + data** | Ticketmaster, Muzooka | Fetched on-demand |
| **Restaurant data** | Google Places ($200/mo free), Foursquare (10k free calls) | Fetched on-demand |
| **Fallback images** | Unsplash API | Generic event imagery |

## Admin Backend Portal

| Phase | Approach |
|---|---|
| **MVP** | Use Supabase dashboard for user/data inspection and moderation |
| **Later** | Custom admin portal (Next.js) for cleaner navigation and moderation workflows |

Admin needs: view users, view logs + attached events, view uploaded photos, review public/private content, inspect growth and event activity, moderate comments/photos later.

## Event Discovery & Reviews (Future)

A key future expansion is turning events into **discovery surfaces**, not just logs.

**Concept:** Users can tap into an event (or artist/team) and see aggregated experiences — reviews, photos, notes, overall sentiment.

**Important model distinction:**
- Sports events are **time-specific** (one game = one instance)
- Concerts/movies are **repeatable entities** (same artist, multiple showings)

The data model should support both **Event Instance** (specific game/date) and **Event Entity** (artist, movie, team) to enable this.

## Future Expansion (Post-MVP)

Not for MVP, but the long-term vision:

- 🎬 Movies
- 🎭 Theater (Broadway, plays, musicals)
- 🎵 Concerts
- 🍽️ Dining & Nightlife — restaurants, bars, clubs, nights out (merged into one category)
- 🎯 Custom events — versatile logs with optional real venue tagging (e.g., golf courses, parks, gyms via Google Places)

**Long-term idea:** Log It becomes a general "log experiences" platform, but sports should prove the model first. Dining & nightlife is a high-engagement category — people naturally want to share meals and nights out, see where friends are going, and check out venues before they go. Custom events with venue tagging extend this to any real-world activity.

## Naming Note

The name works because it matches the intended user action: **"Log it."**
