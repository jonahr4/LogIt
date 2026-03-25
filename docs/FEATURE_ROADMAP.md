# Log It — Feature Roadmap

> **Last updated:** 2026-03-24

## Build Phases

```mermaid
gantt
    title Log It — Build Phases
    dateFormat  YYYY-MM-DD
    section MVP (v1.0)
    Auth + Onboarding           :a1, 2026-04-01, 7d
    Sports Event Ingestion      :a2, after a1, 7d
    Event Search                :a3, after a2, 5d
    Log Creation                :a4, after a3, 5d
    Personal Logbook + Filters  :a5, after a4, 7d
    Event Detail Page           :a6, after a5, 5d
    Simple Feed                 :a7, after a6, 5d
    section v1.5
    Friend System               :b1, after a7, 7d
    Stats Dashboard             :b2, after b1, 7d
    Map View                    :b3, after b2, 5d
    section v2.0
    Shared Attendance           :c1, after b3, 5d
    Comments + Reactions        :c2, after c1, 5d
    Multi-Sport Expansion       :c3, after c2, 10d
```

---

## MVP (v1.0) — Core Product

> **Goal:** A user can sign up, find a game, log it, and browse their history.

### 1. Auth & Onboarding
- [ ] Email + password sign-up/sign-in
- [ ] Google OAuth
- [ ] Apple OAuth
- [ ] Username selection
- [ ] Favorite team picker
- [ ] Profile creation (display name, avatar)

### 2. Sports Event Data
- [ ] Integrate sports data API (start with one league)
- [ ] Scheduled ingestion function (daily sync)
- [ ] Store canonical `Event` records in DB
- [ ] Deduplication via `external_id`
- [ ] Post-game score/status updates

### 3. Event Search
- [ ] Full-text search (team names, venue)
- [ ] Filter by sport, team, date range
- [ ] Paginated results
- [ ] "Game not found" → manual entry fallback

### 4. Log Creation
- [ ] Select game from search results
- [ ] Add optional notes
- [ ] Set privacy (public / friends / private)
- [ ] Optional star rating (1-5)
- [ ] Success confirmation with animation
- [ ] Prevent duplicate logs for same event

### 5. Personal Logbook
- [ ] Unified list of all logs, newest first
- [ ] Filter by: sport, team, date range, venue, privacy
- [ ] Active filters shown as removable chips
- [ ] Total count header ("47 events logged")
- [ ] Tap to view event detail

### 6. Event Detail Page
- [ ] Game header (teams, score, status)
- [ ] Date, time, venue with map link
- [ ] User's attendance badge + notes + rating
- [ ] Edit/delete log from this screen

### 7. Simple Feed
- [ ] "You" tab — own activity as a feed
- [ ] "Everyone" tab — all public logs
- [ ] Each post shows: user, event, date, notes
- [ ] Tap card → event detail
- [ ] Pull-to-refresh
- [ ] Empty states for first-time users

---

## v1.5 — Social & Stats

> **Goal:** Friends, stats, and the map unlock the "wow" features.

### 8. Friend System
- [ ] Search users by username
- [ ] Send/accept/decline friend requests
- [ ] Friends list management
- [ ] "Friends" tab in feed (shows friends' public + friends-only logs)
- [ ] Friend suggestions (later, from event overlap)

### 9. Stats Dashboard
- [ ] Total games attended
- [ ] Favorite team (by attendance count)
- [ ] Win/loss record when attending
- [ ] Most visited venue
- [ ] Attendance by sport breakdown
- [ ] Games per month/year chart
- [ ] Attendance timeline

### 10. Map View
- [ ] Map of all venues attended
- [ ] Pins with attendance count per venue
- [ ] Tap pin → list of games at that venue
- [ ] Attendance by city/state

### 11. Additional Sports
- [ ] Add MLB support
- [ ] Add NFL support
- [ ] Add NHL support
- [ ] Multi-sport filter in logbook and feed

---

## v2.0 — Social Depth & Expansion

> **Goal:** The app becomes social-first and opens beyond sports.

### 12. Shared Attendance
- [ ] "Also attended" section on event detail
- [ ] Notification: "You and @mike were both at this game"
- [ ] Mutual attendance stats with friends

### 13. Comments & Reactions
- [ ] Comment on any public log
- [ ] Emoji reactions (🔥 🏀 👏 etc.)
- [ ] Notification for comments/reactions on your logs

### 14. Beyond Sports
- [ ] Concerts
- [ ] Movies / Theater
- [ ] Restaurants
- [ ] Custom/manual events
- [ ] Generic "experience" event type

### 15. Advanced Features
- [ ] Push notifications
- [ ] Share log as image/story
- [ ] Annual recap / "Year in Review"
- [ ] Achievement badges
- [ ] Profile customization (banner, theme)

---

## Priority Matrix

| Feature | Impact | Effort | Priority |
|---|---|---|---|
| Auth + Onboarding | 🔴 High | 🟡 Medium | **P0 — MVP** |
| Event Ingestion | 🔴 High | 🟡 Medium | **P0 — MVP** |
| Log Creation | 🔴 High | 🟢 Low | **P0 — MVP** |
| Logbook + Filters | 🔴 High | 🟡 Medium | **P0 — MVP** |
| Event Detail | 🟡 Medium | 🟢 Low | **P0 — MVP** |
| Feed | 🟡 Medium | 🟡 Medium | **P0 — MVP** |
| Friend System | 🟡 Medium | 🟡 Medium | **P1 — v1.5** |
| Stats Dashboard | 🔴 High | 🟡 Medium | **P1 — v1.5** |
| Map View | 🔴 High | 🟡 Medium | **P1 — v1.5** |
| Shared Attendance | 🟡 Medium | 🟡 Medium | **P2 — v2.0** |
| Comments/Reactions | 🟢 Low | 🟢 Low | **P2 — v2.0** |
| Beyond Sports | 🔴 High | 🔴 High | **P2 — v2.0** |
