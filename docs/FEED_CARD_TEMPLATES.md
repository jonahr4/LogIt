# Log It — Feed Card UI Templates

> **Purpose:** Reference document for how feed cards look for each event type.
> These templates define the fields, metadata, images, and secondary pills for every supported event type.
> Originally implemented as `MOCK_CARDS` in `feed.tsx` — preserved here as the canonical UI spec.
>
> **Last updated:** 2026-05-28

---

## Card Anatomy

Every feed card has:
- **Header:** User avatar, @username, "logged this", time ago
- **Image area:** Large hero image with overlay gradient
  - **Top-left pill:** Event type icon + label (e.g., 🏀 NBA, 🎬 Movie)
  - **Top-right pill:** Type-specific secondary info (score, runtime, price, genre)
  - **Bottom overlay:** Event title (bold), venue name (uppercase), star rating
- **Note:** 2-line preview of user's notes

### Secondary Pill Logic

The top-right pill adapts by event type:

| Event Type | Pill Content | Color |
|------------|-------------|-------|
| Sports (NBA, NFL, etc.) | Score (e.g., "108 - 112") | `#FF8A3D` (orange) |
| Movie | Runtime (e.g., "166 min") | `#679cff` (blue) |
| Concert | Genre (e.g., "R&B") | `#ac89ff` (purple) |
| Food & Drinks | Price level (e.g., "$$$$") | `#facc15` (gold) |
| Nightlife | Vibe (e.g., "High-energy") | `#00FFC2` (green) |
| Theater | Show type (e.g., "Musical") | `#ac89ff` (purple) |
| Custom | *(none)* | — |

### Event Type Icons

| Event Type | Ionicon | Label |
|------------|---------|-------|
| NBA / Basketball | `basketball-outline` | NBA |
| NFL / Football | `american-football-outline` | NFL |
| MLB / Baseball | `baseball-outline` | MLB |
| NHL / Hockey | `hockey-puck-outline` | NHL |
| Movie | `film-outline` | Movie |
| Concert | `musical-notes-outline` | Concert |
| Food & Drinks | `restaurant-outline` | Food & Drinks |
| Nightlife | `wine-outline` | Nightlife |
| Theater | `ticket-outline` | Theater |
| Custom | `calendar-outline` | Custom |

---

## Templates by Event Type

### 🏀 Sports — NBA

```json
{
  "user": { "name": "@jonah", "avatar": "pravatar/33" },
  "timeAgo": "2 hours ago",
  "image": "unsplash/basketball-arena",
  "title": "Celtics vs Lakers",
  "venue": "Crypto.com Arena",
  "venueCity": "Los Angeles",
  "venueState": "CA",
  "date": "Mar 15, 2026",
  "eventType": "NBA",
  "eventIcon": "basketball-outline",
  "secondaryPill": { "text": "108 - 112", "color": "#FF8A3D" },
  "status": "FINAL • OT",
  "homeTeamName": "Celtics",
  "awayTeamName": "Lakers",
  "homeTeamLogo": "wikipedia/celtics.svg",
  "awayTeamLogo": "wikipedia/lakers.svg",
  "homeScore": 112,
  "awayScore": 108,
  "league": "NBA",
  "season": "2025-26",
  "sport": "basketball",
  "privacy": "public",
  "rating": 5,
  "note": "Incredible game, went to OT! Tatum was on fire in the 4th quarter. Sat in section 301, great view of the court.",
  "photos": ["unsplash/basketball-1", "unsplash/basketball-2"],
  "companions": [
    { "name": "Alex", "avatar": "pravatar/1" },
    { "name": "Sarah", "avatar": "pravatar/2" }
  ]
}
```

### 🏈 Sports — NFL

```json
{
  "user": { "name": "@mike", "avatar": "pravatar/12" },
  "timeAgo": "1 day ago",
  "image": "unsplash/football-stadium",
  "title": "Chiefs vs Eagles",
  "venue": "Arrowhead Stadium",
  "venueCity": "Kansas City",
  "venueState": "MO",
  "date": "Mar 12, 2026",
  "eventType": "NFL",
  "eventIcon": "american-football-outline",
  "secondaryPill": { "text": "24 - 31", "color": "#FF8A3D" },
  "status": "FINAL",
  "homeTeamName": "Chiefs",
  "awayTeamName": "Eagles",
  "homeScore": 31,
  "awayScore": 24,
  "league": "NFL",
  "season": "2025-26",
  "sport": "football",
  "privacy": "public",
  "rating": 5,
  "note": "Mahomes threw 4 TDs. Tailgate was unreal — best BBQ I've ever had. Seats were 10 rows up on the 50.",
  "photos": ["unsplash/football-1"],
  "companions": [
    { "name": "Dad" },
    { "name": "Jake", "avatar": "pravatar/15" }
  ]
}
```

### 🎬 Movie

```json
{
  "user": { "name": "@alex", "avatar": "pravatar/1" },
  "timeAgo": "3 hours ago",
  "image": "unsplash/cinema",
  "title": "Dune: Part Two",
  "venue": "AMC Lincoln Square",
  "venueCity": "New York",
  "venueState": "NY",
  "date": "Mar 14, 2026",
  "eventType": "Movie",
  "eventIcon": "film-outline",
  "secondaryPill": { "text": "166 min", "color": "#679cff" },
  "director": "Denis Villeneuve",
  "genre": "Sci-Fi",
  "runtime": 166,
  "cast": ["Timothée Chalamet", "Zendaya", "Austin Butler", "Florence Pugh"],
  "watchedAt": "IMAX",
  "theaterName": "AMC Lincoln Square",
  "privacy": "public",
  "rating": 5,
  "note": "Absolutely stunning in IMAX. The sandworm riding sequence was breathtaking. Denis Villeneuve outdid himself.",
  "photos": ["unsplash/movie-theater"],
  "companions": [
    { "name": "Sarah", "avatar": "pravatar/2" }
  ]
}
```

