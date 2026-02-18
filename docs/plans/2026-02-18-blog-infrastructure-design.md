# Blog & Content Marketing Infrastructure Design

**Date:** 2026-02-18
**ClickUp Task:** [86affcqcu](https://app.clickup.com/t/86affcqcu)
**Status:** Approved

## Context

ReplySequence has a working blog with 3 published posts. Posts are stored as TypeScript objects in `lib/blog-data.ts` with inline markdown strings. The blog listing (`/blog`) and dynamic post pages (`/blog/[slug]`) are functional. This task scales the content pipeline and adds missing infrastructure.

## Scope

### Infrastructure
1. **RSS feed** at `/blog/rss.xml` (Next.js route handler, RSS 2.0 XML)
2. **Sitemap fix** — add individual blog post URLs to `app/sitemap.ts`
3. **Social share buttons** on post pages (Twitter/X, LinkedIn, copy link)
4. **Tag filtering** on blog listing page (client-side filter with tag pills)
5. **RSS `<link>` tag** in root layout head

### Content
10 new SEO-targeted articles (~1,000-1,500 words each) added to `blog-data.ts`:
1. Meeting-to-Email: Why Copy-Paste Follow-ups Are Dead
2. How to Write the Perfect Sales Follow-up Email (AI-Generated)
3. ReplySequence vs Fathom: Which AI Meeting Assistant Sends Better Emails?
4. 5 Follow-up Email Templates That Get Responses
5. How We Built an AI That Turns Meeting Transcripts into Emails
6. The Sales Rep's Guide to AI Meeting Assistants in 2026
7. Why Your CRM Data Is Wrong (And How AI Meetings Fix It)
8. Meeting Overload? 7 AI Tools That Give You Your Time Back
9. ReplySequence vs Fireflies: Feature Comparison
10. How Consultants Use AI to Never Forget a Client Follow-up

### Not Included
- No CMS migration (staying with blog-data.ts)
- No newsletter signup
- No auto-posting to social APIs
- No blog search beyond tag filter
- No author pages or reading progress bar

## Architecture

### Files Modified
- `lib/blog-data.ts` — add 10 new blog post objects
- `app/sitemap.ts` — import blog posts, map to sitemap entries
- `app/blog/page.tsx` — add tag filter UI (client-side)
- `app/blog/[slug]/page.tsx` — add social share buttons
- `app/layout.tsx` — add RSS link tag

### Files Created
- `app/blog/rss.xml/route.ts` — RSS 2.0 feed endpoint

### Data Structure
Posts follow the existing `BlogPost` interface — no schema changes needed.

## Decisions
- **Content format**: Keep blog-data.ts (no MDX migration)
- **Article authorship**: All by "Jimmy Hackett"
- **Tag filtering**: Client-side, no URL routing
- **Social sharing**: URL-based share links, no API integration
- **RSS**: Standard RSS 2.0 XML format
