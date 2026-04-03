# Log It — API Design

> **Last updated:** 2026-04-02
> **Changes:**
> - 2026-04-02: Added `league` query parameter to `GET /events/search` for filtering results by league (e.g., NCAAM vs NCAAF for shared college teams).
> - 2026-03-31: Added `season_type` and `round` to sports `type_metadata` response. Box score endpoint refactored for multi-sport (dynamic sport/league lookup from DB). Added `round` to search fuzzy ILIKE fields.
> - 2026-03-30: Added `POST/DELETE /api/logs/photos` for photo metadata management (actual upload goes client->Firebase Storage directly). Removed stale `photo_urls` from log create request body.
> - 2026-03-29: Updated `/api/events/search` — added `offset` pagination param, `has_more` in response meta, bumped default limit to 40, documented fuzzy search strategy (trigram + levenshtein word-level + multi-token splitting).
> - 2026-03-29: Added implemented `POST /api/logs/delete` and `GET /api/events/box-score` endpoints.

> - 2026-03-29: Added `/api/logs/update` endpoint for editing existing logs.
> - 2026-03-28: Added implemented status markers to endpoints. Documented new cron endpoints (`sync-nba`, `backfill-nba`), event search (`/api/events/search`), and log creation (`/api/logs/create`). Added `EXTERNAL_SERVICES.md` cross-reference.
> - 2026-03-26: Initial document creation

## Overview

This document defines the API layer, hosted as **Vercel serverless functions**. Auth is via **Firebase Authentication**, and data lives in **Supabase Postgres**. Photos are stored in **Supabase Storage**.

The API is designed to be **event-type agnostic** — sports, movies, concerts, restaurants, and custom events all share common endpoints with type-specific metadata handled through a polymorphic pattern.

---

## Authentication

| Endpoint | Method | Description |
|---|---|---|
| `auth/signup` | POST | Create account (email + password, or OAuth) |
| `auth/login` | POST | Sign in |
| `auth/logout` | POST | Sign out |
| `auth/me` | GET | Get current user profile |

**Auth strategy:** JWT-based via **Firebase Auth**. Token passed in `Authorization: Bearer <token>` header. Verified server-side in Vercel functions.

**OAuth providers:** Google, Apple (minimum for iOS App Store).

---

## Users

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `GET /users/:id` | GET | Yes | Get user profile (public fields only if not self) |
| `PATCH /users/:id` | PATCH | Yes (self) | Update profile |
| `GET /users/:id/logs` | GET | Yes | Get user's logs (filtered by privacy/friendship) |
| `GET /users/:id/stats` | GET | Yes | Get user's stats summary |
| `GET /users/search?q=` | GET | Yes | Search users by username or display name |

### Public vs Private User Fields

| Field | Visibility |
|---|---|
| `username` | Public — visible to everyone |
| `display_name` | Public |
| `avatar_url` | Public |
| `bio` | Public |
| `first_name` | Friends + Self only |
| `last_name` | Friends + Self only |
| `email` | Self only |
| `default_privacy` | Self only |
| `event_preferences` | Self only |

### `PATCH /users/:id` — Request Body

```json
{
  "first_name": "Jonah",
  "last_name": "Rothman",
  "display_name": "Jonah",
  "bio": "I like going to things",
  "avatar_url": "https://...",
  "default_privacy": "friends",
  "event_preferences": ["sports", "movies", "concerts"]
}
```

---

## Events

Events follow a **polymorphic pattern** — all event types share a common base and have type-specific metadata handled via dedicated child tables.

| Endpoint | Method | Auth | Description | Status |
|---|---|---|---|---|
| `GET /events` | GET | Optional | Search/browse events across all types | — |
| `GET /events/search` | GET | No | Full-text search on pre-ingested events | Implemented |
| `GET /events/box-score` | GET | No | Fetch on-demand box score from ESPN for any sport (dynamic sport/league lookup) | Implemented |
| `GET /events/:id` | GET | Yes | Get single event with full details + type metadata | — |
| `GET /events/:id/attendees` | GET | Yes | Get users who logged this event (respects privacy) | — |

### `GET /events` — Query Parameters

