# Log It — API Design

> **Last updated:** 2026-03-24

## Overview

This document defines the API layer — whether using direct Supabase client calls (RPC + REST) or a custom API (e.g., Edge Functions, Express). The endpoints and contracts below apply regardless of backend choice.

---

## Authentication

| Endpoint | Method | Description |
|---|---|---|
| `auth/signup` | POST | Create account (email + password, or OAuth) |
| `auth/login` | POST | Sign in |
| `auth/logout` | POST | Sign out |
| `auth/me` | GET | Get current user profile |

**Auth strategy:** JWT-based via Supabase Auth or Firebase Auth. Token passed in `Authorization: Bearer <token>` header.

**OAuth providers:** Google, Apple (minimum for iOS App Store).

---

## Users

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `GET /users/:id` | GET | Yes | Get user profile (public fields only if not self) |
| `PATCH /users/:id` | PATCH | Yes (self) | Update profile (display name, bio, avatar, favorites) |
| `GET /users/:id/logs` | GET | Yes | Get user's logs (filtered by privacy/friendship) |
| `GET /users/:id/stats` | GET | Yes | Get user's stats summary |
| `GET /users/search?q=` | GET | Yes | Search users by username or display name |

### `PATCH /users/:id` — Request Body

```json
{
  "display_name": "Jonah",
  "bio": "Die-hard Celtics fan",
  "avatar_url": "https://...",
  "favorite_teams": ["celtics", "patriots"],
  "default_privacy": "friends"
}
```

---

## Events

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `GET /events` | GET | Yes | Search/browse events |
| `GET /events/:id` | GET | Yes | Get single event with full details |
| `GET /events/:id/attendees` | GET | Yes | Get users who logged this event (respects privacy) |

### `GET /events` — Query Parameters

| Param | Type | Description |
|---|---|---|
| `q` | string | Full-text search (team names, venue) |
| `sport` | enum | Filter by sport |
| `team` | string | Filter by team ID (home or away) |
| `date_from` | ISO date | Start of date range |
| `date_to` | ISO date | End of date range |
| `venue` | string | Filter by venue name |
| `season` | string | Filter by season (e.g., `2025-26`) |
| `page` | int | Pagination offset |
| `limit` | int | Results per page (default 20, max 50) |

### `GET /events` — Response

```json
{
  "data": [
    {
      "id": "evt_abc123",
      "sport": "basketball",
      "league": "NBA",
      "home_team_name": "Los Angeles Lakers",
      "away_team_name": "Boston Celtics",
      "home_score": 112,
      "away_score": 108,
      "status": "final",
      "event_date": "2026-03-15T19:30:00Z",
      "venue_name": "Crypto.com Arena",
      "venue_city": "Los Angeles",
      "venue_state": "CA"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142
  }
}
```

---

## User Event Logs

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `POST /logs` | POST | Yes | Create a new log |
| `GET /logs` | GET | Yes | Get current user's logs (with filters) |
| `GET /logs/:id` | GET | Yes | Get a specific log |
| `PATCH /logs/:id` | PATCH | Yes (owner) | Update a log (notes, privacy, rating) |
| `DELETE /logs/:id` | DELETE | Yes (owner) | Delete a log |

### `POST /logs` — Request Body

```json
{
  "event_id": "evt_abc123",
  "notes": "Incredible game, went to OT!",
  "privacy": "public",
  "rating": 5
}
```

### `POST /logs` — Response

```json
{
  "id": "log_xyz789",
  "user_id": "usr_001",
  "event_id": "evt_abc123",
  "notes": "Incredible game, went to OT!",
  "privacy": "public",
  "rating": 5,
  "logged_at": "2026-03-15T23:45:00Z"
}
```

### `GET /logs` — Query Parameters

| Param | Type | Description |
|---|---|---|
| `sport` | enum | Filter by event sport |
| `team` | string | Filter by team |
| `date_from` | ISO date | Logs after this date |
| `date_to` | ISO date | Logs before this date |
| `venue` | string | Filter by venue |
| `privacy` | enum | Filter by privacy level |
| `sort` | string | `newest` (default), `oldest` |
| `page` | int | Pagination |
| `limit` | int | Results per page |

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
        "sport": "basketball",
        "home_team_name": "Lakers",
        "away_team_name": "Celtics",
        "home_score": 112,
        "away_score": 108,
        "event_date": "2026-03-15T19:30:00Z",
        "venue_name": "Crypto.com Arena"
      },
      "notes": "Incredible game!",
      "privacy": "public",
      "rating": 5,
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
| **Realtime subscription** | Feed updates, new friend requests |
| **Paginated fetch** | Logbook, event search results |
| **Single fetch + cache** | Event detail page |
| **Optimistic update** | Creating/editing a log |
| **Prefetch** | Event detail when hovering/long-pressing a card |
