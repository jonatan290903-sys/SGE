## 2026-05-19 - Notification Badge Optimization
**Learning:** Fetching all notifications just to filter and count them client-side in the Layout component is a significant performance bottleneck as the notification history grows.
**Action:** Always implement server-side filtering and counting for high-frequency UI elements like notification badges. Adding `count_only` and `unread_only` query parameters reduced the response payload size and processing time by ~86% for 100 notifications.