| Param | Type | Description |
|---|---|---|
| `q` | string | Full-text search (title, venue, teams, artist, etc.) |
| `event_type` | enum | Filter by type: `sports`, `movie`, `concert`, `restaurant`, `manual` |
| `date_from` | ISO date | Start of date range |
| `date_to` | ISO date | End of date range |
| `league` | string | Filter by league (e.g., `NCAAM`, `NFL`) — post-filters results server-side |
| `limit` | int | Results per page (default 40, max 100) |
| `offset` | int | Pagination offset (default 0) |

**Fuzzy search strategy** (implemented in `search_events` RPC):
- ILIKE substring match on title, team names, venue, league, sport, round
- `pg_trgm` trigram similarity (minor typos)
- `levenshtein` word-level distance ≤ 2 (transposition typos e.g. "celitcs" → "Celtics")
- Multi-word queries tokenized in API: longest token queries DB, shorter tokens post-filtered

**Response meta:**
```json
{ "count": 40, "query": "celtics", "offset": 0, "has_more": true }
```
Client shows a **Load More** button when `has_more: true`; tapping appends next page.


**Type-specific filters** (applied when `event_type` is specified):

| Param | Applies To | Description |
|---|---|---|
| `sport` | `sports` | Filter by sport: `basketball`, `baseball`, `football`, `hockey` |
| `league` | `sports` | Filter by league: `NBA`, `MLB`, `NFL`, `NHL` |
| `team` | `sports` | Filter by team ID (home or away) |
| `season` | `sports` | Filter by season (e.g., `2025-26`) |
| `genre` | `movie`, `concert` | Filter by genre |
| `artist` | `concert` | Filter by artist/performer name |
| `cuisine` | `restaurant` | Filter by cuisine type |

### `GET /events` — Response

All event responses share a **common base shape** with a `type_metadata` object for type-specific details:

```json
{
  "data": [
    {
      "id": "evt_abc123",
      "event_type": "sports",
      "title": "Lakers vs Celtics",
      "status": "completed",
      "event_date": "2026-03-15T19:30:00Z",
      "venue_name": "Crypto.com Arena",
      "venue_city": "Los Angeles",
      "venue_state": "CA",
      "image_url": "https://supabase.co/storage/team-logos/lakers.png",
      "type_metadata": {
        "sport": "basketball",
        "league": "NBA",
        "season": "2025-26",
        "home_team_name": "Los Angeles Lakers",
        "away_team_name": "Boston Celtics",
        "home_team_id": "lakers",
        "away_team_id": "celtics",
        "home_score": 112,
        "away_score": 108
      }
    },
    {
      "id": "evt_def456",
      "event_type": "movie",
      "title": "Oppenheimer",
      "status": "completed",
      "event_date": "2026-03-10T20:00:00Z",
      "venue_name": "AMC Lincoln Square",
      "venue_city": "New York",
      "venue_state": "NY",
      "image_url": "https://image.tmdb.org/t/p/w500/poster.jpg",
      "type_metadata": {
        "genre": "Drama",
        "director": "Christopher Nolan",
        "runtime_minutes": 180,
        "tmdb_id": "872585"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142
  }
}
```

### Event Type Metadata Shapes

<details>
<summary><strong>Sports</strong></summary>

```json
{
  "sport": "basketball",
  "league": "NBA",
  "season": "2025-26",
  "season_type": 2,
  "round": null,
  "home_team_id": "lakers",
  "away_team_id": "celtics",
  "home_team_name": "Los Angeles Lakers",
  "away_team_name": "Boston Celtics",
  "home_score": 112,
  "away_score": 108
}
```
</details>

<details>
<summary><strong>Movie</strong></summary>

```json
{
  "genre": "Drama",
  "director": "Christopher Nolan",
  "runtime_minutes": 180,
  "tmdb_id": "872585",
  "cast": ["Cillian Murphy", "Robert Downey Jr."]
}
```
</details>

<details>
<summary><strong>Concert</strong></summary>

```json
{
  "artist": "Kendrick Lamar",
  "tour_name": "The Big Steppers Tour",
  "genre": "Hip-Hop",
  "ticketmaster_id": "vvG10Z...",
  "opener": "Baby Keem"
}
```
</details>

<details>
<summary><strong>Restaurant</strong></summary>

