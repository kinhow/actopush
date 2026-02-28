# OctoPush CRM — Supabase & Database PRD

**Version:** 1.0
**Date:** 2026-02-24
**Parent:** [Main PRD](./PRD-main.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Existing Schema](#2-existing-schema)
3. [Complete Schema — New Tables](#3-complete-schema--new-tables)
4. [Indexes](#4-indexes)
5. [Row Level Security (RLS)](#5-row-level-security-rls)
6. [Database Triggers and Functions](#6-database-triggers-and-functions)
7. [Supabase Edge Functions](#7-supabase-edge-functions)
8. [Supabase Realtime](#8-supabase-realtime)
9. [Supabase Storage](#9-supabase-storage)
10. [Supabase Vault (Token Encryption)](#10-supabase-vault-token-encryption)
11. [Server Actions Architecture](#11-server-actions-architecture)
12. [Data Flow Diagrams](#12-data-flow-diagrams)
13. [Migration Strategy](#13-migration-strategy)
14. [Performance Considerations](#14-performance-considerations)
15. [Backup and Data Retention](#15-backup-and-data-retention)

---

## 1. Overview

OctoPush uses **Supabase** as its backend platform:
- **PostgreSQL** — primary database for all application data
- **Auth** — user authentication (email/password + Google OAuth) — already implemented
- **Realtime** — live message and event subscriptions via WebSocket
- **Storage** — media file storage (WhatsApp images, videos, documents)
- **Edge Functions** — serverless functions for async processing (webhook, campaigns, flows)
- **Vault (pgsodium)** — encryption for WhatsApp access tokens

**Client usage patterns:**
- Server-side: `await createClient()` from `@/lib/supabase/server` (uses cookies)
- Client-side: `createBrowserClient()` from `@/lib/supabase/client`
- Auth checks: always `supabase.auth.getUser()` (never `getSession`)
- All queries go through the authenticated client — RLS enforced

---

## 2. Existing Schema

These tables already exist and are in use:

```sql
-- Users (managed by Supabase Auth + custom table)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT
);

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- Organization Memberships (user ↔ org relationship)
CREATE TABLE org_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  org_id UUID NOT NULL REFERENCES organizations(id)
);
```

**Existing RPC:** `complete_onboarding(full_name, org_name)` — creates user profile + org + membership in a transaction.

**Note:** The existing schema does NOT have `created_at`, `updated_at`, or role fields on these tables. Adding those is recommended in the first migration but is not blocking.

---

## 3. Complete Schema — New Tables

### 3.1 Contacts

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  wa_id TEXT,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  company TEXT,
  job_title TEXT,
  address JSONB DEFAULT '{}',
  notes TEXT,
  source TEXT DEFAULT 'manual',
  opt_in_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (opt_in_status IN ('opted_in', 'opted_out', 'pending')),
  opt_in_at TIMESTAMPTZ,
  opt_in_source TEXT,
  last_message_at TIMESTAMPTZ,
  custom_fields JSONB DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, phone)
);
```

### 3.2 Tags

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, name)
);
```

### 3.3 Contact Tags

```sql
CREATE TABLE contact_tags (
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (contact_id, tag_id)
);
```

### 3.4 WhatsApp Accounts

```sql
CREATE TABLE whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  waba_id TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  display_phone TEXT,
  business_name TEXT,
  access_token_encrypted TEXT NOT NULL,
  quality_rating TEXT DEFAULT 'GREEN',
  messaging_tier TEXT DEFAULT 'TIER_0',
  webhook_verify_token TEXT NOT NULL,
  webhook_verified BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disconnected', 'restricted')),
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.5 Conversations

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  wa_conversation_id TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'pending', 'resolved', 'expired')),
  assigned_to UUID REFERENCES users(id),
  is_bot_active BOOLEAN DEFAULT false,
  active_flow_id UUID,
  window_expires_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.6 Messages

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  wamid TEXT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  type TEXT NOT NULL DEFAULT 'text'
    CHECK (type IN (
      'text', 'image', 'video', 'audio', 'document',
      'location', 'contact', 'interactive', 'template',
      'reaction', 'sticker'
    )),
  content JSONB NOT NULL DEFAULT '{}',
  template_id UUID,
  campaign_id UUID,
  flow_execution_id UUID,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_code TEXT,
  error_message TEXT,
  sent_by UUID REFERENCES users(id),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**`content` JSONB structure by message type:**

| Type | Content Structure |
|------|-------------------|
| text | `{ "body": "Hello world" }` |
| image | `{ "media_url": "path/to/file", "caption": "..." , "mime_type": "image/jpeg" }` |
| video | `{ "media_url": "path/to/file", "caption": "...", "mime_type": "video/mp4" }` |
| audio | `{ "media_url": "path/to/file", "mime_type": "audio/ogg" }` |
| document | `{ "media_url": "path/to/file", "filename": "invoice.pdf", "mime_type": "application/pdf" }` |
| location | `{ "latitude": 37.7749, "longitude": -122.4194, "name": "Office", "address": "123 Main St" }` |
| contact | `{ "name": "John", "phones": ["+15551234567"], "emails": ["john@example.com"] }` |
| interactive | `{ "interactive_type": "button", "body": "...", "buttons": [...], "selected": { "id": "...", "title": "..." } }` |
| template | `{ "template_name": "order_confirm", "variables": {"1": "John", "2": "#ORD-123"} }` |
| reaction | `{ "emoji": "👍", "reacted_message_id": "wamid.xxx" }` |
| sticker | `{ "media_url": "path/to/sticker.webp" }` |

### 3.7 Templates

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wa_template_id TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('marketing', 'utility', 'authentication')),
  language TEXT NOT NULL DEFAULT 'en_US',
  header_type TEXT DEFAULT 'none'
    CHECK (header_type IN ('none', 'text', 'image', 'video', 'document')),
  header_content TEXT,
  body TEXT NOT NULL,
  footer TEXT,
  buttons JSONB DEFAULT '[]',
  variable_count INTEGER DEFAULT 0,
  sample_values JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'disabled')),
  rejection_reason TEXT,
  meta_submitted_at TIMESTAMPTZ,
  meta_reviewed_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, name, language)
);
```

### 3.8 Campaigns

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID NOT NULL REFERENCES templates(id),
  template_variables JSONB DEFAULT '{}',
  segment_id UUID REFERENCES segments(id),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.9 Campaign Contacts

```sql
CREATE TABLE campaign_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  message_wamid TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'replied', 'failed')),
  error_code TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  UNIQUE(campaign_id, contact_id)
);
```

### 3.10 Segments

```sql
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'dynamic'
    CHECK (type IN ('dynamic', 'static')),
  rules JSONB DEFAULT '{}',
  contact_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.11 Static Segment Members

```sql
CREATE TABLE segment_contacts (
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (segment_id, contact_id)
);
```

### 3.12 Automation Flows

```sql
CREATE TABLE automation_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  definition JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.13 Flow Executions

```sql
CREATE TABLE flow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES automation_flows(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'paused', 'cancelled')),
  current_node_id TEXT,
  execution_log JSONB DEFAULT '[]',
  context JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);
```

### 3.14 Webhook Logs

```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
```

### 3.15 Canned Responses

```sql
CREATE TABLE canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  shortcut TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.16 Activity Log

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  contact_id UUID REFERENCES contacts(id),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**`entity_type` values:** `contact`, `conversation`, `message`, `campaign`, `template`, `flow`, `segment`, `whatsapp_account`

**`action` values by entity_type:**

| Entity Type | Actions |
|-------------|---------|
| contact | `created`, `updated`, `deleted`, `tag_added`, `tag_removed`, `opt_in_changed`, `note_added` |
| conversation | `created`, `assigned`, `resolved`, `reopened`, `bot_takeover`, `bot_returned` |
| message | `sent`, `received`, `failed` |
| campaign | `created`, `scheduled`, `started`, `completed`, `paused`, `cancelled` |
| template | `created`, `submitted`, `approved`, `rejected`, `deleted` |
| flow | `created`, `activated`, `deactivated`, `archived` |
| segment | `created`, `updated`, `deleted` |

---

## 4. Indexes

```sql
-- ============================================================
-- CONTACTS
-- ============================================================
CREATE INDEX idx_contacts_org_phone ON contacts(org_id, phone);
CREATE INDEX idx_contacts_org_last_message ON contacts(org_id, last_message_at DESC);
CREATE INDEX idx_contacts_org_name ON contacts(org_id, full_name);
CREATE INDEX idx_contacts_org_source ON contacts(org_id, source);
CREATE INDEX idx_contacts_org_opt_in ON contacts(org_id, opt_in_status);
CREATE INDEX idx_contacts_org_deleted ON contacts(org_id) WHERE deleted_at IS NULL;
-- Full-text search index
CREATE INDEX idx_contacts_search ON contacts USING GIN (
  to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(email, '') || ' ' || coalesce(company, ''))
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE INDEX idx_conversations_org_status ON conversations(org_id, status);
CREATE INDEX idx_conversations_org_assigned ON conversations(org_id, assigned_to);
CREATE INDEX idx_conversations_org_last_message ON conversations(org_id, last_message_at DESC);
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_org_window ON conversations(org_id, window_expires_at)
  WHERE status = 'open';

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_wamid ON messages(wamid) WHERE wamid IS NOT NULL;
CREATE INDEX idx_messages_org_created ON messages(org_id, created_at);
CREATE INDEX idx_messages_campaign ON messages(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_messages_flow_execution ON messages(flow_execution_id) WHERE flow_execution_id IS NOT NULL;

-- ============================================================
-- TEMPLATES
-- ============================================================
CREATE INDEX idx_templates_org_status ON templates(org_id, status);
CREATE INDEX idx_templates_wa_id ON templates(wa_template_id) WHERE wa_template_id IS NOT NULL;

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE INDEX idx_campaigns_org_status ON campaigns(org_id, status);
CREATE INDEX idx_campaigns_scheduled ON campaigns(scheduled_at)
  WHERE status = 'scheduled';

-- ============================================================
-- CAMPAIGN CONTACTS
-- ============================================================
CREATE INDEX idx_campaign_contacts_campaign_status ON campaign_contacts(campaign_id, status);
CREATE INDEX idx_campaign_contacts_contact ON campaign_contacts(contact_id);
CREATE INDEX idx_campaign_contacts_wamid ON campaign_contacts(message_wamid)
  WHERE message_wamid IS NOT NULL;

-- ============================================================
-- FLOW EXECUTIONS
-- ============================================================
CREATE INDEX idx_flow_executions_flow_status ON flow_executions(flow_id, status);
CREATE INDEX idx_flow_executions_contact_status ON flow_executions(contact_id, status);
CREATE INDEX idx_flow_executions_running ON flow_executions(status, started_at)
  WHERE status IN ('running', 'paused');

-- ============================================================
-- WEBHOOK LOGS
-- ============================================================
CREATE INDEX idx_webhook_logs_unprocessed ON webhook_logs(received_at)
  WHERE processed = false;
CREATE INDEX idx_webhook_logs_org ON webhook_logs(org_id, received_at DESC);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
CREATE INDEX idx_activity_log_org_created ON activity_log(org_id, created_at DESC);
CREATE INDEX idx_activity_log_contact ON activity_log(contact_id, created_at DESC);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- ============================================================
-- CONTACT TAGS
-- ============================================================
CREATE INDEX idx_contact_tags_tag ON contact_tags(tag_id);
```

---

## 5. Row Level Security (RLS)

### 5.1 Standard Org Isolation Policy

Applied to most tables:

```sql
-- Enable RLS
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- Users can only access data for orgs they belong to
CREATE POLICY "org_isolation" ON {table_name}
  FOR ALL
  TO authenticated
  USING (
    (select auth.uid()) IS NOT NULL
    AND org_id IN (
      SELECT om.org_id
      FROM org_memberships om
      WHERE om.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT om.org_id
      FROM org_memberships om
      WHERE om.user_id = (select auth.uid())
    )
  );
```

**Apply to:** contacts, tags, conversations, messages, templates, campaigns, campaign_contacts (via campaign.org_id), segments, segment_contacts (via segment.org_id), automation_flows, flow_executions, canned_responses, activity_log, whatsapp_accounts

### 5.2 Join Table Policies

For tables without direct `org_id`:

**contact_tags:**
```sql
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON contact_tags
  FOR ALL
  TO authenticated
  USING (
    (select auth.uid()) IS NOT NULL
    AND contact_id IN (
      SELECT c.id FROM contacts c
      WHERE c.org_id IN (
        SELECT om.org_id FROM org_memberships om WHERE om.user_id = (select auth.uid())
      )
    )
  );
```

**segment_contacts:**
```sql
ALTER TABLE segment_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON segment_contacts
  FOR ALL
  TO authenticated
  USING (
    (select auth.uid()) IS NOT NULL
    AND segment_id IN (
      SELECT s.id FROM segments s
      WHERE s.org_id IN (
        SELECT om.org_id FROM org_memberships om WHERE om.user_id = (select auth.uid())
      )
    )
  );
```

### 5.3 Webhook Logs — Service Role Only

```sql
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their org's logs
CREATE POLICY "org_read" ON webhook_logs
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT om.org_id FROM org_memberships om WHERE om.user_id = (select auth.uid())
    )
  );

-- Only service role can insert (webhook handler uses service role)
-- No INSERT policy for authenticated role — inserts happen via service role
```

### 5.4 RLS Performance Optimizations

The `org_memberships` subquery runs on every row access. The following optimizations are applied per [Supabase RLS best practices](https://supabase.com/docs/guides/database/postgres/row-level-security):

**1. `TO authenticated` on all policies** — Prevents policy evaluation for anon and service roles. Without this, Postgres evaluates policies even for roles that will never match, adding unnecessary overhead (~99.78% improvement measured by Supabase).

**2. `(select auth.uid())` wrapper** — Wrapping `auth.uid()` in a subselect (e.g., `WHERE om.user_id = (select auth.uid())`) triggers PostgreSQL query plan caching. The bare function call `auth.uid()` is re-evaluated per row; the `(select ...)` form is evaluated once and cached (~94-99.99% improvement).

**3. Explicit null check** — `(select auth.uid()) IS NOT NULL` in the USING clause prevents silent failures when the JWT is missing or invalid. Without this, `auth.uid()` returns `null`, and the `IN` subquery silently returns no rows — correct behavior, but the explicit check fails fast and makes intent clear.

**4. Query-side filters** — Always include explicit WHERE conditions in application queries that match the RLS policy logic (e.g., `.eq('org_id', orgId)` in Supabase client calls). This allows PostgreSQL to use indexes efficiently rather than relying on RLS to filter after a full table scan.

**Additional considerations:**
- `org_memberships` must have a composite index: `CREATE INDEX idx_org_memberships_user ON org_memberships(user_id, org_id)`
- For high-frequency tables (messages, activity_log), consider a `SECURITY DEFINER` function for the org lookup to further improve query plan caching and avoid N+1 subquery overhead
- Monitor query plans with `EXPLAIN ANALYZE` on messages and conversations tables under load

---

## 6. Database Triggers and Functions

### 6.1 Auto-update `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER set_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON automation_flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON canned_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON whatsapp_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 6.2 Campaign Count Aggregation

```sql
CREATE OR REPLACE FUNCTION update_campaign_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaigns SET
    sent_count = (
      SELECT COUNT(*) FROM campaign_contacts
      WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
      AND status IN ('sent', 'delivered', 'read', 'replied')
    ),
    delivered_count = (
      SELECT COUNT(*) FROM campaign_contacts
      WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
      AND status IN ('delivered', 'read', 'replied')
    ),
    read_count = (
      SELECT COUNT(*) FROM campaign_contacts
      WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
      AND status IN ('read', 'replied')
    ),
    replied_count = (
      SELECT COUNT(*) FROM campaign_contacts
      WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
      AND status = 'replied'
    ),
    failed_count = (
      SELECT COUNT(*) FROM campaign_contacts
      WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
      AND status = 'failed'
    )
  WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_counts_on_status_change
  AFTER INSERT OR UPDATE OF status ON campaign_contacts
  FOR EACH ROW EXECUTE FUNCTION update_campaign_counts();
```

### 6.3 Template Usage Counter

```sql
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NOT NULL AND NEW.direction = 'outbound' THEN
    UPDATE templates SET usage_count = usage_count + 1
    WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_template_usage_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION increment_template_usage();
```

### 6.4 Flow Execution Counter

```sql
CREATE OR REPLACE FUNCTION increment_flow_execution_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE automation_flows SET
    execution_count = execution_count + 1,
    last_executed_at = now()
  WHERE id = NEW.flow_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_flow_execution_on_start
  AFTER INSERT ON flow_executions
  FOR EACH ROW EXECUTE FUNCTION increment_flow_execution_count();
```

### 6.5 Conversation Window Expiry Check

```sql
-- Run via pg_cron every 5 minutes
-- Marks conversations as 'expired' when window closes and no recent activity
CREATE OR REPLACE FUNCTION check_expired_conversations()
RETURNS void AS $$
BEGIN
  UPDATE conversations
  SET status = 'expired', updated_at = now()
  WHERE status = 'open'
  AND window_expires_at IS NOT NULL
  AND window_expires_at < now()
  AND last_message_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;
```

---

## 7. Supabase Edge Functions

### 7.1 `process-webhook`

**Purpose:** Async processing of WhatsApp webhook payloads

**Trigger:** Called from the Next.js webhook route handler via `supabase.functions.invoke()`

**Input:**
```json
{
  "webhook_log_id": "uuid",
  "payload": { ... }
}
```

**Logic:**
1. Parse payload, identify event type
2. Route to handler: inbound message, status update, template status, quality update
3. Execute database operations (upsert contact, insert message, etc.)
4. Mark `webhook_logs.processed = true`
5. On error: set `webhook_logs.processing_error`

**Timeout:** 30 seconds

### 7.2 `send-campaign`

**Purpose:** Bulk WhatsApp message sending for campaigns

**Trigger:** Called from `sendCampaign` server action

**Input:**
```json
{
  "campaign_id": "uuid",
  "org_id": "uuid"
}
```

**Logic:**
1. Load campaign, template, and resolve audience
2. Create campaign_contacts records
3. Send in batches of 50:
   - Resolve variables per contact
   - Call WhatsApp API
   - Update campaign_contacts per message
   - Track rate limits
4. Update campaign status on completion

**Timeout:** 300 seconds (5 minutes). For large campaigns, uses chunked invocations.

### 7.3 `execute-flow`

**Purpose:** Automation flow execution engine

**Trigger:** Called from `process-webhook` (trigger match), `schedule-runner` (schedules/delays), or server action (manual)

**Input:**
```json
{
  "type": "trigger | resume",
  "flow_id": "uuid",
  "contact_id": "uuid",
  "conversation_id": "uuid | null",
  "execution_id": "uuid (resume only)",
  "trigger_data": { ... }
}
```

**Logic:** See [PRD-automation-flows.md](./PRD-automation-flows.md#flow-execution-engine) for full details.

**Timeout:** 150 seconds. Delay nodes save state and schedule resume.

### 7.4 `schedule-runner`

**Purpose:** Periodic job runner for scheduled triggers and delay resumptions

**Trigger:** `pg_cron` every 1 minute

**Logic:**
1. Check for scheduled flow triggers due to fire
2. Check for flow executions with delays due to resume
3. Check for campaigns scheduled to send
4. Check for stale executions to cancel (>30 days)
5. Run `check_expired_conversations()` every 5 minutes
6. For each: invoke the appropriate Edge Function

**Configuration:**
```sql
SELECT cron.schedule(
  'schedule-runner',
  '* * * * *',  -- every minute
  $$SELECT net.http_post(
    url := 'https://{PROJECT_REF}.supabase.co/functions/v1/schedule-runner',
    headers := '{"Authorization": "Bearer {SERVICE_ROLE_KEY}"}'::jsonb
  )$$
);
```

---

## 8. Supabase Realtime

### 8.1 Subscriptions

| Table | Event | Channel | Filter | Client Consumer |
|-------|-------|---------|--------|-----------------|
| `messages` | INSERT | `messages:org_id=eq.{orgId}` | org_id | Conversations inbox — new messages |
| `messages` | UPDATE | `messages:org_id=eq.{orgId}` | org_id | Conversations inbox — delivery status |
| `conversations` | INSERT | `conversations:org_id=eq.{orgId}` | org_id | Conversation list — new conversations |
| `conversations` | UPDATE | `conversations:org_id=eq.{orgId}` | org_id | Conversation list — status, assignment, unread |
| `activity_log` | INSERT | `activity_log:org_id=eq.{orgId}` | org_id | Dashboard activity feed |
| `templates` | UPDATE | `templates:org_id=eq.{orgId}` | org_id | Template list — approval status |

### 8.2 Client Implementation Pattern

```typescript
// src/features/conversations/hooks/useConversationRealtime.ts
"use client"

import { useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Message } from '../types'

export function useMessageRealtime(orgId: string, onNewMessage: (msg: Message) => void) {
  useEffect(() => {
    const supabase = createBrowserClient()

    const channel = supabase
      .channel(`messages:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          onNewMessage(payload.new as Message)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId, onNewMessage])
}
```

### 8.3 Realtime Configuration

Enable Realtime on these tables in Supabase Dashboard or via migration:

```sql
ALTER publication supabase_realtime ADD TABLE messages;
ALTER publication supabase_realtime ADD TABLE conversations;
ALTER publication supabase_realtime ADD TABLE activity_log;
ALTER publication supabase_realtime ADD TABLE templates;
```

### 8.4 Connection Management

- Auto-reconnect with exponential backoff (built into Supabase client)
- Visual indicator: "Connected" / "Reconnecting..." in conversation header
- On reconnect: fetch messages since last received timestamp to fill gaps
- Fallback: if disconnected >30 seconds, poll every 5 seconds until reconnected

---

## 9. Supabase Storage

### 9.1 Bucket Configuration

```sql
-- Create private media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  false,  -- private, requires signed URLs
  104857600,  -- 100 MB max
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/3gpp',
    'audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/amr', 'audio/ogg',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
);
```

### 9.2 Storage RLS Policies

```sql
-- Users can read media for their org
CREATE POLICY "org_read_media" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] IN (
      SELECT om.org_id::text FROM org_memberships om WHERE om.user_id = (select auth.uid())
    )
  );

-- Users can upload media for their org
CREATE POLICY "org_upload_media" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] IN (
      SELECT om.org_id::text FROM org_memberships om WHERE om.user_id = (select auth.uid())
    )
  );
```

### 9.3 File Path Convention

```
media/
└── {org_id}/
    └── conversations/
        └── {conversation_id}/
            ├── 1708790400000_photo.jpg
            ├── 1708790500000_document.pdf
            └── 1708790600000_voice.ogg
```

Format: `{timestamp_ms}_{original_filename}`

### 9.4 Signed URLs

- Client-side rendering uses signed URLs (1-hour expiry)
- Generate via: `supabase.storage.from('media').createSignedUrl(path, 3600)`
- Cache signed URLs client-side until 50 minutes (refresh before expiry)

---

## 10. Supabase Vault (Token Encryption)

### 10.1 Setup

Enable the `pgsodium` and `vault` extensions:

```sql
CREATE EXTENSION IF NOT EXISTS pgsodium;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
```

### 10.2 Storing Encrypted Tokens

When a WhatsApp account is connected:

```sql
-- Create a secret in the vault
SELECT vault.create_secret(
  'the-actual-access-token-value',
  'whatsapp_token_' || '{org_id}',
  'WhatsApp access token for org {org_id}'
);
```

Store the vault secret ID in `whatsapp_accounts.access_token_encrypted`.

### 10.3 Retrieving Decrypted Tokens

Only via service role (in Edge Functions or server actions with service role client):

```sql
SELECT decrypted_secret
FROM vault.decrypted_secrets
WHERE name = 'whatsapp_token_' || '{org_id}';
```

### 10.4 Token Rotation

On reconnect (new Embedded Signup):
1. Delete old secret: `SELECT vault.delete_secret(old_secret_id)`
2. Create new secret with updated token
3. Update `whatsapp_accounts.access_token_encrypted` with new secret ID

---

## 11. Server Actions Architecture

### 11.1 Pattern

All server actions follow this structure:

```typescript
// src/features/{module}/actions/{action-name}.ts
"use server"

import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  // Zod validation schema
})

export async function actionName(prevState: ActionState, formData: FormData): Promise<ActionState> {
  // 1. Parse and validate input
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  // 2. Create authenticated Supabase client
  const supabase = await createClient()

  // 3. Verify auth (RLS handles org isolation, but explicit check for clarity)
  // NOTE: Server actions use getUser() (not getClaims()) because they need the
  // full user object (user.id) for database operations. The proxy uses getClaims()
  // for fast JWT validation. See Section 11.2 for the auth strategy matrix.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, errors: { _form: ['Not authenticated'] } }
  }

  // 4. Execute database operation
  const { data, error } = await supabase
    .from('table')
    .insert({ ... })
    .select()
    .single()

  if (error) {
    return { success: false, errors: { _form: [error.message] } }
  }

  // 5. Revalidate cache
  revalidatePath('/path')

  // 6. Return success
  return { success: true, data }
}
```

### 11.2 Auth Validation Strategy

Different contexts require different Supabase auth methods. The key distinction: `getClaims()` validates the JWT locally against published public keys (fast, no network request for asymmetric keys), while `getUser()` makes a network request to the Supabase Auth server (slower, but returns the full user object).

| Context | Method | Reason |
|---------|--------|--------|
| **Proxy** (`src/proxy.ts`) | `supabase.auth.getClaims()` | Fast local JWT validation via JWKS. Only needs to confirm user is authenticated + refresh tokens. No user object needed. |
| **Server Components** | `getUser()` via cached wrapper (`src/lib/supabase/queries.ts`) | Needs full `user` object for UI rendering. Cached per-request via `React.cache()` — deduplicates across Sidebar, TopBar, etc. |
| **Server Actions** | `supabase.auth.getUser()` | Needs `user.id` for database operations. RLS handles org isolation, but explicit check provides defense-in-depth. |
| **Client Components** | `supabase.auth.getSession()` | Client-side only. Fast, reads from local storage. Acceptable for UI state (not for authorization decisions). |

**Important:** Never use `getSession()` server-side — it reads from cookies/storage without validating the JWT, so the token could be tampered with. Always use `getClaims()` or `getUser()` on the server.

### 11.3 Action State Type

```typescript
// src/types/action-state.ts
export type ActionState = {
  success: boolean
  errors?: Record<string, string[]>
  data?: unknown
}
```

### 11.4 Complete Server Actions List

| Module | Action | Purpose |
|--------|--------|---------|
| **contacts** | `createContact` | Create new contact with validation |
| | `updateContact` | Update contact fields |
| | `deleteContact` | Soft delete (set deleted_at) |
| | `importContacts` | Parse CSV + bulk insert |
| | `exportContacts` | Generate CSV download |
| | `createTag` | Create org-scoped tag |
| | `deleteTag` | Delete tag + remove from contacts |
| | `addTagToContact` | Add tag to contact |
| | `removeTagFromContact` | Remove tag from contact |
| **conversations** | `sendMessage` | Send text message via WhatsApp API |
| | `sendTemplate` | Send template via WhatsApp API |
| | `sendMedia` | Upload + send media via WhatsApp API |
| | `assignConversation` | Set assigned_to on conversation |
| | `resolveConversation` | Set status to resolved |
| | `markAsRead` | Reset unread_count + call WhatsApp mark-read |
| | `createCannedResponse` | Create canned response |
| | `updateCannedResponse` | Update canned response |
| | `deleteCannedResponse` | Delete canned response |
| **campaigns** | `createCampaign` | Create campaign draft |
| | `updateCampaign` | Update campaign settings |
| | `scheduleCampaign` | Set scheduled_at + status=scheduled |
| | `sendCampaign` | Trigger send-campaign Edge Function |
| | `pauseCampaign` | Set status=paused |
| | `cancelCampaign` | Set status=cancelled |
| **templates** | `createTemplate` | Create template draft |
| | `updateTemplate` | Update template content |
| | `submitTemplate` | Submit to Meta for approval |
| | `deleteTemplate` | Delete from Meta + local |
| **flows** | `createFlow` | Create flow with definition |
| | `updateFlow` | Update flow definition |
| | `activateFlow` | Validate + set status=active |
| | `deactivateFlow` | Set status=paused |
| | `deleteFlow` | Set status=archived |
| | `triggerFlowManually` | Manually trigger for a contact |
| **segments** | `createSegment` | Create with rules |
| | `updateSegment` | Update rules + recalculate |
| | `deleteSegment` | Delete segment |
| | `calculateSegmentCount` | Count matching contacts |
| **settings** | `connectWhatsApp` | Store tokens + setup webhook |
| | `disconnectWhatsApp` | Revoke + delete account |

---

## 12. Data Flow Diagrams

### 12.1 Inbound WhatsApp Message

```
WhatsApp Cloud API
  │
  ▼
POST /api/whatsapp/webhook (Next.js Route Handler)
  │
  ├─→ Validate X-Hub-Signature-256
  ├─→ Return HTTP 200
  ├─→ INSERT webhook_logs (raw payload)
  │
  ▼
process-webhook Edge Function
  │
  ├─→ Lookup org: whatsapp_accounts WHERE phone_number_id = ?
  ├─→ UPSERT contacts WHERE (org_id, phone)
  ├─→ SELECT/INSERT conversations WHERE (org_id, contact_id)
  │     UPDATE: window_expires_at = now() + 24h, last_message_at, unread_count++
  ├─→ INSERT messages (direction: inbound)
  ├─→ UPDATE contacts SET last_message_at
  ├─→ INSERT activity_log
  │
  ├─→ Check automation_flows WHERE status = 'active' AND trigger matches
  │     └─→ Invoke execute-flow Edge Function
  │
  └─→ Supabase Realtime broadcasts:
        ├─→ messages INSERT → Conversations UI
        ├─→ conversations UPDATE → Conversation list
        └─→ activity_log INSERT → Dashboard feed
```

### 12.2 Outbound Message (Agent)

```
Agent submits message in Conversations UI
  │
  ▼
sendMessage Server Action
  │
  ├─→ auth.getUser() → verify authenticated
  ├─→ SELECT conversation → verify window_expires_at > now()
  ├─→ SELECT whatsapp_accounts → decrypt access_token
  │
  ├─→ POST https://graph.facebook.com/v21.0/{phone_number_id}/messages
  │     Response: { messages: [{ id: "wamid.xxx" }] }
  │
  ├─→ INSERT messages (direction: outbound, status: sent, wamid)
  ├─→ UPDATE conversations (last_message_at, last_message_preview)
  ├─→ INSERT activity_log
  │
  └─→ Return success to client
        │
        ▼
      Supabase Realtime → UI updates with new message bubble

  ... later ...

  Webhook receives status update (delivered/read)
    → UPDATE messages SET status, delivered_at/read_at
    → Realtime → UI updates status icon
```

### 12.3 Campaign Send

```
User clicks "Send Campaign"
  │
  ▼
sendCampaign Server Action
  │
  ├─→ Resolve audience (segment query OR manual list)
  ├─→ Filter: opt_in_status = 'opted_in' AND phone IS NOT NULL
  ├─→ INSERT campaign_contacts (status: pending)
  ├─→ UPDATE campaigns (total_recipients, status: sending, started_at)
  │
  └─→ Invoke send-campaign Edge Function
        │
        ▼
      For batch in batches(contacts, 50):
        For contact in batch:
          ├─→ Resolve template variables
          ├─→ POST WhatsApp API (send template)
          ├─→ UPDATE campaign_contacts (status: sent, wamid, sent_at)
          └─→ On error: UPDATE campaign_contacts (status: failed, error_code)
        Check rate limits → throttle if needed
        │
        ▼
      UPDATE campaigns (status: sent, completed_at)

  ... ongoing ...

  Webhooks update campaign_contacts status
    → Trigger: update_campaign_counts
    → campaigns aggregate counts updated
    → Realtime → Campaign detail page updates
```

---

## 13. Migration Strategy

### 13.1 Migration Files

Supabase migrations live in `supabase/migrations/` and are applied via `supabase db push` or `supabase migration up`.

**Recommended migration order:**

| Order | Migration File | Contents |
|-------|---------------|----------|
| 1 | `001_contacts_and_tags.sql` | contacts, tags, contact_tags tables + indexes + RLS |
| 2 | `002_whatsapp_accounts.sql` | whatsapp_accounts + vault setup + RLS |
| 3 | `003_conversations_and_messages.sql` | conversations, messages tables + indexes + RLS + Realtime |
| 4 | `004_templates.sql` | templates table + indexes + RLS + usage trigger |
| 5 | `005_campaigns.sql` | campaigns, campaign_contacts + indexes + RLS + count trigger |
| 6 | `006_segments.sql` | segments, segment_contacts + indexes + RLS |
| 7 | `007_automation_flows.sql` | automation_flows, flow_executions + indexes + RLS |
| 8 | `008_supporting_tables.sql` | webhook_logs, canned_responses, activity_log + indexes + RLS |
| 9 | `009_storage_and_cron.sql` | Storage bucket, storage policies, pg_cron schedules |
| 10 | `010_triggers_and_functions.sql` | All triggers and helper functions |

### 13.2 Phasing

- **Phase 1 (MVP):** Migrations 1-5, 8-10
- **Phase 2 (Campaigns):** Migration 6 (segments already needed for campaigns)
- **Phase 3 (Automation):** Migration 7

All migrations can be applied upfront since tables without data don't impact performance.

---

## 14. Performance Considerations

### 14.1 Query Optimization

| Query | Optimization |
|-------|-------------|
| Contact search | GIN index on tsvector for full-text search; fallback to `ilike` for simple queries |
| Conversation list | Composite index on `(org_id, last_message_at DESC)`; limit to 25 per page |
| Message history | Index on `(conversation_id, created_at)`; paginate with cursor (last message created_at) |
| Dashboard metrics | Use `cache()` wrapped queries with 60-second revalidation; aggregate queries avoid full table scans |
| Segment calculation | Dynamic segments translate rules to SQL WHERE; use contact indexes; add EXPLAIN ANALYZE monitoring |
| Campaign analytics | Pre-aggregated counts on campaigns table via trigger; avoid COUNT(*) on campaign_contacts at read time |

### 14.2 Connection Pooling

- Supabase provides PgBouncer for connection pooling (enabled by default)
- Server actions use the pooled connection string
- Edge Functions use the pooled connection string
- Realtime uses its own connection pool

### 14.3 Caching Strategy

| Data | Cache Strategy | TTL |
|------|---------------|-----|
| Dashboard metrics | `cache()` in Server Component | 60 seconds (revalidated by server actions) |
| Contact list | No cache (paginated, always fresh) | — |
| Conversation messages | Client-side cache + Realtime for new | Until page reload |
| Template list | `cache()` in Server Component | Revalidated on template CRUD |
| Segment count | Stored in `segments.contact_count` | Recalculated on segment use |

### 14.4 Large Table Management

For tables that grow unbounded (messages, webhook_logs, activity_log):

- **Messages:** Partition by `created_at` (monthly) when table exceeds 10M rows
- **Webhook logs:** Auto-purge after 90 days via `pg_cron`
- **Activity log:** Auto-purge after 1 year via `pg_cron`
- **Flow executions:** Archive completed executions older than 90 days

```sql
-- Purge old webhook logs (run daily via pg_cron)
SELECT cron.schedule(
  'purge-webhook-logs',
  '0 3 * * *',  -- 3 AM daily
  $$DELETE FROM webhook_logs WHERE received_at < now() - interval '90 days'$$
);

-- Purge old activity logs (run daily)
SELECT cron.schedule(
  'purge-activity-logs',
  '0 4 * * *',  -- 4 AM daily
  $$DELETE FROM activity_log WHERE created_at < now() - interval '1 year'$$
);
```

---

## 15. Backup and Data Retention

### 15.1 Supabase Backups

- Supabase Pro plan: daily automated backups with 7-day retention
- Point-in-time recovery (PITR) available on Pro plan
- For critical data: also use `pg_dump` via cron for offsite backup

### 15.2 Data Retention Policy

| Data | Retention | Rationale |
|------|-----------|-----------|
| Contacts | Until deleted by user | Core CRM data |
| Messages | 1 year (configurable) | Communication history |
| Conversations | Until resolved + 1 year | Active + historical reference |
| Webhook logs | 90 days | Debugging + replay |
| Activity log | 1 year | Audit trail |
| Flow executions | 90 days (completed), indefinite (active) | Debugging + analytics |
| Campaign contacts | 1 year | Campaign analytics |
| Soft-deleted contacts | 30 days, then hard delete | Recovery period |

### 15.3 GDPR Data Deletion

When a contact requests data deletion:
1. Soft delete contact (`deleted_at = now()`)
2. After 30-day grace period (or immediate on explicit request):
   - Hard delete from `contacts` (cascades to `contact_tags`)
   - Delete related `messages` (or anonymize: replace content with "[deleted]")
   - Delete from `campaign_contacts`
   - Delete from `flow_executions`
   - Delete from `activity_log` where `contact_id` matches
   - Delete media files from Storage
3. Log deletion in `activity_log` (without PII): "Contact deleted per GDPR request"
