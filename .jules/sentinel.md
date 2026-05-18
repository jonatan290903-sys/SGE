## 2025-05-15 - [BOLA and RBAC in Payments]
**Vulnerability:** Broken Object Level Authorization (BOLA) and missing Role-Based Access Control (RBAC) in the payments module.
**Learning:** Authenticated users (students) could access any payment record by ID and view the full list of payments including those belonging to other students. Additionally, financial summaries were exposed to all authenticated users.
**Prevention:** Always implement row-level filtering for list views based on the user's role and ownership, and explicitly check permissions in detail views and summary endpoints.
