## 2025-05-15 - Mass Assignment in User Registration and Profile Update
**Vulnerability:** Privilege Escalation via Mass Assignment.
**Learning:** The `RegisterSerializer` and `UserSerializer` included the `role` field in their `fields` list without making it read-only, allowing any user to register as a 'directivo' (Admin) or escalate their privileges after registration.
**Prevention:** Always use `read_only_fields` for sensitive attributes in `ModelSerializer` and explicitly list fields in `RegisterSerializer` to exclude administrative roles.
