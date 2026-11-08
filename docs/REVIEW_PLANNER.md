# Personal review planner

Open **Review planner** from the workspace navigation. Tasks belong to this account in this browser. Only tasks linked to currently authorized instruments appear or leave through exports. No task action changes a bank record, role, verification decision or financial request.

## Features

1. **Create an account-scoped personal review planner.** Create persistent browser tasks linked to authorized instruments; validate stored data and preserve it on read or write failures.
2. **Schedule personal review task due dates.** Set optional calendar due dates when creating tasks, with strict date validation.
3. **Assign high medium or low review priorities.** Distinguish urgent reviews from routine follow-up without altering financial authorization.
4. **Categorize personal reviews by workflow.** Label tasks as document, verification, maturity, request or general follow-up.
5. **Keep private follow-up notes with review tasks.** Store bounded multiline personal notes locally and render them as plain text.
6. **Complete and reopen personal review tasks.** Track personal completion separately from the linked instrument lifecycle.
7. **Edit existing review task titles.** Rename personal tasks while preserving identity, creation time and instrument linkage.
8. **Reschedule and revise existing task follow-up details.** Edit due dates, priority, category and personal notes together, with the same validation as new tasks.
9. **Delete review tasks with a recoverable undo action.** Confirm deletions and restore the most recently deleted task while it remains authorized and capacity permits.
10. **Search review tasks across titles notes and instrument IDs.** Apply accent-insensitive multi-token task search within authorized records.
11. **Scope personal tasks to one instrument.** Inspect all personal follow-up for a single authorized deposit.
12. **Isolate high priority personal reviews.** Combine priority and instrument scope to build focused review queues.
13. **Separate open and completed personal review queues.** Keep current work and finished follow-up independently searchable.
14. **Find overdue due-today and unscheduled review tasks.** Filter personal due dates against the current India calendar date, with inclusive seven-day boundaries.
15. **Order personal tasks by due date priority recency or title.** Sort deterministically and immutably; unscheduled work follows dated work in due-date order.
16. **Organize personal follow-up in a due-date agenda.** Group matching tasks into overdue, today, next seven days, later and unscheduled work without double-counting.
17. **Complete selected personal review tasks in bulk.** Select matching tasks and complete them together, excluding hidden and unauthorized instruments.
18. **Reschedule selected review tasks together.** Apply or clear one due date across the currently selected authorized tasks.
19. **Duplicate a review task as independent open follow-up.** Copy task context to a new identity while resetting completion and creation timestamps.
20. **Export filtered personal review tasks as safe CSV.** Download the current task queue, including personal notes, with the existing formula-safe CSV encoder.
21. **Back up authorized personal review tasks as versioned JSON.** Export the full authorized personal task collection rather than just the current filtered queue.
22. **Preview and merge personal task backups without overwrites.** Validate JSON shape, capacity, duplicate IDs and authorized instrument references before an explicit import.
23. **Export open scheduled review tasks to a calendar.** Generate all-day iCalendar events with escaped Unicode-safe lines, stable task IDs and no personal notes.
24. **Generate deduplicated missing-document follow-up tasks.** Create one personal task per missing required category on active authorized instruments; repeated generation skips existing sources.
25. **Generate personal reviews for incomplete verification evidence.** Suggest high-priority tasks for verified or release-requested records with incomplete evidence metadata.
26. **Generate upcoming maturity-review tasks within a chosen horizon.** Suggest due-dated personal reviews for active maturities in the next 1–365 days, prioritizing the next week.
27. **Generate follow-up tasks for aging pending requests.** Suggest high-priority personal tasks for authorized pending requests past a configurable age threshold.
28. **Keep a bounded personal task activity trail.** Record created, edited, rescheduled, completed, reopened and deleted task actions locally without copying note contents into the history.
29. **Add bounded checklists to personal review tasks.** Create and edit up to ten named steps, preserve completion for unchanged labels, and toggle individual steps.
30. **Show review checklist completion progress.** Display accessible progress and exact completed-step counts while leaving parent-task completion under user control.
31. **Pin important reviews above ordinary queue items.** Keep marked tasks first across task sort modes and retain pin state in browser storage.
32. **Work through a ranked next-review focus queue.** Show one open task at a time, prioritizing pins, urgency and due dates, then advance automatically after completion.
33. **Summarize the personal review workload with reconciled counts.** Show current authorized open, overdue, due-today and completed task counts independently of queue filters. Archived tasks are excluded from these workload totals.
34. **Synchronize personal task changes across browser tabs.** Refresh matching-account data on storage changes, ignore other accounts, and block saving over unreadable external updates.
35. **Archive completed personal tasks and restore them later.** Move completed work out of the active queue without deleting it; retain backups and generation deduplication, and automatically restore a task when reopened.

