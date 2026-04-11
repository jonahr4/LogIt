# Claude Cowork Suggestions — LogIt

> Auto-updated by scheduled workspace audit. Brief, actionable suggestions only.
> Each entry is timestamped. Older entries stay for reference.

---

## 2026-04-11

**Ideas:**
- **Fix git state first** — staging area has renames to `*ncaamb.ts`/`*ncaawb.ts` files that were then deleted; untracked originals exist. `git reset HEAD` on NCAA files before any commit or the history will be broken.
- Feed is still `MOCK_CARDS` (9 days). Create `api/logs/global.ts` (public logs JOIN events JOIN users, no auth) and swap into `feed.tsx`. One session closes MVP Phase 6.
- Add backfill cron schedule entries to `vercel.json` — 10 backfill scripts exist with no cron entries; historical data for NFL/NHL/MLB/WNBA/NCAA never auto-populates. Zero code, just config.
- Post-event auto-prompt: when sync sets `status = 'final'`, query `user_event_logs` and fire FCM push "Add your rating/photos." FCM + crons already live — zero new infrastructure.
- Win/loss attendance record on Profile ("Your Celtics went 9-3 when you attended") — pure SQL, no schema changes, highest shareability stat available today.
- Today's work shipped: `TeamLogo` fallback component, box score hidden for NCAAMH/NCAAWH/NCAABS (ESPN has no data), `type_metadata.league` fix in box-score fetch, NCAAM→NCAAMB display labels in logbook + EventDetailModal.

**Risks/Issues:**
- **Git state is broken** — staged NCAAM→NCAAMB renames point to deleted files; untracked originals present. A commit right now creates corrupted history. Clean before committing.
- Feed mock data is 9 days old — do not share TestFlight links or demo until fixed.
- Firebase service account JSON history still unaudited (flagged since Apr 7). Run `git log --all --oneline -- the-logit-app-firebase-adminsdk-fbsvc-7538e8cf92.json` and rotate if any hit.
- No Sentry on 22 production cron jobs — silent ESPN failures produce stale data with zero alert.
- `api/events/manual-create.ts` still missing — concerts/theater/dining hit a 422 backend error despite the UI allowing the flow.

---

## 2026-04-10

**Ideas:**
- Feed still `MOCK_CARDS` — now 8 days since last LogIt commit (Apr 2). Create `api/logs/global.ts` (SELECT `user_event_logs` JOIN `events` JOIN `users` WHERE `privacy = 'public'`) and replace mock in `feed.tsx`. One session closes MVP.
- Post-event auto-prompt: when sync sets `status = 'final'`, query `user_event_logs` for that `event_id` and fire FCM push "Add your rating/photos." FCM + crons already live — zero new infrastructure.
- Win/loss attendance stat still unbuilt — "Your Celtics went 9-3 when you attended." Pure SQL from existing tables, highest shareability stat in the app.
- FCRC CSV export: PapaParse in `package.json`, data loaded client-side. Add `Papa.unparse()` download button before imminent stakeholder demo (~30 min).
- "Also Here" count on event detail: `SELECT count(*) WHERE event_id = X AND privacy = 'public'` — earliest visible social proof before friend system ships.
- InternAtlas email alerts: recruiting season window closing. Resend + `email_subscriptions` table is ~2-3 hrs and converts the tool from passive board to active alert system.

**Risks/Issues:**
- Feed mock data is now 8 days stale (Apr 2 last commit). Every day without the real feed endpoint is a day closer to losing launch momentum entirely.
- 10 backfill cron scripts exist with no `vercel.json` schedule entries — historical data for NFL, NHL, MLB, WNBA, and 6 NCAA leagues never auto-populates.
- `manual-create.ts` still missing — concerts, theater, dining unloggable despite being visible in the UI. Non-sports users hit a dead end.
- No Sentry on 22 production cron jobs — a silent ESPN API failure produces stale data with zero alert. Add free tier to sync-nba + sync-nfl as minimum.
- TaskApp-Mobile: `.ipa` files present at repo root (`.gitignore` now correct but run `git rm --cached *.ipa` to untrack if still staged).

---

## 2026-04-09

**Ideas:**
- Feed is still `MOCK_CARDS` — 9 days unfixed. Create `api/logs/global.ts` (public logs, no auth, JOIN events + users) and swap it in `feed.tsx`. This is the only remaining MVP gate.
- 10 backfill cron endpoints (`backfill-ncaamb`, `backfill-wnba`, `backfill-nfl`, etc.) have no schedule in `vercel.json` — add weekly entries (e.g. Sunday 2 AM UTC). Zero code, just config.
- `manual-create.ts` still missing — concerts, restaurants, theater unloggable. ~25 lines to insert into `events` table with `external_source = 'manual'`. Unblocks all non-sports users.
- Win/loss attendance record: "Your Celtics went 9-3 when you attended" — pure client-side calc from `GET /api/logs/mine`, zero schema changes, high shareability. Still unbuilt.
- TaskApp-Mobile: `task_deleted` and `ai_task_created` missing from `EventName` in `analytics.ts` — V1.0.4 roadmap explicitly lists these as goals. Wire before moving to V1.0.5.
- InternAtlas email alerts (Resend) remain unchecked — recruiting season is peaking, this is the one feature that makes the tool active vs. passive.

