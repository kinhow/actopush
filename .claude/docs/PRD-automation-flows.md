# OctoPush CRM — Automation Flows PRD (React Flow)

**Version:** 1.0
**Date:** 2026-02-24
**Parent:** [Main PRD](./PRD-main.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Choice — React Flow](#2-technology-choice--react-flow)
3. [Visual Flow Builder](#3-visual-flow-builder)
4. [Node Types — Triggers](#4-node-types--triggers)
5. [Node Types — Actions](#5-node-types--actions)
6. [Node Visual Design System](#6-node-visual-design-system)
7. [Flow Definition Storage Format](#7-flow-definition-storage-format)
8. [Flow Execution Engine](#8-flow-execution-engine)
9. [Bot-to-Agent Handoff](#9-bot-to-agent-handoff)
10. [Pre-built Flow Templates](#10-pre-built-flow-templates)
11. [Flow Analytics](#11-flow-analytics)
12. [Flow Execution Logs](#12-flow-execution-logs)
13. [Data Model](#13-data-model)
14. [UI Pages and Components](#14-ui-pages-and-components)
15. [Technical Architecture](#15-technical-architecture)
16. [Edge Cases and Constraints](#16-edge-cases-and-constraints)

---

## 1. Overview

Automation Flows allow OctoPush users to build visual, no-code workflows that automate WhatsApp conversations. Flows trigger on events (inbound messages, schedules, CRM changes), execute a sequence of actions (send messages, tag contacts, assign agents), and handle branching logic — all connected to the **real WhatsApp API**, not mocked data.

**Key principles:**
- No-code: business users build flows with drag-and-drop, no programming
- Real messaging: every Send node calls the WhatsApp Cloud API
- Stateful: flows track per-contact execution state, supporting delays and pauses
- Observable: every execution is logged step-by-step for debugging

---

## 2. Technology Choice — React Flow

**Library:** `@xyflow/react` (React Flow v12+)

**Why React Flow:**
- Purpose-built for node-based editors in React
- Excellent performance (virtualizes nodes, handles 1000+ nodes)
- Built-in: zoom, pan, minimap, controls, selection, keyboard shortcuts
- Customizable node types (full React components)
- Edge routing with animated connections
- Active open-source project with strong ecosystem
- Works with React 19 and Server Components (canvas is client-only)

**Installation:**
```
pnpm add @xyflow/react
```

**Key dependencies for the flow builder:**
- `@xyflow/react` — canvas, nodes, edges, controls
- `dagre` — automatic layout algorithm (optional, for "auto-arrange" button)
- `zustand` — flow builder state management (React Flow recommends this pattern)

**Integration with Next.js App Router:**
- Flow builder is a `"use client"` component (requires user interaction)
- Flow list page and detail overview are Server Components
- Flow definition saved/loaded via server actions

---

## 3. Visual Flow Builder

### 3.1 Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ Flow Builder Toolbar                                             │
│ [Save Draft] [Activate] [Deactivate] [Auto-Layout] [Undo] [Redo]│
├──────────┬───────────────────────────────────────────────────────┤
│ Node     │                                                       │
│ Palette  │            React Flow Canvas                          │
│ (240px)  │                                                       │
│          │   ┌─────────┐                                         │
│ Triggers │   │ Trigger │                                         │
│ ─────── │   └────┬────┘                                         │
│ • Inbound│        │                                              │
│ • Button │   ┌────┴────┐                                         │
│ • Sched. │   │ Action  │                                         │
│          │   └────┬────┘                                         │
│ Actions  │        │                                              │
│ ──────── │   ┌────┴────┐     ┌──────┐                           │
│ • Send   │   │Condition├─────┤Action│                            │
│ • Tag    │   └────┬────┘     └──────┘                            │
│ • Delay  │        │                                              │
│ • ...    │   ┌────┴────┐                                         │
│          │   │  End    │                                         │
│          │   └─────────┘                                         │
│          │                                                       │
│          │                          [Minimap]                    │
└──────────┴───────────────────────────────────────────────────────┘
```

### 3.2 Canvas Features

| Feature | Implementation |
|---------|---------------|
| **Drag-and-drop** | Drag node from palette onto canvas — creates node at drop position |
| **Connect nodes** | Drag from output handle → input handle to create an edge |
| **Selection** | Click node to select; Shift+click or drag-select for multi |
| **Delete** | Select node/edge → press Delete/Backspace |
| **Zoom** | Scroll wheel or pinch; zoom controls in bottom-right |
| **Pan** | Click+drag on canvas background |
| **Minimap** | Bottom-right corner, toggleable |
| **Undo/Redo** | Ctrl+Z / Ctrl+Shift+Z — 50-step action history |
| **Auto-layout** | Button in toolbar — applies dagre layout algorithm |
| **Grid snap** | 20px grid snapping for clean alignment |
| **Copy/paste** | Ctrl+C/V for selected nodes (duplicates with offset) |

### 3.3 Node Configuration

When a node is selected, a **configuration panel** slides in from the right (360px):
- Node type icon and name (read-only)
- Type-specific configuration fields (see Sections 4 and 5)
- "Delete node" button at bottom
- Panel closes on deselect or Escape

### 3.4 Flow Controls (Toolbar)

| Button | Action | Conditions |
|--------|--------|------------|
| Save Draft | Save current definition to database (status: draft) | Always available |
| Activate | Validate + save + set status to `active` | Passes validation |
| Deactivate | Set status to `paused` | Only when active |
| Auto-Layout | Rearrange nodes using dagre algorithm | Always available |
| Undo | Revert last action | History available |
| Redo | Re-apply undone action | Redo available |
| Delete Flow | Archive the flow (confirmation modal) | Always available |
| Duplicate | Create a copy of the entire flow | Always available |

### 3.5 Validation (Before Activation)

| Rule | Error Message |
|------|---------------|
| Exactly one trigger node | "Flow must have exactly one trigger" |
| All nodes connected (no orphans) | "Node '{name}' is not connected to the flow" |
| Send Template nodes reference approved template | "Node '{name}' uses an unapproved template" |
| Condition nodes have both true/false branches | "Condition '{name}' is missing a {true/false} branch" |
| Delay duration > 0 | "Delay '{name}' must have a duration greater than zero" |
| No circular paths (infinite loops) | "Flow contains a loop — add an End node or condition to break it" |
| End node reachable from all paths | "Some paths don't reach an End node" (warning, not blocking) |

Validation errors displayed as:
- Red badge on invalid nodes
- Error list in a drawer/panel with click-to-navigate

---

## 4. Node Types — Triggers

Triggers are the entry point of a flow. Exactly one per flow.

### 4.1 Inbound Message Trigger

**Icon:** `IconMessageForward` | **Color:** Blue

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Keyword filter | Select | `any` (no filter), `exact_match`, `contains`, `regex` |
| Keyword value | Text | The keyword/pattern to match (hidden if `any`) |
| Case sensitive | Toggle | Default: off |

**Behavior:** Fires when a contact sends a WhatsApp message. If keyword filter is set, only fires when message matches.

**Conflicts:** If multiple active flows have Inbound Message triggers, the first matching flow (by creation date) executes. Warning shown when activating a flow that conflicts with another active flow's trigger.

### 4.2 Button Reply Trigger

**Icon:** `IconHandClick` | **Color:** Blue

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Button ID | Text | The `reply.id` from an interactive button message |
| Source flow (optional) | Select | Only trigger from buttons sent by a specific flow |

**Behavior:** Fires when a contact taps a specific reply button in an interactive message.

### 4.3 List Reply Trigger

**Icon:** `IconList` | **Color:** Blue

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| List item ID | Text | The `id` of the selected list item |
| Source flow (optional) | Select | Only trigger from lists sent by a specific flow |

### 4.4 New Contact Trigger

**Icon:** `IconUserPlus` | **Color:** Blue

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Source filter | Multi-select | `manual`, `import`, `whatsapp`, `campaign`, `flow`, `ad` (or all) |

**Behavior:** Fires when a contact record is created in the database.

### 4.5 Tag Added Trigger

**Icon:** `IconTag` | **Color:** Blue

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Tag | Select (required) | The specific tag that triggers the flow |

**Behavior:** Fires when the selected tag is added to any contact.

### 4.6 Scheduled Trigger

**Icon:** `IconClock` | **Color:** Blue

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Schedule type | Select | `once`, `recurring` |
| Date/time (once) | DateTime picker | Specific date and time |
| Interval (recurring) | Select + number | Every N minutes/hours/days/weeks |
| Cron (advanced) | Text | Cron expression for complex schedules |
| Target segment | Select (optional) | Segment of contacts to process on each run |

**Behavior:** Fires on a time schedule. If a target segment is set, creates an execution per contact in the segment.

### 4.7 Campaign Reply Trigger

**Icon:** `IconSend` | **Color:** Blue

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Campaign | Select (required) | The campaign whose replies trigger the flow |

**Behavior:** Fires when a contact replies to a message from the selected campaign.

### 4.8 Manual / Webhook Trigger

**Icon:** `IconWebhook` | **Color:** Blue

**Config fields:** None (auto-generates a webhook URL and a "Trigger manually" button in the flow detail page)

**Behavior:** Fires when the generated webhook URL receives a POST request, or when manually triggered from the UI for a specific contact.

---

## 5. Node Types — Actions

### 5.1 Send Text

**Icon:** `IconMessage` | **Color:** Green

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Message body | Textarea | Text content. Supports variables: `{{contact.full_name}}`, `{{contact.phone}}`, etc. |

**Behavior:** Sends a free-form text message. **Only works within 24hr window.** If window is expired, execution fails and logs error.

**Node display:** Shows first 50 chars of message body.

### 5.2 Send Template

**Icon:** `IconTemplate` | **Color:** Green

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Template | Select | Dropdown of approved templates (with preview) |
| Variable 1..N | Text or variable picker | For each `{{N}}` in template: static value or `{{contact.field}}` |

**Behavior:** Sends an approved WhatsApp template. **Works regardless of 24hr window status.** Ideal for re-engaging expired conversations.

**Node display:** Shows template name.

### 5.3 Send Media

**Icon:** `IconPhoto` | **Color:** Green

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Media type | Select | Image, Video, Audio, Document |
| Source | Select | Upload file or enter URL |
| File / URL | File upload or text | The media to send |
| Caption | Text (optional) | Caption for images/videos |

**Behavior:** Sends media message. Within 24hr window only.

### 5.4 Send Interactive

**Icon:** `IconHandClick` | **Color:** Green

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Interactive type | Select | `button` or `list` |
| Body text | Textarea | Message body |
| Buttons (if button type) | Dynamic builder | Up to 3 buttons: id + label |
| Sections (if list type) | Dynamic builder | Sections with rows: id + title + description |

**Behavior:** Sends interactive message. Responses can be captured by Button Reply / List Reply triggers in other flows.

**Node display:** Shows interactive type + body preview.

### 5.5 Add Tag

**Icon:** `IconTagPlus` | **Color:** Orange

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Tag | Select (required) | Tag to add. Option to create new tag inline. |

**Behavior:** Adds the tag to the contact. No-op if already tagged.

### 5.6 Remove Tag

**Icon:** `IconTagMinus` | **Color:** Orange

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Tag | Select (required) | Tag to remove |

**Behavior:** Removes the tag from the contact. No-op if not tagged.

### 5.7 Update Contact

**Icon:** `IconUserEdit` | **Color:** Orange

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Field | Select | Contact field to update (full_name, email, company, etc.) |
| Value | Text or expression | New value. Supports `{{message.body}}` to capture from triggering message. |

**Behavior:** Updates the specified field on the contact record.

### 5.8 Assign Agent

**Icon:** `IconUserCheck` | **Color:** Purple

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Assignment type | Select | `specific_agent`, `round_robin` |
| Agent (if specific) | Select | Dropdown of org members |

**Behavior:** Assigns the conversation to an agent. Creates conversation if none exists. Round-robin: cycles through all agents in the org.

### 5.9 Delay

**Icon:** `IconHourglass` | **Color:** Gray

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Duration | Number | Amount of time |
| Unit | Select | `minutes`, `hours`, `days` |

**Behavior:** Pauses the flow execution for the specified duration. Execution state is saved; a scheduled job resumes it later.

**Node display:** Shows "Wait {N} {unit}".

**Constraints:** Minimum: 1 minute. Maximum: 30 days.

### 5.10 Condition

**Icon:** `IconGitBranch` | **Color:** Yellow

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Condition type | Select | `contact_field`, `message_content`, `tag_check`, `time_check`, `custom_expression` |
| Field (if contact_field) | Select | Contact field to check |
| Operator | Select | `equals`, `not_equals`, `contains`, `not_contains`, `greater_than`, `less_than`, `is_empty`, `is_not_empty`, `matches_regex` |
| Value | Text | Comparison value. Supports variables. |
| Tag (if tag_check) | Select | Check if contact has this tag |
| Time condition (if time_check) | Select | `window_open` (24hr window active), `business_hours` |

**Behavior:** Evaluates the condition against the current contact/message data. Routes to "True" (green) or "False" (red) output handle.

**Node display:** Shows condition summary (e.g., "If tag = VIP").

**Visual:** Two output handles — right side labeled "True" (green), left side labeled "False" (red).

### 5.11 HTTP Webhook

**Icon:** `IconApi` | **Color:** Teal

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| URL | Text | Endpoint URL. Supports variables. |
| Method | Select | GET, POST, PUT, PATCH |
| Headers | Key-value pairs | Request headers |
| Body | Textarea (JSON) | Request body for POST/PUT/PATCH. Supports variables. |
| Timeout | Number | Seconds (default: 10, max: 30) |
| Store response as | Text | Variable name to store response in flow context (e.g., `api_result`) |

**Behavior:** Calls an external HTTP API. Response stored in flow execution context for use in subsequent nodes via `{{flow.api_result.field}}`.

**Error handling:** If request fails or times out, log error and continue to next node (configurable: continue or stop on error).

### 5.12 Add Note

**Icon:** `IconNote` | **Color:** Gray

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Note text | Textarea | Internal note content. Supports variables. |

**Behavior:** Adds an internal note to the contact's activity log. Not visible to the customer.

### 5.13 Handoff to Agent

**Icon:** `IconArrowsTransferUp` | **Color:** Purple

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Assignment type | Select | `specific_agent`, `round_robin`, `unassigned` |
| Agent (if specific) | Select | Agent dropdown |
| Customer message | Textarea (optional) | Message to send to customer (e.g., "Transferring you to an agent...") |

**Behavior:**
1. Pauses flow execution (`flow_executions.status = 'paused'`)
2. Sets `conversations.is_bot_active = false`
3. Assigns conversation per assignment type
4. Optionally sends customer message
5. Adds system message: "Transferred to agent by flow '{flow_name}'"
6. Flow remains paused until agent manually "Returns to bot"

### 5.14 End

**Icon:** `IconSquare` | **Color:** Red

**Config fields:**

| Field | Type | Description |
|-------|------|-------------|
| Conversation status | Select (optional) | `resolve` (set to resolved), `leave_open` (no change, default) |

**Behavior:** Terminates the flow execution. Optionally resolves the conversation.

---

## 6. Node Visual Design System

### 6.1 Node Structure

Each node rendered as a Mantine `Card` with:

```
┌─────────────────────────────────┐
│ ● Input Handle (top center)     │
├─────────────────────────────────┤
│ [Icon] Node Type Name           │  ← Header (colored by category)
├─────────────────────────────────┤
│ Configuration summary           │  ← Body (1-2 lines of context)
│ e.g., "Template: order_confirm" │
├─────────────────────────────────┤
│ ● Output Handle(s) (bottom)    │
└─────────────────────────────────┘
```

### 6.2 Color Coding by Category

| Category | Color | Node Types |
|----------|-------|------------|
| Triggers | Blue (`#228BE6`) | All trigger nodes |
| Send Actions | Green (`#40C057`) | Send Text, Send Template, Send Media, Send Interactive |
| CRM Actions | Orange (`#FD7E14`) | Add Tag, Remove Tag, Update Contact |
| Routing | Purple (`#7950F2`) | Assign Agent, Handoff to Agent |
| Logic | Yellow (`#FAB005`) | Condition |
| Utility | Gray (`#868E96`) | Delay, Add Note, HTTP Webhook |
| Terminal | Red (`#FA5252`) | End |

### 6.3 Node Dimensions

- Width: 240px (fixed)
- Height: auto (content-driven, min 80px)
- Border radius: 8px
- Shadow: `shadow-sm` (Mantine)
- Selected state: blue border ring (2px)
- Error state: red border ring (2px) + error badge

### 6.4 Edge Styling

- Default: solid gray line (#CED4DA), 2px
- Animated: dashed animation when flow is active (live execution view)
- Condition true branch: green (#40C057)
- Condition false branch: red (#FA5252)
- Edge type: `smoothstep` (React Flow built-in)
- Arrow markers on target end

### 6.5 Handle Styling

- Input handle: top center, 10px circle, gray border, white fill
- Output handle: bottom center (or bottom-left/bottom-right for condition)
- Connected handles: filled with edge color
- Connectable state: grows to 14px with blue glow on hover

---

## 7. Flow Definition Storage Format

Flow definitions stored as JSON in `automation_flows.definition`:

```json
{
  "nodes": [
    {
      "id": "trigger_1",
      "type": "trigger_inbound_message",
      "position": { "x": 400, "y": 50 },
      "data": {
        "label": "Inbound Message",
        "keyword_filter": { "type": "contains", "value": "hello", "case_sensitive": false }
      }
    },
    {
      "id": "action_1",
      "type": "send_template",
      "position": { "x": 400, "y": 200 },
      "data": {
        "label": "Send Welcome",
        "template_id": "uuid-of-template",
        "template_name": "welcome_message",
        "variables": {
          "1": { "type": "contact_field", "field": "full_name" }
        }
      }
    },
    {
      "id": "condition_1",
      "type": "condition",
      "position": { "x": 400, "y": 400 },
      "data": {
        "label": "Is VIP?",
        "condition_type": "tag_check",
        "tag": "vip",
        "operator": "has_tag"
      }
    },
    {
      "id": "action_2",
      "type": "assign_agent",
      "position": { "x": 250, "y": 600 },
      "data": {
        "label": "Assign to Sales",
        "assignment_type": "specific_agent",
        "agent_id": "uuid-of-agent"
      }
    },
    {
      "id": "action_3",
      "type": "add_tag",
      "position": { "x": 550, "y": 600 },
      "data": {
        "label": "Tag as Nurture",
        "tag_id": "uuid-of-tag",
        "tag_name": "nurture"
      }
    },
    {
      "id": "end_1",
      "type": "end",
      "position": { "x": 400, "y": 800 },
      "data": {
        "label": "End",
        "conversation_status": "leave_open"
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "trigger_1", "target": "action_1" },
    { "id": "e2", "source": "action_1", "target": "condition_1" },
    { "id": "e3", "source": "condition_1", "target": "action_2", "sourceHandle": "true" },
    { "id": "e4", "source": "condition_1", "target": "action_3", "sourceHandle": "false" },
    { "id": "e5", "source": "action_2", "target": "end_1" },
    { "id": "e6", "source": "action_3", "target": "end_1" }
  ],
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}
```

### React Flow ↔ Database Mapping

- `nodes` array maps directly to React Flow's `Node[]` type
- `edges` array maps directly to React Flow's `Edge[]` type
- `data` field on each node contains the type-specific configuration
- `type` field maps to custom node components registered with React Flow
- `viewport` preserves the user's last zoom/pan position

---

## 8. Flow Execution Engine

### 8.1 Architecture

**Runtime:** Supabase Edge Function (`execute-flow`)

**Trigger sources:**
- Webhook handler (inbound message, button/list reply, template status)
- Database trigger (new contact, tag added)
- Schedule runner (pg_cron for scheduled triggers and delay resumptions)
- Server action (manual trigger, campaign reply)

### 8.2 Execution Pipeline

```
1. Event occurs (inbound message, schedule, etc.)
2. Find all ACTIVE flows matching the trigger type + conditions
3. For each matching flow:
   a. Check: is this contact already in an active execution of this flow?
      → If yes: skip (prevent duplicate executions)
   b. Create flow_executions record:
      - status: 'running'
      - current_node_id: trigger node id
      - execution_log: []
   c. Increment automation_flows.execution_count
   d. Begin node traversal from trigger node
```

### 8.3 Node Traversal Algorithm

```
function executeNode(executionId, nodeId, context):
  node = getNodeFromDefinition(nodeId)

  // Log entry
  appendToLog(executionId, {
    node_id: nodeId,
    node_type: node.type,
    started_at: now(),
    input: context
  })

  // Execute based on type
  switch node.type:
    case 'send_text':
      result = await sendWhatsAppText(context.contact, node.data.body)
    case 'send_template':
      result = await sendWhatsAppTemplate(context.contact, node.data)
    case 'condition':
      result = evaluateCondition(node.data, context)
    case 'delay':
      saveState(executionId, nodeId, context)
      scheduleResume(executionId, node.data.duration)
      return  // Exit — will resume later
    case 'handoff':
      pauseExecution(executionId)
      assignConversation(context.conversation, node.data)
      return  // Exit — agent takes over
    case 'end':
      completeExecution(executionId)
      return
    ...

  // Log result
  updateLog(executionId, nodeId, { result, completed_at: now() })

  // Find next node
  if node.type == 'condition':
    nextEdge = findEdge(nodeId, result ? 'true' : 'false')
  else:
    nextEdge = findEdge(nodeId)

  if nextEdge:
    executeNode(executionId, nextEdge.target, { ...context, ...result })
  else:
    completeExecution(executionId)
```

### 8.4 Delay Handling

When a Delay node is reached:
1. Save current execution state:
   - `flow_executions.current_node_id` = delay node's NEXT node (the node after the delay)
   - `flow_executions.status` = 'running' (but paused internally)
   - Store full context in `execution_log`
2. Calculate resume time: `now() + delay duration`
3. Schedule resume: insert a record into a `scheduled_jobs` table (or use `pg_cron`)
4. Edge Function `schedule-runner` polls every minute:
   - Find executions with delay nodes whose resume time has passed
   - Invoke `execute-flow` with the execution ID to resume
5. On resume: load execution state, continue from the node after the delay

### 8.5 Variable Resolution

Variables in node configurations are resolved at execution time:

| Pattern | Source | Example |
|---------|--------|---------|
| `{{contact.full_name}}` | Current contact record | "John Doe" |
| `{{contact.phone}}` | Contact phone | "+15551234567" |
| `{{contact.email}}` | Contact email | "john@example.com" |
| `{{contact.custom_fields.plan}}` | Contact custom field | "premium" |
| `{{message.body}}` | Triggering message content | "I need help" |
| `{{message.type}}` | Triggering message type | "text" |
| `{{flow.variable_name}}` | Flow context (set by HTTP node) | (varies) |
| `{{agent.full_name}}` | Assigned agent name | "Sarah Smith" |

Resolution algorithm:
1. Parse `{{...}}` patterns in the string
2. Split by `.` to traverse the context object
3. Return empty string if path not found (don't crash)
4. Log unresolved variables as warnings

### 8.6 Concurrency Control

- One execution per contact per flow at a time
- Check before starting: `SELECT id FROM flow_executions WHERE flow_id = $1 AND contact_id = $2 AND status IN ('running', 'paused')`
- If found: skip (log "already in flow")
- Exception: scheduled triggers with segment targets create new executions even if previous completed

### 8.7 Error Handling Per Node

| Error | Behavior | Log Entry |
|-------|----------|-----------|
| WhatsApp API failure (4xx) | Log error, mark execution as `failed` | `{error_code, error_message, failed_at}` |
| WhatsApp API failure (5xx/429) | Retry up to 3 times with backoff, then fail | `{retries, final_error}` |
| 24hr window expired (on Send Text/Media/Interactive) | Log error, mark node as failed, continue to next node | `{error: "window_expired"}` |
| HTTP Webhook timeout/failure | Log error, continue or stop (per node config) | `{url, status_code, error}` |
| Contact not found | Mark execution as failed | `{error: "contact_not_found"}` |
| Invalid variable reference | Replace with empty string, continue, warn | `{warning: "unresolved_variable"}` |

---

## 9. Bot-to-Agent Handoff

### 9.1 During Active Flow

When a flow is executing for a conversation:
- `conversations.is_bot_active = true`
- `conversations.active_flow_id = flow.id`
- Chat header shows "Bot active" badge with flow name

### 9.2 Agent Takes Over

Agent clicks "Take Over" in the conversation:
1. Set `flow_executions.status = 'paused'` and save `current_node_id`
2. Set `conversations.is_bot_active = false`
3. Set `conversations.active_flow_id = null` (or keep for reference)
4. System message: "{agent_name} took over from automated flow"
5. Agent can now message freely

### 9.3 Return to Bot

Agent clicks "Return to Bot":
1. Set `flow_executions.status = 'running'`
2. Set `conversations.is_bot_active = true`
3. System message: "Returned to automated flow"
4. Execution resumes from `current_node_id`

### 9.4 Handoff Node in Flow

The **Handoff to Agent** action node explicitly triggers handoff:
1. Optionally sends a customer message ("Connecting you to an agent...")
2. Assigns conversation to agent/round-robin/unassigned
3. Pauses execution at this node
4. Flow only resumes if agent clicks "Return to Bot"
5. If agent resolves conversation without returning to bot: execution stays paused indefinitely (or auto-cancel after configurable timeout)

### 9.5 Flow + Inbound Message Interaction

While a flow is active for a conversation (`is_bot_active = true`):
- New inbound messages from the contact are processed by the flow engine (e.g., captured by a condition node waiting for a reply)
- They are NOT routed to new flow triggers (prevents parallel flow execution)
- Agent messages are blocked unless they "Take Over" first

---

## 10. Pre-built Flow Templates

### Template 1: Lead Capture

```
[Inbound Message (keyword: "info")]
    ↓
[Send Template: "welcome_greeting"]
    ↓
[Send Interactive: buttons("Product Info", "Pricing", "Talk to Sales")]
    ↓
[Wait for Button Reply]  ← This is modeled as a Condition checking message content
    ↓
[Condition: reply = "Talk to Sales"]
  True → [Add Tag: "qualified"] → [Assign Agent: round-robin] → [End]
  False → [Send Text: product/pricing info] → [Add Tag: "nurture"] → [End]
```

**Use case:** Qualify inbound leads, route hot leads to sales, nurture cold leads.

### Template 2: Support Routing

```
[Inbound Message (any)]
    ↓
[Send Interactive: list("Billing", "Technical", "General", "Speak to Agent")]
    ↓
[Condition: selection = "Speak to Agent"]
  True → [Handoff to Agent] → [End]
  False →
    [Condition: selection = "Billing"]
      True → [Send Text: billing FAQ] → [Assign Agent: billing team] → [End]
      False →
        [Condition: selection = "Technical"]
          True → [Send Text: tech FAQ] → [Assign Agent: tech team] → [End]
          False → [Send Text: general FAQ] → [End]
```

**Use case:** Auto-route support queries to the right team.

### Template 3: Appointment Reminder

```
[Scheduled: daily at 8:00 AM, target segment: "has_appointment_today"]
    ↓
[Send Template: "appointment_reminder" with {{time}}, {{location}}]
    ↓
[Delay: 2 hours]
    ↓
[Condition: contact replied?]
  True →
    [Condition: reply contains "confirm"]
      True → [Update Contact: status = "confirmed"] → [End]
      False → [Assign Agent: receptionist] → [End]
  False → [Send Template: "appointment_reminder_followup"] → [End]
```

**Use case:** Automated appointment reminders with confirmation handling.

### Template 4: Order Notification Sequence

```
[Manual/Webhook Trigger]
    ↓
[Send Template: "order_confirmation" with {{order_id}}, {{total}}]
    ↓
[Delay: 2 days]
    ↓
[Send Template: "shipping_update" with {{tracking_number}}]
    ↓
[Delay: 3 days]
    ↓
[Send Template: "delivery_confirmation"]
    ↓
[Delay: 1 day]
    ↓
[Send Template: "feedback_request"]
    ↓
[End]
```

**Use case:** Post-purchase communication sequence.

### Template 5: Welcome Sequence

```
[New Contact (source: whatsapp, ad)]
    ↓
[Send Template: "welcome"]
    ↓
[Add Tag: "new_lead"]
    ↓
[Delay: 1 day]
    ↓
[Condition: has tag "engaged"]  ← Set by another flow if they message
  True → [Send Template: "product_guide"] → [End]
  False →
    [Send Template: "product_intro"]
    ↓
    [Delay: 3 days]
    ↓
    [Condition: has responded?]
      True → [Add Tag: "warm_lead"] → [End]
      False → [Send Template: "special_offer"] → [Add Tag: "cold_lead"] → [End]
```

**Use case:** Nurture new contacts acquired from WhatsApp ads.

---

## 11. Flow Analytics

### 11.1 Flow List Page Metrics

| Column | Description |
|--------|-------------|
| Executions | Total execution count (all time) |
| Completion rate | completed / (completed + failed) × 100% |
| Active executions | Currently running/paused |
| Last executed | Timestamp of most recent execution |

### 11.2 Flow Detail Page Analytics

**Summary cards:**
- Total executions (filterable: last 7 / 30 / 90 days)
- Completion rate
- Average completion time
- Error rate
- Active (running + paused) count

**Execution over time chart:** Line chart of daily execution count, last 30 days

**Node heatmap overlay:** When toggled, each node on the canvas shows:
- Execution count (how many contacts passed through)
- Success rate (green gradient = high, red = low)
- Average time spent (for delay nodes)

**Drop-off visualization:** Highlight edges where contacts exit the flow (failed or no outgoing edge). Shows percentage of contacts that reached each node.

**Condition node split:** For condition nodes, show % true vs % false.

---

## 12. Flow Execution Logs

### 12.1 Execution List (`/flows/[id]/executions`)

| Column | Description |
|--------|-------------|
| Contact | Name + phone |
| Started at | Execution start timestamp |
| Completed at | Completion timestamp (or "—" if still running) |
| Status | `running` / `completed` / `failed` / `paused` / `cancelled` |
| Current node | Current node name (for running/paused) |
| Error | Error message (for failed) |
| Actions | "View detail", "Retry" (failed), "Cancel" (running) |

Filters: status, date range, contact name/phone

### 12.2 Execution Detail View

Step-by-step log rendered as a vertical timeline:

```
● Trigger: Inbound Message                    10:00:00 AM  ✓
  "Customer sent: hello"

● Send Template: welcome_message              10:00:01 AM  ✓
  "Sent wamid.xxx, status: sent"

● Delay: Wait 5 minutes                      10:00:01 AM  ⏳
  "Resuming at 10:05:01 AM"

● Condition: Is VIP?                          10:05:02 AM  ✓
  "tag_check: vip → false"

● Add Tag: nurture                            10:05:02 AM  ✓
  "Tag 'nurture' added to contact"

● End                                         10:05:02 AM  ✓
  "Flow completed"
```

Each step shows:
- Node type icon + name
- Timestamp
- Status icon: ✓ (success), ✗ (failed), ⏳ (waiting), ▶ (running)
- Input/output data (expandable)
- Duration
- Error details (if failed)

**Actions:**
- "Retry from here" — re-run from a specific failed node
- "Cancel execution" — stop a running execution

---

## 13. Data Model

### 13.1 `automation_flows` Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `org_id` | UUID | Organization FK |
| `name` | text | Flow name |
| `description` | text | Optional description |
| `trigger_type` | text | Trigger type identifier |
| `trigger_config` | jsonb | Trigger-specific config (keyword, schedule, etc.) |
| `definition` | jsonb | Full flow definition (nodes + edges + viewport) |
| `status` | text | `draft` / `active` / `paused` / `archived` |
| `execution_count` | integer | Total executions |
| `last_executed_at` | timestamptz | Most recent execution |
| `created_by` | UUID | Creator FK |
| `created_at` | timestamptz | Created |
| `updated_at` | timestamptz | Updated |

### 13.2 `flow_executions` Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `org_id` | UUID | Organization FK |
| `flow_id` | UUID | FK to automation_flows |
| `contact_id` | UUID | FK to contacts |
| `conversation_id` | UUID | FK to conversations (nullable) |
| `status` | text | `running` / `completed` / `failed` / `paused` / `cancelled` |
| `current_node_id` | text | ID of current node (for running/paused) |
| `execution_log` | jsonb | Array of step logs |
| `context` | jsonb | Current execution context (variables, state) |
| `started_at` | timestamptz | Execution start |
| `completed_at` | timestamptz | Completion time |
| `error_message` | text | Error if failed |

### 13.3 Execution Log Entry Format

```json
{
  "node_id": "action_1",
  "node_type": "send_template",
  "node_label": "Send Welcome",
  "started_at": "2026-02-24T10:00:01Z",
  "completed_at": "2026-02-24T10:00:02Z",
  "duration_ms": 850,
  "status": "success",
  "input": { "template_id": "uuid", "contact_phone": "+15551234567" },
  "output": { "wamid": "wamid.xxx", "api_status": 200 },
  "error": null
}
```

---

## 14. UI Pages and Components

### 14.1 Flow List Page (`/flows`)

- Top bar: "Flows" title, "Create Flow" button, search input
- Table: name, status badge, trigger type icon, executions count, last executed, actions menu
- Status filter: All, Active, Draft, Paused, Archived
- Empty state: "Create your first automation flow" + illustration + template gallery link

### 14.2 Flow Builder Page (`/flows/new`, `/flows/[id]/edit`)

- Full-screen layout (sidebar collapsed or hidden)
- Top toolbar: flow name (editable), status badge, action buttons
- Left panel: node palette (accordion: Triggers, Actions, Logic)
- Center: React Flow canvas
- Right panel: node configuration (slides in on node select)
- Bottom-right: minimap, zoom controls

### 14.3 Flow Detail Page (`/flows/[id]`)

**Tabs:**
1. **Overview** — read-only flow canvas with analytics overlay, summary cards
2. **Executions** — execution log table (see Section 12)
3. **Settings** — flow name, description, trigger config, danger zone (delete/archive)

### 14.4 Custom React Flow Node Components

Each node type gets a custom React component registered with React Flow:

```typescript
// src/features/flows/components/nodes/SendTemplateNode.tsx
"use client"

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Paper, Group, Text, ThemeIcon } from '@mantine/core'
import { IconTemplate } from '@tabler/icons-react'

export function SendTemplateNode({ data, selected }: NodeProps) {
  return (
    <Paper
      shadow="xs"
      radius="md"
      p="xs"
      w={240}
      style={{ border: selected ? '2px solid var(--mantine-color-blue-5)' : undefined }}
    >
      <Handle type="target" position={Position.Top} />
      <Group gap="xs" style={{ background: 'var(--mantine-color-green-0)', borderRadius: 4, padding: 4 }}>
        <ThemeIcon size="sm" color="green" variant="light">
          <IconTemplate size={14} />
        </ThemeIcon>
        <Text size="xs" fw={600}>Send Template</Text>
      </Group>
      <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
        {data.template_name || 'Select a template...'}
      </Text>
      <Handle type="source" position={Position.Bottom} />
    </Paper>
  )
}
```

Register all node types:
```typescript
const nodeTypes = {
  trigger_inbound_message: InboundMessageTriggerNode,
  trigger_button_reply: ButtonReplyTriggerNode,
  trigger_scheduled: ScheduledTriggerNode,
  // ... all trigger types
  send_text: SendTextNode,
  send_template: SendTemplateNode,
  send_media: SendMediaNode,
  send_interactive: SendInteractiveNode,
  add_tag: AddTagNode,
  remove_tag: RemoveTagNode,
  update_contact: UpdateContactNode,
  assign_agent: AssignAgentNode,
  delay: DelayNode,
  condition: ConditionNode,
  http_webhook: HttpWebhookNode,
  add_note: AddNoteNode,
  handoff: HandoffNode,
  end: EndNode,
}
```

---

## 15. Technical Architecture

### 15.1 Component Architecture

```
/flows
├── page.tsx                          ← Server Component: flow list
├── new/
│   └── page.tsx                      ← Client Component: flow builder
├── [id]/
│   ├── page.tsx                      ← Server Component: flow detail (tabs)
│   ├── edit/
│   │   └── page.tsx                  ← Client Component: flow builder (editing)
│   └── executions/
│       └── page.tsx                  ← Server Component: execution log

src/features/flows/
├── actions/
│   ├── create-flow.ts
│   ├── update-flow.ts
│   ├── activate-flow.ts
│   ├── deactivate-flow.ts
│   └── delete-flow.ts
├── components/
│   ├── FlowBuilder.tsx               ← Main React Flow canvas + controls
│   ├── NodePalette.tsx               ← Draggable node list
│   ├── NodeConfigPanel.tsx           ← Right panel for selected node config
│   ├── FlowToolbar.tsx               ← Save/Activate/Undo/Redo
│   ├── FlowValidation.tsx            ← Validation error display
│   └── nodes/                        ← Custom node components
│       ├── InboundMessageTriggerNode.tsx
│       ├── SendTemplateNode.tsx
│       ├── ConditionNode.tsx
│       ├── DelayNode.tsx
│       └── ... (one per node type)
├── constants/
│   └── node-definitions.ts           ← Node type metadata (icon, color, config schema)
├── hooks/
│   ├── useFlowBuilder.ts             ← Flow builder state (zustand store)
│   ├── useFlowValidation.ts          ← Validation logic
│   └── useUndoRedo.ts                ← Undo/redo stack
├── schemas/
│   ├── flow-definition.ts            ← Zod schema for flow definition JSON
│   └── node-configs.ts               ← Zod schemas per node type
├── types/
│   └── index.ts                      ← TypeScript types for nodes, edges, configs
└── utils/
    ├── variable-resolver.ts           ← {{variable}} resolution logic
    ├── flow-validator.ts              ← Validation rules
    └── dagre-layout.ts                ← Auto-layout helper
```

### 15.2 State Management

Flow builder uses a **zustand store** (recommended by React Flow):

```typescript
interface FlowBuilderStore {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  isDirty: boolean

  // Actions
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  addNode: (type: string, position: XYPosition) => void
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void
  deleteNode: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void

  // Persistence
  loadDefinition: (definition: FlowDefinition) => void
  getDefinition: () => FlowDefinition

  // Undo/Redo
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}
```

### 15.3 Edge Function Architecture

**`execute-flow` Edge Function:**

Invoked by:
- Webhook handler (trigger event matched)
- `schedule-runner` (scheduled triggers, delay resumptions)
- Server action (manual trigger)

Input payload:
```json
{
  "type": "trigger" | "resume",
  "flow_id": "uuid",
  "contact_id": "uuid",
  "conversation_id": "uuid | null",
  "execution_id": "uuid (for resume only)",
  "trigger_data": { "message": {...}, "event": "..." }
}
```

**`schedule-runner` Edge Function (pg_cron, every 1 minute):**

1. Find scheduled triggers due to fire:
   ```sql
   SELECT * FROM automation_flows
   WHERE status = 'active' AND trigger_type = 'scheduled'
   AND trigger_config->>'next_run_at' <= now()
   ```
2. Find delayed executions due to resume:
   ```sql
   SELECT * FROM flow_executions
   WHERE status = 'running'
   AND execution_log->(-1)->>'resume_at' <= now()
   ```
3. For each: invoke `execute-flow` Edge Function

---

## 16. Edge Cases and Constraints

### 16.1 Limits

| Limit | Value | Rationale |
|-------|-------|-----------|
| Max nodes per flow | 50 | Performance + complexity |
| Max active flows per org | 50 | Resource management |
| Max concurrent executions per flow | 1,000 | Prevent runaway |
| Max delay duration | 30 days | Practical limit |
| Min delay duration | 1 minute | Prevent tight loops |
| Max HTTP webhook timeout | 30 seconds | Edge Function limits |
| Max execution duration (total) | 30 days | Auto-cancel stale executions |
| Max execution log entries | 100 per execution | Storage management |

### 16.2 Edge Cases

| Scenario | Handling |
|----------|---------|
| Flow deactivated while executions running | Running executions complete; no new ones start |
| Flow deleted while executions running | Running executions complete; flow archived (not hard-deleted) |
| Contact deleted while in flow | Execution marked as `cancelled` |
| Template revoked by Meta while flow uses it | Send Template node fails; execution continues to next node; alert shown on flow detail |
| WhatsApp account disconnected | All Send nodes fail; executions fail; alert on flow list |
| Circular flow definition | Prevented by validation before activation |
| Two flows triggered by same message | First matching flow (by created_at) executes; others skipped |
| Agent sends message while bot is active | Blocked unless agent "Takes Over" |
| Flow execution exceeds 30 days | Auto-cancelled by schedule-runner |
