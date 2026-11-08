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
