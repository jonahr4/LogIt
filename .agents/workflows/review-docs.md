---
description: Review and understand the full LogIt documentation suite
---

# LogIt — Documentation Review Guide

This workflow explains every documentation file in the project, what it covers, and when to reference or update each one.

---

## Core Planning Docs (`docs/`)

These are the project's source of truth. Read them to understand the full system.

### [`PRODUCT_OVERVIEW.md`](file:///Users/jonahrothman/Desktop/Workspace/LogIt/docs/PRODUCT_OVERVIEW.md)
**What it is:** The "why" and "what" of LogIt — vision, positioning, target audience, MVP scope, and future direction.

**Read this to understand:**
- What LogIt is (Letterboxd for live events, starting with sports)
- Who it's for and why it exists
- What's in the MVP vs. what's planned for later
- Core product principles and non-goals

**Key decisions documented:** Polymorphic event model (sports first, then movies/concerts/etc.), NBA-first → multi-sport expansion.

---

### [`DATA_MODELS.md`](file:///Users/jonahrothman/Desktop/Workspace/LogIt/docs/DATA_MODELS.md)
**What it is:** Complete database schema — every table, column, type, index, and relationship.

**Read this to understand:**
- The polymorphic `events` → `sports_events` / `movie_events` pattern
- How users, logs, companions, and venues relate
- All Supabase migrations and what they do
- RLS policy decisions

**Update when:** Any database field is added/removed/renamed, new child tables are created, or query patterns change.

---

### [`TECH_STACK.md`](file:///Users/jonahrothman/Desktop/Workspace/LogIt/docs/TECH_STACK.md)
**What it is:** Architecture decisions and technology choices — React Native + Expo, Supabase, Firebase Auth, Vercel serverless, ESPN API.

**Read this to understand:**
- Why each technology was chosen
- Folder structure and what each directory contains
- How the client, API, and database connect
- State management approach (Zustand stores)

---

### [`UI_AND_FLOWS.md`](file:///Users/jonahrothman/Desktop/Workspace/LogIt/docs/UI_AND_FLOWS.md)
**What it is:** Every screen, navigation flow, and design system token.

**Read this to understand:**
- Tab structure (Feed, Logbook, Add Log, Search, Profile)
- The "Spatial Green v2" design language (glassmorphism, floating nav, atmospheric orbs)
- Component hierarchy and reusable UI patterns
- User flows: search → log → view → edit → delete

**Reference dir:** `docs/ui-reference/` contains mockup images; `docs/ui-variations/` has design exploration screenshots.

---

### [`API_DESIGN.md`](file:///Users/jonahrothman/Desktop/Workspace/LogIt/docs/API_DESIGN.md)
**What it is:** Every Vercel API endpoint — URL, method, request/response shapes, error codes, auth requirements.

**Read this to understand:**
- Search API (`/api/events/search`) with fuzzy matching and pagination
- Box score API (`/api/events/box-score`) — now multi-sport via `league` param
- Log CRUD endpoints (`/api/logs/create`, `/api/logs/mine`, `/api/logs/delete`)
- Cron jobs (`/api/cron/sync-nba`, `/api/cron/sync-nfl`)
- Error code conventions (VALIDATION_ERROR, UNAUTHORIZED, CONFLICT, etc.)

---

### [`FEATURE_ROADMAP.md`](file:///Users/jonahrothman/Desktop/Workspace/LogIt/docs/FEATURE_ROADMAP.md)
**What it is:** Phased feature breakdown with checklists — what's done, what's in progress, what's next.

**Read this to understand:**
- Current progress (Phases 1–5 complete)
- What's shipping next (multi-sport expansion, feed, friends)
- Priority matrix and decision rationale

**Update when:** A feature is completed (check it off) or reprioritized.

---

### [`SOCIAL_FEATURES.md`](file:///Users/jonahrothman/Desktop/Workspace/LogIt/docs/SOCIAL_FEATURES.md)
**What it is:** Privacy model, friend system design, notification approach, and social layer architecture.

**Read this to understand:**
- Privacy levels (public, friends-only, private) and how they're enforced
- Planned friend system (send/accept, mutual, blocking)
- Feed algorithm design
- Notification triggers and delivery channels

---

