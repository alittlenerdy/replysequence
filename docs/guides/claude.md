# Claude Code Instructions for ReplySequence

## Build Logging

After completing any autonomous task, append an entry to `/docs/logs/build-log.md`:

```markdown
## [YYYY-MM-DD HH:MM] - [Task Description]
**Commit:** [hash]
**Files Changed:** [list]
**Summary:** [what was built]
**Key Issues:** [what broke/fixed]
**Duration:** [time spent if known]

---
```

## Project Context

- This is a Next.js 14 app with App Router
- Database: PostgreSQL via Drizzle ORM (Supabase hosted)
- Zoom integration for meeting transcripts
- Environment variables in `.env.local`

## Coding Standards

- Use structured JSON logging (`console.log(JSON.stringify({...}))`)
- Add latency tracking to async operations
- Always run `npx tsc --noEmit` before committing
- Generate Drizzle migrations with `npx drizzle-kit generate`