```json
{
  "cuisine": "Italian",
  "price_level": "$$",
  "foursquare_id": "4b8c...",
  "menu_highlights": ["Truffle pasta", "Tiramisu"]
}
```
</details>

<details>
<summary><strong>Manual</strong></summary>

```json
{
  "category": "Travel",
  "description": "Weekend trip to Cape Cod"
}
```
</details>

---

## User Event Logs

| Endpoint | Method | Auth | Description | Status |
|---|---|---|---|---|
| `POST /logs/create` | POST | Yes | Create a new log | ✅ Implemented |
| `GET /api/logs/mine` | GET | Yes | Get current user's logs with event joins | ✅ Implemented |
| `GET /logs` | GET | Yes | Get current user's logs (with filters) | — |
| `GET /logs/:id` | GET | Yes | Get a specific log | — |
| `POST /api/logs/update` | POST | Yes (owner) | Update a log (notes, privacy, rating, companions) | ✅ Implemented |
| `POST /api/logs/delete` | POST | Yes (owner) | Delete a log and its companions | ✅ Implemented |
| `POST /api/logs/photos` | POST | Yes | Save photo metadata after client uploads to Firebase Storage | ✅ Implemented |
| `DELETE /api/logs/photos` | DELETE | Yes (owner) | Remove a photo record from DB (client deletes from Firebase) | ✅ Implemented |

### `POST /logs` — Request Body

```json
{
  "event_id": "evt_abc123",
  "notes": "Incredible game, went to OT!",
  "privacy": "public",
  "rating": 5,
  "companions": [
    { "user_id": "usr_002", "name": "Mike" },
    { "name": "My dad" }
  ]
}
```

> **Photos** are uploaded separately after log creation via `POST /api/logs/photos` (client uploads directly to Firebase Storage, then saves URL here).

### `POST /api/logs/photos` — Request Body

```json
{
  "log_id": "log_abc123",
  "firebase_path": "photos/uid/log_id/1234567890.jpg",
  "url": "https://firebasestorage.googleapis.com/...",
  "display_order": 0
}
```

Returns `{ photo: { id, url, firebase_path, display_order } }`. Max 5 photos per log enforced server-side.

### `POST /logs` — Response

```json
{
  "id": "log_xyz789",
  "user_id": "usr_001",
  "event_id": "evt_abc123",
  "notes": "Incredible game, went to OT!",
  "privacy": "public",
  "rating": 5,
  "photo_urls": ["https://storage.supabase.co/..."],
  "companions": [
    { "user_id": "usr_002", "name": "Mike" },
    { "name": "My dad" }
  ],
  "logged_at": "2026-03-15T23:45:00Z"
}
```

### `GET /logs` — Query Parameters

| Param | Type | Description |
|---|---|---|
| `event_type` | enum | Filter by event type |
| `date_from` | ISO date | Logs after this date |
| `date_to` | ISO date | Logs before this date |
| `venue` | string | Filter by venue |
| `privacy` | enum | Filter by privacy level |
| `rating` | int | Filter by minimum rating |
| `sort` | string | `newest` (default), `oldest`, `highest_rated` |
| `page` | int | Pagination |
| `limit` | int | Results per page |

**Type-specific log filters** (same as event type-specific params):

| Param | Applies To | Description |
|---|---|---|
| `team` | `sports` | Filter by team |
| `sport` | `sports` | Filter by sport |
| `artist` | `concert` | Filter by artist |
| `genre` | `movie`, `concert` | Filter by genre |

---

## Comments

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `POST /logs/:id/comments` | POST | Yes | Add a comment to a log |
| `GET /logs/:id/comments` | GET | Yes | Get comments on a log |
| `DELETE /comments/:id` | DELETE | Yes (owner) | Delete a comment |

### `POST /logs/:id/comments` — Request Body

```json
{
  "text": "I was there too! What a game."
}
```

### `GET /logs/:id/comments` — Response

```json
{
  "data": [
    {
      "id": "cmt_001",
      "user": {
        "id": "usr_002",
        "username": "mike",
        "display_name": "Mike",
        "avatar_url": "https://..."
      },
      "text": "I was there too! What a game.",
      "created_at": "2026-03-16T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3 }
}
```

