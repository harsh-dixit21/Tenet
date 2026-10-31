# Renewal and replacement

Start from a Verified instrument and choose Renew or Replace. The new submission retains the predecessor link and institution. A renewal must extend the predecessor's maturity date. A replacement can use another valid maturity date after its own issue date.

The predecessor remains Verified while the successor is a draft, submitted or returned for correction. This preserves the existing security deposit until a different reviewer verifies the successor and its required evidence. Verification closes the predecessor as Renewed or Replaced atomically with the successor update.

Only one active successor is allowed. The detail screen hides successor actions when one already exists, and the backend checks again inside the transaction. Closing the original through release/refund/discharge is also blocked while a successor is pending. Existing predecessor links cannot be reassigned through editing.

If an operator creates the wrong successor, do not edit database documents manually to bypass the workflow. The current application has no cancellation or deletion command; escalate to the owner with both record IDs and audit evidence for an approved recovery procedure. Do not create another duplicate to conceal the mistake.

Bank plus instrument number is normalized for Unicode compatibility, case and repeated whitespace before uniqueness hashing. A duplicate rejection should be resolved by locating the existing instrument, not changing cosmetic spacing or case. Historical predecessor and successor links are part of the institutional record.
