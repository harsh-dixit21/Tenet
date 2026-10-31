# Current operating limits

Tenet implements authenticated workflow commands, private evidence, role checks, audit history and computed reminders. The current release does not connect to banks, verify a deposit against a banking system, transfer funds, send email or run scheduled notification delivery. An official records external verification evidence and remains responsible for its accuracy.

Workspace reads are bounded: record and request queries reject views above 500 items, user management is also bounded, and audit history returns the 200 most recent events. No archival interface or cursor-based server pagination is supplied yet. Browser pagination only divides the loaded view. Plan an archive/export strategy before approaching these bounds.

Each instrument accepts up to 100 document versions, each at most 1 MiB. Files remain private and versioned. The current application has no automated retention deletion, legal hold, malware scanning or record cancellation flow. Set retention periods and a controlled deletion process with the institution before using sensitive production data. Do not describe a CSV export as a complete backup.

Reminder and escalation thresholds are editable within server bounds (1–365 and 1–90 days respectively). Alerts are calculated from the current snapshot; marking them read is per account. These are operational prompts, not proof that an external deadline has been satisfied.

The Google provider and real persistence require an owner-created Firebase project, authorized domain and deployed backend. A frontend deployment alone does not activate them. Production recovery, monitoring, billing alerts and backup policies remain owner configuration tasks.
