# Blog & Content Marketing Infrastructure — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add RSS feed, sitemap blog entries, social share buttons, tag filtering, and 10 SEO-targeted articles to the existing blog.

**Architecture:** Existing blog-data.ts pattern (TypeScript objects with inline markdown). No new dependencies. RSS feed is a Next.js route handler returning XML. Tag filtering is client-side state on the blog listing page.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Lucide icons

---

### Task 1: Add RSS Feed Route

**Files:**
- Create: `app/blog/rss.xml/route.ts`

**Step 1: Create RSS 2.0 route handler**

```typescript
import { blogPosts } from '@/lib/blog-data';

export async function GET() {
  const baseUrl = 'https://www.replysequence.com';

  const items = blogPosts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.date + 'T00:00:00').toUTCString()}</pubDate>
      <author>jimmy@replysequence.com (${post.author})</author>
      ${post.tags.map((tag) => `<category>${tag}</category>`).join('\n      ')}
    </item>`
    )
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ReplySequence Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Insights on meeting follow-up automation, sales productivity, and AI-powered email drafts.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(rss.trim(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
```

**Step 2: Add RSS link tag to root layout**

Modify: `app/layout.tsx` — add inside the metadata export, in the `other` or use a `<link>` in the head.

Actually, Next.js metadata API supports alternates:

```typescript
// Add to the metadata export in app/layout.tsx
alternates: {
  types: {
    'application/rss+xml': 'https://www.replysequence.com/blog/rss.xml',
  },
},
```

**Step 3: Verify RSS renders valid XML**

Run: `npx tsc --noEmit` to check types compile.
Manual: Visit `/blog/rss.xml` in dev to confirm valid RSS output.

**Step 4: Commit**

```
git add app/blog/rss.xml/route.ts app/layout.tsx
git commit -m "feat: add RSS feed for blog"
```

---

### Task 2: Add Blog Posts to Sitemap

**Files:**
- Modify: `app/sitemap.ts`

**Step 1: Import blog posts and add entries**

```typescript
import { blogPosts } from '@/lib/blog-data';

// At the end of the returned array, add:
// Blog listing page
{
  url: `${baseUrl}/blog`,
  lastModified,
  changeFrequency: 'weekly',
  priority: 0.8,
},
// Individual blog posts
...blogPosts.map((post) => ({
  url: `${baseUrl}/blog/${post.slug}`,
  lastModified: new Date(post.date + 'T00:00:00'),
  changeFrequency: 'monthly' as const,
  priority: 0.6,
})),
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```
git commit -m "feat: add blog posts to sitemap"
```

---

### Task 3: Add Tag Filtering to Blog Listing

**Files:**
- Modify: `app/blog/page.tsx`

**Step 1: Convert to client component and add tag filter state**

Add `'use client';` directive. Extract unique tags from blogPosts. Add `selectedTag` state. Filter posts by selected tag. Render tag pills above the grid.

Key UI elements:
- Tag pills row between hero and grid
- "All" pill (default selected)
- Each unique tag as a clickable pill
- Selected pill gets solid purple background
- Posts filtered client-side

Keep metadata by extracting it to a `generateMetadata` or using a separate layout. Actually, since we need SEO metadata, use a wrapper: keep the page as server component and extract the filterable grid into a client component.

Better approach: Create a `BlogGrid` client component that receives `blogPosts` as props and handles filtering internally.

**Step 2: Commit**

```
git commit -m "feat: add tag filtering to blog listing page"
```

---

### Task 4: Add Social Share Buttons to Blog Posts

**Files:**
- Modify: `app/blog/[slug]/page.tsx`

**Step 1: Add share buttons section after article content**

Add a share section between the article content and the CTA section. Three buttons:
- Twitter/X: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
- LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
- Copy Link: Client-side `navigator.clipboard.writeText(url)` with "Copied!" feedback

Since the page is a server component, the Copy Link button needs to be a small client component. Create an inline `ShareButtons` client component within the file or as a separate small component.

**Step 2: Commit**

```
git commit -m "feat: add social share buttons to blog posts"
```

---

### Task 5: Write Articles 1-5

**Files:**
- Modify: `lib/blog-data.ts`

Add 5 new BlogPost objects to the blogPosts array:

1. **"Meeting-to-Email: Why Copy-Paste Follow-ups Are Dead"**
   - Slug: `meeting-to-email-copy-paste-follow-ups-dead`
   - Tags: ['meeting follow-up', 'email automation', 'AI email drafts']
   - Date: 2026-02-18
   - ~1200 words, SEO target: "meeting follow-up email"

2. **"How to Write the Perfect Sales Follow-up Email (AI-Generated)"**
   - Slug: `perfect-sales-follow-up-email-ai-generated`
   - Tags: ['sales follow-up', 'AI email drafts', 'email templates']
   - Date: 2026-02-20
   - ~1300 words, SEO target: "sales follow-up email"

3. **"ReplySequence vs Fathom: Which AI Meeting Assistant Sends Better Emails?"**
   - Slug: `replysequence-vs-fathom-ai-meeting-assistant`
   - Tags: ['comparison', 'AI meeting assistant', 'Fathom alternative']
   - Date: 2026-02-22
   - ~1400 words, SEO target: "Fathom alternative", "ReplySequence vs Fathom"

4. **"5 Follow-up Email Templates That Get Responses"**
   - Slug: `follow-up-email-templates-that-get-responses`
   - Tags: ['email templates', 'sales follow-up', 'sales tips']
   - Date: 2026-02-25
   - ~1200 words, SEO target: "follow-up email templates"

5. **"How We Built an AI That Turns Meeting Transcripts into Emails"**
   - Slug: `how-we-built-ai-meeting-transcripts-to-emails`
   - Tags: ['engineering', 'AI email drafts', 'behind the scenes']
   - Date: 2026-02-27
   - ~1500 words, SEO target: "AI meeting transcript email"

**Commit:**
```
git commit -m "content: add 5 blog articles (meeting follow-ups, templates, comparison)"
```

---

### Task 6: Write Articles 6-10

**Files:**
- Modify: `lib/blog-data.ts`

Add 5 more BlogPost objects:

6. **"The Sales Rep's Guide to AI Meeting Assistants in 2026"**
   - Slug: `sales-reps-guide-ai-meeting-assistants-2026`
   - Tags: ['AI meeting assistant', 'sales tips', 'sales productivity']
   - Date: 2026-03-01
   - ~1300 words, SEO target: "AI meeting assistant 2026"

7. **"Why Your CRM Data Is Wrong (And How AI Meetings Fix It)"**
   - Slug: `crm-data-wrong-ai-meetings-fix`
   - Tags: ['CRM automation', 'sales productivity', 'data quality']
   - Date: 2026-03-04
   - ~1200 words, SEO target: "CRM data quality"

8. **"Meeting Overload? 7 AI Tools That Give You Your Time Back"**
   - Slug: `meeting-overload-ai-tools-give-time-back`
   - Tags: ['AI tools', 'meeting productivity', 'workflow optimization']
   - Date: 2026-03-07
   - ~1300 words, SEO target: "AI meeting tools"

9. **"ReplySequence vs Fireflies: Feature Comparison"**
   - Slug: `replysequence-vs-fireflies-feature-comparison`
   - Tags: ['comparison', 'Fireflies alternative', 'AI meeting assistant']
   - Date: 2026-03-10
   - ~1400 words, SEO target: "Fireflies alternative", "ReplySequence vs Fireflies"

10. **"How Consultants Use AI to Never Forget a Client Follow-up"**
    - Slug: `consultants-ai-never-forget-client-follow-up`
    - Tags: ['consulting', 'client management', 'AI email drafts']
    - Date: 2026-03-13
    - ~1200 words, SEO target: "consultant follow-up email"

**Commit:**
```
git commit -m "content: add 5 more blog articles (guides, comparisons, use cases)"
```

---

### Task 7: Build Verification and Push

**Step 1: Run TypeScript check**
```
npx tsc --noEmit
```
Expected: 0 errors

**Step 2: Run build**
```
npx next build
```
Expected: All routes compile, blog posts generate static params

**Step 3: Push and update ClickUp**
```
git push origin main
```
Update ClickUp task 86affcqcu to "ready for review".
