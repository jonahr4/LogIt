# LogIt — To-Do List

> Last updated: May 28, 2026

---

## 🔴 High Priority (MVP)

### Feed
- [ ] **Get feed working with real data** — build `/api/logs/global` endpoint
- [ ] **Keep mock cards as design templates** — don't delete `MOCK_CARDS` in `feed.tsx`, use them as reference for different event type card layouts
- [x] **Sticky header** — ✅ Tab pills now in a fixed sticky header with bottom border, matching other tabs

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
- [x] **Notifications bell (top right)** — ✅ Social icon in PageHeader opens SocialModal (notifications + friends). Available on ALL screens
- [x] **Profile/Account settings button** — ✅ Gear icon in PageHeader opens SettingsModal. Available on ALL screens
- [x] **Logbook sticky header** — ✅ Implemented sticky header with search bar + filter chips
- [x] **Improve "Already Logged" button** — ✅ Replaced iOS Alert with haptic vibration + animated glass toast pill (slides in from top, auto-dismisses after 2.2s)
- [x] **Fix statuses in EditLogModal** — ✅ Added `formatStatus` helper that capitalizes raw ESPN statuses ("final" → "Final", "FINAL" → "Final", "in progress" → "In Progress"). Applied in EventDetailModal and EditLogModal

### Sports — Add Log Flow
- [x] **Make "Search All Games" more natural** — ✅ Replaced button with inline search bar on the sports hub page. Results appear inline as you type, browse-by-sport hides. Clear search to bring browse back.
- [x] **Restructure the sports page** — ✅ Search bar at top, browse by sport below, "Can't find it? Add manually" at bottom
- [x] **Search behavior** — ✅ Typing hides browse-by-sport, clearing search brings it back
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
- [x] **Logbook sticky header height** — ✅ Unified pill/chip heights and letter-spacing across all tabs
- [x] **Feed sticky header** — ✅ Tab pills now in sticky header matching other tabs
- [x] **Unified modal system** — ✅ SharedModal component provides one visual shell (dark overlay, glass card, drag handle) for all modals. SocialModal, SettingsModal, and StatDetailModal all use it. Change style once → updates everywhere
- [x] **Profile redesign** — ✅ Compact Letterboxd-style layout: avatar header, Top 4 pinned events, tappable stats row, event breakdown bars, highlights grid (streak/most visited/avg rating/first log), action buttons
- [x] **SocialModal full width** — ✅ Reduced padding to match settings width, centered tab pill spacing
- [x] **Settings on all screens** — ✅ Gear icon in PageHeader (available on Feed, Logbook, Explore, Profile). SettingsModal extracted to shared component
- [x] **SettingsModal restyled** — ✅ Now uses SharedModal shell (dark overlay, glass card, drag handle) matching SocialModal

---

## 📝 Notes
- The food/drinks + theater uncommitted work from April is saved in `~/Desktop/Workspace/LogIt-old/` — bring those changes over when ready
- Feed mock cards (`MOCK_CARDS` in `feed.tsx`) serve as design templates for different event type cards — preserve them as reference even after real data is wired up
- **Typography.pageHeader** — all page title text must use `Typography.pageHeader` from `constants/typography.ts` (28px, headlineExtraBold, -0.5 letter-spacing). This ensures consistent header sizing across all tab screens.
- **SharedModal architecture** — `components/ui/SharedModal.tsx` is the single source of truth for modal appearance. It exports `SharedModal` (shell) plus building blocks: `ModalRow`, `ModalSectionCard`, `ModalSectionHeader`, `ModalDivider`, `ModalPill`, `ModalRightText`. All modals must use it.
