## 2025-01-26 - [Structural Bottlenecks: Indexes & Compression]
**Learning:** This codebase lacked fundamental database indexes on foreign keys (`patient_id`), which would cause O(n) table scans for every patient history lookup. It also lacked response compression, wasting bandwidth.
**Action:** Always check schema definitions for missing indexes on foreign keys, especially in high-read paths. Always check server config for basic compression middleware.
