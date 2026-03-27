# Log It — Tech Stack & Architecture

> **Last updated:** 2026-03-26
> Updated: Updated project structure to match Phase 1 implementation (auth/onboarding groups, API layer, store, actual dependencies)

## Platform

| Layer | Choice | Rationale |
|---|---|---|
| **Client** | React Native (iOS-first, Android later) | Cross-platform mobile-first, fast iteration |
| **Navigation** | Expo Router | File-based routing, deep linking support |
| **Backend / API** | Vercel (serverless functions) | Integrates cleanly with serverless API layer |
| **Auth** | Firebase Authentication | Familiar, mature, Google/Apple built-in |
| **Database** | Supabase (Postgres) | Relational — natural fit for events, logs, friendships |
| **Storage** | Supabase Storage | User photos, avatars, sports team logos |
| **Event Data (Sports)** | Ball Don't Lie (NBA first) | Free, well-documented, clean NBA data |
| **Event Data (Movies)** | TMDB | Free API key, movie posters + metadata |
| **Event Data (Concerts)** | Ticketmaster Discovery API | Free, millions of events, artist data |
| **Event Media (Sports)** | TheSportsDB / API-Sports | Team logos stored locally in Supabase |
| **Event Media (Artists)** | Muzooka | Artist photos, free tier |
| **State Management** | Zustand or React Context | Lightweight, no boilerplate |
| **Language** | TypeScript | Type safety across the app |

### Rationale

- **Postgres** fits relational data (events, logs, friendships, stats) naturally
- **Supabase** provides a free tier and built-in dashboard (acts as initial admin panel)
- **Firebase Auth** keeps existing familiarity and fast setup
- **Vercel** integrates cleanly with a serverless API layer

### Initial Cost Target

**$0/month** on free tiers during MVP and early usage.

---

## Architecture Overview

```mermaid
graph TB
    subgraph Client["📱 React Native (Expo)"]
        UI[Screens & Components]
        State[State Management]
        Nav[Expo Router]
    end

    subgraph Vercel["⚡ Vercel Serverless"]
        API[API Routes]
        Cron[Scheduled Functions]
    end

    subgraph Supabase["🟢 Supabase"]
        DB[(Postgres Database)]
        Storage[File Storage]
        Realtime[Realtime Subscriptions]
    end

    subgraph Firebase["🔥 Firebase"]
        Auth[Authentication]
        Push[Push Notifications]
    end

    subgraph External["🌐 External APIs"]
        SportsAPI[Ball Dont Lie API]
        TMDB[TMDB API]
        Ticketmaster[Ticketmaster API]
        TheSportsDB[TheSportsDB]
    end

    UI --> State
    UI --> Nav
    State --> API
    State --> Auth
    State --> Realtime
    API --> DB
    API --> Storage
    Cron --> SportsAPI
    Cron --> TMDB
    Cron --> Ticketmaster
    Cron --> DB
    Push --> UI
```

---

## Event Data Ingestion

### Strategy

1. **Source:** External APIs for each event type (starting with Ball Don't Lie for NBA)
2. **Ingestion:** Vercel cron functions run on a schedule (daily or per-event-day)
3. **Storage:** Canonical `Event` records in Supabase Postgres (base table + type-specific child tables)
4. **Matching:** `external_id` + `external_source` fields prevent duplicates
5. **Updates:** Status and score/result updates run post-event

### Data APIs by Event Type

| Event Type | API | Free Tier | What It Provides |
|---|---|---|---|
| **Sports (NBA)** | Ball Don't Lie | ✅ Free | NBA schedules, scores, teams — **MVP choice** |
| **Sports (all)** | TheSportsDB | ✅ Free JSON API | Schedules, results, team data for NBA/MLB/NFL/NHL |
| **Sports (all)** | API-Sports | 100 req/day free | Comprehensive sports data; logo calls are free |
| **Sports (all)** | ESPN (unofficial) | Free (no key) | Undocumented, could change |
| **Movies** | TMDB | ✅ Free API key | Movie metadata, posters, cast, genres, ratings |
| **Concerts** | Ticketmaster Discovery | ✅ Free | Millions of events, artist data, venues, tour dates |
| **Concerts** | Setlist.fm | ✅ Free (non-commercial) | Setlists, artist history, venue data |
| **Restaurants** | Google Places | $200/mo free credits | Restaurant data, reviews, photos |
| **Restaurants** | Foursquare | 10k free calls | Venue data, categories, tips |

### Media / Image APIs

| Category | API | Strategy |
|---|---|---|
| **Sports team logos** | TheSportsDB, API-Sports | Download once, **store locally in Supabase Storage** (finite set of teams) |
| **Movie posters** | TMDB | Fetch on-demand via `https://image.tmdb.org/t/p/w500/{path}` |
| **Artist/concert photos** | Muzooka, Ticketmaster | Fetch on-demand |
| **Restaurant photos** | Google Places, Foursquare | Fetch on-demand |
| **Fallback/generic images** | Unsplash API (50 req/hr free) | Default event imagery |

> **Decision:** Start with Ball Don't Lie for NBA. Sports logos are pre-downloaded to Supabase. Movie and concert API integrations come when those event types launch.

---

## Admin & Internal Tools

| Phase | Approach |
|---|---|
| **MVP** | Supabase dashboard — inspect users, logs, events, photos |
| **Later** | Custom admin portal (Next.js on Vercel) or tools like Retool/Appsmith |

---

## Project Structure (Planned)

```
LogIt/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Auth group (welcome, sign-in, sign-up)
│   ├── (onboarding)/       # Post-auth (profile-setup, preferences, done)
│   ├── (tabs)/             # Tab-based navigation
│   │   ├── feed.tsx
│   │   ├── logbook.tsx
│   │   ├── add-log.tsx
│   │   └── profile.tsx
│   ├── index.tsx           # Entry redirect (auth-aware)
│   └── _layout.tsx         # Root layout with auth gate
├── api/                    # Vercel serverless functions
│   ├── auth/               # Auth endpoints (signup, me)
│   ├── users/              # User endpoints (profile, username check)
│   ├── middleware/         # Auth middleware (Firebase token verification)
│   └── lib/                # Server-side utilities (Supabase admin)
├── components/             # Reusable UI components
│   └── ui/                 # Base UI (Button, Input)
├── constants/              # Colors, typography, config, enums
├── hooks/                  # Custom React hooks
├── lib/                    # Client-side utilities (Supabase, Firebase, API client)
├── store/                  # Zustand state management
├── types/                  # TypeScript type definitions
├── assets/                 # Images, fonts
├── supabase/               # Database migrations
│   └── migrations/
└── docs/                   # Planning documentation
```

---

## Development Tooling

| Tool | Purpose |
|---|---|
| **TypeScript** | Type safety across the app |
| **ESLint + Prettier** | Code quality and formatting |
| **Expo EAS** | Builds, updates, submissions |
| **Git + GitHub** | Version control |
| **Vercel** | API hosting + cron jobs |
| **Figma** (optional) | Design mockups |
