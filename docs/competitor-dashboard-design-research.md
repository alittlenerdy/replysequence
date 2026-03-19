# Competitor Dashboard Design Research

**Date:** March 12, 2026
**Purpose:** Deep design research on sales SaaS competitor dashboards to inform ReplySequence dashboard redesign

---

## Table of Contents

1. [Gong](#1-gong)
2. [HubSpot Sales Hub](#2-hubspot-sales-hub)
3. [Salesloft](#3-salesloft)
4. [Outreach](#4-outreach)
5. [Apollo.io](#5-apolloio)
6. [Close.com](#6-closecom)
7. [Fireflies.ai](#7-firefliesai)
8. [Otter.ai](#8-otterai)
9. [Fathom](#9-fathom)
10. [Mixmax](#10-mixmax)
11. [Superhuman](#11-superhuman)
12. [Linear](#12-linear)
13. [Attio](#13-attio)
14. [Folk CRM](#14-folk-crm)
15. [General Design Principles](#15-general-design-principles-from-topic-research)
16. [Best Patterns to Steal](#16-best-patterns-to-steal-for-replysequence)

---

## 1. Gong

**Category:** Revenue intelligence platform

### Above the Fold
- Personalized homepage showing a snapshot of recent and upcoming activity
- What users see depends on their role, personal settings, and company setup
- Natural-language question bar for asking about accounts and deals directly from the homepage

### Action Items vs Intelligence
- Heavily intelligence-weighted: Gong is analytics-first with action items surfaced from conversation data
- "Dashboards" (formerly "Revenue Analytics") present unified views of revenue with charts, graphs, and tables
- Deal boards provide visual pipeline management with color-coded activity timelines

### Layout
- Sidebar navigation with main content area
- Deal boards use a kanban-style column layout
- Dashboard widgets are configurable in the Admin center under "Data Studio"

### Stats/KPIs
- Revenue dashboards track sales performance in real-time
- Metrics include deal health scores, forecast categories, ARR, close dates
- Color coding provides context on which deals need attention at a glance

### Lists/Tables
- Activity timelines show complete interaction history (calls, emails, deals)
- Deal boards with card-based views
- Filterable and sortable by various deal attributes

### Innovative Patterns
- **Natural language query bar on homepage** -- reps can ask questions about accounts/deals conversationally
- **Account Console and Account Boards** -- dedicated views for account-level intelligence
- **Gong Assistant** -- AI-powered assistant integrated into the workflow

### Empty States
- Not well documented; enterprise product typically pre-populated during onboarding

---

## 2. HubSpot Sales Hub

**Category:** CRM / Sales dashboard

### Above the Fold
- High-priority KPIs arranged at the top with supporting data below
- Main goals placed in the top-left corner (follows eye-tracking best practice)
- Recommended 8-12 reports per dashboard for focus

### Action Items vs Intelligence
- Balanced approach: Combines task management with reporting
- Sales Workspace (in beta) brings key metrics directly into the workspace where reps work
- Dashboards auto-update as new CRM data flows in

### Layout
- Customizable grid layout with drag-and-drop widget placement
- Sidebar navigation with collapsible sections
- Sales Workspace introduces an integrated view combining tasks and metrics

### Stats/KPIs
- Widget-based KPI cards at top of dashboard
- Charts, graphs, and number tiles
- Real-time auto-updating from CRM data

### Lists/Tables
- Pipeline views with deal cards
- Activity feeds with chronological entries
- Filterable contact and deal tables

### Innovative Patterns
- **Customizable Sales Workspace** (beta) -- metrics embedded where reps actually work, not in a separate "dashboard"
- **8-12 report limit guidance** -- opinionated about not overwhelming users
- **Auto-refreshing dashboards** -- no manual refresh needed

### Empty States
- Template gallery with pre-built dashboards for quick start
- Guided setup wizards for new users

---

## 3. Salesloft

**Category:** Sales engagement / cadence platform

### Above the Fold
- **Rhythm Focus Zone** -- AI-prioritized list of actions for the day
- Cadence panel showing active sequences and pending steps
- Activity overview for recent engagement

### Action Items vs Intelligence
- Action-first design: Rhythm is explicitly about prioritizing "what to do next"
- Focus Zones separate work into modes: Rhythm (AI-prioritized), Cadence (sequence steps), Close (deal actions)
- Intelligence is embedded within action context rather than separate dashboards

### Layout
- Left sidebar navigation
- Main content area dominated by the prioritized action list
- Focus Zone dropdown at top to switch between work modes

### Stats/KPIs
- Cadence Activity Dashboard shows email sent/views/clicks/replies and call activity
- Date filter defaults to previous 7 days
- Team vs Personal cadence toggle

### Lists/Tables
- Prioritized action list in Rhythm Focus Zone
- Cadence list view with visual enhancements (2025 redesign)
- Sequence step lists with stage-by-stage breakdown

### Innovative Patterns
- **AI-prioritized action queue** -- Rhythm takes ALL possible actions (cadence steps, plays, tasks) and ranks them by impact
- **Focus Zones** -- mental mode switching between prospecting, sequences, and closing
- **Chrome Extension mirrors web app** -- same Focus Zone experience in the sidebar extension

### Empty States
- Not well documented publicly

---

## 4. Outreach

**Category:** Sales engagement platform

### Above the Fold
- Redesigned personalized homepage with tile-based layout
- Role-based default layouts (XDR vs AE see different things)
- Tasks, scheduled emails, upcoming meetings, and key deals visible without navigating away

### Action Items vs Intelligence
- Blended approach with customizable emphasis
- "Assist" chat unified on homepage for asking questions about Accounts and Opportunities
- Tiles can be added/removed/rearranged -- users choose their own balance

### Layout
- **Tile-based modular layout** -- major differentiator
- Collapsible heading groups for organizing tile sections
- Role-specific pre-built layouts (XDR, AE)
- Users can rearrange tiles freely

### Stats/KPIs
- Deal Overview tile: ARR, close date, status, health score, forecast category
- Team Activity Leaderboard tile
- CRM Sync health tile for admins

### Lists/Tables
- Consistent slide-out design across the app for list item details
- Enhanced List View with standardized summary panels

### Innovative Patterns
- **One-step onboarding sets default layout** -- asks user's role/priorities, auto-configures homepage
- **Tile framework with add/remove/rearrange** -- true personalization
- **Collapsible heading groups** -- users can collapse sections they don't need right now
- **Unified Assist chat on homepage** -- AI assistant accessible from the dashboard itself

### Empty States
- One-step onboarding populates homepage based on role selection
- Pre-built layouts prevent "blank page" syndrome

---

## 5. Apollo.io

**Category:** Prospecting / sales intelligence

### Above the Fold
- Widget-based home dashboard with "Generate Pipeline" and "Win & Close" sections
- Personal and team-wide task tracking
- Engagement and performance statistics

### Action Items vs Intelligence
- Split into two main widget groups:
  - **Generate Pipeline**: prospecting actions (emails, calls, sequences)
  - **Win & Close**: deal performance (pending tasks, quota attainment, win rates)
- Analytics accessible via sidebar as a separate section

### Layout
- Left sidebar navigation (Search, Engage, Close, Analytics)
- Main content area with customizable widget layout
- Multiple layout presets: System (default), Your layouts (custom), Favorites

### Stats/KPIs
- Embedded analytics dashboards with real-time data
- Email engagement trends, deliverability stats
- Sequence performance: reply rates, drop-off analysis, email sentiment

### Lists/Tables
- Sequence list with performance metrics
- Contact/lead tables with extensive filtering
- Deal pipeline views

### Innovative Patterns
- **Layout presets with switching** -- users can toggle between saved dashboard layouts
- **Automatic high-intent signal alerts** -- proactive notifications based on prospect behavior
- **Team benchmark analysis** -- individual performance compared to team averages

### Empty States
- Clean onboarding flow; interface described as "easy to navigate for first-time users"
- Can feel slightly cluttered due to feature density once populated

---

## 6. Close.com

**Category:** CRM (known for clean design)

### Above the Fold
- Inbox View: prioritized feed of new leads, follow-ups, missed communications, overdue tasks
- Activity stream showing calls, emails, SMS, meetings
- Pipeline overview accessible from left menu

### Action Items vs Intelligence
- Action-first: The Inbox is the primary view, showing what needs attention NOW
- Smart Views create dynamic filtered lists based on real-time activity
- Intelligence is embedded in the filtering/sorting, not in separate dashboards

### Layout
- Left sidebar with collapsible navigation
- Main content area shows either Inbox, Pipeline, or Smart View
- Slide-out detail panels for lead/contact records

### Stats/KPIs
- Pipeline View provides visual deal overview
- Activity metrics within Smart Views
- Minimal standalone KPI widgets -- data is in-context

### Lists/Tables
- Smart Views as dynamic, filterable lists (hot prospects, stalled deals, renewals)
- **"Next Lead" button** -- move through inbox sequentially without jumping back to list
- Activity tables filterable by type (calls, emails, SMS, WhatsApp, meetings, notes)

### Innovative Patterns
- **"Next Lead" button** -- sequential processing without context-switching back to the list
- **Smart Views as saved dynamic filters** -- not static reports, always up-to-date
- **Inbox as the primary interface** -- everything flows through a single prioritized stream
- **Action-first, analytics-second** -- dashboard is a to-do list, not a chart gallery

### Empty States
- Clean, minimal interface means empty states feel natural rather than broken
- Guided setup for initial lead import

---

## 7. Fireflies.ai

**Category:** Meeting AI notetaker

### Above the Fold
- Recent Meetings section with meeting name, date, participants, timestamps
- Quick access links to transcripts, soundbites, and summaries
- AskFred AI search bot
- AI Apps feed with active AI-powered tools

### Action Items vs Intelligence
- Intelligence-first with action items extracted by AI:
  - **Daily Digest**: action items, blockers, crucial updates from past 24 hours
  - **Meeting Prep**: briefs for upcoming meetings
  - **Popular Topics**: highlights important themes from recent meetings
- AI Apps provide contextual recommendations based on meeting content

### Layout
- Clean dashboard with distinct sections
- Search-centric design with Global Search across all meetings
- Left sidebar for navigation, main content area for meeting list
- Cards for each meeting with expandable details

### Stats/KPIs
- Minimal traditional KPIs
- Usage tracking (e.g., "0 of 300 monthly mins used") in sidebar
- AI-generated insights replace traditional metrics

### Lists/Tables
- Searchable, organized meeting library
- Meetings organized by channels and tags
- Shared access with team members

### Innovative Patterns
- **AskFred** -- conversational AI search across ALL meetings (not just keyword search)
- **AI Apps feed** -- contextual app recommendations based on meeting content
- **Daily Digest as a first-class feature** -- automated daily summary of action items
- **Meeting Prep briefs** -- pre-meeting intelligence generated automatically

### Empty States
- 7-day free trial provides immediate feature access
- Updated welcome screen designed for "every user, whether you've just signed up or have 100+ meetings"

---

## 8. Otter.ai

**Category:** Meeting transcription / notes

### Above the Fold
- Three-zone layout:
  - Left sidebar: past conversations, shared files, navigation
  - Center: transcript list with meeting titles, durations, participant previews
  - Right panel: live/upcoming meetings with calendar integration
- Usage indicator in sidebar (e.g., monthly minutes used)

### Action Items vs Intelligence
- Balanced: transcripts are the intelligence, action items are extracted automatically
- Post-meeting summary emails include action items and outlines personalized per user
- Folder organization for categorizing meetings by project/topic

### Layout
- **Three-panel layout** (sidebar + main list + right panel)
- Calendar synced in right panel showing upcoming meetings
- Main content is a chronological meeting list with most recent at top

### Stats/KPIs
- Minimal: usage tracking (minutes used vs. plan limit)
- No traditional sales KPI dashboards
- Intelligence is in the transcript content, not in charts

### Lists/Tables
- Clean transcript list: title, duration, participants, short preview
- Expandable items for more detail
- Folder-based organization

### Innovative Patterns
- **Three-panel layout with calendar** -- upcoming meetings always visible alongside past meetings
- **Personalized summary emails** -- each team member gets their own relevant action items from the same meeting
- **"No learning curve" philosophy** -- interface is immediately understandable
- **Frictionless recording** -- OtterPilot auto-joins scheduled meetings

### Empty States
- Calendar sync immediately populates the right panel with upcoming meetings
- Even before first meeting, the interface shows your schedule

---

## 9. Fathom

**Category:** Meeting recorder / notetaker

### Above the Fold
- Dashboard with AI Search bar prominently placed
- List of recent meeting recordings
- One-click access to any meeting summary

### Action Items vs Intelligence
- Intelligence-first: AI-powered search across all meetings is the hero feature
- Action items extracted within meeting summaries
- "Ask Fathom" ChatGPT-like interface for querying across all historical meetings

### Layout
- Clean, distraction-free main content area
- Meeting list as primary view
- Transcript view with highlighted key segments (feedback, notes)

### Stats/KPIs
- Minimal traditional metrics
- Intelligence comes from AI analysis of conversations, not charts
- Company-wide call visibility for admins

### Lists/Tables
- Meeting list with video recordings
- Timestamped transcript segments
- Company calls page with tabs: user's calls, shared calls, org-wide calls

### Innovative Patterns
- **AI Search across all meetings** -- find any moment across entire meeting history in seconds
- **Timestamp-linked search results** -- click a result, jump to that exact video moment
- **Ask Fathom** -- conversational query interface across all historical meetings (account-wide)
- **Highlighted transcript segments** -- visual differentiation of feedback, decisions, action items

### Empty States
- Simple onboarding: connect calendar, record first meeting
- Criticism: post-meeting dashboard can feel "functional but cluttered"

---

## 10. Mixmax

**Category:** Email sequences / sales engagement

### Above the Fold
- Sequence dashboard with list of active sequences
- Reports Dashboard accessible via left sidebar hover
- Quick access to create new sequences (AI-assisted, library, or from scratch)

### Action Items vs Intelligence
- Action-oriented: sequences and tasks are the primary view
- Reports/analytics are secondary (hover to access in sidebar)
- Sequence insights provide stage-by-stage performance data

### Layout
- Left sidebar (collapsed by default, expands on hover)
- Main content: sequence list or email view
- Stage-based sequence builder with linear progression

### Stats/KPIs
- Email tracking: sent, opens, clicks, replies, bounces
- Sequence performance: per-stage breakdown
- Task performance: created, open, completed per stage
- Top-performing sequences and templates highlighted

### Lists/Tables
- Sequence list with performance indicators
- Stage-by-stage breakdown within each sequence
- Recipient status tracking

### Innovative Patterns
- **AI-assisted sequence creation** -- "Assisted" mode where AI builds the sequence
- **Sequence library with templates** -- pre-built sequences for specific use cases (renewal, onboarding, webinar)
- **Hover-to-expand sidebar** -- keeps interface clean, reveals navigation on demand
- **Weekend-aware scheduling** -- automatic weekend skipping for sequence stages

### Empty States
- Three creation paths: AI-assisted, template library, from scratch
- Template library prevents "blank page" problem for sequences

---

## 11. Superhuman

**Category:** Email client (gold standard for action-oriented UX)

### Above the Fold
- Split Inbox with 3-7 categorized email streams
- Current email stream fills the viewport -- zero clutter
- No ads, sidebars, news panels -- just messages

### Action Items vs Intelligence
- **Pure action orientation** -- the entire interface is designed around processing and responding
- Intelligence is embedded in automation: Auto Labels (AI categorizes every email), Auto Drafts (AI writes follow-ups), Auto Archive (marketing/cold emails auto-archived)
- No dashboards or charts -- the inbox IS the dashboard

### Layout
- **Single-column email list** with preview pane
- Split Inbox tabs (1-5 keyboard shortcuts): Important / VIP / News / Calendar / Other
- No sidebar clutter -- navigation via keyboard shortcuts and Cmd+K

### Stats/KPIs
- None in the traditional sense
- Performance IS the metric: "get through email 2x faster, reply 12 hours sooner, save 4+ hours weekly"
- The product is the KPI

### Lists/Tables
- Email list with streamlined message cards
- Zero-friction navigation: J/K to move between emails, H/L between inbox splits

### Innovative Patterns
- **Cmd+K Command Palette** -- type any action, palette shows keyboard shortcut beside it (passive shortcut learning)
- **Split Inbox** -- AI auto-categorizes emails into focused streams, reducing cognitive load of unified inbox
- **< 100ms load time** -- everything feels instantaneous
- **Vim-inspired navigation** -- J/K/H/L for spatial navigation without leaving home row
- **Auto Drafts** -- AI pre-writes follow-up emails in the user's voice
- **Auto Labels + Auto Archive** -- AI handles categorization and cleanup automatically
- **Stripped-down interface** -- "Colors are soft, spacing is well-calibrated, every element has a purpose"

### Empty States
- Inbox Zero is the GOAL state, not an empty state -- celebrated when achieved
- New user onboarding teaches keyboard shortcuts progressively

---

## 12. Linear

**Category:** Issue tracking (best-in-class dashboard design reference)

### Above the Fold
- Issue list in the currently selected view (list, board, timeline, or split mode)
- Compact navigation tabs at top
- Dimmed sidebar that recedes from focus

### Action Items vs Intelligence
- **Work-first:** the issue list IS the action items
- Filters and views provide the intelligence layer
- No separate "analytics dashboard" -- insights come from structured views of the same data

### Layout
- **Sidebar + main content area**
- Sidebar deliberately dimmed to let content area dominate
- Compact tabs at top (not full-width)
- Multiple view modes: list, board, timeline, split, fullscreen

### Stats/KPIs
- Dashboard widgets following best practices (their own doc on this)
- Minimal, purposeful KPI display
- Metrics within project/cycle views rather than separate dashboards

### Lists/Tables
- Dense but readable issue lists
- Meta properties in side panels
- Headers store filters and display options
- Inline editing of issue properties

### Innovative Patterns
- **Dimmed sidebar principle** -- navigation recedes, content area takes precedence
- **Cmd+K command palette** -- global access to any action
- **"Calmer interface" philosophy** -- not every element carries equal visual weight
- **Multiple view modes** for the same data (list/board/timeline/split)
- **Inter typeface on dark background** -- professional, reduced eye strain
- **Whitespace as active design element** -- breathing room between items establishes visual groupings
- **Custom theme generator** -- users can personalize the interface

### Empty States
- Clean, minimal empty states that feel intentional
- Templates for quick project setup

---

## 13. Attio

**Category:** Modern CRM

### Above the Fold
- Workspace-style interface resembling Notion/Airtable
- Table view or kanban view of current collection/list
- Left sidebar with lists, objects, and navigation

### Action Items vs Intelligence
- **Workspace-first:** actions happen in-context within lists and views
- AI Attributes act as dedicated agents: auto-qualify leads, identify opportunities, research prospects
- Intelligence is embedded in the data model, not in separate dashboards

### Layout
- **Sidebar + main content area** (Notion-inspired)
- Multiple view types: table, kanban, custom
- Side panels for record details
- Color-coded tags throughout

### Stats/KPIs
- Customizable dashboards with automatic report generation
- Advanced data visualization
- AI-generated insights embedded in records

### Lists/Tables
- Spreadsheet-style table views with direct inline editing
- Customizable columns, filters, and sorts per view
- Kanban boards with drag-and-drop cards
- Status-based columns customizable per workflow

### Innovative Patterns
- **Avoids CRM jargon** -- uses "collections, entries, views" instead of "pipeline, contact, dashboard"
- **View independence** -- hiding/reordering attributes in one view doesn't affect others
- **AI Attributes** -- AI agents that auto-enrich and qualify records
- **Modular, template-based setup** -- start from templates, customize from there
- **Apple-like aesthetic** -- simplicity and elegance as design pillars

### Empty States
- Template-based onboarding
- Familiar spreadsheet metaphor reduces learning curve

---

## 14. Folk CRM

**Category:** Lightweight modern CRM

### Above the Fold
- Spreadsheet-like contact list view
- Pipeline view available as kanban board
- Action Stream for managing leads from central workspace

### Action Items vs Intelligence
- **Action-first with lightweight intelligence:**
- Action Stream centralizes lead management tasks
- Pipeline kanban shows deal stages
- Contact records include communication history and internal notes
- Minimal analytics/reporting compared to enterprise CRMs

### Layout
- **Spreadsheet-style main view** with customizable columns
- Left sidebar for navigation between groups and pipelines
- Pop-up detail view for individual contacts (maintains context of underlying list)
- Light color scheme with ample white space

### Stats/KPIs
- Minimal -- Folk prioritizes contact management over analytics
- Pipeline stages provide implicit progress metrics
- Smart fields for computed/enriched data

### Lists/Tables
- Core strength: highly customizable spreadsheet views
- Custom fields (native, smart, and custom types)
- Groups with unlimited contacts, contacts can belong to multiple groups
- Filterable and sortable by any field

### Innovative Patterns
- **Pop-up detail view** -- opens record details WITHOUT navigating away from the list
- **LinkedIn integration** -- seamless contact import and sync
- **Multi-group membership** -- single contact belongs to multiple groups simultaneously
- **Spreadsheet familiarity** -- zero learning curve for anyone who has used Excel/Sheets

### Empty States
- Quick onboarding praised by users
- LinkedIn import provides immediate data population

---

## 15. General Design Principles (from Topic Research)

### Information Hierarchy

**The Inverted Pyramid:**
- Most crucial KPIs and high-level summaries at the top
- Drill-down capabilities for granular details below
- Users should grasp key insights within seconds

**F-Pattern Eye Tracking:**
- Users start top-left, scan horizontally across top
- Drop down, scan horizontally again
- Continue scanning down the left side
- Place most important KPI/chart in top-left corner

**The 5-Second Rule:**
- Users should find what they need within 5 seconds
- Prioritize actionable metrics over vanity metrics
- Limit to 5-6 cards in initial view

### Above the Fold Best Practices

- High-priority metrics above the fold, secondary below
- Larger type for primary metrics, restrained color for categories
- Critical numbers occupy "prime real estate" at top
- Less critical details and supplementary info placed below

### Action-Oriented Design

- Connect metrics with actions using thresholds, indicators, or suggestions
- Color-coded badges, alerts, or CTA buttons linked to insights
- AI-driven prescriptive analytics ("Customer churn up 5% in Region X; consider targeted engagement")
- Design around roles and processes so users see only what matters for action

### Progressive Disclosure

- Show the big number first, let users drill down for details
- Start with 5-7 summary cards, expand on demand
- Hover states reveal secondary detail without visual noise
- Products using progressive disclosure see 35% fewer support tickets during onboarding

### Empty State Best Practices

- Pre-load demo data -- "nobody likes an empty graph"
- 84% of users who encounter blank states without contextual help abandon within first session
- Ideal: < 2 minutes to first perceived value
- Slack approach: pre-populated channels with onboarding messages
- Notion approach: personalized templates based on workspace type

### 2026 Dashboard Trends

- Modular UI with drag-and-drop widget rearrangement
- Global date-picker that updates every widget simultaneously
- Neutral color bases (soft grays, clean whites) with 1-2 accent colors
- Motion and microinteractions for feedback
- AI-embedded insights within data views (not separate AI sections)

---

## 16. Best Patterns to Steal for ReplySequence

### TIER 1: Must-Have Patterns

#### 1. Action-First Homepage (Close.com + Salesloft Rhythm)
**What:** The homepage should be a prioritized action queue, not a chart gallery.
- Show "what to do next" above the fold: follow-ups due, meetings today, sequences needing attention
- Close's Inbox model: a single stream of prioritized action items
- Salesloft Rhythm's approach: AI ranks all possible actions by impact
- **Implementation:** Top section = "Your Actions Today" list with the most urgent items. Each item has a one-click action button (send, reschedule, review draft).

#### 2. Split/Tabbed Content Modes (Superhuman + Salesloft)
**What:** Let users switch mental modes without navigating to different pages.
- Superhuman's Split Inbox: 3-7 tabs across the top (Important / VIP / Other)
- Salesloft Focus Zones: dropdown to switch between Rhythm / Cadence / Close
- **Implementation:** Tab bar with "Meetings" / "Follow-ups" / "Sequences" / "Deals" -- same page, different filtered view of the work.

#### 3. Cmd+K Command Palette (Superhuman + Linear)
**What:** Global keyboard-accessible command palette for power users.
- Shows keyboard shortcuts next to each command (passive learning)
- Type any action: "send follow-up to John," "snooze meeting," "create sequence"
- **Implementation:** Cmd+K opens a search-first palette with actions, navigation, and search across meetings, contacts, and sequences.

#### 4. Dimmed Sidebar + Content-First Layout (Linear)
**What:** Sidebar exists for navigation but visually recedes so the work area dominates.
- Navigation sidebar is a few notches dimmer than the content area
- Compact tabs, not full-width headers
- Whitespace as active design element between content groups
- **Implementation:** Left sidebar with navigation in muted tones. Main content area has higher contrast and visual weight.

### TIER 2: High-Impact Patterns

#### 5. Tile-Based Customizable Layout (Outreach)
**What:** Users can add, remove, and rearrange dashboard tiles.
- One-step onboarding asks role/priorities, auto-configures layout
- Collapsible heading groups to reduce clutter
- Pre-built layouts for different roles
- **Implementation:** Offer 2-3 preset layouts (SDR, AE, Manager) during onboarding, then allow customization.

#### 6. Conversational AI Search Across Meetings (Fathom + Fireflies)
**What:** "Ask anything across all your meetings" -- not keyword search, but AI-powered Q&A.
- Fathom's "Ask Fathom" and Fireflies' "AskFred"
- Returns results with timestamps, transcript snippets, clickable jump-to-moment links
- **Implementation:** Search bar at top of dashboard: "What did Sarah say about pricing in last week's call?" Returns relevant transcript moments with video timestamps.

#### 7. Daily Digest / Meeting Prep (Fireflies)
**What:** Automated intelligence briefings generated from meeting data.
- Daily Digest: action items, blockers, updates from past 24 hours
- Meeting Prep: AI-generated briefs before upcoming meetings
- Popular Topics: trending themes from recent meetings
- **Implementation:** Morning digest card at top of dashboard showing today's action items extracted from yesterday's meetings + prep notes for today's meetings.

#### 8. "Next Item" Sequential Processing (Close.com)
**What:** A "Next" button that moves through a list without returning to the list view.
- Reduces context-switching between list and detail views
- Users process items sequentially like an inbox
- **Implementation:** When viewing a follow-up draft, "Next Follow-up" button moves to the next one. Process all follow-ups in sequence without jumping back to list.

### TIER 3: Differentiating Patterns

#### 9. Pop-Up Detail View (Folk CRM)
**What:** Record details open in a modal/overlay WITHOUT navigating away from the list.
- Maintains context of the underlying list
- Quick edits without losing place
- **Implementation:** Clicking a meeting or contact in a list opens a slide-over panel, not a new page. User can close it and continue where they left off.

#### 10. Three-Panel Layout with Calendar (Otter.ai)
**What:** Left sidebar (nav) + Center (main content) + Right panel (upcoming schedule).
- Upcoming meetings always visible alongside past meeting data
- Calendar sync populates right panel automatically
- **Implementation:** Optional right panel showing today's remaining meetings and tomorrow's schedule. Collapsible for more workspace.

#### 11. Auto-Classification and Auto-Actions (Superhuman)
**What:** AI handles categorization and cleanup automatically.
- Auto Labels: every incoming item is classified
- Auto Archive: low-priority items are handled without user intervention
- Auto Drafts: AI pre-writes follow-up responses
- **Implementation:** Auto-categorize meeting follow-ups by urgency/type. Auto-draft follow-up emails. Auto-archive completed sequences.

#### 12. Highlighted Transcript Segments (Fathom)
**What:** Visual differentiation within transcripts for different content types.
- Color-code: decisions (blue), action items (orange), feedback (green), objections (red)
- Makes scanning long transcripts fast
- **Implementation:** Meeting summaries use color-coded tags/highlights for different insight types.

### LAYOUT RECOMMENDATION FOR REPLYSEQUENCE

Based on all research, the recommended layout structure:

```
+------------------+--------------------------------+------------------+
|                  |                                |                  |
|  SIDEBAR (dim)   |  MAIN CONTENT AREA             |  RIGHT PANEL     |
|                  |                                |  (collapsible)   |
|  - Meetings      |  [Tab Bar: Actions | Meetings  |                  |
|  - Follow-ups    |   | Sequences | Insights]      |  Today's         |
|  - Sequences     |                                |  Schedule        |
|  - Contacts      |  [Action Queue / Content]      |                  |
|  - Settings      |                                |  Upcoming        |
|                  |  Top: KPI strip (3-4 metrics)  |  Meetings        |
|  Usage stats     |  Middle: Prioritized list      |                  |
|  at bottom       |  Bottom: Secondary content     |  Quick           |
|                  |                                |  Actions         |
+------------------+--------------------------------+------------------+
```

**Key principles:**
1. Sidebar is dimmed/muted (Linear pattern)
2. Tab bar switches content mode without page navigation (Superhuman pattern)
3. Main area leads with actions, not charts (Close pattern)
4. Right panel shows calendar/schedule (Otter pattern) -- collapsible
5. KPI strip is compact, 3-4 metrics max (HubSpot pattern)
6. Cmd+K available globally (Superhuman/Linear pattern)
7. Progressive disclosure throughout -- summary first, drill-down on click

### COLOR AND TYPOGRAPHY GUIDANCE

Based on 2026 trends and best-performing competitors:
- **Base:** Neutral palette -- soft grays and clean whites (or dark mode option)
- **Accent colors:** Maximum 2 -- one for primary actions (blue), one for alerts/urgency (orange or red)
- **Status colors:** Green (positive/completed), yellow (pending/warning), red (overdue/critical)
- **Typography:** Clean sans-serif (Inter, which Linear uses, is an excellent choice)
- **Spacing:** Generous whitespace between sections, tighter within related groups
- **Information density:** Medium -- more than Fireflies (too sparse), less than Apollo (too dense)

### ONBOARDING / EMPTY STATE STRATEGY

1. **First visit:** Show pre-populated sample data with a "This is demo data" banner and CTA to connect real integrations
2. **Calendar connected but no meetings yet:** Show upcoming schedule in right panel + "Your first meeting insights will appear here" with illustration
3. **After first meeting:** Immediate value -- show AI-generated summary, action items, draft follow-up
4. **Goal:** < 2 minutes to first perceived value (industry best practice)

---

## Sources

### Competitor-Specific
- [Gong Revenue Intelligence](https://www.gong.io/revenue-intelligence)
- [Gong Revenue Dashboards Blog](https://www.gong.io/blog/revenue-dashboard)
- [Gong Dashboards Help](https://help.gong.io/docs/dashboards)
- [HubSpot Dashboard Basics 2025](https://everbrave.ca/hubspot-dashboard-basics-how-to-build-a-high-impact-reporting-hub-in-2025/)
- [HubSpot Dashboard Examples](https://www.hublead.io/blog/hubspot-dashboard-examples)
- [Salesloft Rhythm Focus Zones](https://www.salesloft.com/platform/rhythm/focus-zones)
- [Salesloft Cadence Activity Dashboard](https://support.salesloft.com/hc/en-us/articles/360038020731-Cadence-Activity-Dashboard)
- [Outreach Personalized Homepage](https://support.outreach.io/hc/en-us/articles/42996161426203-Personalized-Homepage-Experience-Overview)
- [Outreach Q4 2025 Release](https://www.outreach.io/resources/blog/outreach-q4-2025-product-release)
- [Apollo.io Home Overview](https://knowledge.apollo.io/hc/en-us/articles/14845941738637-Home-Overview)
- [Apollo.io Analytics Dashboards](https://knowledge.apollo.io/hc/en-us/articles/4411230325517-Use-Analytics-Dashboards)
- [Apollo.io UX Case Study](https://medium.com/@porwalanubha99/ux-case-study-apollo-io-4471cb0ed3e8)
- [Close CRM Smart Views](https://help.close.com/docs/creating-smart-views)
- [Close CRM Pipeline View](https://help.close.com/docs/opportunity-pipeline-view)
- [Fireflies Welcome Screen Guide](https://guide.fireflies.ai/articles/8020055559-Fireflies+Welcome+Screen:+A+Guide+to+Your+New+Home+Screen)
- [Fireflies.ai Review 2025](https://techpoint.africa/guide/fireflies-ai-review/)
- [Otter.ai Review 2026](https://www.sales-echo.com/blog/otter-ai-review)
- [Otter.ai Features](https://otter.ai/features)
- [Fathom AI Search](https://help.fathom.video/en/articles/7374465)
- [Fathom Review 2025](https://work-management.org/productivity-tools/fathom-review/)
- [Mixmax Reports Dashboard](https://success.mixmax.com/en/articles/8313152-reports-dashboard-overview)
- [Mixmax Sequence Performance](https://success.mixmax.com/en/articles/8070010-how-to-analyze-sequence-performance)
- [Superhuman Speed as Product](https://blakecrosley.com/guides/design/superhuman)
- [Superhuman Review 2026](https://max-productive.ai/ai-tools/superhuman/)
- [Superhuman Keyboard Shortcuts](https://help.superhuman.com/hc/en-us/articles/45191759067411-Speed-Up-With-Shortcuts)
- [Linear UI Redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Linear Calmer Interface](https://linear.app/now/behind-the-latest-design-refresh)
- [Linear Dashboard Best Practices](https://linear.app/now/dashboards-best-practices)
- [Linear Design Trend](https://blog.logrocket.com/ux-design/linear-design/)
- [Attio Design Analysis](https://www.opensourceceo.com/p/attio-beautiful-design)
- [Attio Figma UI Screens](https://www.figma.com/community/file/1533024283737732966/attio-full-dashboard-ui-screens-250-screens-for-research-inspiration)
- [Attio UX Reframing](https://www.softwareco.com/attio-reframe-crm-through-ux-and-language/)
- [Folk CRM Review](https://www.breakcold.com/blog/folk-crm-review)
- [Folk CRM In-Depth Review 2026](https://www.onepagecrm.com/crm-reviews/folk/)

### General Design Topics
- [SaaS Dashboard Design 2026 Trends](https://www.saasframe.io/blog/the-anatomy-of-high-performance-saas-dashboard-design-2026-trends-patterns)
- [Dashboard UX Best Practices (DesignRush)](https://www.designrush.com/agency/ui-ux-design/dashboard/trends/dashboard-ux)
- [Dashboard Design Principles 2025 (UXPin)](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [Smart SaaS Dashboard Design Guide 2026](https://f1studioz.com/blog/smart-saas-dashboard-design/)
- [UX Strategies for Real-Time Dashboards (Smashing Magazine)](https://www.smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/)
- [6 Steps to Design Thoughtful B2B Dashboards](https://uxdesign.cc/design-thoughtful-dashboards-for-b2b-saas-ff484385960d)
- [Dashboard UX Patterns (Pencil & Paper)](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
- [Progressive Disclosure in SaaS UX](https://lollypop.design/blog/2025/may/progressive-disclosure/)
- [SaaS Dashboard Design Best Practices](https://adamfard.com/blog/saas-dashboard-design)
- [10 SaaS Dashboard KPI Strategies](https://www.aufaitux.com/blog/top-saas-dashboard-ui-ux-design-strategies-kpi-driven-engagement/)
- [Empty State Design in SaaS](https://userpilot.com/blog/empty-state-saas/)
- [SaaS Onboarding Best Practices 2025](https://www.flowjam.com/blog/saas-onboarding-best-practices-2025-guide-checklist)
- [7 SaaS Dashboards That Nail Onboarding](https://procreator.design/blog/saas-dashboards-that-nail-user-onboarding/)
- [Linear Design Breakdown](https://www.925studios.co/blog/linear-design-breakdown)
- [CRM Design Best Practices](https://www.aufaitux.com/blog/crm-ux-design-best-practices/)
