## 2026-05-17 - Optimized Notification Counting

**Learning:** Fetching a full list of objects only to filter and count them on the frontend is a common O(N) performance anti-pattern. As the user's notification history grows, this payload becomes increasingly heavy for the network and the browser.

**Action:** Implement `count_only` and `unread_only` parameters on the backend to leverage database-level counting and return a minimal O(1) response. Use this specialized endpoint for UI elements like unread badges.
