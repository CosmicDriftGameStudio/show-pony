# Changelog

Kumiko upgrades of this app, written by `kumiko-upgrade --apply`. Newest first.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.385.0] - 2026-10-21

### Changed

- @cosmicdrift/kumiko-*: 0.383.1 → 0.385.0

### Breaking

- 0.384.0 · Boot fails when a feature leaves a locale out of some of its translation keys
- 0.384.0 · Entity text fields must declare a personal stance

### Manual migrations

- [not-applicable] 0.384.0:c4e47f9e · 0.384.0 · Boot fails when a feature leaves a locale out of some of its translation keys
- [not-applicable] 0.384.0:dc44900b · 0.384.0 · Entity text fields must declare a personal stance

## [0.383.1] - 2026-10-21

### Changed

- @cosmicdrift/kumiko-*: 0.383.0 → 0.383.1

## [0.383.0] - 2026-10-20

### Changed

- @cosmicdrift/kumiko-*: 0.378.0 → 0.383.0

### Breaking

- 0.383.0 · Job handlers can return ctx.defer(ms)
- 0.383.0 · Placeholder reasons are rejected at boot and at runtime
- 0.383.0 · loadAllEventsByType and LOAD_ALL_EVENTS_ROW_LIMIT are removed
- 0.383.0 · metricField is removed from the screen type exports
- 0.383.0 · globalIpRateLimit and httpRouteRateLimit option onFailClosed is now onFailOpen
- 0.383.0 · runProdApp requires trustedProxyHops in production
- 0.383.0 · MetricSpec requires the object form with a label
- 0.383.0 · EditFieldsSection is either fields or groups
- 0.383.0 · HeaderActionsBar onError receives an ErrorNotice instead of a string
- 0.380.0 · Writes compile only for Writable tables or capable runners
- 0.379.0 · Overrides of locked templates are no longer served
- 0.379.0 · dsgvoSelfServiceFeatures removed
- 0.379.0 · Form draft content is encrypted per owner
- 0.379.0 · SSE entity signals follow the read access of the connection
- 0.379.0 · Global IP rate-limit middleware default matches runProdApp
- 0.379.0 · Direct writes on event-fed tables throw at runtime
- 0.379.0 · buildEntityTableMeta and observabilityOptions removed
- 0.379.0 · Re-export shim packages removed
- 0.379.0 · TenantDb.databaseNow
- 0.379.0 · HandlerContext.outsideTransaction removed
- 0.379.0 · kumiko check managed rejects loose Kumiko pins and a missing infraRef
- 0.379.0 · Forms ask before unsaved input is discarded
- 0.379.0 · Form writes carry a requestId and reuse it only for a safe retry

### Manual migrations

- [not-applicable] 0.383.0:9b3a6c92 · 0.383.0 · Job handlers can return ctx.defer(ms)
- [not-applicable] 0.383.0:e58d6a0e · 0.383.0 · Placeholder reasons are rejected at boot and at runtime
- [not-applicable] 0.383.0:85ebb6fc · 0.383.0 · loadAllEventsByType and LOAD_ALL_EVENTS_ROW_LIMIT are removed
- [not-applicable] 0.383.0:80e7d21f · 0.383.0 · metricField is removed from the screen type exports
- [not-applicable] 0.383.0:a8239cd8 · 0.383.0 · globalIpRateLimit and httpRouteRateLimit option onFailClosed is now onFailOpen
- [not-applicable] 0.383.0:9b2c3c63 · 0.383.0 · runProdApp requires trustedProxyHops in production
- [not-applicable] 0.383.0:5ecbdb44 · 0.383.0 · MetricSpec requires the object form with a label
- [not-applicable] 0.383.0:e2066a6a · 0.383.0 · EditFieldsSection is either fields or groups
- [not-applicable] 0.383.0:f0929413 · 0.383.0 · HeaderActionsBar onError receives an ErrorNotice instead of a string
- [not-applicable] 0.380.0:ba46c719 · 0.380.0 · Writes compile only for Writable tables or capable runners
- [migrated] 0.379.0:17824d40 · 0.379.0 · Overrides of locked templates are no longer served
- [not-applicable] 0.379.0:05314008 · 0.379.0 · dsgvoSelfServiceFeatures removed
- [not-applicable] 0.379.0:b076fcc4 · 0.379.0 · Form draft content is encrypted per owner
- [not-applicable] 0.379.0:c2bdf67a · 0.379.0 · SSE entity signals follow the read access of the connection
- [not-applicable] 0.379.0:fc65a329 · 0.379.0 · Global IP rate-limit middleware default matches runProdApp
- [not-applicable] 0.379.0:cac3018d · 0.379.0 · Direct writes on event-fed tables throw at runtime
- [not-applicable] 0.379.0:bb83981f · 0.379.0 · buildEntityTableMeta and observabilityOptions removed
- [not-applicable] 0.379.0:7fdb9b53 · 0.379.0 · TenantDb.databaseNow
- [not-applicable] 0.379.0:529404c8 · 0.379.0 · HandlerContext.outsideTransaction removed
- [migrated] 0.379.0:c0e25ffd · 0.379.0 · kumiko check managed rejects loose Kumiko pins and a missing infraRef
- [not-applicable] 0.379.0:033de70d · 0.379.0 · Forms ask before unsaved input is discarded
- [not-applicable] 0.379.0:4c9fd9f7 · 0.379.0 · Form writes carry a requestId and reuse it only for a safe retry

