# Claude Code Prompt Formula - PROVEN METHODOLOGY
**Last Updated:** January 27, 2026  
**Source:** Resolved 4-day Anthropic SDK blocker in 3 hours using this exact formula

---

## 🎯 THE BREAKTHROUGH

**What happened:** Spent 4 days debugging Anthropic SDK timeouts in Vercel. Tried 20+ "fixes." Nothing worked.

**What changed:** Used this systematic formula. Found root cause in 3 hours. **The SDK doesn't work in serverless environments.**

**Key insight:** Stop debugging symptoms. Research → Test assumptions → Fix root cause.

---

## ⚡ THE FORMULA (6 Steps)

### STEP 1: RESEARCH FIRST (Mandatory)
**DO NOT SKIP THIS STEP. EVER.**

Before writing ANY code, research the problem space:

```
Research Phase Checklist:
□ Web search: "[library name] [environment] compatibility"
□ Web search: "[specific error] [technology stack]"  
□ Web search: "[feature] production deployment best practices"
□ Save findings to /tmp/research_*.md files
□ CHECKPOINT: Do not proceed without ALL research files
```

**Example from 4-day blocker:**
```
Search 1: "Anthropic SDK Vercel serverless timeout"
Search 2: "Anthropic API streaming Node.js fetch authentication"
Search 3: "Vercel serverless function timeout limits best practices"

Save findings → /tmp/research_sdk.md, /tmp/research_streaming.md, /tmp/research_vercel.md
```

**Why this works:** Uncovers incompatibilities BEFORE you build. Would have saved 4 days.

---

### STEP 2: ANALYZE CURRENT CODE
**Understand what's actually broken before "fixing" it.**

```
Code Analysis Checklist:
□ Find the relevant file and function
□ Document what it's TRYING to do
□ Document what it's ACTUALLY doing (logs, behavior)
□ Identify assumptions (libraries work, APIs respond, timeouts trigger)
□ Save analysis → /tmp/current_code_analysis.md
```

**Example:**
```markdown
# Current Code Analysis

File: `/path/to/webhook/handler.ts`
Function: `handleTranscriptCompleted()`

What it's trying to do:
1. Receive webhook from Zoom
2. Download transcript using Anthropic SDK
3. Parse transcript
4. Generate draft using Claude API
5. Store in database

What it's actually doing:
- Step 1-2: Working
- Step 3: **HANGS INDEFINITELY**
- Step 4-5: Never reached

Assumptions (TO TEST):
- Anthropic SDK works in Vercel serverless ❌ FALSE
- Timeout configuration will prevent hangs ❌ FALSE  
- SDK uses same patterns as REST API ❌ FALSE
```

---

### STEP 3: UNDERSTAND THE PROBLEM
**Write out the expected flow vs actual behavior.**

```
Problem Understanding Template:

EXPECTED FLOW:
1. [Step 1]
2. [Step 2]  
3. [Step 3]
...

ACTUAL BEHAVIOR:
1. [Step 1] ✅ Works
2. [Step 2] ❌ Hangs here
3. [Step 3] Never reached

HYPOTHESIS:
Based on research, likely causes:
- [Cause 1]
- [Cause 2]
- [Cause 3]

TESTING PLAN:
1. Test [hypothesis 1] by [action]
2. Test [hypothesis 2] by [action]
```

---

### STEP 4: FIX IMPLEMENTATION
**Now - and ONLY now - write code.**

```
Implementation Checklist:
□ Address root cause from research (not symptoms)
□ Implement fix with proper error handling
□ Add logging: [TAG-1] through [TAG-N] for each step
□ Set correct timeouts for environment
□ Handle edge cases discovered in research
□ Write code with verification in mind
```

**Example logging pattern:**
```javascript
console.log('[TRANSCRIPT-1] Starting download, URL:', downloadUrl);
// ... download logic ...
console.log('[TRANSCRIPT-2] Download complete, size:', content.length);
// ... parsing logic ...
console.log('[TRANSCRIPT-3] Parsed segments:', segments.length);
```

**Why this works:** Each log becomes proof point. Can trace exact failure.

---

### STEP 5: TEST & VERIFY
**Prove it works. Don't assume.**

