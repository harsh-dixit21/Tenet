# Incident and recovery procedure

For an unexpected operation failure, record the timestamp, record ID, action and displayed error. Refresh once before retrying. A stale-revision error means another operation changed the record; compare the refreshed state before resubmitting. Do not repeatedly click approval buttons.

Command IDs are idempotency keys. A retry with the same ID and same payload returns the original result. A reused ID with different content is rejected. Keep a request ID with the operation during diagnostic retries; do not manufacture a new ID merely to bypass a conflict.

If an account is compromised, an authorized Admin should disable its profile using Account access. Preserve audit entries and review actions performed by that UID. If all administrators are unavailable, restoration requires the project owner's approved Firebase procedure; changing INITIAL_ADMIN_EMAIL alone does not reset the existing bootstrap lock.

For suspected document corruption, compare the downloaded file's SHA-256 with stored metadata and preserve the original evidence. Do not overwrite versions. Private Storage access and Firestore access remain denied to direct clients.

Before any database restoration, export the affected state and identify the recovery point. Firestore records, audit history, uniqueness markers, command receipts and private Storage objects must remain consistent. This application does not ship an automatic rollback or restore tool. Test a recovery in an isolated project before touching production. Avoid placing sensitive record contents in public issues or logs.
