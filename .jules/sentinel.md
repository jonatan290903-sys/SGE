## 2025-05-22 - Mass Assignment Privilege Escalation
**Vulnerability:** Mass assignment on User model allowing any user to change their role or security flags via profile update or registration.
**Learning:** Default ModelSerializer behavior without explicit `read_only_fields` or restricted `fields` can expose sensitive internal state (like `role` or `must_change_password`) to external modification.
**Prevention:** Always use `read_only_fields` for sensitive attributes in update serializers and explicitly list safe fields in creation serializers.
