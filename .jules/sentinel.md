## 2025-05-14 - Mass Assignment in User Profiles
**Vulnerability:** The `role` field in the `User` model was not protected in DRF serializers, allowing users to specify a privileged role (e.g., 'administrativo') during registration or profile update.
**Learning:** Default `ModelSerializer` behavior includes all model fields if not explicitly restricted. In multi-role applications, sensitive fields like `role`, `is_staff`, or `is_superuser` must always be `read_only` or excluded from public-facing serializers.
**Prevention:** Always use `read_only_fields` for sensitive attributes and strictly define `fields` in registration serializers instead of using `__all__`.
