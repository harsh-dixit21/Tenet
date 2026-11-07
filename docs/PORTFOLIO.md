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
26. **Analyze portfolio concentration by institution.** Identify institutions with the largest matching face value and compare exact amounts and shares.
27. **Build a monthly ladder of active deposit maturities.** Group active maturity dates by calendar month in chronological order.
28. **Create a prioritized document gap worklist.** Rank active instruments by missing required categories and link directly to each record.
29. **Detect possible duplicate bank instrument numbers.** Find same-bank number collisions while ignoring case, Unicode width and incidental whitespace.
30. **Flag verified instruments with incomplete evidence metadata.** Surface missing evidence sources, references or valid dates without altering record status.
31. **Explore renewal and replacement successor relationships.** Inspect predecessor and successor states while handling unavailable predecessor records safely.
32. **Prioritize pending requests by elapsed age.** Show the oldest pending release, refund or discharge requests within the filtered portfolio.
33. **Search and scope audit activity to the current portfolio.** Filter authorized instrument events by actor and action tokens, newest first, with a bounded preview.
34. **Save account-scoped portfolio display preferences.** Persist only sort, direction, page size, column visibility and density locally; validate stored data and provide an explicit reset.
35. **Analyze maturity horizons and request ages at a chosen reporting date.** Choose a reporting reference date without implying historical balance reconstruction. Invalid amount ranges and reversed date ranges receive inline feedback.

## Scope and exports

Face-value totals include the lifecycle states currently selected. Choose **Active exposure only** to exclude drafts and terminal history. Calendar exports always exclude drafts and terminal instruments. CSV exports include all filtered results, across pages; selected exports include only selections within the current filters. JSON contains record metadata and required-document gaps, without attachment contents or evidence notes.

Display preferences are saved per account in this browser, rather than to Firebase. They contain only presentation settings. Filters, record selections and reporting dates are not saved with those preferences. Browser storage failures produce feedback and leave the portfolio usable.

The reporting date changes relative maturity horizons and pending-request ages against the current workspace snapshot. It does not reconstruct historical balances or audit permissions. Relationship links resolve only within the authorized snapshot. Duplicate-number and evidence-gap panels identify records for review and never change lifecycle state.

## Validation and design

Run `npm run test:portfolio` for the 35 portfolio regression cases. The complete utility, backend, tooling and portfolio suites contain 124 passing tests. The production build and repository checks pass. Browser verification covers 41 interactions and state checks, including exports, printing, reload persistence, keyboard navigation and collapsed/expanded layouts at 1440, 768 and 390 pixels. Browser flow validation uses the existing synthetic demo dataset; production Firebase credentials are not required by this feature.

The interface retains Tenet's dark palette, Inter typography and existing navigation shell. The design reference is **True-black flat**, seed `884981776`, with palette and type preserved and no redraws. The screen answers “Which deposits match this scope, and what needs attention?” through exact face-value totals, a maturity-ordered instrument ledger and expandable analytical worklists. The browser design inspector reports zero failures or warnings. Sample institutions and values remain the existing explicitly labeled synthetic demo data.
