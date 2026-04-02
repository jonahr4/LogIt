<p align="center">
  <img src="assets/images/icon.png" width="120" alt="LogIt Icon" />
</p>

<h1 align="center">LogIt</h1>

<p align="center">
  <strong>Log the events you live.</strong><br/>
  A mobile-first logbook for sports games, concerts, movies, and more.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-iOS-blue?logo=apple" alt="Platform" />
  <img src="https://img.shields.io/badge/react_native-0.76-61DAFB?logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/expo-54-000020?logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/supabase-postgres-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/vercel-serverless-000?logo=vercel" alt="Vercel" />
</p>

---

## What Is LogIt?

People track the events they attend in Notes, spreadsheets, photos, or memory. Those methods are fragmented and hard to search. LogIt replaces all of that with a clean, structured logbook that feels like a personal collection.

**Think Letterboxd, but for live events — starting with sports.**

---

## Features

| Feature | Description |
|---|---|
| 🔍 **Game Search** | Find any game from a structured sports database powered by ESPN |
| ✅ **One-Tap Logging** | Log that you were there, with optional notes, rating, photos, and companions |
| 📖 **Personal Logbook** | Browse and filter your full history by sport, team, venue, or date |
| 📊 **Event Detail** | Rich game context — teams, score, venue, date, box score |
| 📡 **Feed** | See your activity and discover what others are logging |
| 🔒 **Privacy Controls** | Each log can be public, friends-only, or private |
| 🏟️ **Venue Enrichment** | Auto-populated venue photos and coordinates via Wikimedia + Nominatim |
| 🏈 **Multi-Sport** | NBA, NFL, and NHL supported, with a scalable pattern for adding more leagues |
| 🛠️ **Admin Portal** | Static HTML dashboard for viewing venue and game data with filters |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 54) |
| **Navigation** | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing) |
| **Database** | [Supabase](https://supabase.com/) (Postgres + Row Level Security) |
| **Auth** | [Firebase Authentication](https://firebase.google.com/docs/auth) (Google + Apple Sign-In) |
| **API / Cron** | [Vercel](https://vercel.com/) (serverless functions + scheduled cron jobs) |
| **Sports Data** | [ESPN API](https://site.api.espn.com/) (NBA, NFL, NHL — scoreboard + team data) |
| **Venue Media** | [Nominatim](https://nominatim.org/) (geocoding) + [Wikimedia Commons](https://commons.wikimedia.org/) (images) |
| **Language** | TypeScript |

---

## Architecture

```
├── app/                        # Expo Router screens (file-based routing)
│   ├── (auth)/                 # Auth screens (login, onboarding)
│   ├── (tabs)/                 # Main tab screens
│   │   ├── feed.tsx            # Activity feed
│   │   ├── logbook.tsx         # Personal logbook with filters/sort
│   │   ├── add-log.tsx         # Log new event (search, browse by sport)
│   │   ├── search.tsx          # Explore & discover events
│   │   └── profile.tsx         # User profile
│   └── _layout.tsx             # Root layout with auth guard
├── components/                 # Reusable UI components
│   ├── ui/                     # GlassCard, EventDetailModal, EditLogModal, etc.
│   └── ...
├── server-lib/                 # Shared server utilities
│   ├── espn.ts                 # Shared ESPN fetch/parse/upsert for all sports
│   ├── venue-lookup.ts         # findOrCreateVenue() + auto-enrichment
│   ├── nba-venues.ts           # Static NBA arena mappings (30 teams)
│   ├── nfl-venues.ts           # Static NFL stadium mappings (32 teams)
│   ├── nhl-venues.ts           # Static NHL arena mappings (32 teams)
│   └── supabase-admin.ts       # Supabase service-role client
├── api/                        # Vercel serverless functions
│   ├── cron/                   # Scheduled sync jobs
│   │   ├── sync-nba.ts         # Daily NBA game sync (ESPN)
│   │   ├── sync-nfl.ts         # Daily NFL game sync (ESPN)
│   │   ├── sync-nhl.ts         # Daily NHL game sync (ESPN)
│   │   ├── backfill-nba.ts     # Historical NBA season backfill
│   │   ├── backfill-nfl.ts     # Historical NFL season backfill
│   │   └── backfill-nhl.ts     # Historical NHL season backfill
│   ├── events/                 # Event search & box score APIs
│   ├── logs/                   # Log CRUD APIs
│   └── scripts/                # One-off scripts (venue backfill)
├── admin/                      # Static HTML admin dashboard
│   └── index.html              # Venue & game data viewer with filters
├── store/                      # Zustand state stores
├── constants/                  # Design tokens, colors, typography
├── supabase/migrations/        # Database migrations (numbered SQL files)
├── docs/                       # Planning & reference documentation
│   ├── event-types/            # Workflow guides for adding new event types
│   └── *.md                    # Product, tech stack, data models, API, etc.
└── assets/                     # Images, fonts, and icons
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Xcode 15+ (for iOS builds)
- Supabase project with Postgres
- Firebase project with Auth enabled
- Vercel account (for API deployment)

### Setup

```bash
# Clone the repo
git clone https://github.com/jonahr4/LogIt.git
cd LogIt

# Install dependencies
npm install

# Create your .env.local file
cp .env.example .env.local
# Fill in Supabase, Firebase, and Vercel credentials

# Start the dev server
npx expo start

# Run on iOS simulator
npx expo run:ios
```

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server only) |
| `FIREBASE_API_KEY` | Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `CRON_SECRET` | Secret for Vercel cron job auth |

---

## Documentation

All planning and reference docs live in [`docs/`](./docs/):

| Document | Purpose |
|---|---|
| [`PRODUCT_OVERVIEW.md`](./docs/PRODUCT_OVERVIEW.md) | Vision, positioning, and MVP scope |
| [`DATA_MODELS.md`](./docs/DATA_MODELS.md) | Database schema and entity relationships |
| [`TECH_STACK.md`](./docs/TECH_STACK.md) | Architecture, tech choices, and project structure |
| [`UI_AND_FLOWS.md`](./docs/UI_AND_FLOWS.md) | Screens, navigation, and design system |
| [`API_DESIGN.md`](./docs/API_DESIGN.md) | API endpoints and request/response contracts |
| [`FEATURE_ROADMAP.md`](./docs/FEATURE_ROADMAP.md) | Phased feature breakdown with progress |
| [`SOCIAL_FEATURES.md`](./docs/SOCIAL_FEATURES.md) | Privacy model, friend system, and social layer |
| [`EXTERNAL_SERVICES.md`](./docs/EXTERNAL_SERVICES.md) | Data ingestion and external API integration |
| [`ADMIN_DASHBOARD.md`](./docs/ADMIN_DASHBOARD.md) | Admin portal setup, features, and RLS policies |
| [`event-types/sports.md`](./docs/event-types/sports.md) | Workflow for adding new sports leagues |

---

## Roadmap

| Phase | Focus |
|---|---|
| **MVP (v1.0)** | Auth, NBA game search, log creation with photos, logbook, event detail, feed |
| **v1.5** | Multi-sport (NFL ✅, NHL ✅, MLB), friend system, stats dashboard, map view |
| **v2.0** | Shared attendance, event discovery & reviews, comments/reactions, beyond sports |

---

## Status

🟢 **MVP core complete** — Auth, onboarding, full UI (Spatial Green v2 design), NBA + NFL + NHL game sync from ESPN, Supabase-backed event search with fuzzy matching, log creation with companions, personal logbook with sort/filter, venue auto-enrichment, and admin data portal.

---

## Changelog

| Date | Update |
|---|---|
| 2026-04-02 | NHL integration — sync + backfill + 32 NHL teams in browse UI, cron at 6:10 AM UTC |
| 2026-03-31 | Season metadata — `season_type` + playoff `round` tracking, multi-sport box score, team browse with season headers |
| 2026-03-31 | NFL integration — shared ESPN utility, sync + backfill scripts, 32 NFL teams in browse UI |
| 2026-03-31 | Admin portal — static HTML dashboard for venues & games with filters, pagination, sorting |
| 2026-03-31 | Venue auto-enrichment — Nominatim geocoding + Wikimedia Commons images |
| 2026-03-30 | Logbook & Add Log — connected to Supabase, real API search, log creation |
| 2026-03-29 | Event Detail Modal — ticket-style UI, box score, delete log |
| 2026-03-28 | NBA game sync — ESPN cron job, venue normalization, sports_events child table |
| 2026-03-27 | UI foundation — Spatial Green v2 design system, glassmorphism, floating nav |
| 2026-03-27 | Auth — Firebase Google + Apple Sign-In, cross-platform hybrid strategy |

---

*Log it. Remember it. Own it.*