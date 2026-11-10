# Evidence and activity browsing

The document library combines category, institution, instrument status, format, checksum availability and upload-date filters. Search requires every token to match. Latest versions only keeps the newest upload in each category for each instrument. Turn it off to inspect historical versions. Sorting supports newest, oldest, filename and file size. Twenty files appear per page, while counts, byte totals, category summaries and exports cover all filtered files.

The document CSV and JSON indexes contain metadata. Evidence content and private Storage paths are excluded from these indexes. Downloads continue to use the existing authorization checks. Checksum unavailable identifies older or demo metadata without a recorded digest. Size unavailable distinguishes legacy metadata from measured file sizes.

Audit history searches actions, roles, instrument IDs and structured details. Date filters use calendar days in Asia/Kolkata and include both endpoints. Choose workspace or instrument activity, newest or oldest order, and 20, 50 or 100 actions per page. Toggle structured details for compact browsing. CSV exports contain the matching action summaries. Detailed JSON retains the matching event payloads. Copy event ID supplies a precise reference for an administrator.

Audit history in a live workspace remains limited to the latest 200 loaded server events. Browser filters and pagination operate on that loaded history. Exports share that same limit.

Alerts can be filtered by search, reminder type, institution, instrument status and unread state. Unread first ordering prioritizes reminders still awaiting acknowledgment. Mark filtered read adds the matching reminders to existing read markers. Mark all read retains its workspace-wide behavior. The exported reminder CSV reflects current filters and read state. Reading a reminder records acknowledgment and leaves its instrument lifecycle intact.

Reset actions restore each screen's default filters. A reversed document-date interval displays guidance and returns no results. Empty screens retain their filters so you can broaden the search. All these controls use the records already available to the current account.
