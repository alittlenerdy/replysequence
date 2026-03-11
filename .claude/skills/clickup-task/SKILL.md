---
name: clickup-task
description: Manage ClickUp tasks with correct field IDs, status mappings, and dropdown UUIDs. Use when creating, updating, or triaging ClickUp tasks to avoid field lookup errors.
---

# ClickUp Task Management

You are managing tasks in Jimmy's ClickUp workspace. Follow these rules exactly.

## Workspace

- **Workspace ID**: `9013469200` — include in every MCP call

## Dropdown Field UUID Mapping

**CRITICAL**: ClickUp dropdown fields require UUID option IDs, NOT orderindex numbers. Use these exact values:

### Owner (Field: `3b3584e9-4da1-44e6-a628-2790ce50fb2f`)
| Display | UUID |
|---------|------|
| Claude Code | `4fe5ad0e-4437-4809-8622-5bf2b8424563` |
| Manual | `eba69a85-56fe-4675-aaa9-0bfc28285a1a` |
| Me | `050c2977-e2b6-46ad-8285-aa243efab2ca` |

### Priority Custom Field (Field: `f8766d13-6f1f-4929-b7a6-228c9d3b27de`)
| Display | UUID |
|---------|------|
| Urgent | `778ad411-7d14-4eaa-b67d-094767a42688` |
| High | `7b63c001-0b1d-4d7e-9952-12ca169aed8b` |
| Normal | `df789c67-eb9e-4d70-995c-cf0f97a7bf4e` |
| Low | `b491a89a-b3a6-493c-82ea-0892e1eff545` |

### Quarter (Field: `ff6a6e3b-1ebb-46bd-a9f0-3e1fde64e6fd`)
| Display | UUID |
|---------|------|
| Q1 2026 | `f8b0da05-c490-44cf-9412-464f3c837bce` |
| Q2 2026 | `1d7c30ed-d5f4-4c89-a782-69582c45ca01` |
| Q3 2026 | `4177e253-b263-48b6-a67d-6b7118a95985` |
| Q4 2026 | `3aae99da-823d-4950-a967-e54e5cbd24a2` |

### Phase (Field: `b89f3a3c-4522-4731-a8df-8a5cf4281dd6`) — Building Space only
Get UUIDs from a `get_task` response on any task in the Building space. Common values:
- Planning, Dev, Testing, Deployed

### Product Area (Field: `3d642d6a-095b-44d6-8f63-148777e31b2d`) — Building Space only
Get UUIDs from a `get_task` response. Common values:
- Auth, Webhooks, UI, API, Email, Integrations, Infrastructure

### Sprint (Field: `dc7be6b5-03ee-4158-a28d-8457cd6bc361`) — Building Space only
Get UUIDs from a `get_task` response. Values: Week 1 through Week 12.

## Number Fields (no UUID needed)

### Estimated Effort (Field: `f63ddbc4-4677-48ca-99c7-d8bb174d473e`)
Set as plain number: `{"id": "f63ddbc4-4677-48ca-99c7-d8bb174d473e", "value": 3}`

## Key Lists

| List | ID | Space |
|------|----|-------|
| Immediates (daily plans) | `901326290802` | Daily |
| Sprint 2 | `901324927980` | Building |
| Backlog | `901324927994` | Building |
| Bugs | `901324928003` | Building |
| Housekeeping | `901324928301` | Daily |
| Learning & Development | `901324928396` | Daily |

## Status Gotchas

| List | Working Statuses | Broken Statuses |
|------|-----------------|-----------------|
| Backlog | `to do` | `backlog`, `prioritized`, `ready` (don't exist via API) |
| Bugs | `testing`, `investigating`, `fixing`, `backlog`, `complete` | `reported`, `closed` |
| Sprint 1/2 | `backlog`, `planning`, `in progress`, `testing`, `ready for review`, `done` | — |
| Immediates | `to do`, `in progress`, `done` | — |
| Learning & Dev | `planned`, `learning`, `done`, `in progress` | — |

## Rules

1. **Never mark tasks "complete" or "done"** — use `ready for review`. Only Jimmy marks done after testing.
2. **No emojis in task names.**
3. **Always set ALL required custom fields**: Effort, Owner, Quarter minimum. Add Phase, Priority, Product Area, Sprint for Building space.
4. **Prefer fewer parent tasks with subtask checklists** over many standalone tasks.
5. **Task statuses for active work**: `CODE IS ON IT` when Claude is working, `JIMMY IS ON IT` when Jimmy is doing manual work (Sprint lists only).
6. **ClickUp API cannot move tasks between lists** — no `list_id` param on `update_task`.
7. **Full field reference**: `/Volumes/just_a_little_nerd/CLICKUP_FIELDS.md`

## Custom Field Template

```json
[
  {"id": "f63ddbc4-4677-48ca-99c7-d8bb174d473e", "value": 3},
  {"id": "3b3584e9-4da1-44e6-a628-2790ce50fb2f", "value": "4fe5ad0e-4437-4809-8622-5bf2b8424563"},
  {"id": "f8766d13-6f1f-4929-b7a6-228c9d3b27de", "value": "df789c67-eb9e-4d70-995c-cf0f97a7bf4e"},
  {"id": "ff6a6e3b-1ebb-46bd-a9f0-3e1fde64e6fd", "value": "f8b0da05-c490-44cf-9412-464f3c837bce"}
]
```
This sets: 3 hours effort, Owner=Claude Code, Priority=Normal, Quarter=Q1 2026.