```bash
# Standard verification pattern:

# 1. Commit and push
git add .
git commit -m "fix: transcript download with proper auth"
git push origin main

# 2. Wait for deployment
sleep 45  # Vercel takes ~30-45s

# 3. Trigger test
# (Make test API call, webhook, or manual test)

# 4. Check logs
vercel logs https://yourapp.vercel.app --since 10m | grep "TRANSCRIPT"

# 5. Query database to verify data
# (SQL query showing actual stored content)
```

**Critical:** If logs don't show success, IT DIDN'T WORK. Don't claim done.

---

### STEP 6: REQUIRED EVIDENCE (ALL 7 Pieces)
**Don't report "done" without these:**

1. ✅ Research findings (3 files from Step 1)
2. ✅ Code analysis showing the problem
3. ✅ Fixed code (git commit hash)
4. ✅ Deployment logs showing success
5. ✅ Database query showing stored data
6. ✅ Performance metrics (time, cost, etc)
7. ✅ Test results with real data

**No evidence = No completion.**

---

## 📋 COMPLETE PROMPT TEMPLATE

```
TASK: [Brief description of what needs to be fixed/built]

STEP 1: RESEARCH (MANDATORY - DO NOT SKIP)
Execute these web searches and save findings:
1. Search: "[technology] [environment] [feature]"
2. Search: "[error/issue] [stack] production"  
3. Search: "[library] best practices deployment"

Save each to /tmp/research_[topic].md

CHECKPOINT: Do not proceed without all 3 research files.

STEP 2: CODE ANALYSIS  
File: [exact filepath]
Function: [function name]

Document:
- What it's trying to do
- What it's actually doing (check logs)
- Assumptions that might be wrong
- Save to /tmp/code_analysis.md

STEP 3: PROBLEM UNDERSTANDING
Expected flow: [list steps]
Actual behavior: [what happens]  
Hypothesis: [based on research]
Testing plan: [how to verify]

STEP 4: IMPLEMENTATION
Based on research findings:
- Fix root cause (not symptoms)
- Add logging tags [TAG-1] through [TAG-N]
- Set proper timeouts for environment
- Handle edge cases from research
- Error handling for failures

STEP 5: VERIFICATION
```bash
git add . && git commit -m "fix: [description]" && git push
sleep 45
# Run test
vercel logs https://yourapp.vercel.app --since 10m | grep "[TAG]"
# Query database
```

STEP 6: REQUIRED EVIDENCE
Provide all 7:
1. Research files (3 files)
2. Code analysis (before fix)
3. Git commit hash (8 chars)
4. Deployment logs (showing success tags)
5. Database query (showing stored data)
6. Performance (time/cost metrics)
7. Test results (real data, not mocked)

SUCCESS CRITERIA:
□ Research complete (3 files)
□ Root cause identified (not symptoms)
□ Fix implemented (commit pushed)
□ Logs show success tags
□ Database shows correct data
□ Performance meets targets
□ All 7 evidence pieces provided

DO NOT STOP until all 7 pieces of evidence are provided.
```

---

## 🚨 COMMON MISTAKES TO AVOID

### Mistake 1: Skipping Research
**Don't:** "Let me try adding a timeout..."  
**Do:** "Let me research Anthropic SDK serverless compatibility first."

**Result:** 4 days debugging vs 3 hours.

### Mistake 2: Fixing Symptoms
**Don't:** Increase timeout → still hangs → add retry → still hangs → change config → still hangs  
**Do:** Research root cause (SDK incompatible with serverless) → Use raw fetch() → Works immediately

### Mistake 3: No Evidence
**Don't:** "I fixed it, should work now."  
**Do:** "Fixed. Evidence: Logs show [TAG-1] through [TAG-6], database query returns 259 lines of content, draft generated in 8.2s."

### Mistake 4: Incremental Debugging
**Don't:** Fix one thing → test → fix another → test → fix another → test  
**Do:** Research → identify all issues → fix all at once → test complete flow

### Mistake 5: Assuming It Works
**Don't:** Code looks right, deployment succeeded, probably works.  
**Do:** Logs show success, database query returns data, API call works, performance metrics met.

