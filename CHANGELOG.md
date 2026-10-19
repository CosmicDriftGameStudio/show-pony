# Changelog

Kumiko upgrades of this app, written by `kumiko-upgrade --apply`. Newest first.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.377.0] - 2026-10-19

### Changed

- @cosmicdrift/kumiko-*: 0.371.1 → 0.377.0

### Breaking

- 0.377.0 · Provider contexts expose auditUserId instead of _userId
- 0.377.0 · JobContext._userId removed
- 0.376.0 · Test stack and seed helpers moved to @cosmicdrift/kumiko-dev-server/testing
- 0.376.0 · effectiveFeatures is gone from runProdApp, runDevApp and runWorkerApp
- 0.376.0 · The default mail resolver only reaches members of the notifying tenant
- 0.374.0 · tenant-caps:list pages by offset and rejects cursor
- 0.374.0 · DashboardChartPanel.valueFormat only takes the currency format
- 0.373.0 · rateLimit accepts a list of buckets that are enforced all-or-nothing
- 0.372.0 · Queued delivery jobs carry the recipient address sealed
- 0.372.0 · Orphaned upload bytes are swept through a new upload ledger
- 0.372.0 · executor.detail() and executor.list() return EntityRow<E>, derived from the entity definition
- 0.372.0 · Tokens carrying system or all lose those roles on verify
- 0.372.0 · http.route and the metric route label carry the route pattern, http.target is removed

### Manual migrations

- [open] 0.377.0:6f304e9d · 0.377.0 · Provider contexts expose auditUserId instead of _userId
- [open] 0.377.0:2bbbe839 · 0.377.0 · JobContext._userId removed
- [open] 0.376.0:aed66582 · 0.376.0 · effectiveFeatures is gone from runProdApp, runDevApp and runWorkerApp
- [open] 0.376.0:55d4f0c1 · 0.376.0 · The default mail resolver only reaches members of the notifying tenant
- [open] 0.374.0:da980756 · 0.374.0 · tenant-caps:list pages by offset and rejects cursor
- [open] 0.374.0:c12fa0d0 · 0.374.0 · DashboardChartPanel.valueFormat only takes the currency format
- [open] 0.373.0:da1166ae · 0.373.0 · rateLimit accepts a list of buckets that are enforced all-or-nothing
- [open] 0.372.0:a4d33892 · 0.372.0 · Queued delivery jobs carry the recipient address sealed
- [open] 0.372.0:20a582e5 · 0.372.0 · Orphaned upload bytes are swept through a new upload ledger
- [open] 0.372.0:01af8eda · 0.372.0 · executor.detail() and executor.list() return EntityRow<E>, derived from the entity definition
- [open] 0.372.0:d9c8517f · 0.372.0 · Tokens carrying system or all lose those roles on verify
- [open] 0.372.0:459dc581 · 0.372.0 · http.route and the metric route label carry the route pattern, http.target is removed

### Codemods applied

- 0.372.0 · scripts/codemod/remove-engine-payload-casts.ts · executor.detail() and executor.list() return EntityRow<E>, derived from the entity definition
- 0.376.0 · scripts/codemod/testing-injection.ts · Test stack and seed helpers moved to @cosmicdrift/kumiko-dev-server/testing
- 0.377.0 · scripts/codemod/package-merge.ts · http moved into framework
