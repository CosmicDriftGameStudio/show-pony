-- Migration 0009_job_run_logs_run_id_index
--
-- Hand-authored: index-only, no entity-schema diff to generate from. 0004
-- created read_job_run_logs without an index on run_id, which job-detail
-- screens filter by — full-table scan per lookup as the table grows.

CREATE INDEX IF NOT EXISTS "read_job_run_logs_run_id_idx" ON "read_job_run_logs" ("run_id");