---

## 💡 WHEN TO USE THIS FORMULA

### Always use for:
- Third-party SDK integration
- Production deployment issues
- Multi-day blockers
- Features that "should work but don't"
- Performance problems
- Timeout/hanging issues
- Authentication failures

### Don't need for:
- Simple UI changes
- CSS tweaks
- Copy updates
- Config value changes
- Obvious typos

---

## 🎯 REAL EXAMPLE: Transcript Download Bug (Jan 27, 2026)

**Prompt that will work:**

```
TASK: Fix transcript download - VTT files exist but database content field is empty

STEP 1: RESEARCH
Search 1: "Zoom recording.transcript_completed webhook payload structure"
Search 2: "Zoom VTT transcript download Node.js fetch authentication"
Search 3: "Vercel serverless function timeout VTT file download"

Save findings to /tmp/research_zoom.md, /tmp/research_auth.md, /tmp/research_timeout.md

CHECKPOINT: Verify all 3 files exist before proceeding.

STEP 2: CODE ANALYSIS
File: `/Volumes/just_a_little_nerd/replysequence/src/app/api/webhooks/zoom/route.ts`
Function: `handleTranscriptCompleted`

What it's trying to do:
1. Extract download URL from webhook
2. Fetch VTT file using authentication
3. Parse VTT into speaker segments
4. Store raw content in transcripts.content
5. Update meeting status to 'ready'

What it's actually doing:
- Webhook arrives ✅
- Meeting record created ✅  
- Transcript record created ✅
- content field is NULL ❌

Assumptions to test:
- download_token from webhook payload works
- VTT file fetches successfully
- Content stores in database correctly

STEP 3: PROBLEM UNDERSTANDING
Expected: VTT downloads → content stores → ready for draft generation
Actual: Records created but content is empty

Hypothesis:
1. Not finding download URL in webhook payload
2. Using wrong authentication method
3. Download succeeds but storage fails
4. Timeout cutting off before storage

Testing plan:
1. Log exact webhook payload structure
2. Log download URL and auth token used
3. Log downloaded content size
4. Log database insert operation

STEP 4: IMPLEMENTATION
Based on research:
- Extract download_token from webhook.payload.object.recording_files[0].download_url
- Use download_token as query parameter
- Set 30s timeout (not 5 minutes)
- Add comprehensive logging:
  [TRANSCRIPT-1] Webhook received
  [TRANSCRIPT-2] Download URL extracted  
  [TRANSCRIPT-3] VTT downloaded, size: X
  [TRANSCRIPT-4] Segments parsed, count: Y
  [TRANSCRIPT-5] Content stored in DB
  [TRANSCRIPT-6] Meeting status updated

STEP 5: VERIFICATION
```bash
git commit -m "fix: transcript download with download_token auth"
git push origin main  
sleep 45
# Trigger test meeting
vercel logs https://replysequence.vercel.app --since 10m | grep "TRANSCRIPT"
# Query database
SELECT id, LENGTH(content), SUBSTRING(content, 1, 50) 
FROM transcripts 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

STEP 6: EVIDENCE
1. Research files: /tmp/research_zoom.md, research_auth.md, research_timeout.md
2. Code analysis: Current code, identified missing auth
3. Git commit: a7b3c9d2
4. Logs: [TRANSCRIPT-1] through [TRANSCRIPT-6] all present
5. Database: content LENGTH = 8,432 chars, starts with "WEBVTT"
6. Performance: Download 1.2s, parse 0.3s, total 1.5s
7. Test: Real Zoom meeting processed successfully

SUCCESS: All 7 evidence pieces provided. Transcript download working.
```

---

## 🏆 SUCCESS METRICS

Using this formula:
- ✅ 4-day blocker → 3 hours (12x faster)
- ✅ Found root cause (SDK incompatibility) not symptoms
- ✅ Solution worked first try (no iteration)
- ✅ Complete evidence trail for documentation
- ✅ Replicable process for next blocker

**The key:** Research FIRST. Test assumptions BEFORE building. Prove with evidence.

---

**Remember:** Someone who rejected you is watching. Don't waste 4 days when research would take 30 minutes.
