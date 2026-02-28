# OctoPush CRM — WhatsApp Integration PRD

**Version:** 1.0
**Date:** 2026-02-24
**Parent:** [Main PRD](./PRD-main.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [WhatsApp Business Cloud API Fundamentals](#2-whatsapp-business-cloud-api-fundamentals)
3. [Authentication and Business Setup](#3-authentication-and-business-setup)
4. [Message Types](#4-message-types)
5. [24-Hour Conversation Window](#5-24-hour-conversation-window)
6. [Webhook Architecture](#6-webhook-architecture)
7. [Sending Messages — API Reference](#7-sending-messages--api-reference)
8. [Rate Limits and Messaging Tiers](#8-rate-limits-and-messaging-tiers)
9. [Pricing Model](#9-pricing-model)
10. [WhatsApp Integration Setup (Settings Page)](#10-whatsapp-integration-setup-settings-page)
11. [Campaign Sending Engine](#11-campaign-sending-engine)
12. [Template Management with Meta](#12-template-management-with-meta)
13. [Quality Monitoring](#13-quality-monitoring)
14. [Security Requirements](#14-security-requirements)
15. [Error Handling](#15-error-handling)
16. [Media Handling](#16-media-handling)

---

## 1. Overview

OctoPush integrates with the **WhatsApp Business Cloud API** (hosted by Meta) — the only supported API as of 2025 (On-Premises API deprecated). Every org connects their own WhatsApp Business Account (WABA) via Meta's Embedded Signup flow. All messaging is real — no mocked or hardcoded data.

**Base URL:**
```
https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
```

**Key identifiers per organization:**
- `WABA_ID` — WhatsApp Business Account ID
- `PHONE_NUMBER_ID` — Meta-assigned ID for the registered phone number (not the phone number itself)
- `ACCESS_TOKEN` — Long-lived System User token scoped to the WABA

---

## 2. WhatsApp Business Cloud API Fundamentals

| Aspect | Detail |
|--------|--------|
| API type | REST (JSON payloads) |
| Hosting | Meta Cloud (no self-hosting) |
| Auth | Bearer token per request |
| Contact identifier | Phone number in E.164 format (`wa_id`) |
| Message deduplication key | `wamid` (WhatsApp Message ID) |
| Conversation model | 24-hour service window from last customer message |
| Template requirement | Business-initiated messages outside window require pre-approved templates |
| Webhook delivery | At-least-once; not guaranteed in order |

---

## 3. Authentication and Business Setup

### 3.1 Embedded Signup Flow

Meta provides an Embedded Signup widget — an OAuth-like modal that lets each org connect their WABA without leaving OctoPush.

**Flow:**
1. User clicks "Connect WhatsApp Business" on settings page
2. Meta's JavaScript SDK loads popup
3. User authenticates with Meta Business Manager
4. Widget guides: WABA creation/selection → phone number registration (OTP) → permission grant
5. On success: returns `access_token`, `waba_id`, `phone_number_id`
6. OctoPush server action:
   - Encrypts access token via Supabase Vault (pgsodium)
   - Inserts `whatsapp_accounts` record
   - Generates `webhook_verify_token` (random UUID)
   - Registers webhook: `POST /v21.0/{APP_ID}/subscriptions`
   - Subscribes app to WABA: `POST /v21.0/{WABA_ID}/subscribed_apps`
   - Verifies webhook handshake

**Disconnection:**
- Revoke app subscription
- Delete `whatsapp_accounts` record
- Confirmation: "This stops all WhatsApp messaging for your organization"

### 3.2 Phone Number Registration Limits

- 10 registration attempts per 72-hour rolling window per phone number
- Exceeding blocks the number for 72 hours
- Only one WABA per phone number at any time

### 3.3 WhatsApp Account Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `org_id` | UUID | Organization FK (UNIQUE — one per org) |
| `waba_id` | text | WhatsApp Business Account ID |
| `phone_number_id` | text | Registered phone number ID |
| `display_phone` | text | Display phone number (formatted) |
| `business_name` | text | Business name on WhatsApp |
| `access_token_encrypted` | text | Encrypted via Supabase Vault |
| `quality_rating` | text | `GREEN` / `YELLOW` / `RED` |
| `messaging_tier` | text | `TIER_0` / `TIER_1` / `TIER_2` / `TIER_3` / `UNLIMITED` |
| `webhook_verify_token` | text | Random token for webhook verification |
| `webhook_verified` | boolean | Whether handshake succeeded |
| `status` | text | `active` / `disconnected` / `restricted` |
| `connected_at` | timestamptz | When connected |
| `updated_at` | timestamptz | Last updated |

---

## 4. Message Types

### 4.1 Template Messages (Business-Initiated)

Required when initiating a conversation or when the 24-hour window has expired. Every template must be submitted to and approved by Meta before use.

**Categories:**

| Category | Purpose | Charged? |
|----------|---------|----------|
| Marketing | Promotions, campaigns, re-engagement | Always |
| Utility | Order confirmations, shipping, reminders | Only outside 24hr window |
| Authentication | OTP, identity verification | Always |

**Components:**
- **Header**: text (60 chars max), image, video, or document
- **Body**: text (1024 chars max) with `{{1}}`, `{{2}}` variable placeholders
- **Footer**: static text (60 chars max)
- **Buttons**: up to 3 quick-reply OR up to 2 CTA (URL/phone)

### 4.2 Free-Form Messages (Within 24-Hour Window)

Once a customer messages the business, free-form replies are allowed for 24 hours:

| Type | Details | Max Size |
|------|---------|----------|
| Text | Plain text, up to 4,096 chars | — |
| Image | JPEG, PNG | 5 MB |
| Video | MP4, 3GPP | 16 MB |
| Audio | AAC, MP4, MPEG, AMR, OGG | 16 MB |
| Document | PDF, DOCX, XLSX, PPTX, etc. | 100 MB |
| Sticker | WebP | 100 KB static, 500 KB animated |
| Location | Latitude/longitude with optional name | — |
| Contact card | vCard-style contact | — |
| Reaction | Emoji reaction to a message | — |

### 4.3 Interactive Messages

Available both within and outside the window (as templates):

| Type | Description | Limits |
|------|-------------|--------|
| Reply buttons | Tappable text buttons | Up to 3 buttons, 25 chars each |
| List messages | Menu picker with sections | Up to 10 items in sections |
| CTA URL buttons | Button that opens a URL | Up to 2 buttons |

### 4.4 CTA Click Tracking

**Technical limitation:** When a user taps a CTA URL button in WhatsApp, the URL opens directly in their device's browser. Meta does **not** send a webhook event for CTA URL button taps — unlike quick-reply buttons which generate a `button_reply` webhook. This means CTA URL clicks cannot be tracked server-side via the WhatsApp webhook pipeline.

**Solution — Tracked Redirect URLs:**

OctoPush wraps CTA destination URLs in a tracking redirect so that clicks are recorded when the user's browser passes through OctoPush's server before reaching the destination.

**URL format:**
```
Original:   https://business.com/book-appointment
Tracked:    https://app.octopush.com/t/{tracking_id}?dst=https://business.com/book-appointment
```

- `tracking_id`: UUID linking to `campaign_id`, `contact_id`, and the original destination URL
- `dst`: URL-encoded original destination (used for the 302 redirect)

**Redirect endpoint:**

Route Handler: `GET /api/t/[trackingId]`

```
1. Lookup tracking_id → get campaign_id, contact_id, destination_url
2. Record click: INSERT into cta_clicks (tracking_id, contact_id, campaign_id, clicked_at, user_agent, ip_hash)
3. Return 302 redirect to destination_url
4. If tracking_id not found: redirect to org's default URL or show 404
```

**Requirements:**
- Redirect must respond in <100ms (lookup + insert async or fire-and-forget)
- Deduplication: first click recorded per (tracking_id, contact_id); subsequent clicks update `click_count` but don't create new records
- Privacy: IP addresses stored as SHA-256 hash only; no PII in redirect URL query params
- URL generation happens at campaign send time in the `send-campaign` Edge Function — the template's CTA URL is rewritten per-contact before calling the WhatsApp API

**Data model (minimal):**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `tracking_id` | UUID | Unique per CTA per contact per campaign |
| `campaign_id` | UUID | Campaign FK |
| `contact_id` | UUID | Contact FK |
| `destination_url` | text | Original destination URL |
| `clicked_at` | timestamptz | First click timestamp |
| `click_count` | integer | Total clicks (default 1) |
| `user_agent` | text | Browser user agent |
| `ip_hash` | text | SHA-256 of IP address |

**Note:** Quick-reply button responses (interactive reply buttons) ARE received via the `messages` webhook as `type: "interactive"` → `interactive.type: "button_reply"`. These are handled in the standard webhook pipeline (Section 6.5), not via redirect URLs.

---

## 5. 24-Hour Conversation Window

**This is the most critical rule in the entire WhatsApp integration.**

| Scenario | Allowed | Cost |
|----------|---------|------|
| Customer messages business | Business replies freely for 24 hours | Free (Service) |
| Each new customer message | Resets the 24-hour window | Free |
| Window expired | ONLY approved templates | Template rate charged |
| Business sends template, customer replies | New 24-hour window opens | Template cost, then free |
| Click-to-WhatsApp ad click | 72-hour free window for all message types | Free |

### Implementation in OctoPush

**Database tracking:**
- `conversations.window_expires_at` = `MAX(inbound_message.created_at) + interval '24 hours'`
- Updated on every inbound message

**Server-side enforcement:**
- Before sending free-form message: check `window_expires_at > now()`
- If expired: reject with error "Window expired — use template"

**Client-side indicators:**
- Chat header: countdown timer ("Window closes in 2h 34m")
- Color: green (>4h), yellow (1–4h), red (<1h), gray (expired)
- Input bar: disabled when expired with "Send a template to re-engage" prompt

**Edge cases:**
- Window expires while composing → warning toast, disable send
- Template sent + customer replies → window reopens, UI updates via Realtime

---

## 6. Webhook Architecture

### 6.1 Endpoint

**File:** `src/app/api/whatsapp/webhook/route.ts`

```
GET  /api/whatsapp/webhook  — Verification handshake
POST /api/whatsapp/webhook  — Receive events
```

### 6.2 Verification Handshake (GET)

Meta sends on first registration:
```
GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
```

Handler:
1. Look up `whatsapp_accounts` where `webhook_verify_token = TOKEN`
2. If found and `hub.mode = "subscribe"`: return `Response(CHALLENGE, 200)`
3. Else: return `Response("Forbidden", 403)`

### 6.3 Event Processing (POST)

**Request validation:**
1. Read raw body
2. Compute HMAC-SHA256 of body using Meta App Secret
3. Compare with `X-Hub-Signature-256` header (timing-safe)
4. If mismatch: return 401
5. Parse JSON
6. **Return 200 immediately** (Meta retries on slow responses)
7. Insert raw payload into `webhook_logs` (processed: false)
8. Process asynchronously

### 6.4 Webhook Payload Structure

**Inbound message:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "<WABA_ID>",
    "changes": [{
      "field": "messages",
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "...",
          "phone_number_id": "..."
        },
        "contacts": [{ "profile": { "name": "John Doe" }, "wa_id": "..." }],
        "messages": [{
          "id": "wamid.xxx",
          "from": "1234567890",
          "timestamp": "1700000000",
          "type": "text",
          "text": { "body": "Hello" }
        }]
      }
    }]
  }]
}
```

**Delivery status:**
```json
"statuses": [{
  "id": "wamid.xxx",
  "status": "delivered",
  "timestamp": "...",
  "recipient_id": "..."
}]
```

Status progression: `sent` → `delivered` → `read` (or `failed`)

### 6.5 Processing Pipeline

> **Note:** CTA URL button clicks are **not** received via this webhook pipeline. They are tracked via the redirect URL endpoint (`GET /api/t/[trackingId]`) described in [Section 4.4](#44-cta-click-tracking). Only quick-reply button responses (`button_reply`) arrive here as inbound messages.

```
parse payload → extract entry[].changes[]
  ├── field: "messages"
  │   ├── value.messages[]  → handleInboundMessage()
  │   └── value.statuses[]  → handleStatusUpdate()
  ├── field: "message_template_status_update" → handleTemplateStatusUpdate()
  ├── field: "phone_number_quality_update"    → handleQualityUpdate()
  └── field: "account_update"                 → handleAccountUpdate()
```

**handleInboundMessage(message, metadata):**
1. Lookup org by `metadata.phone_number_id` → `whatsapp_accounts`
2. Upsert contact by `(org_id, phone=message.from)` — set `wa_id`, `avatar_url` from profile
3. Find or create conversation for `(org_id, contact_id)` — set `status='open'`, `window_expires_at = now() + 24h`
4. Insert message (direction: inbound, wamid, type, content parsed by type)
5. Update conversation: `last_message_at`, `last_message_preview`, `unread_count += 1`
6. Update contact: `last_message_at`
7. Check active automation flows → trigger matching flows
8. Log to `activity_log`

**handleStatusUpdate(status):**
1. Find message by `wamid = status.id`
2. Update message status + corresponding timestamp
3. If message has `campaign_id`: update `campaign_contacts` status
4. Supabase Realtime broadcasts update

**handleTemplateStatusUpdate(event):**
1. Find template by `wa_template_id`
2. Update status to `approved` / `rejected`
3. If rejected: store `rejection_reason`
4. Set `meta_reviewed_at`
5. Log to `activity_log`

**handleQualityUpdate(event):**
1. Find `whatsapp_accounts` by `waba_id`
2. Update `quality_rating`
3. If YELLOW/RED: create alert notification

### 6.6 Subscribed Webhook Fields

| Field | Purpose |
|-------|---------|
| `messages` | Inbound messages + outbound delivery/read status updates |
| `account_update` | Policy violations, account restrictions |
| `message_template_status_update` | Template approval/rejection |
| `phone_number_quality_update` | Quality rating changes |

### 6.7 Webhook Reliability Requirements

- **Idempotent processing**: use `wamid` as unique constraint on messages table — skip if already exists
- **Out-of-order delivery**: use message timestamps for sequencing, not arrival order
- **Raw payload logging**: store in `webhook_logs` before processing for replay
- **Deduplication**: each outbound message generates up to 3 callbacks (sent, delivered, read) — handle as status updates, not new events

---

## 7. Sending Messages — API Reference

### 7.1 Send Text Message

```json
POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {TOKEN}

{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "15551234567",
  "type": "text",
  "text": { "body": "Hello, how can we help?" }
}
```

### 7.2 Send Template Message

```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "template",
  "template": {
    "name": "order_confirmation",
    "language": { "code": "en_US" },
    "components": [{
      "type": "body",
      "parameters": [
        { "type": "text", "text": "John" },
        { "type": "text", "text": "#ORD-1234" }
      ]
    }]
  }
}
```

### 7.3 Send Interactive (Reply Buttons)

```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": { "text": "Did this resolve your issue?" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "yes_resolved", "title": "Yes" }},
        { "type": "reply", "reply": { "id": "no_help", "title": "No, I need help" }}
      ]
    }
  }
}
```

### 7.4 Send Interactive (List Message)

```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "body": { "text": "How can we help?" },
    "action": {
      "button": "Select option",
      "sections": [{
        "title": "Support",
        "rows": [
          { "id": "billing", "title": "Billing", "description": "Payment and invoice help" },
          { "id": "technical", "title": "Technical", "description": "Product issues" },
          { "id": "general", "title": "General", "description": "Other questions" }
        ]
      }]
    }
  }
}
```

### 7.5 Send Media (Image)

```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "image",
  "image": {
    "link": "https://example.com/image.jpg",
    "caption": "Your order receipt"
  }
}
```

### 7.6 Mark Message as Read

```json
POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages

{
  "messaging_product": "whatsapp",
  "status": "read",
  "message_id": "wamid.xxx"
}
```

### 7.7 Upload Media

```
POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/media
Content-Type: multipart/form-data

file=@image.jpg
type=image/jpeg
messaging_product=whatsapp
```

Returns `{ "id": "MEDIA_ID" }` — reference in message payloads.

### 7.8 Manage Templates

```
GET    https://graph.facebook.com/v21.0/{WABA_ID}/message_templates
POST   https://graph.facebook.com/v21.0/{WABA_ID}/message_templates
DELETE https://graph.facebook.com/v21.0/{WABA_ID}/message_templates/{TEMPLATE_ID}
```

---

## 8. Rate Limits and Messaging Tiers

### 8.1 Messaging Tiers (Business-Initiated per 24 Hours)

| Tier | Unique Contacts / 24h | Unlock Requirement |
|------|----------------------|--------------------|
| Unverified (TIER_0) | 250 | Default |
| TIER_1 | 2,000 | Business verified + quality maintained |
| TIER_2 | 10,000 | Consistent usage and quality |
| TIER_3 | 100,000 | Higher scale usage |
| UNLIMITED | No limit | Established track record |

- Tiers upgrade automatically based on quality and volume
- Messaging same user multiple times in 24h counts as ONE conversation toward limit
- Tracked per `whatsapp_accounts.messaging_tier`

### 8.2 Throughput (Messages Per Second)

| Level | MPS |
|-------|-----|
| Default | 80 per phone number |
| Upgraded | Up to 1,000 (automatic for eligible accounts) |

### 8.3 Per-User Marketing Caps

Meta enforces per-user marketing frequency limits algorithmically. Businesses cannot send unlimited marketing templates to the same user. Exact thresholds are not publicly documented.

### 8.4 OctoPush Rate Limit Management

- Display current tier + usage on settings page
- Track rolling 24h business-initiated conversations
- Campaign engine respects tier limits:
  - If nearing limit: pause, notify, show estimated resume time
  - Throttle to 80 MPS (default) between API calls
  - Queue excess messages
- Alert when at 80% of tier capacity

---

## 9. Pricing Model

Per-message billing (effective July 1, 2025):

| Category | Range (USD) | Notes |
|----------|-------------|-------|
| Marketing | $0.011 – $0.132 | Always charged; Germany/Netherlands most expensive |
| Utility | $0.0008 – $0.046 | Free within 24hr window |
| Authentication | $0.0008 – $0.046 | Always charged |
| Service | Free | Always free |

**Volume discounts (utility + authentication only):**

| Monthly Volume | Discount |
|----------------|----------|
| 0 – 100K | List rate |
| 100K – 500K | -5% |
| 500K – 2M | -10% |
| 2M – 5M | -15% |
| 5M – 10M | -20% |
| 10M+ | -25% |

**Free windows:**
- Customer-initiated 24hr window: utility + service free
- Click-to-WhatsApp 72hr FEP: all types free
- 1,000 free service conversations/month per WABA

---

## 10. WhatsApp Integration Setup (Settings Page)

**Route:** `/settings/whatsapp`

### 10.1 Connection Card

**Not connected state:**
- Headline: "Connect Your WhatsApp Business Account"
- Description of what connecting enables
- "Connect WhatsApp Business" button (launches Embedded Signup)
- Requirements: Meta Business Manager account, real phone number, business verification

**Connected state:**
- Phone number with verified badge
- Business name
- Quality rating (color-coded badge)
- Messaging tier display
- Connection date
- "Disconnect" button (danger, with confirmation)

### 10.2 Webhook Event Log

Tab or section showing last 100 webhook events:

| Column | Description |
|--------|-------------|
| Received at | Timestamp |
| Event type | messages, template_status, quality_update, etc. |
| Status | Processed (green) / Failed (red) |
| Payload | Expandable JSON viewer |
| Actions | "Reprocess" for failed events |

- Filter by event type, status, date range
- Auto-refresh via Realtime on `webhook_logs`

---

## 11. Campaign Sending Engine

### 11.1 Architecture

Supabase Edge Function: `send-campaign`

### 11.2 Execution Flow

```
sendCampaign server action called
  → Resolve audience (segment rules OR manual contacts)
  → Filter: exclude opted_out, exclude no-phone
  → Create campaign_contacts records (status: pending)
  → Update campaign: total_recipients, status=sending, started_at=now()
  → Invoke send-campaign Edge Function
```

**Edge Function logic:**
```
Load campaign + template + campaign_contacts (pending)
For each batch of 50 contacts:
  For each contact:
    1. Resolve template variables (static or from contact fields)
    2. Build WhatsApp API payload
    3. Decrypt org's access token
    4. POST to WhatsApp API
    5. On success: update campaign_contacts (status=sent, wamid, sent_at)
    6. On failure: update campaign_contacts (status=failed, error_code)
  Check rate limits between batches
  If approaching tier limit: pause, notify
After all batches:
  Update campaign: status=sent, completed_at=now()
```

### 11.3 Rate Limit Handling

- Query `whatsapp_accounts.messaging_tier` for limit
- Track sent count in rolling 24hr window: `SELECT COUNT(DISTINCT contact_id) FROM campaign_contacts WHERE sent_at > now() - '24h'`
- If at 90% of limit: pause campaign, create notification
- Respect 80 MPS throughput: add ~12ms delay between sends
- If API returns 429: exponential backoff (1s, 2s, 4s)

### 11.4 Status Tracking

Webhook delivery statuses update `campaign_contacts`:
- `sent` → `delivered` → `read` → (optionally `replied` if contact responds)
- Database trigger on `campaign_contacts` updates aggregate counts on `campaigns` table
- Real-time analytics on campaign detail page

---

## 12. Template Management with Meta

### 12.1 Submission

Server action: `submitTemplate(templateId)`

1. Load template from database
2. Build Meta API payload:
```json
{
  "name": "order_confirmation",
  "category": "UTILITY",
  "language": "en_US",
  "components": [
    { "type": "HEADER", "format": "TEXT", "text": "Order Update" },
    { "type": "BODY", "text": "Hi {{1}}, your order {{2}} has shipped.", "example": { "body_text": [["John", "#ORD-1234"]] } },
    { "type": "FOOTER", "text": "Reply STOP to opt out" },
    { "type": "BUTTONS", "buttons": [{ "type": "QUICK_REPLY", "text": "Track Order" }] }
  ]
}
```
3. `POST https://graph.facebook.com/v21.0/{WABA_ID}/message_templates`
4. Store returned `id` as `wa_template_id`
5. Update status: `pending`, set `meta_submitted_at`

### 12.2 Approval Webhook

`message_template_status_update` webhook:
- Match by template name + language (or `wa_template_id`)
- Approved: status → `approved`, set `meta_reviewed_at`
- Rejected: status → `rejected`, store `rejection_reason`, set `meta_reviewed_at`
- Disabled: status → `disabled` (Meta policy enforcement)

### 12.3 Deletion

```
DELETE https://graph.facebook.com/v21.0/{WABA_ID}/message_templates?name={name}
```

Deletes all languages of a template. Also delete local record or mark as deleted.

---

## 13. Quality Monitoring

### 13.1 Quality Rating

Meta monitors per-phone quality based on:
- User block rate
- Spam reports
- Template rejection frequency

| Rating | Meaning | OctoPush Action |
|--------|---------|-----------------|
| GREEN | Healthy | Normal operation |
| YELLOW | Warning | Banner: "Quality declining — review content and frequency" |
| RED | Critical | Alert: "Messaging may be restricted — contact Meta support" |

### 13.2 Quality Update Webhook

`phone_number_quality_update` event:
- Update `whatsapp_accounts.quality_rating`
- Create notification for org admins
- Log in `activity_log`

### 13.3 Best Practices (Displayed in Settings)

- Get explicit opt-in before sending marketing messages
- Keep marketing frequency reasonable (no more than 2-3 per week per contact)
- Provide clear opt-out mechanism in every marketing template
- Respond to customer messages promptly within the 24hr window
- Monitor block rates (if >2%, review content strategy)

---

## 14. Security Requirements

### 14.1 Token Security

- Access tokens encrypted at rest using Supabase Vault (pgsodium extension)
- Encryption: `vault.create_secret(token, 'whatsapp_token_{org_id}')`
- Decryption: via `vault.decrypted_secrets` view (service role only)
- Tokens NEVER exposed to client-side code
- Used only in server actions and Edge Functions
- Token rotation: re-running Embedded Signup overwrites with new token

### 14.2 Webhook Security

- **HMAC-SHA256 validation** on every POST using Meta App Secret
- Timing-safe comparison to prevent timing attacks
- **Verify token** validated on GET handshake
- **Rate limiting**: 1,000 req/min on webhook endpoint
- **Raw payload logging**: audit trail in `webhook_logs`

### 14.3 Data Privacy

- Contact opt-in tracked with timestamp and source (Meta requirement)
- Marketing messages only to `opted_in` contacts
- Opt-out immediately stops campaign targeting
- Message content stored securely with org-level RLS isolation
- Webhook logs auto-purged after 90 days

---

## 15. Error Handling

### 15.1 WhatsApp API Errors

| HTTP Code | Meaning | OctoPush Handling |
|-----------|---------|-------------------|
| 400 | Bad request (invalid payload) | Log, show specific error to user, don't retry |
| 401 | Auth failure (invalid/expired token) | Log, alert: "Reconnect WhatsApp in Settings" |
| 404 | Resource not found | Log, don't retry |
| 429 | Rate limited | Exponential backoff: 1s, 2s, 4s (max 3 retries) |
| 500-503 | Meta server error | Retry with backoff (max 3 retries) |

### 15.2 Common WhatsApp Error Codes

| Code | Meaning | User Message |
|------|---------|--------------|
| 131030 | Recipient not on WhatsApp | "This number is not registered on WhatsApp" |
| 131047 | Re-engagement required (window expired) | "Send a template to re-engage this contact" |
| 131048 | Spam rate limit hit | "Slow down — too many messages to this contact" |
| 131051 | Unsupported message type | "This message type is not supported" |
| 132000 | Template not found | "Template not found on WhatsApp — resubmit" |
| 132012 | Template parameter mismatch | "Template variables don't match — check your values" |
| 133004 | Quality-based rate limit | "Messaging paused due to quality rating — check Settings" |
| 133015 | Too many template submissions | "Wait before submitting more templates" |

### 15.3 Retry Logic

```
attempt = 1
max_retries = 3
while attempt <= max_retries:
  response = call_whatsapp_api()
  if response.ok: break
  if response.status in [429, 500, 502, 503]:
    delay = min(2^attempt, 8) seconds
    wait(delay)
    attempt++
  else:
    log_error(response)
    break
```

---

## 16. Media Handling

### 16.1 Inbound Media

1. Webhook payload contains `media_id` (not the file itself)
2. Fetch media URL: `GET https://graph.facebook.com/v21.0/{media_id}` → returns `{ url: "..." }`
3. Download from URL (with auth header)
4. Upload to Supabase Storage: `media/{org_id}/conversations/{conversation_id}/{timestamp}_{filename}`
5. Store Storage path in `messages.content.media_url`
6. Generate thumbnail for images (client-side or via Edge Function)

### 16.2 Outbound Media

1. Agent uploads file in chat input
2. Client-side validation: type + size limits
3. Upload to Supabase Storage, get signed URL
4. Call WhatsApp API with media link:
```json
{
  "messaging_product": "whatsapp",
  "to": "...",
  "type": "image",
  "image": { "link": "https://...signed-url..." }
}
```
5. Store Storage path in message record

### 16.3 Storage Configuration

- Supabase Storage bucket: `media` (private)
- Path pattern: `{org_id}/conversations/{conversation_id}/{timestamp}_{filename}`
- RLS: org-level isolation via bucket policies
- Signed URLs: 1-hour expiry for client-side rendering
- Cleanup: orphaned media purged after 30 days (background job)

### 16.4 Size Limits (Enforced Client + Server)

| Type | Max Size | Formats |
|------|----------|---------|
| Image | 5 MB | JPEG, PNG |
| Video | 16 MB | MP4, 3GPP |
| Audio | 16 MB | AAC, MP4, MPEG, AMR, OGG |
| Document | 100 MB | PDF, DOCX, XLSX, PPTX, etc. |
| Sticker | 100 KB (static), 500 KB (animated) | WebP |
