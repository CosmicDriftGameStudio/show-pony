# Changelog

Kumiko upgrades of this app, written by `kumiko-upgrade --apply`. Newest first.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.403.0] - 2026-10-31

### Changed

- @cosmicdrift/kumiko-*: 0.392.0 → 0.403.0

### Breaking

- 0.402.0 · The inbound mail supervisor requires a lock and the dedup anchor is unique
- 0.402.0 · Agent manifest labels are one string in the requested locale
- 0.401.0 · Boot rejects a user reference with personal: false and file accept entries that never match
- 0.400.0 · An untouched money field is no longer submitted as 0
- 0.396.0 · Entity writes on a row the caller cannot read fail with not_found
- 0.395.0 · Content collections edit in plain or document format; rich and markdown are gone
- 0.395.0 · A managed page body is Markdown or an editor document, edited in the document editor
- 0.394.0 · Mail account handlers are stricter and the trusted authserv-id has its own handler
- 0.394.0 · The mailbox row action Reconnect is folded into Reactivate
- 0.394.0 · The OAuth callback only connects a personal mailbox for the account that signed in
- 0.394.0 · inbound-message-received is v3 and inbound-message-content-fetched is v2
- 0.394.0 · Personal mail is private to its owner, roles are configurable
- 0.394.0 · Remove subscription-dodo, replaced by subscription-paddle

### Manual migrations

- [not-applicable] 0.402.0:d9c675b2 · 0.402.0 · The inbound mail supervisor requires a lock and the dedup anchor is unique
- [not-applicable] 0.402.0:cc1593bc · 0.402.0 · Agent manifest labels are one string in the requested locale
- [not-applicable] 0.401.0:5e91ab7e · 0.401.0 · Boot rejects a user reference with personal: false and file accept entries that never match
- [not-applicable] 0.400.0:c746cec7 · 0.400.0 · An untouched money field is no longer submitted as 0
- [not-applicable] 0.396.0:bfd9c878 · 0.396.0 · Entity writes on a row the caller cannot read fail with not_found
- [migrated] 0.395.0:5cab5fbc · 0.395.0 · A managed page body is Markdown or an editor document, edited in the document editor
- [not-applicable] 0.394.0:f48819c6 · 0.394.0 · Mail account handlers are stricter and the trusted authserv-id has its own handler
- [not-applicable] 0.394.0:e96e1ab5 · 0.394.0 · The mailbox row action Reconnect is folded into Reactivate
- [not-applicable] 0.394.0:4413a827 · 0.394.0 · The OAuth callback only connects a personal mailbox for the account that signed in
- [not-applicable] 0.394.0:99b6cef7 · 0.394.0 · inbound-message-received is v3 and inbound-message-content-fetched is v2
- [not-applicable] 0.394.0:7662810d · 0.394.0 · Personal mail is private to its owner, roles are configurable
- [not-applicable] 0.394.0:4c2809a9 · 0.394.0 · Remove subscription-dodo, replaced by subscription-paddle

### Codemods applied

- 0.395.0 · scripts/codemod/content-collection-format.ts · Content collections edit in plain or document format; rich and markdown are gone

## [0.392.0] - 2026-10-25

### Changed

- @cosmicdrift/kumiko-*: 0.391.0 → 0.392.0

### Breaking

- 0.392.0 · The managed Dockerfile reads the registry token from a BuildKit secret

### Manual migrations

- [not-applicable] 0.392.0:ffc424c8 · 0.392.0 · The managed Dockerfile reads the registry token from a BuildKit secret

## [0.391.0] - 2026-10-25

### Changed

- @cosmicdrift/kumiko-*: 0.390.1 → 0.391.0

## [0.390.1] - 2026-10-24

### Changed

- @cosmicdrift/kumiko-*: 0.390.0 → 0.390.1

## [0.390.0] - 2026-10-24

### Changed

- @cosmicdrift/kumiko-*: 0.389.0 → 0.390.0

### Breaking

- 0.390.0 · Tenant streams and rows live on the system tenant, seed defaults changed
- 0.390.0 · HandlerContext without wiring, hooks receive the HandlerContext
- 0.390.0 · HandlerContext and JobContext use namespaces instead of flat members
- 0.390.0 · Feature AST, pattern library and codemods moved to @cosmicdrift/kumiko-feature-ast
- 0.390.0 · Jobs append their own events with ctx.events.append
- 0.390.0 · Jobs see whether they can still defer (ctx.canDefer)
- 0.390.0 · meilisearch is an optional peer dependency
- 0.390.0 · Framework subpaths no longer export names without a user
- 0.390.0 · preQuery hooks removed
- 0.390.0 · createTenantDb mode system requires a reason
- 0.390.0 · RLS boot check tells known tables from orphaned ones
- 0.390.0 · rowLevelSecurity defaults to "on"
- 0.390.0 · Boot hooks with a db dependency get a system-scoped db at rowLevelSecurity "on"
- 0.390.0 · runInSystemRowLevelSecurityScope and systemScopedRunner take a reason
- 0.390.0 · A projection write under a tenant scope can no longer land in another tenant
- 0.390.0 · happy-dom and undici updated for security advisories
- 0.390.0 · extraContext factories get the raw db in the test stack and dev
- 0.390.0 · The test stack runs with row level security on as role kumiko_app
- 0.390.0 · The dev server runs with row level security on

### Manual migrations

