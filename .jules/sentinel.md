## 2025-05-15 - Missing Authorization on Grade and Attendance Modification
**Vulnerability:** Missing Role-Based Access Control (RBAC) on `guardar_nota` and `registrar_asistencia_bulk` endpoints.
**Learning:** Authenticated users were only checked for `IsAuthenticated` but not for specific roles or ownership/assignment (e.g., student vs. teacher).
**Prevention:** Always implement a granular access check (helper function) for any endpoint that modifies data, ensuring the user has the required role and is authorized for the specific resource (e.g., the subject they are assigned to).
