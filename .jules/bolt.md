## 2025-05-22 - [Batch Attendance Requests]
**Learning:** The frontend's daily attendance view was making N separate API calls (one per subject) to fetch data, leading to high latency and network overhead. Batching these into a single course-level endpoint reduces requests by ~80-90% for a typical school day.
**Action:** Always look for patterns where the frontend iterates over a list of IDs and makes individual requests; these are prime candidates for batching optimizations.