### 🎵 Concert

```json
{
  "user": { "name": "@maya", "avatar": "pravatar/9" },
  "timeAgo": "8 hours ago",
  "image": "unsplash/concert-crowd",
  "title": "SZA",
  "venue": "Madison Square Garden",
  "venueCity": "New York",
  "venueState": "NY",
  "date": "Mar 13, 2026",
  "eventType": "Concert",
  "eventIcon": "musical-notes-outline",
  "secondaryPill": { "text": "R&B", "color": "#ac89ff" },
  "artist": "SZA",
  "tourName": "SOS Tour",
  "opener": "Omar Apollo",
  "genre": "R&B",
  "setlist": ["Kill Bill", "Snooze", "Shirt", "Love Galore", "Kiss Me More", "Good Days"],
  "privacy": "public",
  "rating": 5,
  "note": "SZA's vocals were insane live. She played for almost 2 hours straight. Omar Apollo opened and was incredible too.",
  "photos": ["unsplash/concert-1", "unsplash/concert-2"],
  "companions": [
    { "name": "Lily", "avatar": "pravatar/10" },
    { "name": "Marcus", "avatar": "pravatar/11" }
  ]
}
```

### 🍽️ Food & Drinks

```json
{
  "user": { "name": "@emma", "avatar": "pravatar/20" },
  "timeAgo": "1 day ago",
  "image": "unsplash/restaurant-interior",
  "title": "Carbone",
  "venue": "Carbone",
  "venueCity": "New York",
  "venueState": "NY",
  "date": "Mar 12, 2026",
  "eventType": "Food & Drinks",
  "eventIcon": "restaurant-outline",
  "secondaryPill": { "text": "$$$$", "color": "#facc15" },
  "cuisine": "Italian-American",
  "priceLevel": "$$$$",
  "venueType": "Restaurant",
  "privacy": "public",
  "rating": 4,
  "note": "Finally got a reservation. The spicy rigatoni lived up to the hype. Veal parm was unreal. Definitely going back.",
  "photos": ["unsplash/food-1", "unsplash/food-2"],
  "companions": [
    { "name": "Tom", "avatar": "pravatar/22" }
  ]
}
```

### 🎭 Theater

```json
{
  "user": { "name": "@jake", "avatar": "pravatar/15" },
  "timeAgo": "2 days ago",
  "image": "unsplash/theater-stage",
  "title": "Hamilton",
  "venue": "Richard Rodgers Theatre",
  "venueCity": "New York",
  "venueState": "NY",
  "date": "Mar 10, 2026",
  "eventType": "Theater",
  "eventIcon": "ticket-outline",
  "secondaryPill": { "text": "Musical", "color": "#ac89ff" },
  "showName": "Hamilton",
  "showType": "Musical",
  "performer": "Broadway Cast",
  "seatSection": "Orchestra",
  "privacy": "public",
  "rating": 5,
  "note": "Absolutely incredible. The Act 2 opener gave me chills. Orchestra seats were worth every penny. Lin-Manuel is a genius.",
  "photos": [],
  "companions": [
    { "name": "Alex", "avatar": "pravatar/1" },
    { "name": "Maya", "avatar": "pravatar/9" }
  ]
}
```

### 📅 Custom

```json
{
  "user": { "name": "@jonah", "avatar": "pravatar/33" },
  "timeAgo": "2 days ago",
  "image": "unsplash/graduation",
  "title": "Graduation Day",
  "venue": "Boston University",
  "venueCity": "Boston",
  "venueState": "MA",
  "date": "May 18, 2025",
  "eventType": "Custom",
  "eventIcon": "calendar-outline",
  "secondaryPill": null,
  "privacy": "public",
  "rating": 5,
  "note": "Finally walked across that stage. 4 years of hard work paid off. So grateful for everyone who came out to celebrate.",
  "photos": ["unsplash/graduation-1"],
  "companions": [
    { "name": "Mom" },
    { "name": "Dad" },
    { "name": "Sarah", "avatar": "pravatar/2" }
  ]
}
```

---

## Unsplash Reference Images

For prototyping and development, these Unsplash images were used as card heroes:

| Event Type | Image URL |
|------------|-----------|
| NBA | `photo-1546519638-68e109498ffc` |
| NBA (#2) | `photo-1577223625816-7546f13df25d` |
| NFL | `photo-1566577739112-5180d4bf9390` |
| Movie | `photo-1536440136628-849c177e76a1` |
| Concert | `photo-1540039155733-5bb30b53aa14` |
| Food & Drinks | `photo-1517248135467-4c7edcad34c4` |
| Theater | `photo-1503095396549-807759245b35` |
| Custom | `photo-1523050854058-8df90110c476` |

All at `https://images.unsplash.com/{id}?q=80&w=800&auto=format&fit=crop`

---

## Usage

This document serves as the **source of truth** for feed card UI when:
- Developing new event type integrations
- Testing the feed with placeholder data
- Ensuring each event type has appropriate secondary pill, icon, and metadata display
- Rebuilding mock feeds for demos or screenshots