---

## Feed

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `GET /feed/public` | GET | Yes | Public feed — all public logs, newest first |
| `GET /feed/friends` | GET | Yes | Friends' logs (public + friends-only) |
| `GET /feed/me` | GET | Yes | Current user's own logs as feed |

### Feed Response Shape

```json
{
  "data": [
    {
      "log_id": "log_xyz789",
      "user": {
        "id": "usr_001",
        "username": "jonah",
        "display_name": "Jonah",
        "avatar_url": "https://..."
      },
      "event": {
        "id": "evt_abc123",
        "event_type": "sports",
        "title": "Lakers vs Celtics",
        "event_date": "2026-03-15T19:30:00Z",
        "venue_name": "Crypto.com Arena",
        "image_url": "https://...",
        "type_metadata": {
          "sport": "basketball",
          "home_team_name": "Lakers",
          "away_team_name": "Celtics",
          "home_score": 112,
          "away_score": 108
        }
      },
      "notes": "Incredible game!",
      "privacy": "public",
      "rating": 5,
      "companions": [
        { "user_id": "usr_002", "name": "Mike" }
      ],
      "comment_count": 3,
      "logged_at": "2026-03-15T23:45:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 85 }
}
```

---

## Friendships

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `POST /friends/request` | POST | Yes | Send friend request |
| `POST /friends/respond` | POST | Yes | Accept or decline request |
| `GET /friends` | GET | Yes | List current user's friends |
| `GET /friends/requests` | GET | Yes | List pending requests |
| `DELETE /friends/:id` | DELETE | Yes | Remove a friend |

### `POST /friends/request`

```json
{ "addressee_id": "usr_002" }
```

### `POST /friends/respond`

```json
{ "friendship_id": "fr_abc", "action": "accept" }
```

---

## Notifications

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `GET /notifications` | GET | Yes | Get current user's notifications |
| `PATCH /notifications/:id/read` | PATCH | Yes | Mark a notification as read |
| `POST /notifications/settings` | POST | Yes | Update notification preferences |

### Notification Types

| Type | Trigger | Timing |
|---|---|---|
| `event_reminder` | Upcoming event the user has logged as attending | Configurable: 24h, 2h, 30min before |
| `post_event_prompt` | Event concluded — prompt to add photos, rating, and notes | Shortly after event ends |
| `friend_request` | Someone sent a friend request | Immediate |
| `friend_activity` | A friend logged an event | Near-realtime |
| `comment` | Someone commented on your log | Immediate |
| `companion_tagged` | Someone tagged you as a companion | Immediate |

### `GET /notifications` — Response

```json
{
  "data": [
    {
      "id": "ntf_001",
      "type": "post_event_prompt",
      "title": "How was the game?",
      "body": "Lakers vs Celtics just ended. Add your photos, rating, and notes!",
      "reference_id": "evt_abc123",
      "reference_type": "event",
      "read": false,
      "created_at": "2026-03-15T22:30:00Z"
    },
    {
      "id": "ntf_002",
      "type": "event_reminder",
      "title": "Game tonight!",
      "body": "Lakers vs Warriors starts in 2 hours at Crypto.com Arena",
      "reference_id": "evt_def456",
      "reference_type": "event",
      "read": false,
      "created_at": "2026-03-20T17:00:00Z"
    }
  ]
}
```

---

## Error Format

All errors follow a consistent shape:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Event not found",
    "status": 404
  }
}
```

### Standard Error Codes

| Code | Status | When |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Accessing another user's private data |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 422 | Invalid request body |
| `CONFLICT` | 409 | Duplicate log, duplicate friend request |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Unexpected failure |

---

## Rate Limiting

| Tier | Limit |
|---|---|
| Auth endpoints | 10 req/min |
| Read endpoints | 100 req/min |
| Write endpoints | 30 req/min |

---

## Data Fetching Strategy (Client-Side)

| Pattern | Use Case |
|---|---|
| **Realtime subscription** | Feed updates, new friend requests, comments |
| **Paginated fetch** | Logbook, event search results |
| **Single fetch + cache** | Event detail page |
| **Optimistic update** | Creating/editing a log, adding comments |
| **Prefetch** | Event detail when hovering/long-pressing a card |
