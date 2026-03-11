---
name: typefully-publish
description: Cross-account social publishing workflow for @replysequence and @atinylittlenerd. Use when creating social media posts, scheduling tweets, or publishing content via Typefully.
---

# Typefully Cross-Account Publishing

You are publishing social content across two linked accounts. Follow this workflow exactly.

## Accounts

| Account | Social Set ID | Platform | Purpose |
|---------|--------------|----------|---------|
| @replysequence | `283435` | Twitter/X + LinkedIn | Product account |
| @atinylittlenerd | `266757` | Twitter/X | Jimmy's personal account |

## Publishing Workflow

### Step 1: Create @replysequence post
```
typefully_create_draft:
  social_set_id: "283435"
  content: "<post content>"
  platforms: ["twitter"] or ["twitter", "linkedin"]
  schedule: "next-free-slot" or specific datetime
```

### Step 2: Wait for @replysequence post to publish
- You need the published tweet URL before creating the quote-tweet
- If scheduling for later, note the scheduled time and plan Step 3 accordingly

### Step 3: Create @atinylittlenerd quote-tweet
```
typefully_create_draft:
  social_set_id: "266757"
  content: "<personal commentary on the post>"
  quote_post_url: "<published tweet URL from Step 1>"
  schedule: 2-4 hours AFTER the @replysequence post
```

## Content Rules

### Twitter/X
- Keep under 280 characters per tweet
- Use thread format (separator: `\n\n---\n\n`) for longer content
- The personal quote-tweet should add Jimmy's perspective, not just "check this out"

### LinkedIn
- LinkedIn posts MUST include images — text-only posts get no engagement
- Use `typefully_create_media_upload` to upload images first
- Longer form content works well on LinkedIn (3-5 paragraphs)
- Include relevant hashtags at the end

## Image Workflow

1. Generate or source the image
2. Upload via `typefully_create_media_upload` to get the media URL
3. Include the media URL in the draft's `media` field

## Scheduling Guidelines

- **@replysequence posts**: Schedule during business hours (9am-5pm CT)
- **@atinylittlenerd RT**: Schedule 2-4 hours after the product post
- **Frequency**: Up to 3 posts/day on @replysequence
- Use `typefully_get_queue_schedule` to check existing queue before scheduling

## Common Patterns

### Product announcement
1. @replysequence: Feature description + screenshot/demo
2. @atinylittlenerd: "Just shipped this for ReplySequence..." + personal angle

### Blog post distribution
1. @replysequence: Key insight from article + link
2. @atinylittlenerd: "Wrote about..." + personal learning

### Social proof / milestone
1. @replysequence: The achievement/metric
2. @atinylittlenerd: Behind-the-scenes story of how it happened
