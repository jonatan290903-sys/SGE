## 2025-05-22 - [Optimized Notification Count Fetching]
**Learning:** Fetching a full list of objects only to count them on the client is a significant overhead. Implementing server-side `count_only` using Django's `.count()` is much more efficient as it avoids object serialization and large network payloads.
**Action:** Always check if a frontend "badge" or "count" can be satisfied by a dedicated lightweight endpoint or query parameter.

## 2025-05-22 - [DRF Testing with force_authenticate]
**Learning:** When testing DRF endpoints, use `APITestCase` instead of standard `TestCase` to easily use `self.client.force_authenticate(user)`.
**Action:** Use `APITestCase` for all API-related tests in the backend.
