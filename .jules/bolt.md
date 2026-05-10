## 2025-05-22 - [Optimized Notification Count Fetching]
**Learning:** Fetching a full list of notifications and filtering on the frontend to display a count is an anti-pattern that increases payload size and client-side processing. Database-level counting is significantly more efficient.
**Action:** Always provide `count_only` or similar parameters in list endpoints when the UI only needs a summary count.
