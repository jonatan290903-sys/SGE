## 2025-05-22 - [Optimized HorarioCurso View]
**Learning:** Significant performance bottlenecks in Django views often stem from N+1 query patterns during both record creation (individual `.create()` vs `bulk_create`) and business logic calculations (querying in loops vs memory-based aggregation).
**Action:** Use `bulk_create` to insert many objects, pre-fetch data into memory maps to avoid repeated `.get()` calls, and perform complex aggregations in Python rather than through multiple ORM queries when the dataset is manageable.
