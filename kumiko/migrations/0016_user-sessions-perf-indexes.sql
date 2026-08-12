-- Migration 0016_user-sessions-perf-indexes
--
-- Hand-authored: index-only, no entity-schema diff to generate from (same
-- pattern as 0009_job_run_logs_run_id_index). 0014 added store_user_sessions
-- with only a tenant_id index; user_id lookup (logout-everywhere, password
-- change) and expires_at cleanup scan the whole table.

CREATE INDEX IF NOT EXISTS "store_user_sessions_tenant_user_idx" ON "store_user_sessions" ("tenant_id", "user_id");
CREATE INDEX IF NOT EXISTS "store_user_sessions_expires_at_idx" ON "store_user_sessions" ("expires_at") WHERE "revoked_at" IS NULL;
