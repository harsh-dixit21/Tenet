# Snapshot comparison

Open **Snapshot comparison** and download a baseline JSON file. Open that file in the same workspace mode when you want to compare it with the current records. Baselines contain instrument and request metadata. Document contents, storage paths, verification notes and request reasons are excluded. Keep baseline files with the workspace records they describe.

The comparison lists current instruments by ID. Baseline instruments absent from the current workspace contribute only to the unavailable count. Absence may reflect scope changes. Maturity windows use the same reference day for both snapshots and default to the current India calendar date. The face value delta uses matched instruments in the filtered results and sums integer paise exactly.

CSV and JSON exports cover all matching pages. The JSON report includes the baseline capture time, workspace mode, maturity reference day and exact aggregate delta. Baseline imports accept version 1 files up to 8 MB with up to 500 instruments and 500 linked requests.

## Features

1. Download a metadata baseline from the workspace
2. Open validated same-mode baseline files
3. Identify instruments newly present in the current snapshot
4. Count unavailable baseline instruments without revealing their details
5. Compare recorded lifecycle states
6. Track instrument face value changes in integer paise
7. Detect revised maturity dates
8. Detect revised instrument issue dates
9. Track changes to the recorded bank
10. Track changes to the recorded bank branch
11. Flag changes to the bank instrument number
12. Compare recorded institution names across snapshots
13. Detect changes to predecessor links
14. Compare renewal and replacement classifications
15. Track uploaded evidence counts
16. Track latest instrument copy evidence versions
17. Track latest bank letter evidence versions
18. Track latest declaration evidence versions
19. Track latest approval letter evidence versions
20. Track latest other evidence versions
21. Compare the recorded verification date
22. Track the number of linked closure requests
23. Compare pending closure request counts
24. Compare approved closure request counts
25. Compare rejected closure request counts
26. Identify instruments entering or leaving active exposure
27. Compare maturity windows against a shared reference day
28. Compare completeness of required evidence categories
29. Show individual closure request decisions by request reference
30. Identify newly linked and unavailable request references
31. Calculate exact face value change for comparable instruments
32. Filter comparison differences by change group
33. Search comparison results using current instrument details
34. Scope comparison results and value change to a current institution
35. Include unchanged instruments for baseline reconciliation
36. Rank comparable instruments by absolute face value change
37. Page through comparison results in groups of ten instruments
38. Export all filtered comparison rows as formula-safe CSV
39. Export structured comparison findings and baseline provenance
40. Clear an open baseline and invalidate pending file reads
41. Choose a common reporting date for maturity window comparisons
42. Isolate active exposure without hiding instruments that exited it
