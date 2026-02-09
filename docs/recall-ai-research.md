# Recall.ai Integration Research

> Research conducted: Feb 8, 2026
> Purpose: Evaluate Recall.ai for auto-join meeting bot capability

---

## Executive Summary

Recall.ai is the leading Meeting Bot API provider with **sub-second webhook latency**, multi-platform support, and **99.9% uptime SLA**. They've raised $38M Series B (Feb 2026) and are used by major companies including Calendly, Datadog, HubSpot, and ClickUp.

**Recommendation**: Strong fit for ReplySequence. Single integration handles Zoom, Teams, and Meet with real-time transcript delivery.

---

## 1. API Capabilities

### Supported Platforms
- Zoom
- Google Meet
- Microsoft Teams
- Slack Huddles
- Webex
- In-person meetings (via SDKs)
- Phone calls
- Desktop and Mobile Recording SDKs

### How the Bot Joins
- Automated bots join meetings via API call
- "Deploy in minutes, not hours" - single API change
- 99.9% uptime SLA with thousands of concurrent bots
- Billions of minutes processed annually

### Transcript Delivery
- **Real-time webhook delivery with sub-second latency**
- Asynchronous post-call transcription available
- Support for multiple transcription providers (can bring your own API keys)
- Multiple transcript formats (JSON, VTT, SRT)

### Data Available
- Recordings (audio/video)
- Transcripts (real-time and post-call)
- Speaker identification
- Chat messages
- Participant events and metadata
- Real-time audio/video streams via WebSocket (200ms latency)

---

## 2. Pricing

### Pay As You Go (Startup Tier)
| Item | Cost |
|------|------|
| First 5 hours | **FREE** |
| Recording | $0.50/hour |
| Storage (after 7 days) | $0.05/hour |
| Monthly limit | 500 hours |
| Per-recording limit | 2 hours |

**Billing**: Prorated to the second (30 min = $0.25)

### Launch Plan
- For companies launching their product
- Custom pricing
- No monthly recording limit
- Slack channel support

### Enterprise Plan
- Custom pricing
- Dedicated Slack channel
- Premium SLA options
- No limits

### Cost Estimate for ReplySequence MVP
| Usage | Monthly Cost |
|-------|--------------|
| 10 meetings × 1 hour | ~$5/month |
| 50 meetings × 1 hour | ~$25/month |
| 100 meetings × 1 hour | ~$50/month |

---

## 3. Technical Integration

### API Products
- Meeting Bot API (primary - for auto-join)
- Meeting Transcription API
- Meeting Recording API
- Desktop/Mobile Recording SDKs

### Key Features
- Single API for cross-platform recording
- Real-time and post-call delivery
- Webhook-based with sub-second latency
- WebSocket for real-time audio (200ms latency)
- Configurable transcription settings
- BYOK: Bring your own transcription API keys (OpenAI, etc.)

### Authentication
- API key-based authentication
- Dashboard for key management
- Support for own transcription API keys

### Documentation
- Official docs: https://docs.recall.ai/
- "Ask AI" feature for API support
- Code examples available

---

## 4. Comparison with Alternatives

| Feature | Recall.ai | Assembly AI | Rev.ai | Build Own |
|---------|-----------|-------------|--------|-----------|
| Multi-platform | ✅ All major | ✅ Limited | ❌ | ⚠️ Complex |
| Real-time delivery | ✅ Sub-second | ⚠️ Slower | ❌ | ⚠️ Hard |
| Uptime SLA | 99.9% | 99.5% | 99% | Variable |
| Bot management | ✅ Managed | ✅ Managed | ❌ | ❌ DIY |
| Pricing | $0.50/hr | ~$0.60/hr | ~$0.40/hr | High dev cost |

### Why Recall.ai for ReplySequence
1. **Webhook Delivery**: Sub-second latency critical for fast draft generation
2. **Multi-Platform**: One integration for Zoom, Teams, Meet
3. **Real-time**: Can start draft generation while meeting is happening
4. **Reliability**: 99.9% SLA means fewer retry loops
5. **BYOK**: Could use Claude for transcription if needed

---

## 5. Integration Plan

### Phase 1: Setup (1 day)
1. Create Recall.ai account
2. Get API keys
3. Set up webhook endpoint for transcript delivery

### Phase 2: Core Integration (2 days)
1. Create bot scheduling API endpoint
2. Handle webhook transcript delivery
3. Connect to existing draft generation pipeline
4. Store bot/meeting associations in database

### Phase 3: User Experience (1 day)
1. Calendar integration UI
2. Toggle for auto-join per meeting
3. Bot status display in dashboard

### Database Changes Needed
```sql
-- New table for Recall.ai bot tracking
CREATE TABLE recall_bots (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  meeting_id UUID REFERENCES meetings(id),
  recall_bot_id TEXT NOT NULL,
  meeting_url TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  scheduled_at TIMESTAMP,
  joined_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Environment Variables
```env
RECALL_API_KEY=your_api_key
RECALL_WEBHOOK_SECRET=your_webhook_secret
```

---

## 6. Next Steps

1. **Sign up** at https://www.recall.ai/ (5 free hours)
2. **Review docs** at https://docs.recall.ai/
3. **Create webhook endpoint** for transcript delivery
4. **Implement Calendar Integration** first (dependency)
5. **Build bot scheduling flow**

---

## References

- Website: https://www.recall.ai/
- Docs: https://docs.recall.ai/
- Pricing: https://www.recall.ai/pricing
- Series B Announcement: https://www.recall.ai/blog/recall-ai-series-b-the-api-for-meeting-recording
