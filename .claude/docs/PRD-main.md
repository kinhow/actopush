# OctoPush CRM — Main Product Requirements Document

**Version:** 1.0
**Date:** 2026-02-24
**Status:** Draft — Ready for Engineering Review

**Related Documents:**
- [WhatsApp Integration PRD](./PRD-whatsapp.md)
- [Automation Flows PRD](./PRD-automation-flows.md)
- [Supabase & Database PRD](./PRD-supabase.md)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals and Success Metrics](#2-goals-and-success-metrics)
3. [User Personas](#3-user-personas)
4. [Feature Scope — Dashboard Page](#4-feature-scope--dashboard-page)
5. [Feature Scope — Contacts Module](#5-feature-scope--contacts-module)
6. [Feature Scope — Conversations (Inbox)](#6-feature-scope--conversations-inbox)
7. [Feature Scope — Campaigns](#7-feature-scope--campaigns)
8. [Feature Scope — Segments](#8-feature-scope--segments)
9. [Feature Scope — Templates](#9-feature-scope--templates)
10. [Phased Rollout Plan](#10-phased-rollout-plan)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Risks and Mitigations](#12-risks-and-mitigations)
13. [Open Questions](#13-open-questions)

---

## 1. Executive Summary

### Product Vision

OctoPush is a **WhatsApp-first CRM platform** that enables small-to-medium businesses to manage customer relationships, run targeted marketing campaigns, and automate conversations — all through a single, unified dashboard connected to the WhatsApp Business Cloud API.

### Problem Statement

Businesses that rely on WhatsApp as their primary customer communication channel face fragmented tooling:

- **No unified inbox**: Teams juggle WhatsApp Web, spreadsheets, and disparate CRMs, losing context across conversations
- **Manual campaigns**: Broadcast lists are managed by hand with no targeting, scheduling, or performance analytics
- **No CTA-to-conversion tracking**: When a campaign includes a CTA URL button (e.g., "Book Now", "Reserve a Spot"), there is no mechanism to track whether a customer tapped the link and completed a reservation — meaning businesses cannot connect outbound campaign effort to downstream revenue or booking outcomes
- **Zero automation**: Routine interactions (FAQs, appointment reminders, order confirmations) consume agent time that could be automated
- **No visibility**: Business owners lack metrics on response times, campaign effectiveness, and team performance
- **Compliance gaps**: Opt-in tracking, message retention, and GDPR requirements are handled ad hoc or not at all

### Target Users

- **Primary**: Small-to-medium businesses (5–200 employees) in e-commerce, services, education, and healthcare that use WhatsApp as their primary customer communication channel
- **Secondary**: Marketing teams at mid-market companies (200–1,000 employees) seeking a dedicated WhatsApp campaign and automation tool
- **Geographic focus**: Malaysia — a market with exceptionally high WhatsApp penetration (>80% smartphone users), where WhatsApp is the dominant channel for business-to-customer communication across e-commerce, F&B, services, education, and healthcare

### Key Value Proposition

1. **WhatsApp Inbox** — real-time team inbox with conversation assignment, 24-hour window management, and bot-to-agent handoff
2. **Contact CRM** — structured contact management with tags, segments, opt-in tracking, and activity history
3. **Campaign Engine** — targeted WhatsApp campaigns with scheduling, analytics, and rate-limit management
4. **Automation Flows** — visual flow builder for automating lead capture, support routing, appointment reminders, and transactional notifications (see [PRD-automation-flows.md](./PRD-automation-flows.md))
5. **Template Management** — create, submit, and track WhatsApp message templates with Meta approval workflow

All data is live from Supabase — **no hardcoded data**. All WhatsApp messaging integrates with the **real WhatsApp Business Cloud API** (see [PRD-whatsapp.md](./PRD-whatsapp.md)).

### Existing Codebase State

| Area | Status |
|------|--------|
| Auth (signin, signup, Google OAuth, email verification) | Done |
| Onboarding (user profile + org creation via `complete_onboarding` RPC) | Done |
| Dashboard layout (Sidebar 300px + TopBar 80px) | Done |
| Sidebar nav items (Dashboard, Contacts, Conversations, Campaigns, Flows, Segments, Templates) | Done |
| Route protection middleware (auth + org membership check) | Done |
| Light/dark mode theming (primary: #FF2D55) | Done |
| Feature module pattern (`features/{name}/actions\|components\|schemas\|types`) | Established |
| Dashboard page content | Placeholder |
| Contacts, Conversations, Campaigns, Flows, Segments, Templates pages | Placeholder |
| Database (beyond users/orgs/memberships) | Not started |

---

## 2. Goals and Success Metrics

### Business Goals

| Goal | Target | Timeframe |
|------|--------|-----------|
| Paying organizations onboarded | 100 | 6 months post-launch |
| Monthly active usage rate | 70% of onboarded orgs | Ongoing |
| Total WhatsApp messages processed | 1M+/month | Month 6 |
| User retention (monthly) | >80% | After month 3 |
| Net Promoter Score (NPS) | >40 | Quarterly survey |

### User Goals

| Goal | Metric | Target |
|------|--------|--------|
| Faster response to customers | Average first-response time | <5 minutes (business hours) |
| Better campaign performance | Campaign read rate | >60% |
| Reduced manual work | % of conversations handled by automation | >40% |
| Improved contact management | Contact opt-in rate growth | 10% month-over-month |
| Template efficiency | Template first-submission approval rate | >80% |

### Key Performance Indicators (KPIs)

**Engagement:**
- Daily active users (DAU) per organization — target: >3
- Messages sent per agent per day — target: >50
- Conversations resolved per day per agent — target: >20

**Delivery:**
- Message delivery rate — target: >95%
- Webhook processing latency (p95) — target: <500ms
- Campaign send throughput — target: 80 MPS (messaging tier dependent)

**Quality:**
- WhatsApp phone number quality rating — target: GREEN maintained
- Template approval rate — target: >80% first submission
- Automation flow completion rate — target: >70%

---

## 3. User Personas

### Persona 1: Sarah — Customer Support Lead

| Attribute | Details |
|-----------|---------|
| **Age** | 28 |
| **Role** | Customer Support Lead, e-commerce company (50 employees) |
| **Team size** | Manages 5 support agents |
| **Tech comfort** | High — uses multiple SaaS tools daily |

**Current workflow:** Agents use WhatsApp Web on individual phones + a shared Google Sheet to track open issues. Sarah manually assigns cases by messaging her team. End-of-day reports are compiled by hand.

**Pain points:**
- No visibility into which agent handles which conversation
- Loses context when conversations are handed off between agents
- Cannot measure response times or agent productivity
- Customers fall through cracks when 24-hour windows expire unnoticed
- FAQ responses are typed manually every time

**Goals:**
- Unified inbox where all team conversations are visible
- Assign conversations to specific agents with internal notes
- Track response times per agent and per conversation
- Get alerts when 24-hour windows are about to expire
- Build a library of canned responses for common questions

**Primary features:** Conversations (8+ hrs/day), Dashboard (30 min/day), Contacts (1 hr/day)

---

### Persona 2: Marcus — Marketing Manager

| Attribute | Details |
|-----------|---------|
| **Age** | 35 |
| **Role** | Marketing Manager, mid-size retail brand (120 employees) |
| **Team size** | 3 marketing coordinators |
| **Tech comfort** | Medium-high — uses email marketing tools, social media schedulers |

**Current workflow:** Uses WhatsApp broadcast lists (max 256 contacts each) to send promotions. Manually maintains opt-in lists in spreadsheets. Has no analytics beyond checking message ticks one by one.

**Pain points:**
- Broadcast lists cap at 256 contacts — splitting audiences is tedious
- No segmentation — same message goes to everyone
- Template rejections waste hours with no clear guidance
- Zero campaign analytics
- Cannot schedule campaigns

**Goals:**
- Segment contacts by purchase history, tags, and engagement level
- Schedule campaigns to send at optimal times
- Track delivery, read, and reply rates per campaign
- Get template guidelines and rejection reasons to speed up approvals
- A/B test different message templates

**Primary features:** Campaigns (2 hrs/day), Segments (1 hr/day), Templates (1 hr/day), Dashboard (30 min/day)

---

### Persona 3: Priya — Business Owner

| Attribute | Details |
|-----------|---------|
| **Age** | 42 |
| **Role** | Owner, chain of 4 fitness studios (15 employees) |
| **Team size** | 1 receptionist handles WhatsApp |
| **Tech comfort** | Medium — comfortable with mobile apps, less so with complex software |

**Current workflow:** Receptionist manually sends appointment reminders via WhatsApp one by one. Leads from WhatsApp ads are copied into a notebook. Follow-up messages are sent sporadically.

**Pain points:**
- Manually sending 50+ appointment reminders daily is a full-time job
- Leads from Click-to-WhatsApp ads are lost because no one responds fast enough
- No automated follow-up sequences
- Cannot see business-level metrics without asking staff
- Wants to scale without hiring more staff

**Goals:**
- Automate appointment reminders (triggered by schedule)
- Auto-capture leads from WhatsApp ads with immediate bot response
- Set up follow-up sequences that run automatically
- View high-level dashboard with key metrics
- Do all of this without needing technical expertise

**Primary features:** Dashboard (30 min/day), Flows (setup then monitor weekly), Conversations (spot-check 30 min/day)

---

## 4. Feature Scope — Dashboard Page

The dashboard is the landing page after login. All data from Supabase — **no hardcoded values**.

### 4.1 Overview Metric Cards (Top Row)

Six metric cards in a responsive row:

| Metric | Description | Query Logic |
|--------|-------------|-------------|
| **Total Contacts** | Active contacts for the org | `COUNT(*) FROM contacts WHERE org_id = $1 AND deleted_at IS NULL` |
| **Active Conversations** | Open conversations within 24hr window | `WHERE org_id = $1 AND window_expires_at > now() AND status = 'open'` |
| **Messages Today** | Inbound + outbound in last 24hrs | `WHERE org_id = $1 AND created_at > now() - interval '24 hours'` |
| **Avg Response Time** | Mean first-reply time (today) | Computed: for each inbound, find first subsequent outbound in same conversation; average deltas |
| **Template Approval Rate** | % of submitted templates approved | `COUNT(approved) / COUNT(approved + rejected + pending)` |
| **Unassigned Conversations** | Open with no assigned agent | `WHERE assigned_to IS NULL AND status = 'open'` |

**UI specs:**
- Mantine `Paper` with `shadow="xs"` and `radius="md"`
- Layout: large number, metric label below, trend indicator (arrow + %) vs previous period
- `Skeleton` loading states while fetching
- Empty state: "0" with "Get started" link
- Responsive: 6 across (>1440px), 3x2 (1024–1440px), 2x3 (768–1024px), 1 column (<768px)

### 4.2 Charts and Visualizations

Use `@mantine/charts` (built on Recharts) for theme compatibility.

| Chart | Type | Data | Position |
|-------|------|------|----------|
| **Messages Over Time** | Line (2 lines) | Inbound vs outbound per day, last 30 days | Left 2/3 width |
| **Conversation Status** | Donut | Open / pending / resolved / expired counts | Right 1/3 width |
| **Campaign Performance** | Grouped bar | Last 5 campaigns: sent/delivered/read/replied | Left column below |
| **Response Time Trend** | Area line | Avg first-response time per day, last 14 days. Red dashed reference line at 5min target | Right column below |
| **Top Templates** | Horizontal bar | Top 5 by usage count + read rate overlay | Full width below |
| **Sales Opportunities** | Stat + bar | Total count of reservations/appointments originated from OctoPush campaign CTA clicks (tracked via redirect URLs), per campaign, last 30 days. Definition: every reservation or appointment completed after a contact clicks a tracked CTA URL in an OctoPush-sent campaign counts as one sales opportunity. See Section 7.2 for tracking mechanism detail | Full width below |

### 4.3 Activity Feed

Real-time event feed — right sidebar on wide screens (>1440px), below charts otherwise.

| Event | Icon | Format |
|-------|------|--------|
| New conversation | `IconMessagePlus` | "New conversation with {contact_name}" |
| Inbound message | `IconMessageForward` | "{contact_name} sent a message" |
| Campaign completed | `IconSend` | "Campaign '{name}' completed — {sent} sent" |
| Flow triggered | `IconPlayerPlay` | "Flow '{name}' triggered for {contact_name}" |
| Template approved | `IconCircleCheck` | "Template '{name}' approved by Meta" |
| Template rejected | `IconCircleX` | "Template '{name}' rejected — {reason}" |
| Contact created | `IconUserPlus` | "New contact: {contact_name}" |
| Conversation assigned | `IconUserCheck` | "{agent_name} assigned to {contact_name}" |

- Last 20 events, newest first
- Each item: relative timestamp, icon, description, clickable link
- Auto-updates via Supabase Realtime on `activity_log` table
- "View all activity" link at bottom

### 4.4 Quick Actions

| Button | Label | Action |
|--------|-------|--------|
| `IconPlus` | "New Campaign" | Navigate to `/campaigns/new` |
| `IconTemplate` | "Send Template" | Open template selector modal |
| `IconUserPlus` | "Add Contact" | Open contact creation drawer |
| `IconInbox` | "Unassigned ({count})" | Navigate to `/conversations?filter=unassigned` |

### 4.5 Date Range Picker

- Top-right, Mantine `DatePickerInput` with range mode
- Presets: Today, Last 7 days, Last 30 days (default), Last 90 days, Custom
- Changes refresh all cards and charts
- Persisted in URL search params

### 4.6 Data Architecture

- Server Components with `cache()` wrapped Supabase queries
- Client components for interactive charts, receiving server-fetched data as props
- Activity feed: client component with Supabase Realtime subscription
- `revalidatePath('/dashboard')` called by relevant server actions

---

## 5. Feature Scope — Contacts Module

### 5.1 Contact Data Model

> Full schema in [PRD-supabase.md](./PRD-supabase.md#contacts)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | auto | Primary key |
| `org_id` | UUID | yes | Organization FK |
| `phone` | text | yes | E.164 format, unique per org |
| `wa_id` | text | no | WhatsApp ID (from first message exchange) |
| `full_name` | text | no | Display name |
| `email` | text | no | Email address |
| `avatar_url` | text | no | Profile photo URL (synced from WhatsApp) |
| `company` | text | no | Company name |
| `job_title` | text | no | Role |
| `address` | jsonb | no | `{street, city, state, country, zip}` |
| `notes` | text | no | Free-form notes |
| `source` | text | no | `manual`, `import`, `whatsapp`, `campaign`, `flow`, `ad` |
| `opt_in_status` | text | yes | `opted_in` / `opted_out` / `pending` |
| `opt_in_at` | timestamptz | no | When opted in |
| `opt_in_source` | text | no | `form`, `whatsapp`, `import`, `manual` |
| `last_message_at` | timestamptz | no | Most recent message timestamp |
| `custom_fields` | jsonb | no | Org-defined custom fields |
| `deleted_at` | timestamptz | no | Soft delete |
| `created_at` | timestamptz | auto | Created |
| `updated_at` | timestamptz | auto | Updated |

### 5.2 CRUD Operations

**Create:**
- Form: phone (required), full_name, email, company, job_title, tags (multi-select), notes, opt_in_status
- Server action: `createContact(formData)` with Zod validation (E.164 phone regex, email format)
- Duplicate check by `(org_id, phone)` — error with link to existing contact if duplicate
- Uses `useActionState` for form state

**Read (Detail Page — `/contacts/[id]`):**
- Two-column: contact info + edit form (left), activity timeline (right)
- Tags as color-coded chips, opt-in status badge (green/yellow/red)
- Quick actions: "Send Message", "Add Tag", "Edit"

**Update:**
- Inline editing on detail page
- Server action: `updateContact(id, formData)`
- Optimistic UI update with rollback on failure

**Delete:**
- Soft delete (`deleted_at = now()`)
- Confirmation modal
- Admin can view/restore from "Trash" section

### 5.3 Search, Filter, Sort

**Search:** Full-text on name, phone, email, company — debounced 300ms, server-side

**Filters:**

| Filter | Type | Options |
|--------|------|---------|
| Opt-in status | Multi-select | Opted in, Opted out, Pending |
| Tags | Multi-select | All org tags |
| Source | Multi-select | Manual, Import, WhatsApp, Campaign, Flow, Ad |
| Created date | Date range | From / To |
| Last message date | Date range | From / To |
| Has conversation | Toggle | Yes / No |

**Sort:** Name (A-Z/Z-A), Last message, Created date, Phone

**Pagination:** Server-side, 25/50/100 per page, total count displayed

### 5.4 Import / Export

**CSV Import:**
1. Upload CSV (drag-drop or file picker, max 10MB)
2. Column mapping UI (auto-detect + user confirm)
3. Preview first 10 rows
4. Duplicate handling: Skip / Update existing / Create all
5. Validation: phone format, required fields, error count
6. Batch processing (100/batch) with progress bar
7. Results: X created, X updated, X skipped, X failed (downloadable error CSV)

**CSV Export:**
- Exports current filtered view or all
- All fields + tags (comma-separated)
- Large exports (>5,000): background Edge Function, download notification
- UTF-8 CSV with BOM for Excel

### 5.5 Tags

- Org-scoped, create on-the-fly or via Tag Manager (settings)
- Each tag: `name`, `color` (hex, default gray)
- Displayed as Mantine `Badge` chips
- Operations: add/remove from contact, bulk add/remove from list selection
- Max 50 tags per org
- Stored in `contact_tags` join table

### 5.6 Opt-in Tracking

| Status | Badge | Enforcement |
|--------|-------|-------------|
| `opted_in` | Green | Can be targeted in campaigns and flows |
| `pending` | Yellow | Can only receive replies within 24hr window |
| `opted_out` | Red | Cannot be targeted in campaigns or flows |

- Campaigns auto-exclude opted_out and pending contacts
- Opt-in changes logged in `activity_log` with who, when, old/new value, source
- History viewable on contact detail page

### 5.7 Activity History

Timeline on contact detail page, reverse chronological:

| Event | Icon | Details |
|-------|------|---------|
| Message sent/received | `IconSend` / `IconMessageForward` | Preview, status, agent |
| Campaign sent | `IconBroadcast` | Campaign name, template, status |
| Flow triggered/completed | `IconPlayerPlay` / `IconCircleCheck` | Flow name, outcome |
| Tag added/removed | `IconTag` / `IconTagOff` | Tag name, by whom |
| Opt-in changed | `IconShieldCheck` | Old → new, source |
| Note added | `IconNote` | Content, by whom |
| Contact created/updated | `IconUserPlus` / `IconEdit` | Source / fields changed |

Paginated: 20 at a time, "Load more" button

### 5.8 UI Components

**List Page (`/contacts`):**
- Top bar: search, filter button (drawer), sort dropdown, "Add Contact", "Import", "Export"
- Table: Mantine `Table`, sticky header, columns: checkbox, name+phone (avatar), email, tags, opt-in, last message, source, actions menu
- Bulk actions bar (on selection): "Add Tag", "Remove Tag", "Change Opt-in", "Delete"
- Empty state: illustration + "Add your first contact" CTAs

**Detail Page (`/contacts/[id]`):**
- Breadcrumb: Dashboard > Contacts > {Name}
- Left (60%): info card (editable), tags, custom fields, notes
- Right (40%): activity timeline (scrollable)
- Bottom: "Send Message", "Delete" (danger)

---

## 6. Feature Scope — Conversations (Inbox)

### 6.1 Layout

Three-panel layout:

```
┌──────────┬──────────────┬───────────────┬─────────────────────┐
│ Sidebar  │ Conversation │ Chat View     │ Contact Info Panel   │
│ (300px)  │ List (320px) │ (flex)        │ (300px, collapsible) │
└──────────┴──────────────┴───────────────┴─────────────────────┘
```

Mobile (<768px): single panel at a time with back navigation.

### 6.2 Conversation List

Each item shows:
- Contact avatar (or initials)
- Contact name (or phone if no name)
- Last message preview (50 chars)
- Relative timestamp
- Unread count badge
- Assigned agent avatar
- 24hr window indicator: green (>4h), yellow (1–4h), red (<1h), gray (expired)

**Tabs:** All | Mine | Unassigned | Resolved

**Features:**
- Sorted by `last_message_at` DESC
- Real-time updates via Supabase Realtime
- Search by name/phone/message content

### 6.3 Chat View

**Message bubbles:**
- Inbound: left-aligned, light gray background
- Outbound: right-aligned, primary color (#FF2D55), white text
- Date separators between different days
- System messages centered, muted

**Content rendering by type:**

| Type | Rendering |
|------|-----------|
| Text | Linkified text with line breaks |
| Image | Thumbnail (max 300px) + lightbox |
| Video | Inline player with play overlay |
| Audio | Player with waveform |
| Document | File icon + name + size, click to download |
| Location | Static map + pin, click for Google Maps |
| Contact (vCard) | Card with name/phone, "Add to contacts" button |
| Interactive replies | Styled chip showing selected option |
| Template | Structured card (header, body, footer, buttons) |
| Reaction | Emoji overlay on target message |

**Delivery status icons (outbound):**
- Pending: `IconClock` (gray)
- Sent: single check (gray)
- Delivered: double check (gray)
- Read: double check (blue)
- Failed: `IconX` (red) + hover for error

**Chat header:**
- Contact name + phone
- 24hr window countdown with color coding
- "Assign to" dropdown
- "Resolve" button
- More menu: View contact, Add tag, Mark unread, Transfer to bot

### 6.4 Message Input

**Window OPEN:**
- Multi-line text input (auto-expand, max 5 lines)
- Emoji picker, attachment button, "Send Template" button, send button
- "/" command → canned responses dropdown
- Enter to send, Shift+Enter for new line

**Window EXPIRED:**
- Text input disabled: "24-hour window expired. Send a template to re-engage."
- "Send Template" button prominently displayed
- Collapsible info box explaining the rule

### 6.5 24-Hour Window Management

- `window_expires_at` on conversations = latest inbound message + 24 hours
- Server-side check before allowing free-form send
- Client-side timer with color changes (green → yellow → red → gray)
- Edge case: if window expires while composing, show warning toast and disable send
- Window reopens when customer replies to a template

### 6.6 Assignment and Routing

- Assign from chat header dropdown or bulk from list
- System message: "Assigned to {agent} by {assigner}"
- Notification to assigned agent
- Conversation moves to assigned agent's "Mine" tab
- Auto-assign rules (Phase 2): round-robin, least-busy, keyword-based

### 6.7 Bot-to-Agent Handoff

> Full details in [PRD-automation-flows.md](./PRD-automation-flows.md#bot-to-agent-handoff)

- "Bot active" badge in chat header when flow is running
- "Take Over" button: pauses flow, enables agent messaging
- "Return to Bot" button: resumes flow
- System messages logged for both transitions

### 6.8 Canned Responses

**Management (Settings):**
- CRUD for org-scoped responses: title, content, shortcut (e.g., "/greeting")
- Supports `{contact_name}` and `{agent_name}` variables

**Usage:**
- Type "/" in input → searchable dropdown
- Click to insert (variables auto-replaced)
- Editable before sending

### 6.9 Real-time Events

| Event | Mechanism | UI Update |
|-------|-----------|-----------|
| New inbound message | Realtime INSERT on `messages` | New bubble, conversation to top, unread++ |
| Status update | Realtime UPDATE on `messages` | Status icon changes |
| Assignment change | Realtime UPDATE on `conversations` | Badge update, notification |
| New conversation | Realtime INSERT on `conversations` | New item in list |
| Window expiry | Client `setInterval` | Input disables, indicator grays |

Connection management: auto-reconnect, "Reconnecting..." indicator, fetch missed on reconnect, poll fallback at 5s.

---

## 7. Feature Scope — Campaigns

### 7.1 Creation Workflow (5-step wizard)

**Step 1 — Setup:** Name (required), description (optional)

**Step 2 — Audience:**
- Select existing segment (shows name + count) OR create new segment OR manual selection
- Audience size display: "X contacts will receive this campaign"
- Auto-exclusions: "Y excluded (opted out: N, no phone: N)"
- Warning if exceeding messaging tier limit

**Step 3 — Content:**
- Template selector (approved only, filter by category)
- Phone mockup preview
- Variable mapping per placeholder: static value OR dynamic from contact field
- Preview with sample contact data

**Step 4 — Schedule:**
- "Send now" (default) or "Schedule for later" (date + time + timezone)
- Estimated completion time based on audience size + tier
- Cost estimate (if pricing implemented)

**Step 5 — Review:**
- Summary card: name, audience, template preview, schedule
- "Send" / "Schedule" primary button, "Save as Draft" secondary

### 7.2 Campaign Analytics

**List Page (`/campaigns`):**
- Table: name, status badge, audience, sent/delivered/read/replied, created date, actions
- Filters: status, date range, created by

**Detail Page (`/campaigns/[id]`):**
- Top row cards: Total sent | Delivered (%) | Read (%) | Replied (%) | CTA Clicks (count) | Sales Opportunities (count) | Failed (%)
- Delivery funnel chart: Sent → Delivered → Read → CTA Clicked → Opportunity Created
- Per-recipient table: name, phone, status, timestamps, cta_clicked_at, opportunity_created_at, error — searchable, filterable, exportable

**CTA click tracking mechanism:** WhatsApp CTA URL buttons open a URL in the user's browser — Meta does **not** send a webhook event for this action. To track CTA clicks, OctoPush uses **tracked redirect URLs**: when a campaign template includes a CTA URL button, the destination URL is wrapped in a tracking redirect (e.g., `https://app.octopush.com/t/{tracking_id}?dst={original_url}`). When the contact taps the button, their browser hits OctoPush's redirect endpoint (`GET /api/t/[trackingId]`), which records the click (contact_id, campaign_id, timestamp) and issues a 302 redirect to the original destination. See [PRD-whatsapp.md — Section 4.4](./PRD-whatsapp.md#44-cta-click-tracking) for full technical detail.

**Sales Opportunity definition:** A **Sales Opportunity** is recorded when a contact clicks a tracked CTA URL in an OctoPush campaign and subsequently completes a reservation or appointment. Opportunity creation requires an explicit completion signal (e.g., a landing page conversion callback, a flow node marking the contact as converted, or a manual agent action).

**Real-time:** Analytics update as webhook statuses arrive via campaign count database triggers

### 7.3 Sending Engine

> Technical details in [PRD-whatsapp.md](./PRD-whatsapp.md#campaign-sending) and [PRD-supabase.md](./PRD-supabase.md#edge-functions)

- Edge Function `send-campaign` handles bulk sending
- Batches of 50, respecting rate limits (80 MPS default)
- Rate limit awareness: query messaging tier, track rolling 24hr usage
- Pause/resume capability
- Display: "1,234 / 2,000 messages used (24hr window)"

### 7.4 A/B Testing (Phase 2)

- Split audience into 2–3 groups (equal or custom %)
- Different templates per group
- Test period (2h/6h/12h/24h), then compare read/reply rates
- Auto-send winner to remaining audience (optional)

---

## 8. Feature Scope — Segments

### 8.1 Segment Types

| Type | Behavior |
|------|----------|
| **Dynamic** | Recalculated on every use; rules evaluated against current data |
| **Static** | Fixed contact list captured at creation time |

### 8.2 Rules Builder

Visual rule builder with nested AND/OR groups:

```
GROUP (AND/OR)
├── Rule: {field} {operator} {value}
├── Rule: {field} {operator} {value}
└── GROUP (AND/OR)
    ├── Rule: ...
    └── Rule: ...
```

**Available rules:**

| Category | Field | Operators |
|----------|-------|-----------|
| Contact | full_name, email, phone, company, source, opt_in_status, custom_fields.* | equals, contains, starts with, is empty, is one of |
| Tags | has tag, does not have tag | tag selector |
| Behavior | last_message_at, total messages sent/received, has active conversation | before, after, in last N days, greater/less than |
| Campaign | received/read/replied to campaign | campaign selector |
| Flow | completed/currently in flow | flow selector |
| Date | created_at | before, after, in last N days |

### 8.3 Size Estimation

- Live count as rules are built (debounced 300ms)
- Server action: `calculateSegmentCount(rules)` → translates to SQL WHERE → COUNT query
- Display: "~{count} contacts match" with loading spinner

### 8.4 UI

**List Page (`/segments`):** Table with name, type badge, count, last calculated, actions

**Builder (`/segments/new`, `/segments/[id]/edit`):**
- Left: rule builder
- Right: live preview — first 10 matching contacts + total count

**Detail (`/segments/[id]`):**
- Info: name, type, rules summary, count
- Members table (paginated)
- Actions: "Use in Campaign", "Export CSV", "Edit", "Delete"

---

## 9. Feature Scope — Templates

### 9.1 Template Builder

**Route:** `/templates/new` or `/templates/[id]/edit`

**Layout:** Editor (left 60%) + phone preview (right 40%)

| Field | Input | Validation |
|-------|-------|------------|
| Name | Text | Required, lowercase + underscores, 1–512 chars |
| Category | Select | `marketing` / `utility` / `authentication` |
| Language | Select | From Meta's supported list (default: `en_US`) |
| Header type | Select | None / Text / Image / Video / Document |
| Header content | Text or file upload | Text max 60 chars; media per WhatsApp limits |
| Body | Textarea | Required, max 1024 chars, `{{1}}`, `{{2}}` placeholders |
| Footer | Text | Optional, max 60 chars |
| Buttons | Dynamic builder | Up to 3 quick-reply OR up to 2 CTA (URL/phone). CTA URL buttons in campaigns use tracked redirect URLs for click attribution in Sales Opportunity analytics (see Section 7.2) |

**Phone preview:** Mantine-styled phone mockup, real-time rendering, sample values substituted

### 9.2 Template Lifecycle

```
Draft → [Submit] → Pending → [Meta reviews] → Approved / Rejected
                                                    ↓
                                             [Edit & Resubmit] → Pending → ...
Approved → [Meta policy change] → Disabled
```

**Submit to Meta:**
- Server action: `submitTemplate(id)` → builds Meta API payload → `POST /{WABA_ID}/message_templates`
- Stores `wa_template_id`, sets status=pending
- Status updates via `message_template_status_update` webhook

### 9.3 Status Display

| Status | Badge Color | Actions |
|--------|-------------|---------|
| Draft | Gray | Edit, Submit, Delete |
| Pending | Yellow | View only |
| Approved | Green | Use in campaigns/conversations, Delete from Meta |
| Rejected | Red | View reason, Edit & Resubmit, Delete |
| Disabled | Dark gray | Contact Meta, Delete |

### 9.4 Performance Analytics

- Usage count over time (line chart, last 30 days)
- Delivery funnel: sent → delivered → read → replied
- Campaigns and flows using this template (linked lists)
- "Top performing" filter on list page (highest read rate, min 50 sends)

### 9.5 UI

**List Page (`/templates`):**
- Grid/table view toggle
- Grid: card with name, category badge, status badge, body preview, usage count
- Table: name, category, language, status, usage, created, actions
- Filters: status, category, language; search by name

**Detail (`/templates/[id]`):**
- Phone preview (left), details + analytics (right)
- Actions: Edit, Submit, Delete, Duplicate

---

## 10. Phased Rollout Plan

### Phase 1 — MVP (Weeks 1–6)

**Goal:** Working end-to-end WhatsApp messaging through the CRM

| Week | Deliverables |
|------|-------------|
| 1–2 | Database schema migration (all tables). WhatsApp setup (Embedded Signup, webhook handler, signature validation). |
| 2–3 | Contacts: CRUD, search, filter, sort, pagination. Tags: CRUD, assignment. Opt-in tracking. |
| 3–4 | Conversations inbox: three-panel layout, message list, Realtime. Send text + templates. Delivery status. 24hr window. |
| 4–5 | Templates: builder + preview, submit to Meta, status tracking. Conversation assignment. |
| 5–6 | Dashboard: metric cards, Messages Over Time, Conversation Status donut. Canned responses. QA. |

**Exit criteria:** Org connects WhatsApp → contacts managed → messages flow in real-time → agents reply → templates submitted → dashboard shows live metrics.

### Phase 2 — Campaigns & Segments (Weeks 7–10)

**Goal:** Targeted WhatsApp campaigns

| Week | Deliverables |
|------|-------------|
| 7–8 | Segments: rules builder, dynamic/static, live count. Contact import/export. |
| 8–9 | Campaigns: creation wizard, variable mapping, scheduling. Send engine (Edge Function + rate limiting). |
| 9–10 | Campaign analytics: funnel, per-recipient, real-time. Dashboard: Campaign Performance chart, activity feed, Top Templates. |

### Phase 3 — Automation & Advanced (Weeks 11–16)

**Goal:** Full automation with visual flow builder

| Week | Deliverables |
|------|-------------|
| 11–12 | Automation Flows: visual builder (React Flow), all node types, definition storage. |
| 12–13 | Flow execution engine (Edge Function): node eval, messaging, delays, conditions. |
| 13–14 | Pre-built flow templates (5). Bot-to-agent handoff. Flow analytics. |
| 14–15 | Execution logs + debugging. HTTP webhook node. Response Time Trend chart. |
| 15–16 | Campaign A/B testing. Quality monitoring dashboard. Polish + QA + performance. |

### Dependency Graph

```
Phase 1: Schema → WhatsApp Setup → Contacts → Conversations → Templates → Dashboard
                                       ↓             ↓
Phase 2:                         Import/Export → Segments → Campaigns → Analytics
                                                                          ↓
Phase 3:                                            Flow Builder → Engine → Templates → A/B
                                                         ↓
                                                   Bot Handoff
```

---

## 11. Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| Dashboard page load | <2s (LCP) |
| Conversation list load | <1s |
| Message send round-trip | <3s |
| Contact search results | <500ms |
| Campaign throughput | 80 MPS (default tier) |
| Webhook processing (p95) | <500ms |
| Page navigation (client) | <300ms |

### Scalability

| Dimension | Target |
|-----------|--------|
| Contacts per org | 100,000+ |
| Concurrent conversations | 500+ |
| Messages per day per org | 50,000+ |
| Active flows per org | 50+ |
| Concurrent users per org | 20+ |

### Accessibility (WCAG 2.1 AA)

- Keyboard navigable (Tab, Enter, Escape, Arrow)
- Color contrast: 4.5:1 normal text, 3:1 large text
- ARIA labels on all icons, buttons, status indicators
- Focus trapped in modals, returned on close
- `aria-live` for dynamic content
- Mantine provides built-in baseline

### Browser Support

Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+ (Next.js 16 default browserslist). Mobile Chrome/Safari (secondary).

### Responsiveness

| Breakpoint | Adaptation |
|------------|------------|
| >1440px | Full 3-panel conversations, dashboard with side activity feed |
| 1024–1440px | 2-panel conversations (info collapsed), dashboard 3-col |
| 768–1024px | Single panel conversations, dashboard 2-col |
| <768px | Full-screen views with back nav, dashboard 1-col, 44x44px min tap targets |

---

## 12. Risks and Mitigations

### Technical

| Risk | Impact | Mitigation |
|------|--------|------------|
| Meta API rate limiting | Delayed campaigns | Queue with throttling, respect tier, show ETA, pause/resume |
| Realtime connection drops | Stale data | Auto-reconnect, poll fallback (5s), "Reconnecting" indicator |
| DB performance at 100K+ contacts | Slow queries | Indexes, server-side pagination, query optimization |
| Edge Function cold starts | Delayed webhooks | Process critical path inline, async for rest |
| Concurrent agent replies | Duplicates | Optimistic locking, assignment enforcement, "composing" indicator |

### Business

| Risk | Impact | Mitigation |
|------|--------|------------|
| Meta policy changes | Revenue disruption | Abstract API layer, monitor changelog |
| Low template approval | User churn | In-app guidelines, samples, clear rejection reasons |
| Competition | Slow acquisition | UX quality, automation as differentiator, competitive pricing |
| GDPR gaps | Legal risk | Built-in opt-in tracking, export/delete, privacy-by-design |

---

## 13. Open Questions

### Product

1. **Pricing model**: Per-message, flat subscription, or tiered plans?
2. **Multi-phone support**: Multiple WhatsApp numbers per org?
3. **Auto-close policy**: Auto-resolve expired conversations after X days?
4. **Message retention**: 30 days, 1 year, unlimited, configurable?
5. **Mobile app**: Native app needed or responsive web sufficient?

### Technical

6. **API access**: Direct Meta Cloud API or via BSP (Twilio, 360dialog)?
7. **Webhook processing**: Inline vs always Edge Function?
8. **Flow execution**: Edge Functions vs external job queue (Inngest, Trigger.dev)?
9. **Charting**: `@mantine/charts` (best theme fit) vs standalone Recharts?
10. **Custom fields**: JSONB on contacts vs typed `custom_field_definitions` table?

### Access Control

11. **Roles**: owner, admin, agent, viewer, campaign_manager — which permissions?
12. **Team routing**: Assign to teams vs only individual agents?

### Integrations

13. **Notifications**: In-app only? Email? Browser push? Which events?
14. **External API**: Expose REST API for third-party integrations?
15. **Report export**: PDF/CSV dashboard reports? Scheduled email delivery?
