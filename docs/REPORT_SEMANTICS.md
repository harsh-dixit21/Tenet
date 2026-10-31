# Reports and exports

Amounts are stored as integer paise by the live backend. Aggregations sum amountMinor and convert to INR for display. Legacy demo records without amountMinor derive it by rounding amount times 100. Invalid unsafe integers contribute zero rather than contaminating totals.

Active exposure excludes Draft, Released, Refunded, Discharged, Renewed and Replaced. Bank and status summaries use the supplied record set; bank exposure is not a credit-risk assessment. Maturity summaries use active records only and calendar-day windows: overdue, today through 7 days, 8–30, 31–90 and later. Dates use the Asia/Kolkata business day by default.

Register search is case-insensitive and accent-insensitive. Every space-separated search token must occur somewhere in the searchable record text. Bank, status, maturity range and active-only filters combine. A reversed date interval intentionally returns no matches. Priority sorting places discrepancies and near/overdue maturity higher; it is an operational aid.

Pagination affects visible rows only. CSV exports contain the full filtered set, with the export count shown beside the action. String values beginning with whitespace followed by =, +, - or @ are prefixed with an apostrophe to reduce spreadsheet formula execution. Quotes are doubled and every cell is quoted.

JSON metadata exports omit file data and Storage paths. Neither export substitutes for a consistent backend backup. The live snapshot currently caps each record/request collection view at 500 items and recent audit history at 200 events; reports are bounded to that available workspace view.
