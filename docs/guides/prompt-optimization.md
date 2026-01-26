# Prompt Optimization Guide

This document describes the optimized prompt system for generating high-quality follow-up emails.

## Overview

The v2 prompt system includes:
- **Meeting type detection** - Automatically identifies sales calls, internal syncs, client reviews, and technical discussions
- **Tone adaptation** - Adjusts formality based on conversation style
- **Structured output** - JSON response with subject, body, and action items
- **Quality scoring** - Automatic scoring (0-100) with issue detection

## Meeting Type Detection

The system detects 5 meeting types based on keyword analysis:

| Type | Signals | Focus |
|------|---------|-------|
| `sales_call` | pricing, proposal, demo, competitor | Next steps, value prop, timeline |
| `internal_sync` | standup, sprint, blocker, roadmap | Decisions, action items, blockers |
| `client_review` | feedback, deliverable, scope, approval | Feedback, timeline, scope changes |
| `technical_discussion` | api, database, deploy, debugging | Technical decisions, solutions |
| `general` | Default fallback | Key takeaways, next steps |

### Detection Algorithm

1. Scan transcript for keyword patterns
2. Weight occurrences (max 3 per keyword)
3. Calculate confidence score (0-100)
4. Select highest-scoring type

## Prompt Structure

### System Prompt

The system prompt establishes:
- Role: Expert follow-up email writer
- Output format: Strict JSON structure
- Quality criteria: Specific subjects, clear CTAs, owner/deadline action items
- Anti-patterns: Generic phrases to avoid

### User Prompt

Built dynamically with:
- Meeting metadata (topic, date, participants)
- Detected meeting type and tone
- Full transcript
- Type-specific focus instructions

## Output Format

```json
{
  "subject": "Redis debugging session - next steps",
  "body": "Hi James, ...",
  "actionItems": [
    {
      "owner": "Jimmy",
      "task": "Send calendar invite for debugging session",
      "deadline": "by Wednesday"
    }
  ],
  "meetingTypeDetected": "technical_discussion",
  "toneUsed": "neutral",
  "keyPointsReferenced": ["timeout errors", "ioredis configuration"]
}
```

## Quality Scoring

Drafts are scored on 4 dimensions (25 points each):

### Subject Score (0-25)
- Length: 30-60 characters ideal
- Specificity: Penalize generic patterns
- Context: Reference transcript content

### Body Score (0-25)
- Length: 100-200 words ideal
- Generic phrases: Penalize clichés
- Context references: Reward specific callbacks

### Action Items Score (0-25)
- Owner clarity: Named individuals
- Deadline specificity: "by Friday" vs "asap"
- Task clarity: Actionable descriptions

### Structure Score (0-25)
- Greeting: Personalized opening
- CTA: Clear call-to-action
- Paragraphs: Proper formatting

## Quality Grades

| Score | Grade | Meaning |
|-------|-------|---------|
| 85-100 | A | Excellent, send as-is |
| 70-84 | B | Good, minor edits |
| 55-69 | C | Acceptable, needs review |
| 40-54 | D | Poor, significant edits needed |
| 0-39 | F | Unusable, regenerate |

## Token Optimization

- MAX_OUTPUT_TOKENS reduced from 4096 to 2048
- Target: Punchier, more focused drafts
- Latency improvement: ~30% faster generation

## Testing

Run the quality test harness:

```bash
npx tsx scripts/test-prompt-quality.ts
```

This tests:
- Meeting type detection accuracy
- Tone detection accuracy
- Quality scoring consistency

## Best Practices

### DO:
- Reference 2-3 specific points from the transcript
- Use names when addressing recipients
- Include one clear CTA
- Format action items with owner and deadline

### DON'T:
- Start with "It was great meeting you"
- Include multiple CTAs
- Use generic subject lines
- List more than 5 action items

## Database Schema

New fields added to `drafts` table:

```sql
quality_score     INTEGER      -- 0-100 quality score
meeting_type      TEXT         -- Detected meeting type
tone_used         TEXT         -- formal/casual/neutral
action_items      JSONB        -- Structured action items
key_points_referenced JSONB    -- Points from transcript
```

## Monitoring

Track quality in Vercel logs:

```
message:"Draft quality scored" qualityScore:<70
```

Low-scoring drafts should be reviewed for prompt improvements.
