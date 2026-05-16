## 2025-05-15 - [Missing Authorization in Payments Module]
**Vulnerability:** Broken Object Level Authorization (BOLA) / IDOR in payment endpoints. Any authenticated user could access and modify any payment record.
**Learning:** Generic `IsAuthenticated` permission is insufficient for sensitive financial data. Specific role-based filters and ownership checks must be implemented in the views.
**Prevention:** Always implement ownership checks (e.g., `pago.estudiante.user == request.user`) and role-based access control for administrative endpoints (e.g., `resumen_pagos`).
