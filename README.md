# 🏟️ Log It

**Log the events you live.** A mobile-first app for tracking the sports games you attend — with structured event data, a personal logbook, and lightweight social discovery.

---

## What Is Log It?

People who attend games track them in Notes, spreadsheets, photos, or memory. Those methods are fragmented and hard to search. Log It replaces all of that with a clean, structured logbook that feels like a personal collection.

**Think Letterboxd, but for live events — starting with sports.**

## Core Features

| Feature | Description |
|---|---|
| 🔍 **Game Search** | Find any game from a structured sports database |
| ✅ **Log Attendance** | One tap to log that you were there, with optional notes, rating, and photos |
| 📖 **Personal Logbook** | Browse and filter your full history by sport, team, venue, or date |
| 📊 **Event Detail** | Rich game context — teams, score, venue, date |
| 📡 **Feed** | See your activity and discover what others are logging |
| 🔒 **Privacy Controls** | Each log can be public, friends-only, or private |
| 🔔 **Notifications** | Event reminders and post-game prompts to log |
| 📸 **Photos** | Attach photos to your log entries |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native (iOS-first) |
| Backend / API | Vercel (serverless functions) |
| Auth | Firebase Authentication |
| Database | Supabase (Postgres) |
| Storage | Supabase Storage |
| Sports Data | Ball Don't Lie (NBA first) |
| Language | TypeScript |

## Roadmap

| Phase | Focus |
|---|---|
| **MVP (v1.0)** | Auth, NBA game search, log creation with photos, logbook, event detail, feed, notifications |
| **v1.5** | Friend system, stats dashboard, map view, multi-sport |
| **v2.0** | Shared attendance, event discovery & reviews, comments/reactions, expansion beyond sports |

## Documentation

All planning docs live in [`docs/`](./docs/):

- [`PRODUCT_OVERVIEW.md`](./docs/PRODUCT_OVERVIEW.md) — Vision, positioning, and MVP scope
- [`DATA_MODELS.md`](./docs/DATA_MODELS.md) — Database schema and entity relationships
- [`TECH_STACK.md`](./docs/TECH_STACK.md) — Architecture, tech choices, and project structure
- [`UI_AND_FLOWS.md`](./docs/UI_AND_FLOWS.md) — Screens, navigation, user flows, and design system
- [`API_DESIGN.md`](./docs/API_DESIGN.md) — API endpoints and request/response contracts
- [`FEATURE_ROADMAP.md`](./docs/FEATURE_ROADMAP.md) — Phased feature breakdown with checklists
- [`SOCIAL_FEATURES.md`](./docs/SOCIAL_FEATURES.md) — Privacy model, friend system, and social layer design

## Status

🟡 **Planning phase** — no code yet, documentation in progress.

---

*Log it. Remember it. Own it.*