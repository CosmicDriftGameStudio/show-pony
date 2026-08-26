-- Migration 0021_drop-user-sessions-tenant-id-idx
--
-- Hand-authored: index-only drop. 0016 added store_user_sessions_tenant_user_idx
-- on (tenant_id, user_id), which covers pure tenant_id lookups — the 0014
-- store_user_sessions_tenant_id_idx is a prefix duplicate.

DROP INDEX IF EXISTS "store_user_sessions_tenant_id_idx";
