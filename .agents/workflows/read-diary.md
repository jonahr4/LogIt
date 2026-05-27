---
description: Read all diary logs and provide a narrative summary of the project's development journey
---

# Read Diary Logs

Read through all session diary entries in `docs/diary/` and synthesize them into a meaningful narrative — connecting the dots between sessions, tracking progress arcs, and surfacing patterns.

---

## Steps

### 1. Gather All Entries

- List all files in `docs/diary/` sorted by filename (which encodes the date/time).
- Read every diary entry fully.

### 2. Also Read Project Context

To give the diary entries proper context, also review:
- `docs/FEATURE_ROADMAP.md` — to map diary work against the planned roadmap
- `docs/PRODUCT_OVERVIEW.md` — to understand the bigger picture
- The most recent state of the codebase (check `git log --oneline -10` for recent commits)

### 3. Produce the Summary

Create a response (NOT a file — respond directly to the user) that covers:

#### Timeline & Progress Arc
- Walk through the diary entries chronologically
- Highlight the major milestones and turning points
- Show how the project evolved session by session

#### Themes & Patterns
- What areas got the most attention?
- Are there recurring blockers or pain points?
- What decisions were made and how did they play out?

#### Current State
- Based on the latest diary entry, where does the project stand right now?
- What's the most recent blocker or open question?
- What was the developer's momentum/energy like?

#### Recommendations
- Based on the diary history, what should be prioritized next?
- Are there any recurring issues that should be addressed structurally?
- Any patterns that suggest a better workflow?

### 4. Presentation Style

- Write it as a narrative, not a bullet dump — tell the story of the project
- Use the diary entries as primary sources, quoting key moments when relevant
- Be conversational — this is a debrief, not a report
- If there are only 1-2 entries, keep it short and focused
- If there are many entries, organize by phase/chapter rather than listing every session
