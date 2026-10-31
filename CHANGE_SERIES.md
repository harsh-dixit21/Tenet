# Tenet: 100 incremental improvements

Each numbered item is an actual source, validation, test, tooling or documentation change. Final checks are recorded after the series. Firebase production activation still requires the owner’s project and billing setup.

1. Record the scope and acceptance criteria for the improvement series
2. Format document sizes consistently
3. Resolve current document versions by category
4. Calculate missing verification document categories
5. Calculate readiness from required documents
6. Centralize the active-deposit lifecycle definition
7. Normalize deposit values to integer paise
8. Sum deposits without floating-point drift
9. Build status reports from a shared aggregation
10. Aggregate bank-wise deposit exposure
11. Aggregate maturity windows for active instruments
12. Support accent-insensitive multi-term record searches
13. Calculate pending-case age with a future-date guard
14. Centralize pending request filtering
15. Rank cases by correction and maturity urgency
16. Filter ISO dates through inclusive ranges
17. Escape CSV cells including whitespace-prefixed formulas
18. Parse workspace routes without crashing on bad encodings
19. Validate document uploads before reading file bytes
20. Generate readable initials for assigned account roles
21. Detect successor conflicts before offering renewal actions
22. Reject non-printing control characters in workflow text
23. Normalize Unicode text and duplicate instrument keys
24. Bound supported instrument dates to prevent year-entry errors
25. Require a trusted actor identity for every mutation
26. Reject malformed workflow command containers
27. Reject unrecognized account roles before command dispatch
28. Detect invalid persisted lifecycle statuses
29. Prevent an instrument from being its own predecessor
30. Reject verification evidence dated before instrument issuance
31. Prevent officials from returning their own submissions
32. Check request and instrument institution consistency
33. Prevent request authors from deciding their own requests
34. Protect existing successor links from reassignment
35. Detect stale record edits with optimistic revision checks
36. Bind idempotency receipts to canonical command payloads
37. Reject malformed and noncanonical document encodings
38. Reject path separators and bidirectional overrides in file names
39. Persist server-generated checksums for private documents
40. Bound callable payload sizes before workflow processing
41. Validate and deduplicate per-user alert read markers
42. Test hidden control-character rejection
43. Test Unicode normalization across labels and uniqueness keys
44. Test supported date bounds and leap dates
45. Test mutation rejection without actor identity
46. Test invalid command container rejection
47. Test unknown account roles cannot mutate records
48. Test corrupted lifecycle state rejection
49. Test self-referencing successor rejection
50. Test verification chronology against issue dates
51. Test self-review rejection on correction requests
52. Test cross-institution request consistency checks
53. Test request authors cannot later approve their own request
54. Test existing predecessor links cannot be reassigned
55. Test stale revision rejection and matching revision acceptance
56. Test command fingerprints ignore object property order
57. Test command fingerprints detect changed values and array order
58. Test canonical base64 validation rejects malformed padding
59. Test document checksums cover exact uploaded bytes
60. Test payload limits count UTF-8 bytes rather than characters
61. Test alert read marker validation and deduplication
62. Add bank filtering and multi-term priority search to the register
63. Filter the instrument register by inclusive maturity date ranges
64. Add an active-only register view that excludes closed lifecycle records
65. Paginate long register lists while preserving complete filtered exports
66. Add a single clear-filters action and explicit export counts
67. Show a required-document checklist on each instrument
68. Validate upload extensions and expose readable sizes and integrity checksums
69. Add printable instrument details with a readable paper stylesheet
70. Export an instrument metadata snapshot without private file payloads
71. Filter closure requests by type and prioritize the oldest cases
72. Filter audit history by assigned actor role
73. Toggle current document versions separately from historical uploads
74. Add bank exposure and maturity-window management reports
75. Use integer-paise totals and formula-safe exports throughout the workspace
76. Align dashboard readiness and successor actions with verification requirements
77. Harden deep links and standardize role avatar labels
78. Add a credential-safe Firebase environment validator
79. Add a read-only backend deployment preflight