## Storage and scope

Tasks are stored per signed-in account in this browser. Demo mode has its own planner key. Browser tabs for the same account synchronize through storage events; tasks are not uploaded to Firebase or shared with another user. Tasks whose instruments leave the authorized workspace snapshot remain stored but are hidden and excluded from exports. Bulk operations act only on matching selected tasks linked to authorized instruments.

The planner holds at most 200 tasks, including archived tasks and tasks currently hidden by access scope. Titles support 120 characters, notes 1000 characters, and checklists ten steps of at most 80 characters each. Completed checklist steps do not automatically complete their parent task. Duplicating a task resets completion, pins, archive state and checklist completion, and removes its suggestion source key.

Unreadable stored data is preserved. The planner blocks writes until valid data is restored in another tab or the user explicitly confirms removal of the unreadable account data. Failed saves leave the previous stored and visible task collection unchanged. Deletion undo is available for the most recent deletion during the current visit, subject to capacity and current instrument access.

## Backups and calendar files

CSV contains the current filtered task queue, including personal notes, and uses the existing formula-safe encoder. JSON backs up all currently authorized tasks, including archived tasks, notes and checklists. Local activity history is not part of the task backup. Imports accept files up to 2 MB, validate the versioned task schema and instrument references, preview additions, and skip existing task IDs. Importing never overwrites an existing ID; capacity and authorization are checked again when the preview is applied.

Calendar exports include only open tasks with due dates. They contain task titles, instrument IDs, category and priority, and exclude personal notes. Dates are all-day events with exclusive next-day end dates, stable task UIDs, escaped content and UTF-8-safe folded lines. Task due dates and agenda boundaries use the current India calendar date. Imported timestamps are ordered as instants, including timestamps with timezone offsets.

## Suggestions and history

Suggestions use the currently authorized workspace snapshot. Document suggestions cover missing required categories on active instruments. Evidence suggestions cover incomplete verification metadata. Maturity suggestions cover active upcoming maturities in a chosen 1–365-day horizon. Pending-request suggestions cover authorized pending requests at least 1–90 days old, according to the selected threshold. Generating suggestions is an explicit user action and never sends notifications or makes financial decisions.

Suggestion source keys prevent repeated generation for the same source, including completed and archived tasks. A batch that would exceed capacity fails without saving a partial batch. The planner reports how many tasks were added, or that no new tasks were needed.

The personal history keeps the latest 100 local task actions, omits note contents and respects current instrument access. It is separate from the institution's server audit trail and is not tamper-resistant evidence.

## Validation and design

`npm run test:planner` runs 38 regression tests and is included in GitHub validation. The complete planner, portfolio, utility, backend and tooling suites contain 162 passing tests. The production build, output validation, tracked-file scan and size check pass. Browser verification covers 56 checks, including create/edit/delete/undo, checklist progress, focus mode, bulk changes, archived work, backup preview and merge, exports, real cross-tab updates, corrupt storage recovery, quota failures and keyboard access.

Desktop, tablet and phone layouts were checked at 1440, 768 and 390 pixels with both collapsed and expanded controls. Source lint and browser design inspection report zero failures or warnings. The design reference is **True-black flat**, seed `1510637236`, with Tenet's palette, Inter typography and shell preserved and no redraws. The screen answers “What should I review next?” through a task ledger linked to instruments, exact workload counts and visible checklist progress. Browser fixtures are explicitly synthetic personal review tasks linked to the existing demo instruments; no production credentials or records are required by the validation flow.
