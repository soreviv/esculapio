# 2025-01-26 - [Structural Bottlenecks: Indexes & Compression]

## Learning

Foreign-key columns used heavily in JOINs and WHERE clauses (e.g. `patient_id`, `medico_id`) must have explicit indexes; PostgreSQL does **not** auto-index foreign keys. Without them, every lookup becomes a sequential scan.

## Action

Define indexes in both the Drizzle schema (`shared/schema.ts`) and the SQL migration (`migrations/0002_add_indexes.sql`) using the unified naming convention `idx_{table}_{column}` to avoid duplicates and keep both sources consistent.
