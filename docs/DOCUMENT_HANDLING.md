# Supporting documents

The three required categories are Instrument copy, Bank letter and Declaration. Approval letter and Other are optional and do not increase verification completeness. The latest version in each category appears in the checklist. Historical versions remain available in the document library by clearing Latest versions only.

An Institution account can upload to its own Draft, Awaiting verification or Discrepancy records. Documents lock after verification. Uploading a correction creates the next version in that category; it does not overwrite earlier metadata. There is a 100-version total limit per instrument.

Files must be non-empty and no larger than 1 MiB. Accepted pairs are PDF/.pdf, PNG/.png, JPEG/.jpg or .jpeg, and plain text/.txt. The server also checks file signatures (or absence of null bytes for text), rejects path separators and directional override characters in names, and stores content in a private bucket. These checks do not constitute malware scanning.

SHA-256 is calculated from the exact bytes by the server and stored in metadata. Copy checksum allows an operator to compare a downloaded file using Get-FileHash -Algorithm SHA256 in PowerShell. Older demo documents may have no checksum. Download permission is checked against the current account and instrument each time. Export metadata omits document content and storage paths; it is not a document backup.
