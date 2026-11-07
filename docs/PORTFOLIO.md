# Deposit portfolio

Open **Portfolio** in the workspace navigation. All calculations use the currently authorized local workspace snapshot. Filters and analytical panels do not execute financial decisions. Amounts use integer paise; face value includes the selected lifecycle states.

## Features

1. **Add searchable deposit portfolio workspace.** Search all tokens across institutions, bank, branch, record IDs and instrument numbers, with accent-insensitive matching and exact paise totals.
2. **Filter portfolio by bank.** Select one bank from the authorized dataset.
3. **Filter portfolio by institution.** Combine institution and bank scopes without changing source records.
4. **Filter portfolio by lifecycle status.** Inspect one lifecycle stage independently of the main register.
5. **Isolate active portfolio exposure.** Exclude drafts and terminal lifecycle states from exposure analysis.
6. **Filter instruments by document readiness.** Identify complete instruments or those missing required document categories.
7. **Filter portfolio by minimum face value.** Use inclusive minimum amounts with exact decimal-to-paise parsing.
8. **Filter portfolio by maximum face value.** Apply an inclusive upper amount bound, including zero.
9. **Inspect an inclusive maturity date window.** Limit results by maturity dates and reject reversed or invalid ranges.
10. **Inspect instruments by issue period.** Combine issuance periods with maturity and amount criteria.
11. **Apply quick maturity horizon presets.** Review overdue exposure or active maturities in 7, 30 or 90 days, relative to the reporting date.
12. **Sort portfolio by value date institution or lifecycle stage.** Apply deterministic ascending or descending sorting without mutating records.
13. **Page large portfolios with adjustable result counts.** Show 10, 25 or 50 rows with a truthful range; clamp pages after filters reduce results.
14. **Customize visible portfolio table columns.** Hide optional columns while retaining instrument links and a fixed export schema.
15. **Offer compact portfolio row density.** Switch to denser instrument rows while preserving control hit areas and readable numbers.
16. **Select individual instruments or an entire portfolio page.** Keep selections across pages and restrict bulk actions to selected records inside the current filters.
17. **Summarize selected value and maturity span.** Calculate selected face value, instrument count and earliest/latest maturity dates.
18. **Compare up to four selected instruments side by side.** Compare values, dates, banks, lifecycle states and missing document categories.
19. **Export the entire filtered portfolio as safe CSV.** Export all matching results in sorted order, across pages, using formula-safe CSV encoding.
20. **Export a structured portfolio snapshot without attachment contents.** Download versioned JSON with explicit INR/paise units and reporting date; exclude uploaded files and evidence notes.
21. **Export only selected in-scope instruments.** Download an independent CSV of selected rows, excluding hidden or no-longer-authorized records.
22. **Export active deposit maturities as calendar events.** Generate all-day iCalendar events with stable IDs, exclusive end dates, escaped content and UTF-8 line folding.
23. **Print a complete filtered portfolio report.** Print all filtered results with reporting date and reconciled totals, regardless of on-screen pagination or hidden columns.
24. **Copy filtered instrument IDs with a manual clipboard fallback.** Copy one record ID per line in current sort order and provide a selectable fallback when clipboard access fails.
25. **Analyze portfolio concentration by bank.** Rank banks by face value and show their share of filtered exposure with exact totals.
