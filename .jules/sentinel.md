## 2025-05-15 - [Broken Access Control in Payments]
**Vulnerability:** Any authenticated user could view, modify, or delete payment records of any student, and access the school's financial summary.
**Learning:** Using `IsAuthenticated` alone in Django Rest Framework views is insufficient when data belongs to specific users or roles. This pattern was found across several apps in the repo.
**Prevention:** Implement explicit Role-Based Access Control (RBAC) and ownership checks using helper functions or custom permissions classes. Ensure students can only see their own data and restrict administrative actions.
