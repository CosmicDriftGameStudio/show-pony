-- Migration 0032_drop-orphan-cap-counters
--
-- 0010 removed the cap-counter projection but left its DROP commented out, so
-- read_cap_counters stayed in every database. With row-level security on, the
-- boot check rejects this tenant table without policies. It is a projection;
-- its events stay in the event store.
DROP TABLE IF EXISTS "read_cap_counters";
