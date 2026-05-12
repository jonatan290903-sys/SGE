## 2025-05-15 - [API Optimization: Server-side counting]
**Learning:** Fetching a full list of objects only to calculate a count on the frontend is a significant performance anti-pattern. Large notification histories can cause slow page loads and unnecessary memory pressure.
**Action:** Always provide `count_only` or similar parameters for metadata-only requests. Use Django's `.count()` to perform the calculation at the database level.
