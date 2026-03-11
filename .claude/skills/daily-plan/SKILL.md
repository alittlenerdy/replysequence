---
name: daily-plan
description: Create a daily plan in ClickUp Immediates list with proper parent task and subtasks. Use when starting a new day's work, planning tasks, or when the user says "daily plan" or "what should I work on today".
---

# Daily Plan Creation

You are creating a structured daily plan in ClickUp's Immediates list.

## Setup

- **List**: Immediates (`901326290802`)
- **Space**: Daily (`901313027185`)
- **Workspace**: `9013469200`

## Workflow

### Step 1: Gather context
1. Check what's in progress across all spaces:
   - Search ClickUp for tasks with status "in progress" or "CODE IS ON IT"
   - Check for overdue tasks
2. Review the backlog triage file: `/Users/j1mmy/.claude/projects/-Volumes-just-a-little-nerd-replysequence/memory/backlog-triage-2026-03-11.md`
3. Check today's date for any due dates

### Step 2: Create parent task
```
clickup_create_task:
  list_id: "901326290802"
  name: "Daily Plan - [Month Day, Year]"  (e.g., "Daily Plan - March 11, 2026")
  due_date: "[today's date]"
  priority: "high"
  custom_fields:
    - id: "f63ddbc4-4677-48ca-99c7-d8bb174d473e"  # Effort
      value: [total estimated hours]
    - id: "3b3584e9-4da1-44e6-a628-2790ce50fb2f"  # Owner
      value: "4fe5ad0e-4437-4809-8622-5bf2b8424563"  # Claude Code
    - id: "ff6a6e3b-1ebb-46bd-a9f0-3e1fde64e6fd"  # Quarter
      value: "f8b0da05-c490-44cf-9412-464f3c837bce"  # Q1 2026
```

### Step 3: Create subtasks
For each planned item, create a subtask under the parent:
```
clickup_create_task:
  list_id: "901326290802"
  parent: "[parent task ID]"
  name: "[task description]"  # No emojis!
  due_date: "[today's date]"
  priority: "[urgent/high/normal/low]"
  custom_fields:
    - id: "f63ddbc4-4677-48ca-99c7-d8bb174d473e"  # Effort
      value: [hours]
    - id: "3b3584e9-4da1-44e6-a628-2790ce50fb2f"  # Owner
      value: "[appropriate UUID]"
    - id: "ff6a6e3b-1ebb-46bd-a9f0-3e1fde64e6fd"  # Quarter
      value: "f8b0da05-c490-44cf-9412-464f3c837bce"
```

### Step 4: Present the plan
Show the user a summary table:

| Priority | Task | Owner | Effort | Status |
|----------|------|-------|--------|--------|
| ...      | ...  | ...   | ...    | ...    |

Include total estimated hours and recommended order of execution.

## Rules

1. **No emojis** in task names
2. **Every subtask** gets: Effort, Owner, Quarter, due date, priority
3. **Owner values**: Claude Code = `4fe5ad0e-...`, Me = `050c2977-...`, Manual = `eba69a85-...`
4. **Prefer 5-8 subtasks** — enough to fill the day without overwhelming
5. **Order by priority**: Urgent > High > Normal > Low
6. **Flag blockers**: If a task depends on external input (e.g., Google OAuth), note it
7. **Total effort should be 6-8 hours** for a realistic day
