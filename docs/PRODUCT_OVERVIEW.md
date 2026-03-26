# Log It — Product Overview

> **Last updated:** 2026-03-26

## One-Line Concept

A mobile-first app for logging the events you attend, starting with sports games, with structured event data, a personal logbook, and lightweight social discovery.

---

## Product Vision

Log It turns messy notes into a clean, searchable history of real-life experiences. Instead of manually typing a list of games you went to, users can log structured events, revisit them later, and eventually discover overlap with friends.

## Core Positioning

| Dimension | Detail |
|---|---|
| **Primary use case** | Track the sports games you attend |
| **Emotional value** | Memory, collection, identity, fandom |
| **Functional value** | Searchable logbook with filters, stats, and event details |

## Product Personality

The app should feel like:

- 🏛️ A **memory vault** — preserving your live experiences
- 🏟️ A **fandom tracker** — showing your dedication
- 📊 A **personal stats page** — quantifying your attendance
- 📝 A **cleaner, structured version** of keeping notes manually

## Key User Problem

People who attend many games often track them in Notes, spreadsheets, photos, ticket apps, or memory. Those methods are:

- **Fragmented** — scattered across multiple apps
- **Unstructured** — no metadata like score, venue, teams
- **Hard to filter** — can't quickly answer "how many Yankees games did I go to?"
- **Hard to revisit** — no timeline, no map, no stats

## Why This Is Compelling

1. **Structured event identity** instead of freeform notes
2. **Better browsing** than a notepad
3. **Personal collection feel**, similar to Letterboxd for movies
4. **Natural social layer**: "you and your friend were both at this game"
5. **Built-in metadata** (teams, score, venue, date) makes the log feel rich immediately

## MVP Focus

Start with **sports only**, beginning with the **NBA**.

| Sport | League(s) | MVP Priority |
|---|---|---|
| Basketball | NBA | ✅ **First league** |
| Baseball | MLB | Later |
| Football | NFL | Later |
| Hockey | NHL | Later |

## MVP Goals

1. ✅ Let a user **create an account** and onboard quickly
2. ✅ Let a user **search for a sports game** from a structured database
3. ✅ Let a user **log that they attended** the game
4. ✅ Let a user **browse all past logs** in a clean personal logbook
5. ✅ Let a user **view event details** with game context
6. ✅ Let a user optionally **share logs publicly or keep them private**
7. ✅ Let a user see a **lightweight feed** of their own activity (and later, friends')

## MVP Additions

- 📸 **Photo uploads** — Users can attach photos per log entry (stored in Supabase Storage)
- 🔔 **Notifications** — Part of MVP:
  - Upcoming event countdown reminders
  - Post-event prompt to log attendance
  - Friend activity notifications (later)

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