**Risks/Issues:**
- Feed mock data is now 9 days old. Do not share a TestFlight link or demo LogIt until `MOCK_CARDS` is replaced.
- 11 `.ipa` binary build artifacts are committed to TaskApp-Mobile git repo root. Add `*.ipa` to `.gitignore` and untrack now before repo becomes unwieldy.
- No error monitoring on 22 production cron jobs — a silent ESPN API failure produces stale data with zero alert. Add Sentry free tier to sync-nba + sync-nfl as a start.
- `manual-create.ts` missing for 10+ days — non-sports event types (concert, restaurant, theater) are unloggable despite being shown in the UI.
- FCRC: PapaParse installed but no CSV export in UI — stakeholder demo likely imminent, add Export button before any handoff.

---

## 2026-04-08

**Ideas:**
- Wire `GET /api/feed/global` NOW — feed has been mock for 6+ days. Phase 6 is the only remaining MVP phase. One focused 3-hr session closes it. Do this before any more sports leagues.
- College sports rename (NCAAM→NCAAMB, NCAAW→NCAAWB) just landed via migration 018 — double-check `add-log.tsx` and `logbook.tsx` display logic still maps correctly against the new league string values.
- `backfill-ncaamb` and `backfill-ncaawb` scripts exist but no cron entries in `vercel.json` — add scheduled backfill triggers the same way other sports have them, or they'll never run automatically.
- TaskApp-Mobile V1.0.4 is in progress (analytics + UX) — `task_deleted` and `task_completed` event tracking is the most valuable unshipped item there; complete it before moving to new features.
- Win/loss attendance stat on Profile — pure client-side, no schema changes, high shareability. Still unbuilt after 3 days of flagging.
- InternAtlas: no code since Mar 29. Email alert subscriptions remain the highest-ROI unshipped feature — even a basic Resend integration would dramatically improve retention.

**Risks/Issues:**
- Feed mock data is now a week-old blocker. Six days since first flagged; still `MOCK_CARDS` in `feed.tsx`. Do not soft-launch until this ships.
- `api/events/manual-create.ts` still doesn't exist — concerts, dining, theater are unloggable. Non-sports users hit a dead end.
- Firebase SDK key confirmed in `.gitignore` (not tracked), but confirm it was never committed in history: `git log --all --oneline -- the-logit-app-firebase-adminsdk-fbsvc-7538e8cf92.json`. If any hit, rotate immediately.
- No Sentry or error monitoring on 22+ cron jobs. A silent failure in any sync would produce stale data with no alert.
- FCRC README refreshed Apr 6–7 — stakeholder demo likely imminent. Confirm the CSV export gap won't block a handoff.

---

## 2026-04-07

**Ideas:**
- Wire `GET /api/feed/global` + replace `MOCK_CARDS` in `feed.tsx` — still the #1 launch blocker, 5 days unfixed. Do this first.
- Post-event prompt via cron: when sync updates event to `status = 'final'`, scan `user_event_logs` for that event and trigger FCM push. Infrastructure (FCM + crons) already live.
- Multi-sport filter chips in Logbook + Feed — all 11 sports tagged in DB, filter chips already exist in logbook UI. ~2 hrs, zero new infrastructure.
- Win/loss attendance record on Profile: "Your Celtics went 9-3 when you attended." Pure client-side calc from `GET /api/logs/mine`. High social shareability.
- FCRC: Add CSV export button (PapaParse already in `package.json`) — README refreshed yesterday, stakeholder handoff likely imminent.
- CS519 se-iroko-connector accessed today — if there's a deadline, time-box that work to avoid losing LogIt launch momentum.

**Risks/Issues:**
- **SECURITY:** `the-logit-app-firebase-adminsdk-fbsvc-7538e8cf92.json` exists at LogIt repo root. Run `git log --all --oneline -- the-logit-app-firebase-adminsdk-fbsvc-7538e8cf92.json` immediately. If in history, rotate the service account key and purge with BFG.
- Feed still mock (5 days since flagged, 5 days since last commit). Momentum stall at MVP final phase is a real risk.
- `api/events/manual-create.ts` still missing — concerts, theater, dining unloggable.
- Auto-created user profiles in `logs/create.ts` fallback are incomplete (`first_name: ''`). Will cause broken display names in feed.
- CS519 competing for attention at the exact moment LogIt needs a 3-hr push to reach MVP.

---

## 2026-04-06

**Ideas:**
- Wire `GET /api/feed/global` (public logs, no auth) → replace mock data in `feed.tsx` Global tab. ~3 hrs, launch blocker.
- Build `api/events/manual-create.ts` — last unchecked Phase 3 item. Unblocks non-sports events immediately.
- "Also Here" count on event detail: `SELECT count(*) WHERE event_id = X AND privacy = 'public'`. Zero schema changes.
- Share log as image via `react-native-view-shot` — free organic marketing, you already have team logos + score data.

**Risks/Issues:**
- Feed is 100% mock data (`MOCK_CARDS` in `feed.tsx`). Don't share LogIt publicly until fixed.
- No error monitoring on prod — 21 cron jobs running blind. Add Sentry (free tier, ~1 hr).
- Verify `admin/config.js` was never git committed (`git log --all -- admin/config.js`). If it was, rotate Supabase service_role key.
- Firebase/Supabase auth race condition: auto-create fallback in `logs/create.ts` creates broken user profiles silently. Add a proper `ensure-user` endpoint.
- LogIt isn't on your personal website yet.