### Codemods applied

- 0.379.0 · scripts/codemod/package-merge.ts · Re-export shim packages removed
- 0.379.0 · scripts/codemod/feature-layout.ts · Client files of a feature live under web/

## [0.378.0] - 2026-10-20

### Changed

- @cosmicdrift/kumiko-*: 0.377.0 → 0.378.0

### Breaking

- 0.378.0 · Template editing is SystemAdmin-only unless the app unlocks it
- 0.378.0 · Boot check for projectionList writeHandler actions
- 0.378.0 · Designer screens are SystemAdmin-only unless the app passes access
- 0.378.0 · Renderer stylesheet no longer scans the document designer

### Manual migrations

- [migrated] 0.378.0:9ba4dbff · 0.378.0 · Template editing is SystemAdmin-only unless the app unlocks it
- [not-applicable] 0.378.0:bf2b6dab · 0.378.0 · Boot check for projectionList writeHandler actions
- [migrated] 0.378.0:2a2e894e · 0.378.0 · Designer screens are SystemAdmin-only unless the app passes access
- [migrated] 0.378.0:90f527f5 · 0.378.0 · Renderer stylesheet no longer scans the document designer

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

- [not-applicable] 0.377.0:6f304e9d · 0.377.0 · Provider contexts expose auditUserId instead of _userId
- [not-applicable] 0.377.0:2bbbe839 · 0.377.0 · JobContext._userId removed
- [not-applicable] 0.376.0:aed66582 · 0.376.0 · effectiveFeatures is gone from runProdApp, runDevApp and runWorkerApp
- [not-applicable] 0.376.0:55d4f0c1 · 0.376.0 · The default mail resolver only reaches members of the notifying tenant
- [not-applicable] 0.374.0:da980756 · 0.374.0 · tenant-caps:list pages by offset and rejects cursor
- [not-applicable] 0.374.0:c12fa0d0 · 0.374.0 · DashboardChartPanel.valueFormat only takes the currency format
- [not-applicable] 0.373.0:da1166ae · 0.373.0 · rateLimit accepts a list of buckets that are enforced all-or-nothing
- [not-applicable] 0.372.0:a4d33892 · 0.372.0 · Queued delivery jobs carry the recipient address sealed
- [not-applicable] 0.372.0:20a582e5 · 0.372.0 · Orphaned upload bytes are swept through a new upload ledger
- [migrated] 0.372.0:01af8eda · 0.372.0 · executor.detail() and executor.list() return EntityRow<E>, derived from the entity definition
- [not-applicable] 0.372.0:d9c8517f · 0.372.0 · Tokens carrying system or all lose those roles on verify
- [not-applicable] 0.372.0:459dc581 · 0.372.0 · http.route and the metric route label carry the route pattern, http.target is removed

### Codemods applied

- 0.372.0 · scripts/codemod/remove-engine-payload-casts.ts · executor.detail() and executor.list() return EntityRow<E>, derived from the entity definition
- 0.376.0 · scripts/codemod/testing-injection.ts · Test stack and seed helpers moved to @cosmicdrift/kumiko-dev-server/testing
- 0.377.0 · scripts/codemod/package-merge.ts · http moved into framework
