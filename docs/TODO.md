# LogIt — To-Do List

> Last updated: May 27, 2026

---

## 🔴 High Priority (MVP)

### Feed
- [ ] **Get feed working with real data** — build `/api/logs/global` endpoint
- [ ] **Keep mock cards as design templates** — don't delete `MOCK_CARDS` in `feed.tsx`, use them as reference for different event type card layouts
- [ ] **Sticky header** — lock the "Global / Following / You" tab selector so it doesn't scroll down with the feed content. It should scroll up (collapse), but the feed should scroll independently beneath it

### Social
- [ ] **Simple friend integration** — basic friend system (MVP scope)

---

## 🟡 Medium Priority

### My Teams
- [ ] **Auto-collect teams from logs** — when a user selects a rooted_team during log creation, auto-add that team to a `myTeams` list in their user profile
- [ ] **Data structure** — organize myTeams by: `event_type → sport → team` (e.g., sports → NBA → Celtics)
- [ ] **Auto-select rooted_team** — when creating a new log, if the user has a saved team for that sport in myTeams, auto-fill the "My Team" selector so they don't have to pick every time
- [ ] **Settings → My Teams page** — add a section in profile/settings where users can:
  - View their auto-populated teams
  - Add new teams manually
  - Remove teams
  - Edit/change teams
- [ ] **Store in user profile** — add `my_teams` column (JSONB) to the `users` table, or a separate `user_teams` table

> **Why:** Users who are Celtics fans go to lots of Celtics games. If they forget to select "My Team" once, they lose the W/L badge. This auto-fills it so they don't have to think about it.

### Navigation & UI Polish
- [ ] **Notifications bell (top right)** — currently does nothing. Hardcode placeholder functionality for now
- [ ] **Profile/Account settings button** — add a settings/gear icon in the top right of the profile screen
- [ ] **Logbook sticky header** — consider the same sticky header pattern as the feed
- [ ] **Improve "Already Logged" button** — polish the button shown when an event has already been logged
- [ ] **Fix statuses in EditLogModal** — game statuses are displaying lowercase (e.g. "final" instead of "Final"). Capitalize/format them properly

### Sports — Add Log Flow
- [ ] **Make "Search All Games" more natural** — remove the button-to-search pattern. Replace with an always-visible search bar on the main sports page
- [ ] **Restructure the sports page** — take the "find your sport" page (currently behind "Search All Games") and make it the main sports page layout:
  - Search bar at top
  - Browse by sport section below
  - "Can't find what you're looking for? Add manually" pushed to the bottom, below browse by sport
- [ ] **Search behavior** — when the user starts typing, hide the "browse by sport" options. Bring them back only when the search field is cleared
- [ ] **Apply same search pattern to other event types** (movies, concerts, food/drinks, theater)

### Sports Data & Filtering
- [ ] **Future games flooding results** — when a college sport has the full year backfilled, the top results are 100+ future games. Users have to scroll forever to find past games. Add a default sort/filter that prioritizes recent past games, or add a date limit so future games aren't shown first
- [ ] **College sports naming audit** — have an agent review naming schemes for college hockey, basketball, etc. Conference names like "Big Ten" don't apply uniformly across all sports. Flag any glaring filter or naming issues
- [ ] **Scoreboard issues** — investigate reported scoreboard display issues on some event types

### Admin Dashboard
- [ ] **Reduce Supabase quota usage** — the admin dashboard is currently eating through Supabase read quota. Optimize queries, add pagination, reduce unnecessary fetches
- [ ] **Refocus purpose** — admin dashboard is primarily for browsing photos and reviewing data. Simplify the UI around that core use case
- [ ] **Make it look better** — visual refresh

---

## 🟢 Lower Priority / Stretch Goals

### Explore/Search Page
- [ ] **Keep existing headers** — the current explore page headers look good, preserve them
- [ ] **Make it searchable** — add real search functionality (stretch goal)
- [ ] **Expand for social** — show friend's stuff, friend's ratings. Model after Letterboxd search
- [ ] **Placeholder content** — since we won't have users at launch, build good placeholders that hint at what the social features will look like
- [ ] **Implement last** — this is one of the last things to build since it depends on friend system + user base

### UI Polish
- [ ] **Logbook sticky header height** — search bar still feels a bit high/different from other pages. Needs fine-tuning to match the visual rhythm of feed/explore headers
- [ ] **Feed sticky header** — lock the tab pills so they don't scroll (deferred — too much UI tweaking)

---

## 📝 Notes
- The food/drinks + theater uncommitted work from April is saved in `~/Desktop/Workspace/LogIt-old/` — bring those changes over when ready
- Feed mock cards (`MOCK_CARDS` in `feed.tsx`) serve as design templates for different event type cards — preserve them as reference even after real data is wired up
- **Typography.pageHeader** — all page title text must use `Typography.pageHeader` from `constants/typography.ts` (28px, headlineExtraBold, -0.5 letter-spacing). This ensures consistent header sizing across all tab screens.
