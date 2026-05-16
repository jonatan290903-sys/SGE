## 2025-05-16 - Server-side Notification Counting
**Learning:** Fetching the full list of notifications on the frontend just to count unread items is a major performance anti-pattern. Using a database-level `COUNT` query with server-side filtering reduces network payload and memory overhead.
**Action:** Always check if a 'count-only' or 'unread-only' parameter exists or can be added to list endpoints that are frequently polled or used for badges.