### [`EXTERNAL_SERVICES.md`](file:///Users/jonahrothman/Desktop/Workspace/LogIt/docs/EXTERNAL_SERVICES.md)
**What it is:** How LogIt ingests data from external APIs — ESPN for sports, future TMDB for movies, etc.

**Read this to understand:**
- ESPN API endpoints, rate limits, and data shapes
- Venue auto-enrichment (Nominatim + Wikimedia Commons)
- The shared `server-lib/espn.ts` utility and `SportConfig` pattern
- Per-sport sync strategy (cron scheduling, backfill approach)

---

### [`ADMIN_DASHBOARD.md`](file:///Users/jonahrothman/Desktop/Workspace/LogIt/docs/ADMIN_DASHBOARD.md)
**What it is:** Setup, features, and policies for the static HTML admin portal.

**Read this to understand:**
- How to set up and access the admin dashboard (`admin/index.html`)
- Venue and Games tab features (filters, search, sort, pagination)
- Image lightbox and URL editing
- RLS policies for anon access
- Venue auto-enrichment pipeline and backfill scripts

---

## Event Type Workflows (`docs/event-types/`)

These are **living workflow documents** for adding new event types. Each file is a step-by-step recipe.

### [`sports.md`](file:///Users/jonahrothman/Desktop/Workspace/LogIt/docs/event-types/sports.md)
**What it is:** Step-by-step instructions for adding a new sports league to LogIt.

**Follow this when:** Adding NFL, MLB, NHL, MLS, Premier League, or any new sport.

**What it covers:**
1. File checklist (venues, sync script, backfill, client teams, vercel.json, docs)
2. `SportConfig` interface and ESPN paths
3. Season format conventions per sport
4. Client-side team array and `SUPPORTED_SPORTS` flag
5. Testing workflow (sync first → verify → then backfill)
6. Cron scheduling strategy (offset by 5 min per sport)
7. ESPN API reference table with paths for 10 leagues
8. Team logo CDN pattern
9. Tracker of which sports are implemented
10. **ESPN playoff/season metadata** — what fields exist, planned `season_type` + `round` DB columns, planned UI pill changes
11. **Comprehensive testing strategy** — required test matrix (preseason/regular/postseason for all sports), date ranges, spot-check SQL, box score validation

**Update after:** Every new sport is added — check it off and add any new learnings.

### Future event type docs (planned)
- `movies.md` — TMDB API ingestion, movie_events child table
- `concerts.md` — Ticketmaster/Songkick API, concert_events child table

---

## Other Documentation

### [`README.md`](file:///Users/jonahrothman/Desktop/Workspace/LogIt/README.md)
**What it is:** Front-facing project presentation. Not for internal planning — for anyone visiting the repo.

**Contains:** Icon, badges, features table, tech stack, architecture tree, setup guide, env vars, doc links, roadmap status, and a timestamped changelog at the bottom.

**Update when:** Major feature shipped, new sport added, tech stack changed. Add a row to the Changelog table.

### [`.agents/workflows/update-docs.md`](file:///Users/jonahrothman/Desktop/Workspace/LogIt/.agents/workflows/update-docs.md)
**What it is:** Cross-reference guide for which docs to update when specific changes happen.

**Contains:** A matrix of "if X changed → update Y docs", format consistency rules, and README update policy.

### [`supabase/migrations/`](file:///Users/jonahrothman/Desktop/Workspace/LogIt/supabase/migrations/)
**What it is:** Numbered SQL migration files. Each one is a single schema change applied to Supabase.

**Convention:** Files are numbered `001_`, `002_`, etc. Run them in order via the Supabase SQL Editor. Never edit a migration that's been applied — create a new one instead.

---

## Quick Reference: When to Read What

| I need to... | Read |
|---|---|
| Understand what LogIt is | `PRODUCT_OVERVIEW.md` |
| See the database schema | `DATA_MODELS.md` |
| Know the API endpoints | `API_DESIGN.md` |
| Add a new sport | `docs/event-types/sports.md` |
| Update database fields | `DATA_MODELS.md` then run migration |
| Change UI / add a screen | `UI_AND_FLOWS.md` |
| Set up the admin portal | `ADMIN_DASHBOARD.md` |
| Understand ESPN integration | `EXTERNAL_SERVICES.md` |
| Check feature progress | `FEATURE_ROADMAP.md` |
| Update the README | `README.md` (changelog at bottom) |
| Know which docs to update | `.agents/workflows/update-docs.md` |
