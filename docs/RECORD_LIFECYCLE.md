# Instrument lifecycle

1. An onboarded Institution saves a Draft or submits Awaiting verification. Bank, branch, instrument number, valid issue/maturity dates and a positive INR amount are required. The issue date cannot be future-dated and must precede maturity.
2. The Institution supplies the three required document categories. A different Reviewer or Admin records source, reference, note and a verification date between issue date and today.
3. A successful review produces Verified. A correction note instead produces Discrepancy. The Institution can edit, upload new versions and resubmit a complete returned record.
4. A Verified record can enter a closure request or have a linked successor. These paths cannot run concurrently while a successor is pending.
5. A closure request produces Release requested. Rejection returns Verified; approval produces Released, Refunded or Discharged according to request type.

Renewed and Replaced identify predecessor records closed by verification of their successor. These and Released, Refunded and Discharged are terminal for active exposure calculations. Drafts are also excluded from active exposure.

Each successful command adds a server-derived audit event. Client-supplied identities cannot replace the authenticated actor. Commands with an expectedUpdatedAt revision reject stale edits; refresh the workspace and reapply the intended change after checking the latest record. No automatic bank transfer occurs when a status changes.
