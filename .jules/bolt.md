## 2025-05-11 - [API Optimization for UI counts]
**Learning:** Fetching full object lists just to show a count in a badge is a common but expensive anti-pattern. Implementing `count_only` on the backend and using it on the frontend reduces network payload from O(N) to O(1) and eliminates client-side filtering.
**Action:** Always check if a badge or summary only needs a count and provide a dedicated optimized endpoint or query parameter for it.