- [migrated] 0.390.0:24ed4ba0 · 0.390.0 · Tenant streams and rows live on the system tenant, seed defaults changed
- [not-applicable] 0.390.0:c2e924b0 · 0.390.0 · Jobs append their own events with ctx.events.append
- [not-applicable] 0.390.0:98616096 · 0.390.0 · Jobs see whether they can still defer (ctx.canDefer)
- [migrated] 0.390.0:1670c6c2 · 0.390.0 · meilisearch is an optional peer dependency
- [not-applicable] 0.390.0:cfeaff80 · 0.390.0 · Framework subpaths no longer export names without a user
- [not-applicable] 0.390.0:8ea1076e · 0.390.0 · preQuery hooks removed
- [not-applicable] 0.390.0:b1f2c39d · 0.390.0 · createTenantDb mode system requires a reason
- [not-applicable] 0.390.0:85949cd3 · 0.390.0 · RLS boot check tells known tables from orphaned ones
- [migrated] 0.390.0:9b65d050 · 0.390.0 · rowLevelSecurity defaults to "on"
- [migrated] 0.390.0:79e2595f · 0.390.0 · Boot hooks with a db dependency get a system-scoped db at rowLevelSecurity "on"
- [not-applicable] 0.390.0:a0e444ab · 0.390.0 · runInSystemRowLevelSecurityScope and systemScopedRunner take a reason
- [not-applicable] 0.390.0:b02c020a · 0.390.0 · A projection write under a tenant scope can no longer land in another tenant
- [migrated] 0.390.0:320382d4 · 0.390.0 · happy-dom and undici updated for security advisories
- [migrated] 0.390.0:0d310ad7 · 0.390.0 · extraContext factories get the raw db in the test stack and dev
- [migrated] 0.390.0:d3b22cd6 · 0.390.0 · The test stack runs with row level security on as role kumiko_app
- [migrated] 0.390.0:e1c37b50 · 0.390.0 · The dev server runs with row level security on

### Codemods applied

- 0.390.0 · scripts/codemod/ctx-namespaces.ts · HandlerContext without wiring, hooks receive the HandlerContext
- 0.390.0 · scripts/codemod/feature-ast-package.ts · Feature AST, pattern library and codemods moved to @cosmicdrift/kumiko-feature-ast

## [0.389.0] - 2026-10-23

### Changed

- @cosmicdrift/kumiko-*: 0.388.0 → 0.389.0

### Breaking

- 0.389.0 · isPrincipalBlocked is no longer exported from sessions
- 0.389.0 · Bun.SQL replaces postgres-js as the only Postgres driver
- 0.389.0 · Money list aggregates answer one value per currency
- 0.389.0 · FeatureRegistrar types moved to @cosmicdrift/kumiko-types/feature-registrar
- 0.389.0 · relatedList groupBy replaced by table.grouping
- 0.389.0 · Unused ProviderPluginContext helpers removed
- 0.389.0 · provider selector option labels are unique per owner
- 0.389.0 · captureClosedConnectionError returns a Bun.SQL error
- 0.389.0 · e2e tests fail after more than 8 app boots; the per-test client IP no longer disables the HTTP cache
- 0.389.0 · BootOptionName drops demoMode, seeds and signals
- 0.389.0 · DbConnection, DbTx and PgClient are Bun.SQL types and postgres is no longer a peer dependency
- 0.389.0 · DataTable rowGrouping removed

### Manual migrations

- [not-applicable] 0.389.0:ea3eee55 · 0.389.0 · isPrincipalBlocked is no longer exported from sessions
- [migrated] 0.389.0:40d38105 · 0.389.0 · Bun.SQL replaces postgres-js as the only Postgres driver
- [not-applicable] 0.389.0:c1c92c96 · 0.389.0 · Money list aggregates answer one value per currency
- [not-applicable] 0.389.0:27381b29 · 0.389.0 · FeatureRegistrar types moved to @cosmicdrift/kumiko-types/feature-registrar
- [not-applicable] 0.389.0:db22828f · 0.389.0 · relatedList groupBy replaced by table.grouping
- [not-applicable] 0.389.0:201a7e61 · 0.389.0 · Unused ProviderPluginContext helpers removed
- [not-applicable] 0.389.0:761b33b4 · 0.389.0 · provider selector option labels are unique per owner
- [not-applicable] 0.389.0:715ee7b4 · 0.389.0 · captureClosedConnectionError returns a Bun.SQL error
- [not-applicable] 0.389.0:eef12ba6 · 0.389.0 · e2e tests fail after more than 8 app boots; the per-test client IP no longer disables the HTTP cache
- [not-applicable] 0.389.0:6d477801 · 0.389.0 · BootOptionName drops demoMode, seeds and signals
- [not-applicable] 0.389.0:447ebcc7 · 0.389.0 · DbConnection, DbTx and PgClient are Bun.SQL types and postgres is no longer a peer dependency
- [not-applicable] 0.389.0:12b95cee · 0.389.0 · DataTable rowGrouping removed

## [0.388.0] - 2026-10-22

### Changed

- @cosmicdrift/kumiko-*: 0.385.0 → 0.388.0

### Breaking

- 0.388.0 · A catalog with several providers no longer throws an ambiguous-provider error
- 0.388.0 · runAsDirectCallEntry renamed to runAsAgentToolCallEntry
- 0.388.0 · billing boot option takes stripe and/or dodo
- 0.388.0 · Input gets kind "code" and autoFocus on kind "text"

### Manual migrations

- [not-applicable] 0.388.0:41caf008 · 0.388.0 · A catalog with several providers no longer throws an ambiguous-provider error
- [not-applicable] 0.388.0:bb5a35e3 · 0.388.0 · runAsDirectCallEntry renamed to runAsAgentToolCallEntry
- [not-applicable] 0.388.0:ada45613 · 0.388.0 · billing boot option takes stripe and/or dodo
- [not-applicable] 0.388.0:45bde48d · 0.388.0 · Input gets kind "code" and autoFocus on kind "text"

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
