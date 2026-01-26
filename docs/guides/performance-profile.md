# Performance Profile

ReplySequence pipeline performance instrumentation and optimization guide.

## Target Latency

**Goal: < 2 minutes** from webhook receipt to draft generation.

## Pipeline Stages

The pipeline tracks timing across these stages:

| Stage | Description | Target |
|-------|-------------|--------|
| `webhook_received` | Initial webhook processing | < 100ms |
| `lock_acquired` | Redis idempotency lock | < 500ms |
| `event_stored` | Raw event storage in DB | < 200ms |
| `meeting_fetched` | Query existing meeting | < 200ms |
| `meeting_created` | Create/update meeting record | < 300ms |
| `transcript_download` | Download VTT from Zoom | < 5s |
| `transcript_parse` | Parse VTT into segments | < 100ms |
| `transcript_stored` | Store transcript in DB | < 500ms |
| `draft_generation` | Claude API streaming call | < 30s |
| `draft_stored` | Store draft in DB | < 200ms |

## Performance Logs

Pipeline metrics are logged as structured JSON:

```json
{
  "level": "info",
  "category": "PERFORMANCE",
  "event": "PIPELINE_END",
  "pipelineId": "transcript-abc123",
  "totalDurationMs": 45230,
  "stageCount": 8,
  "stageBreakdown": [
    {"stage": "webhook_received", "durationMs": 50, "percentOfTotal": 0},
    {"stage": "transcript_download", "durationMs": 3200, "percentOfTotal": 7},
    {"stage": "draft_generation", "durationMs": 28000, "percentOfTotal": 62}
  ],
  "targetMet": true
}
```

### Key Log Events

- `PIPELINE_START` - Pipeline begins
- `STAGE_START` - Stage begins with metadata
- `STAGE_END` - Stage completes with duration
- `PIPELINE_END` - Pipeline completes with full breakdown

## Optimization Notes

### Claude API (Primary Bottleneck)
- Uses streaming to prevent serverless timeouts
- 20s timeout, 2 max retries
- Typically 8-30s depending on transcript length

### Transcript Download
- Depends on Zoom CDN latency
- Uses download_token from webhook payload
- Typically 1-5s

### Database Operations
- 10s timeout on queries
- Minimal columns selected where possible
- Indexes on meetingId, zoomMeetingId

## Monitoring Queries

Filter Vercel logs for performance events:

```
category:PERFORMANCE event:PIPELINE_END
```

Find slow pipelines:

```
category:PERFORMANCE totalDurationMs:>120000
```

## Architecture Considerations

1. **Vercel Serverless Limits**
   - 60s function timeout (Pro plan)
   - Streaming keeps connections alive
   - Avoid long synchronous operations

2. **Redis (Upstash)**
   - Used for idempotency locks
   - 5s timeout on operations
   - Falls back to allow processing on failure

3. **PostgreSQL (Neon)**
   - 10s query timeout
   - Connection pooling via serverless driver
