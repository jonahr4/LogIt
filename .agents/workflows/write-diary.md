---
description: Write a diary log summarizing the current session — what was done, learned, blockers, and solutions
---

# Write Diary Log

Create a session diary entry in `docs/diary/`. These logs serve as a dev journal — like a standup summary capturing what happened, what was learned, and what's unresolved.

---

## Steps

### 1. Determine the Topic

- If the user specifies a topic or focus area, use that as the primary framing for the entry.
- If no topic is given, review the current conversation history to identify everything done since the last diary entry.

### 2. Check for Previous Entries

- Read the `docs/diary/` directory to see existing logs.
- If there are previous entries, read the most recent one to understand where things left off. This helps frame "what changed since last time."

### 3. Create the Diary Entry

Create a new markdown file at:

```
docs/diary/Log - YYYY-MM-DD-HHmm.md
```

Use the current local date and time (24h format). Example: `Log - 2026-05-27-0047.md`

### 4. Entry Format

Use this template:

```markdown
# Session Log — [Date, Human Readable]

**Time:** [start time or approximate time]
**Focus:** [1-line summary of the session's main theme]

---

## What We Did
- Bullet list of concrete things accomplished
- Be specific — mention file names, features, commands run
- Group related items together

## What We Learned
- Key insights, discoveries, or "aha" moments
- Things about the codebase, tools, APIs, or architecture
- Include context for why it matters

## Blockers & Issues
- Problems encountered during the session
- Things that are still unresolved
- External dependencies or decisions needed
- Mark resolved blockers with ✅ and unresolved with 🔴

## What's Next
- Natural next steps based on this session
- Open questions to pick up next time
- Priority items for the next session
```

### 5. Writing Style

- Write in first-person plural ("we") — casual but informative
- Keep it scannable — short bullets, not paragraphs
- Be honest about blockers — these logs are for the developer, not a boss
- Include enough context that re-reading it weeks later still makes sense
- Reference specific files, endpoints, or features by name
- If a decision was made, note the reasoning briefly

### 6. Confirm

After creating the entry, tell the user the file was created and give a 1-line summary of what it covers.
