# Log It — Product Overview

> **Last updated:** 2026-03-26

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

1. **Structured event identity** instead of freeform notes
2. **Better browsing** than a notepad
3. **Personal collection feel**, similar to Letterboxd for movies
4. **Natural social layer**: "you and your friend were both at this event"
5. **Built-in metadata** (teams, score, venue, date, artist, etc.) makes the log feel rich immediately
6. **Companion tracking** — remember who you went with

## Implementation Strategy

Build sports first (starting with NBA) to prove the model, then expand across event types. The architecture is designed to be event-type agnostic from day one.

| Event Type | Data Source | Implementation |
|---|---|---|
| Sports (NBA) | Ball Don't Lie API | **First implementation** |
| Sports (MLB/NFL/NHL) | TheSportsDB / API-Sports | Later |
| Movies | TMDB API | v2.0+ |
| Concerts | Ticketmaster API | v2.0+ |
| Restaurants | Google Places / Foursquare | v2.0+ |
| Manual / Custom | User-created | v2.0+ |

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
| **Sports logos** | TheSportsDB, API-Sports | Store locally in Supabase (finite set of teams) |
| **Sports data/scores** | Ball Don't Lie (NBA) | Ingested via Vercel cron functions |
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
- 🎭 Theater
- 🍽️ Restaurants
- 🎵 Concerts
- 🎯 Custom events

**Long-term idea:** Log It becomes a general "log experiences" platform, but sports should prove the model first.

## Naming Note

The name works because it matches the intended user action: **"Log it."**
