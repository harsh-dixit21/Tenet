# Controls review

Open **Controls review** from the workspace navigation or choose **Review instrument controls** from an instrument. The screen checks the loaded records and requests available to the account. It shows inconsistencies and items for review, with links back to instruments.

Checks run on the loaded workspace before the screen narrows the results. That preserves comparisons with a predecessor already present in the snapshot when an institution or instrument filter is active. Request and predecessor checks need the related records to be present. Demo mode marks checks for missing live identities as skipped.

The findings CSV covers every matching row across pages. The summary CSV lists the matching checks, their evaluation state, and their finding counts. Both exports use formula-safe CSV encoding and contain references and check descriptions. Document contents, storage paths, and actor identifiers stay in the source workspace.

## Checks

1. Reconcile stored rupees and paise in workspace controls review
2. Detect invalid instrument amounts
3. Identify invalid instrument issue dates
4. Identify invalid instrument maturity dates
5. Flag maturities on or before issue dates
6. Flag future instrument issue dates
7. Check bank branch and instrument identifiers
8. Detect missing live institution identifiers
9. Detect missing live submission creators
10. Flag matching submission and verification identities
11. Detect missing live verifier identities
12. Flag verification evidence dated before issue
13. Flag verification evidence dated in the future
14. Validate recorded verification timestamps
15. Flag updates timestamped before record creation
16. Detect returned instruments without correction instructions
17. Find repeated document identifiers within an instrument
18. Identify invalid evidence version numbers
19. Find duplicate evidence versions within a category
20. Find gaps in evidence version sequences
21. Flag unrecognized evidence categories
22. Check stored evidence sizes against upload bounds
23. Validate recorded SHA-256 metadata format
24. Check stored evidence type against filename extension
25. Flag future evidence upload dates
26. Find instruments with multiple pending closure requests
27. Check pending requests against instrument lifecycle
28. Find release-requested instruments without a pending request
29. Check closure request and instrument institution identifiers
30. Flag closure decisions with overlapping actor identities
31. Flag renewals that fail to extend predecessor maturity
32. Detect circular predecessor chains

## Review tools

33. Filter control findings and catalogue by category
34. Search controls and their instrument references
35. Hide controls without matching findings during triage
36. Scope controls review to a selected institution
37. Separate data inconsistencies from review prompts
38. Page through every matching control finding
39. Link directly to individual workspace checks
40. Export filtered findings across all pages as safe CSV
41. Export check coverage with evaluated and skipped states
42. Open a record-scoped controls review from instrument details
