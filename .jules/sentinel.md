## 2025-05-15 - [Mass Assignment in DRF Serializers]
**Vulnerability:** Mass assignment vulnerability on User model fields `role` and `must_change_password`.
**Learning:** In Django REST Framework, using `ModelSerializer` without explicitly defining `read_only_fields` can allow users to update sensitive fields if they are included in the `fields` tuple. This is particularly dangerous for fields like `role` which controls access control.
**Prevention:** Always explicitly define `read_only_fields` in DRF serializers for any field that should not be modifiable by the client. For registration serializers, exclude privileged fields from the `fields` tuple entirely to ensure default values are used.
