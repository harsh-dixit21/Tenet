# Saved register views

On the Instrument register, Review queue or Maturity schedule, set the filters you use regularly. Enter a name under **Save current filters**, then select **Save view**. Each screen can keep up to five named views.

**Apply** restores the search, status, bank, sort order, maturity date range, active-only setting and rows per page. It returns the table to page one. The results and CSV export use the restored filters against the currently available records; saving a view does not freeze the records or their amounts.

**Delete** removes that saved view while keeping the current filters. To change a saved view, delete it and save the new filters under the same name. Names must contain 1–40 characters and are unique within a screen regardless of case. Invalid or reversed date ranges cannot be saved.

Views stay in this browser's local storage, separately for each signed-in account and screen. Demo views use a separate account scope. They do not sync to Firebase or another device. Clearing browser storage removes them. Institution-specific links remain governed by the current URL; those links are not part of a saved view. Saved filters never grant access to records outside the signed-in account's permissions.

If the browser blocks storage or its quota is full, Tenet displays an error and keeps your current filters usable. Avoid including sensitive information in view names or searches on a shared device. Unknown or malformed stored preferences are ignored safely.

Use **Copy filter link** next to the register filters to share the current view, or use the same action beside a saved view to share that preset. The link carries the filter values and any institution scope in the current URL. Opening it restores the filters on the same screen, starting on page one. Recipients see the records available to their account. Search text and bank names travel in the URL, so review the filters before sharing. If clipboard access is blocked, select and copy the displayed link.

Validation for the original saved-view release: production build, 20 utility tests, and seven browser checks covering save/apply, persistence after reload, duplicate names, deletion, phone layout and uncaught exceptions. The feature adds no dependencies or backend schema changes.

Use the name field with Rename using name to rename a preset. Update filters replaces that preset's filter settings with the current table settings. Saved presets show a status, bank and lifecycle summary. Open tabs receive saved-view changes through browser storage events.
