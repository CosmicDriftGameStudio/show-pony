# Changelog

Kumiko upgrades of this app, written by `kumiko-upgrade --apply`. Newest first.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.425.1] - 2026-11-20

### Changed

- @cosmicdrift/kumiko-*: 0.425.0-next-20261120062848-a44b984 → 0.425.1

## [0.425.0-next-20261120062848-a44b984] - 2026-11-20

### Changed

- @cosmicdrift/kumiko-*: 0.425.0-next-20261119155716-cdbf386 → 0.425.0-next-20261120062848-a44b984

### Breaking

- 0.425.0 · _refs carry money and located timestamps in the detail shape

### Manual migrations

- [not-applicable] 0.425.0:24d4699a · 0.425.0 · _refs carry money and located timestamps in the detail shape

## [0.425.0-next-20261119155716-cdbf386] - 2026-11-19

### Changed

- @cosmicdrift/kumiko-*: 0.425.0-next-20261119100036-007d227 → 0.425.0-next-20261119155716-cdbf386

### Breaking

- 0.425.0 · Test-ES-Row-Writes guard checks app and library tests

### Manual migrations

- [not-applicable] 0.425.0:d1f0b7f7 · 0.425.0 · Test-ES-Row-Writes guard checks app and library tests

## [0.425.0-next-20261119100036-007d227] - 2026-11-19

### Changed

- @cosmicdrift/kumiko-*: 0.424.1 → 0.425.0-next-20261119100036-007d227

### Breaking

- 0.425.0 · Mail and PDF renderers live in bundled-features, document-draft and signature print without injected functions
- 0.425.0 · Tenant admins act only on users within their own reach
- 0.425.0 · The anonymous deletion verify mail comes from user-data-rights
- 0.425.0 · GDPR default mails need an app name and follow the request language
- 0.425.0 · User-data adapter features merged into their owner features
- 0.425.0 · Deletion grace period is the maximum over the user's tenants with a 7-day floor
- 0.425.0 · Custom managed-pages layouts get escaped parts only
- 0.425.0 · Published page list always reads the caller's tenant
- 0.425.0 · Branding exports removed from managed-pages
- 0.425.0 · Branding is its own feature
- 0.425.0 · Ledger reports filter the period in SQL and require ISO dates
- 0.425.0 · Ledger reversal and schedule links moved out of reference
- 0.425.0 · Agent write tools keep optimistic locking
- 0.425.0 · Doc-only translations for kumiko api-docs
- 0.425.0 · Agent lint fails on missing handler translations
- 0.425.0 · API docs generator on its own subpath
- 0.425.0 · Public pages send default-src 'none' and form-action 'none'
- 0.425.0 · Signature requests are visible through their host row
- 0.425.0 · forget-signer checks the host record
- 0.425.0 · WhatsApp test double moved to channel-whatsapp/testing
- 0.425.0 · WhatsApp PII under per-stream record keys, opt-in retention
- 0.425.0 · S3 endpoint and forcePathStyle are SystemAdmin-writable only
- 0.425.0 · Stricter field-approval rules
- 0.425.0 · Storage provider selection is SystemAdmin-only
- 0.425.0 · credentialRevoker extension point replaces the session mass-revoke callbacks
- 0.425.0 · User email lookups and writes are case-insensitive
- 0.425.0 · Row-bound grants verify the signature before the row lookup
- 0.425.0 · late-bound slot helper removed
- 0.425.0 · Prebuilt addNoteHandler constant removed
- 0.425.0 · admin-shell workspaces collect navs; includeDocumentDesigner removed
- 0.425.0 · Ingest progress is a direct store write on the TenantDb
- 0.425.0 · Prebuilt tag and note handler constants removed
- 0.425.0 · Legacy tag catalog handlers removed
- 0.425.0 · caps:usage hands cap callbacks a tenant-scoped db without unsafeRaw
- 0.425.0 · Tenant caps list sorts by key and searches through the search index
- 0.425.0 · autoRevokeOnPasswordChange option and late binding removed
- 0.425.0 · Session check rejects removed members and no longer falls back to JWT roles on errors
- 0.425.0 · Audit payloads follow the entity read rules; payload can be null
- 0.425.0 · Tenant row version follows the destruction stage events
- 0.425.0 · r.httpRoute gets deps.hostTenantId(); managed-pages and seo default to it; createHostTenantIdResolver is removed
- 0.425.0 · Mail-thread rollup and read_mail_threads removed
- 0.425.0 · message:list pages with a cursor
- 0.425.0 · OAuth connect state is bound to the starting browser
- 0.425.0 · Idempotent send from a mailbox
- 0.425.0 · Send idempotency keys bound to caller and mailbox
- 0.425.0 · Renderer plugins are picked by kind with selectRendererPlugin
- 0.425.0 · One request core for the static login and the token flows
- 0.425.0 · Default auth pages cover every auth path and take a shell
- 0.425.0 · Token request handlers no longer return the token
- 0.425.0 · Resource upload always links into a template
- 0.425.0 · Template reads follow tenantEditable roles
- 0.425.0 · Read override on text blocks narrows to SYSTEM only
- 0.425.0 · User-owned entry titles and folders are personal data
- 0.425.0 · Text-block writes reject external images and embeds
- 0.425.0 · Delivery log no longer accepts old cursors
- 0.425.0 · Queued delivery renders inside the send job and seals the message content
- 0.425.0 · No plaintext addresses in delivery jobs
- 0.425.0 · files feature only under @cosmicdrift/kumiko-framework/files
- 0.425.0 · Prebuilt folder handler constants removed
- 0.425.0 · Folder assignments enforce ownership.write
- 0.425.0 · MFA revoke bindings removed; regenerate-recovery also revokes access tokens
- 0.425.0 · Tier sync follows the subscription events; drift sync runs daily
- 0.425.0 · Custom fields enforce read roles and the searchable flag
- 0.425.0 · Per-field custom-field retention removed
- 0.425.0 · Custom fields only on wired host entities
- 0.425.0 · One custom-fields value projection for all wired host entities
- 0.425.0 · Job triggers on events only
- 0.425.0 · forget-subject erases the key after commit and forgets forgetWithSubject rows
- 0.425.0 · Document drafts are visible through their subject row
- 0.425.0 · SMTP requires STARTTLS unless the host is loopback or allowlisted
- 0.425.0 · PAT auto-revoke option and late binding removed
- 0.425.0 · PATs of principals without a user row are rejected
- 0.425.0 · Field read rules the framework cannot enforce fail at boot
- 0.425.0 · Production boot requires real login and MFA rate limiters
- 0.425.0 · JWT verify pins HS256 and requires a kid in keyring mode
- 0.425.0 · /version drops the node field
- 0.425.0 · Deprecated money, PII, schema and webhook aliases removed
- 0.425.0 · Join rows respect the host's query roles
- 0.425.0 · Rebuild guards the single-table contract
- 0.425.0 · Entity cache removed
- 0.425.0 · Entity handlers with the verb in the name string are internal
- 0.425.0 · Event pruning removes whole streams only
- 0.425.0 · Write-handler job triggers carry the written row id
- 0.425.0 · Lean update, delete and forget events and executor createMany/updateMany
- 0.425.0 · Named entity verbs, executor history and listAsOf
- 0.425.0 · Anonymous writes under the system tenant need tenantlessAnonymous
- 0.425.0 · Money amounts are integers in minor units everywhere
- 0.425.0 · Projection list shows implicit entity projections
- 0.425.0 · Entity rows follow their stream version; list and detail drop the per-row event-store lookup
- 0.425.0 · SessionMassRevoker type removed
- 0.425.0 · AuthSessionStatus gains not_a_member
- 0.425.0 · Boot rule transfer/multi-stream-projection
- 0.425.0 · Boot rule transfer/custom-projection
- 0.425.0 · Workflow engine, workflow-runner and step-dispatcher removed
- 0.425.0 · step-dispatcher feature removed
- 0.425.0 · workflow-runner feature removed
- 0.425.0 · App connections carry their projection registry
- 0.425.0 · ctx.db rows are typed from the entity table
- 0.425.0 · ctx.db.unsafeRaw() stays in the caller's tenant
- 0.425.0 · createTenantDb on the db subpath is tenant-only
- 0.425.0 · Every event append states its concurrency expectation
- 0.425.0 · Free query helpers are typed
- 0.425.0 · Query handlers declare their result entity
- 0.425.0 · Breaking changesets declare affects
- 0.425.0 · listDefaults replaces bundledLists, adoptsBundledLists removed
- 0.425.0 · Entities carry their name
- 0.425.0 · escapeHatch names its grants
- 0.425.0 · Registrar verbs take one options object; r.useExtension becomes r.applyExtension
- 0.425.0 · parentRef and the join features name their hosts
- 0.425.0 · Returned query failures are thrown
- 0.425.0 · Unmapped colon queries need resultEntity
- 0.425.0 · onDelete cascades run automatically in the delete lifecycle
- 0.425.0 · A record key that an owner forget erases holds only that owner's data
- 0.425.0 · Fuzzy-searchable longText fields cannot restrict access.read
- 0.425.0 · systemScope handlers get ctx.systemDb typed as present
- 0.425.0 · A missing migrations directory fails the prod boot
- 0.425.0 · updateRows and deleteRows refuse event-sourced entity tables without a reason
- 0.425.0 · Scaffolded Playwright config uses ports.e2e
- 0.425.0 · Video tooling on its own subpath
- 0.425.0 · runProdApp defaults to Secure session cookies
- 0.425.0 · Production boot defaults for kmsMode and staticDir
- 0.425.0 · composeFeatures listDefaults applies to all features
- 0.425.0 · Unused entity, handler payload and handler result type maps removed
- 0.425.0 · Step definitions drop the unused failure strategy
- 0.425.0 · Ratchet guards fail without a baseline file
- 0.425.0 · lib-test-coverage ignore tags cite an existing test file
- 0.425.0 · Handler layout and feature import cycles are guarded
- 0.425.0 · seed-runtime-imports guard
- 0.425.0 · test-env-writes ratchet and suite env helpers
- 0.425.0 · File Size guard limits test files to 1500 lines
- 0.425.0 · test-timeouts flags literal Playwright timeouts and extended test objects
- 0.425.0 · Test guard opt-outs move to kumiko-lint-ignore
- 0.425.0 · Ratchet baselines with headroom fail
- 0.425.0 · Unused kumiko-lint-ignore markers fail the guard run
- 0.425.0 · Payload casts in handlers count as suspect casts
- 0.425.0 · Existence-only checks on queries fail, existence-only tests are ratcheted
- 0.425.0 · securityBaselineFeatures preset removed
- 0.425.0 · kumiko check verifies test script timeouts
- 0.425.0 · Overrides of Kumiko packages fail the managed-files check
- 0.425.0 · Managed ci.yml covers e2e shards and full Chromium, checks run on pull requests only
- 0.425.0 · setupAppTestStack is the one app test entry
- 0.425.0 · Managed kumiko/schema.ts and kumiko check read listDefaults
- 0.425.0 · App test stacks gate tiers like runDevApp
- 0.425.0 · Handlers are defined with defineWriteHandler/defineQueryHandler
- 0.425.0 · adoptsBundledLists pattern removed
- 0.425.0 · Upgrade codemods up to 0.420.0 removed
- 0.425.0 · Currency cells format with Intl and an ISO currency code
- 0.425.0 · Unused web exports removed
- 0.425.0 · Drawer widget props type is DrawerPanelProps
- 0.425.0 · formatMoney takes an options object
- 0.425.0 · Every CorePrimitive is required, createStubPrimitives replaces partial test stubs

### Manual migrations

- [not-applicable] 0.425.0:85fe49d3 · 0.425.0 · Mail and PDF renderers live in bundled-features, document-draft and signature print without injected functions
- [not-applicable] 0.425.0:bb0d0f09 · 0.425.0 · Tenant admins act only on users within their own reach
- [not-applicable] 0.425.0:ef03b7ed · 0.425.0 · The anonymous deletion verify mail comes from user-data-rights
- [not-applicable] 0.425.0:26e73d2b · 0.425.0 · GDPR default mails need an app name and follow the request language
- [not-applicable] 0.425.0:b320ee9c · 0.425.0 · User-data adapter features merged into their owner features
- [not-applicable] 0.425.0:a7eb9241 · 0.425.0 · Deletion grace period is the maximum over the user's tenants with a 7-day floor
- [not-applicable] 0.425.0:14486a57 · 0.425.0 · Custom managed-pages layouts get escaped parts only
- [not-applicable] 0.425.0:d30fb9d9 · 0.425.0 · Published page list always reads the caller's tenant
- [migrated] 0.425.0:0fbf8862 · 0.425.0 · Branding exports removed from managed-pages
- [migrated] 0.425.0:101e26aa · 0.425.0 · Branding is its own feature
- [not-applicable] 0.425.0:4334f46e · 0.425.0 · Ledger reports filter the period in SQL and require ISO dates
- [not-applicable] 0.425.0:955b780c · 0.425.0 · Ledger reversal and schedule links moved out of reference
- [not-applicable] 0.425.0:ad472bdf · 0.425.0 · Agent write tools keep optimistic locking
- [not-applicable] 0.425.0:d13dba3d · 0.425.0 · Doc-only translations for kumiko api-docs
- [migrated] 0.425.0:97845ccc · 0.425.0 · Agent lint fails on missing handler translations
- [not-applicable] 0.425.0:3974b59c · 0.425.0 · API docs generator on its own subpath
- [migrated] 0.425.0:b1730a4c · 0.425.0 · Public pages send default-src 'none' and form-action 'none'
- [not-applicable] 0.425.0:1121f886 · 0.425.0 · Signature requests are visible through their host row
- [not-applicable] 0.425.0:25979949 · 0.425.0 · forget-signer checks the host record
- [not-applicable] 0.425.0:e3487cf6 · 0.425.0 · WhatsApp test double moved to channel-whatsapp/testing
- [not-applicable] 0.425.0:ea8cc854 · 0.425.0 · WhatsApp PII under per-stream record keys, opt-in retention
- [not-applicable] 0.425.0:0ddd6f52 · 0.425.0 · S3 endpoint and forcePathStyle are SystemAdmin-writable only
- [not-applicable] 0.425.0:4721f527 · 0.425.0 · Stricter field-approval rules
- [not-applicable] 0.425.0:7061e469 · 0.425.0 · Storage provider selection is SystemAdmin-only
- [not-applicable] 0.425.0:20e04b90 · 0.425.0 · credentialRevoker extension point replaces the session mass-revoke callbacks
- [migrated] 0.425.0:e7f738c0 · 0.425.0 · User email lookups and writes are case-insensitive
- [not-applicable] 0.425.0:b35cea07 · 0.425.0 · Row-bound grants verify the signature before the row lookup
- [not-applicable] 0.425.0:0896171d · 0.425.0 · late-bound slot helper removed
- [not-applicable] 0.425.0:8db069b9 · 0.425.0 · Prebuilt addNoteHandler constant removed
- [migrated] 0.425.0:17a8aa7c · 0.425.0 · admin-shell workspaces collect navs; includeDocumentDesigner removed
- [not-applicable] 0.425.0:0a43d3c4 · 0.425.0 · Ingest progress is a direct store write on the TenantDb
- [not-applicable] 0.425.0:33cdcb27 · 0.425.0 · Prebuilt tag and note handler constants removed
- [not-applicable] 0.425.0:32d58b6b · 0.425.0 · Legacy tag catalog handlers removed
- [not-applicable] 0.425.0:1913a2a5 · 0.425.0 · caps:usage hands cap callbacks a tenant-scoped db without unsafeRaw
- [not-applicable] 0.425.0:813a54a9 · 0.425.0 · Tenant caps list sorts by key and searches through the search index
- [not-applicable] 0.425.0:0090f5ee · 0.425.0 · autoRevokeOnPasswordChange option and late binding removed
- [not-applicable] 0.425.0:77a5e0ee · 0.425.0 · Session check rejects removed members and no longer falls back to JWT roles on errors
- [not-applicable] 0.425.0:c9f9040c · 0.425.0 · Audit payloads follow the entity read rules; payload can be null
- [not-applicable] 0.425.0:0290688c · 0.425.0 · Tenant row version follows the destruction stage events
- [migrated] 0.425.0:dc107c19 · 0.425.0 · r.httpRoute gets deps.hostTenantId(); managed-pages and seo default to it; createHostTenantIdResolver is removed
- [not-applicable] 0.425.0:dba54b91 · 0.425.0 · Mail-thread rollup and read_mail_threads removed
- [not-applicable] 0.425.0:6221b4d6 · 0.425.0 · message:list pages with a cursor
- [not-applicable] 0.425.0:2e90bdc7 · 0.425.0 · OAuth connect state is bound to the starting browser
- [not-applicable] 0.425.0:37aaa852 · 0.425.0 · Idempotent send from a mailbox
- [not-applicable] 0.425.0:de6198ab · 0.425.0 · Send idempotency keys bound to caller and mailbox
- [not-applicable] 0.425.0:151b21b6 · 0.425.0 · Renderer plugins are picked by kind with selectRendererPlugin
- [not-applicable] 0.425.0:8bd2f9e0 · 0.425.0 · One request core for the static login and the token flows
- [migrated] 0.425.0:3277b9bb · 0.425.0 · Default auth pages cover every auth path and take a shell
- [not-applicable] 0.425.0:4d291a5e · 0.425.0 · Token request handlers no longer return the token
- [not-applicable] 0.425.0:ba0c9bd5 · 0.425.0 · Resource upload always links into a template
- [migrated] 0.425.0:d6954465 · 0.425.0 · Template reads follow tenantEditable roles
- [not-applicable] 0.425.0:0cac8de7 · 0.425.0 · Read override on text blocks narrows to SYSTEM only
- [not-applicable] 0.425.0:7eecc279 · 0.425.0 · User-owned entry titles and folders are personal data
- [not-applicable] 0.425.0:6620f48a · 0.425.0 · Text-block writes reject external images and embeds
- [not-applicable] 0.425.0:0bce371b · 0.425.0 · Delivery log no longer accepts old cursors
- [not-applicable] 0.425.0:50277e5a · 0.425.0 · Queued delivery renders inside the send job and seals the message content
- [not-applicable] 0.425.0:6142aed2 · 0.425.0 · No plaintext addresses in delivery jobs
- [not-applicable] 0.425.0:7ed1eaa8 · 0.425.0 · files feature only under @cosmicdrift/kumiko-framework/files
- [not-applicable] 0.425.0:798983b4 · 0.425.0 · Prebuilt folder handler constants removed
- [not-applicable] 0.425.0:6ddcaa55 · 0.425.0 · Folder assignments enforce ownership.write
- [not-applicable] 0.425.0:bbb92e75 · 0.425.0 · MFA revoke bindings removed; regenerate-recovery also revokes access tokens
- [not-applicable] 0.425.0:501cf6b5 · 0.425.0 · Tier sync follows the subscription events; drift sync runs daily
- [not-applicable] 0.425.0:c02c9826 · 0.425.0 · Custom fields enforce read roles and the searchable flag
- [not-applicable] 0.425.0:35188e93 · 0.425.0 · Per-field custom-field retention removed
- [not-applicable] 0.425.0:a2c93afe · 0.425.0 · Custom fields only on wired host entities
- [not-applicable] 0.425.0:64e04921 · 0.425.0 · One custom-fields value projection for all wired host entities
- [not-applicable] 0.425.0:cd3cd3dd · 0.425.0 · Job triggers on events only
- [migrated] 0.425.0:9e6a9104 · 0.425.0 · forget-subject erases the key after commit and forgets forgetWithSubject rows
- [not-applicable] 0.425.0:17a59ac4 · 0.425.0 · Document drafts are visible through their subject row
- [not-applicable] 0.425.0:df70baee · 0.425.0 · SMTP requires STARTTLS unless the host is loopback or allowlisted
- [not-applicable] 0.425.0:bb081f05 · 0.425.0 · PAT auto-revoke option and late binding removed
- [not-applicable] 0.425.0:2797a1c5 · 0.425.0 · PATs of principals without a user row are rejected
- [not-applicable] 0.425.0:54788635 · 0.425.0 · Field read rules the framework cannot enforce fail at boot
- [not-applicable] 0.425.0:cb523e95 · 0.425.0 · Production boot requires real login and MFA rate limiters
- [not-applicable] 0.425.0:7ef3346a · 0.425.0 · JWT verify pins HS256 and requires a kid in keyring mode
- [not-applicable] 0.425.0:669224f4 · 0.425.0 · /version drops the node field
- [not-applicable] 0.425.0:50032abd · 0.425.0 · Deprecated money, PII, schema and webhook aliases removed
- [not-applicable] 0.425.0:2ea14de9 · 0.425.0 · Join rows respect the host's query roles
- [not-applicable] 0.425.0:6c3947a7 · 0.425.0 · Rebuild guards the single-table contract
- [not-applicable] 0.425.0:fd613564 · 0.425.0 · Entity cache removed
- [not-applicable] 0.425.0:6f59ac65 · 0.425.0 · Entity handlers with the verb in the name string are internal
- [not-applicable] 0.425.0:570f9a89 · 0.425.0 · Event pruning removes whole streams only
- [not-applicable] 0.425.0:b52b31a3 · 0.425.0 · Write-handler job triggers carry the written row id
- [not-applicable] 0.425.0:5ab1a1c6 · 0.425.0 · Lean update, delete and forget events and executor createMany/updateMany
- [not-applicable] 0.425.0:61efe832 · 0.425.0 · Named entity verbs, executor history and listAsOf
- [not-applicable] 0.425.0:3d0e4827 · 0.425.0 · Anonymous writes under the system tenant need tenantlessAnonymous
- [not-applicable] 0.425.0:054de6a4 · 0.425.0 · Money amounts are integers in minor units everywhere
- [migrated] 0.425.0:9eacb56d · 0.425.0 · Projection list shows implicit entity projections
- [not-applicable] 0.425.0:37b1813d · 0.425.0 · Entity rows follow their stream version; list and detail drop the per-row event-store lookup
- [not-applicable] 0.425.0:8648a3e8 · 0.425.0 · SessionMassRevoker type removed
- [not-applicable] 0.425.0:a3162bed · 0.425.0 · AuthSessionStatus gains not_a_member
- [not-applicable] 0.425.0:2ed5488c · 0.425.0 · Boot rule transfer/multi-stream-projection
- [not-applicable] 0.425.0:3db4dc39 · 0.425.0 · Boot rule transfer/custom-projection
- [not-applicable] 0.425.0:3946fec9 · 0.425.0 · Workflow engine, workflow-runner and step-dispatcher removed
- [not-applicable] 0.425.0:af1e83db · 0.425.0 · step-dispatcher feature removed
- [not-applicable] 0.425.0:54564cba · 0.425.0 · workflow-runner feature removed
- [not-applicable] 0.425.0:fd97033d · 0.425.0 · App connections carry their projection registry
- [migrated] 0.425.0:1948e377 · 0.425.0 · ctx.db rows are typed from the entity table
- [migrated] 0.425.0:2c545371 · 0.425.0 · createTenantDb on the db subpath is tenant-only
- [not-applicable] 0.425.0:6b32da9b · 0.425.0 · Every event append states its concurrency expectation
- [migrated] 0.425.0:b6264480 · 0.425.0 · Free query helpers are typed
- [not-applicable] 0.425.0:ddacdc93 · 0.425.0 · Query handlers declare their result entity
- [not-applicable] 0.425.0:cc159684 · 0.425.0 · Breaking changesets declare affects
- [not-applicable] 0.425.0:162790d6 · 0.425.0 · listDefaults replaces bundledLists, adoptsBundledLists removed
- [migrated] 0.425.0:cb60c009 · 0.425.0 · Entities carry their name
- [not-applicable] 0.425.0:a17ab194 · 0.425.0 · escapeHatch names its grants
- [migrated] 0.425.0:ac9ea3d0 · 0.425.0 · Registrar verbs take one options object; r.useExtension becomes r.applyExtension
- [not-applicable] 0.425.0:66ed85d1 · 0.425.0 · parentRef and the join features name their hosts
- [not-applicable] 0.425.0:27180505 · 0.425.0 · Returned query failures are thrown
- [not-applicable] 0.425.0:2cff7e4b · 0.425.0 · Unmapped colon queries need resultEntity
- [not-applicable] 0.425.0:f21d4093 · 0.425.0 · onDelete cascades run automatically in the delete lifecycle
- [not-applicable] 0.425.0:9532cd54 · 0.425.0 · A record key that an owner forget erases holds only that owner's data
- [not-applicable] 0.425.0:8c0c7423 · 0.425.0 · Fuzzy-searchable longText fields cannot restrict access.read
- [not-applicable] 0.425.0:6d20e09d · 0.425.0 · systemScope handlers get ctx.systemDb typed as present
- [migrated] 0.425.0:46d955f2 · 0.425.0 · A missing migrations directory fails the prod boot
- [not-applicable] 0.425.0:31f10339 · 0.425.0 · updateRows and deleteRows refuse event-sourced entity tables without a reason
- [migrated] 0.425.0:5c988484 · 0.425.0 · Scaffolded Playwright config uses ports.e2e
- [migrated] 0.425.0:89e2bb29 · 0.425.0 · Video tooling on its own subpath
- [not-applicable] 0.425.0:2105a8dd · 0.425.0 · runProdApp defaults to Secure session cookies
- [migrated] 0.425.0:a7a2470e · 0.425.0 · Production boot defaults for kmsMode and staticDir
- [not-applicable] 0.425.0:1cca721b · 0.425.0 · composeFeatures listDefaults applies to all features
- [not-applicable] 0.425.0:c89f8caf · 0.425.0 · Unused entity, handler payload and handler result type maps removed
- [not-applicable] 0.425.0:36899ecc · 0.425.0 · Step definitions drop the unused failure strategy
- [migrated] 0.425.0:d3d0a6cd · 0.425.0 · Ratchet guards fail without a baseline file
- [migrated] 0.425.0:27e0504b · 0.425.0 · lib-test-coverage ignore tags cite an existing test file
- [migrated] 0.425.0:1a86f459 · 0.425.0 · seed-runtime-imports guard
- [migrated] 0.425.0:a2e80913 · 0.425.0 · test-env-writes ratchet and suite env helpers
- [migrated] 0.425.0:7520e85f · 0.425.0 · File Size guard limits test files to 1500 lines
- [migrated] 0.425.0:02947005 · 0.425.0 · test-timeouts flags literal Playwright timeouts and extended test objects
- [migrated] 0.425.0:c7e17371 · 0.425.0 · Ratchet baselines with headroom fail
- [migrated] 0.425.0:70f34594 · 0.425.0 · Unused kumiko-lint-ignore markers fail the guard run
- [not-applicable] 0.425.0:366c28c4 · 0.425.0 · Payload casts in handlers count as suspect casts
- [migrated] 0.425.0:fd9d5589 · 0.425.0 · Existence-only checks on queries fail, existence-only tests are ratcheted
- [not-applicable] 0.425.0:e854bf43 · 0.425.0 · securityBaselineFeatures preset removed
- [migrated] 0.425.0:aa0d7c4f · 0.425.0 · kumiko check verifies test script timeouts
- [migrated] 0.425.0:c69f8008 · 0.425.0 · Overrides of Kumiko packages fail the managed-files check
- [migrated] 0.425.0:72dcd03d · 0.425.0 · Managed ci.yml covers e2e shards and full Chromium, checks run on pull requests only
- [not-applicable] 0.425.0:f19d3188 · 0.425.0 · setupAppTestStack is the one app test entry
- [not-applicable] 0.425.0:828d8d9e · 0.425.0 · Managed kumiko/schema.ts and kumiko check read listDefaults
- [migrated] 0.425.0:d5192c48 · 0.425.0 · App test stacks gate tiers like runDevApp
- [not-applicable] 0.425.0:4e7f2425 · 0.425.0 · Handlers are defined with defineWriteHandler/defineQueryHandler
- [not-applicable] 0.425.0:4863e30b · 0.425.0 · adoptsBundledLists pattern removed
- [not-applicable] 0.425.0:e2cf135f · 0.425.0 · Upgrade codemods up to 0.420.0 removed
- [not-applicable] 0.425.0:a93e463a · 0.425.0 · Currency cells format with Intl and an ISO currency code
- [not-applicable] 0.425.0:78d9206e · 0.425.0 · Unused web exports removed
- [not-applicable] 0.425.0:bd0f8e73 · 0.425.0 · Drawer widget props type is DrawerPanelProps
- [not-applicable] 0.425.0:69aaa841 · 0.425.0 · formatMoney takes an options object
- [not-applicable] 0.425.0:c7e18fd1 · 0.425.0 · Every CorePrimitive is required, createStubPrimitives replaces partial test stubs

### Codemods applied

- 0.425.0 · scripts/codemod/unsafe-raw-all-tenants.ts · ctx.db.unsafeRaw() stays in the caller's tenant
- 0.425.0 · scripts/codemod/entity-name.ts · Entities carry their name
- 0.425.0 · scripts/codemod/escape-hatch-grants.ts · escapeHatch names its grants
- 0.425.0 · scripts/codemod/registrar-single-form.ts · Registrar verbs take one options object; r.useExtension becomes r.applyExtension
- 0.425.0 · scripts/codemod/feature-layout.ts · Handler layout and feature import cycles are guarded
- 0.425.0 · scripts/codemod/guard-markers-to-lint-ignore.ts · Test guard opt-outs move to kumiko-lint-ignore
- 0.425.0 · scripts/codemod/define-handler.ts · Handlers are defined with defineWriteHandler/defineQueryHandler

## [0.424.1] - 2026-11-18

### Changed

- @cosmicdrift/kumiko-*: 0.420.0 → 0.424.1

### Breaking

- 0.424.0 · authorizeSubject receives the subject scope context instead of the full handler context
- 0.424.0 · system placeholder labels moved to the template-resolver namespace
- 0.423.0 · The TenantOwner role option is removed from the member roles form
- 0.423.0 · TenantOwner no longer closes the account
- 0.423.0 · TenantOwner is no longer a keep-account role
- 0.423.0 · ROLES.TenantOwner is removed

### Manual migrations

- [not-applicable] 0.424.0:695f52e8 · 0.424.0 · authorizeSubject receives the subject scope context instead of the full handler context
- [not-applicable] 0.424.0:23df73b3 · 0.424.0 · system placeholder labels moved to the template-resolver namespace
- [not-applicable] 0.423.0:f355af8d · 0.423.0 · The TenantOwner role option is removed from the member roles form
- [not-applicable] 0.423.0:853c7d4f · 0.423.0 · TenantOwner no longer closes the account
- [not-applicable] 0.423.0:7bcb1ea2 · 0.423.0 · TenantOwner is no longer a keep-account role
- [not-applicable] 0.423.0:461f4e38 · 0.423.0 · ROLES.TenantOwner is removed

## [0.420.0] - 2026-11-12

### Changed

- @cosmicdrift/kumiko-*: 0.418.0 → 0.420.0

### Breaking

- 0.419.0 · signature and imprint are no longer placeholders, company* names are reserved
- 0.419.0 · Line grid, flush tables and the address window in PDF bodies
- 0.419.0 · The template title is a rich-text field in front of the body

### Manual migrations

- [not-applicable] 0.419.0:c551491c · 0.419.0 · signature and imprint are no longer placeholders, company* names are reserved
- [not-applicable] 0.419.0:2a948fdb · 0.419.0 · Line grid, flush tables and the address window in PDF bodies
- [not-applicable] 0.419.0:8841a183 · 0.419.0 · The template title is a rich-text field in front of the body

## [0.418.0] - 2026-11-10

### Changed

- @cosmicdrift/kumiko-*: 0.415.0 → 0.418.0

### Breaking

- 0.417.0 · Subject check for the signature feature and a readable-file check on requests
- 0.417.0 · Board look for lists, forms, record pages and the shell
- 0.417.0 · List cells stay blank when empty, truncate, and phone cards follow the board
- 0.417.0 · submitWith actions never write without their form, relative "just now" is translated

### Manual migrations

- [not-applicable] 0.417.0:494c3150 · 0.417.0 · Subject check for the signature feature and a readable-file check on requests
- [not-applicable] 0.417.0:33832fec · 0.417.0 · Board look for lists, forms, record pages and the shell
- [not-applicable] 0.417.0:c5495a2d · 0.417.0 · List cells stay blank when empty, truncate, and phone cards follow the board
- [not-applicable] 0.417.0:8c5324ff · 0.417.0 · submitWith actions never write without their form, relative "just now" is translated

### Codemods applied

- 0.417.0 · scripts/codemod/scaffold-kms-mode.ts · kumiko-upgrade migrates older scaffolds to Key Manager ciphertext keys

## [0.415.0] - 2026-11-06

### Changed

- @cosmicdrift/kumiko-*: 0.414.0 → 0.415.0

### Breaking

- 0.415.0 · Whitespace-only translations and blank plural forms fail the boot check
- 0.415.0 · Irreversible operations without a write-handler entry need a declared exception
- 0.415.0 · Named filter refs carry `access` instead of `roles`
- 0.415.0 · security-plugin-suppression guard rejects biome-ignore on the security Biome plugins
- 0.415.0 · kumiko check fails when biome.json does not extend the Kumiko Biome preset

### Manual migrations

- [not-applicable] 0.415.0:ff0d0354 · 0.415.0 · Whitespace-only translations and blank plural forms fail the boot check
- [not-applicable] 0.415.0:69f8ebde · 0.415.0 · Irreversible operations without a write-handler entry need a declared exception
- [not-applicable] 0.415.0:6202b92a · 0.415.0 · Named filter refs carry `access` instead of `roles`
- [not-applicable] 0.415.0:c3d2fdc7 · 0.415.0 · security-plugin-suppression guard rejects biome-ignore on the security Biome plugins
- [not-applicable] 0.415.0:b1476991 · 0.415.0 · kumiko check fails when biome.json does not extend the Kumiko Biome preset

## [0.414.0] - 2026-11-05

### Changed

- @cosmicdrift/kumiko-*: 0.409.0 → 0.414.0

### Breaking

- 0.414.0 · Stripe checkouts are matched by session id, consentId metadata is gone
- 0.414.0 · SystemAdmin checks use ROLES.SystemAdmin
- 0.414.0 · S3 endpoint rule from the booted env
- 0.414.0 · Mollie first payments are matched by payment id, consentId metadata is gone
- 0.414.0 · Paddle checkouts are bound by the checkout ledger, the tenant binding key is gone
- 0.414.0 · includePaid from a non-SystemAdmin is rejected
- 0.414.0 · Anonymous file uploads need the claim handle to be bound
- 0.414.0 · Billing webhooks are accepted only for checkouts the server opened
- 0.414.0 · Helpdesk reply error passthrough, paged user-data lookups
- 0.414.0 · A personal password mailbox only connects the caller's own account address
- 0.414.0 · Biome preset biome-rules with GritQL plugins
- 0.414.0 · Review fixes in document-ingest, documents, feature-toggles, auth-mfa and auth-email-password
- 0.414.0 · Remove dead allowPerRequest config key option
- 0.414.0 · anonymous uploads are capped, rate limited and answer sign_in_required
- 0.414.0 · Db and types review fixes
- 0.414.0 · access.authenticated is renamed to access.builtinUserRoles
- 0.414.0 · pool statements without a tenant scope run in an empty scope; seedRow refuses event-sourced entity tables; read_ tables are not writable from plain runners
- 0.414.0 · Boot fails when the booted features declare tables the generated schema lacks
- 0.414.0 · system tenant read policy only on tables marked systemRowsReadable
- 0.414.0 · Test-stack cleanup removes only its own queues; one sweep per integration run
- 0.414.0 · Single-file guards are replaced by the Biome preset biome-rules
- 0.414.0 · cardRenderer removed from entityList and projectionList
- 0.414.0 · DashboardTextPanel: blocks optional, text and items accept i18n objects
- 0.413.0 · contact feature renamed to helpdesk

### Manual migrations

- [migrated] 0.414.0:6e982281 · 0.414.0 · Stripe checkouts are matched by session id, consentId metadata is gone
- [not-applicable] 0.414.0:daacd4e2 · 0.414.0 · SystemAdmin checks use ROLES.SystemAdmin
- [not-applicable] 0.414.0:b9a9b954 · 0.414.0 · S3 endpoint rule from the booted env
- [not-applicable] 0.414.0:73be8142 · 0.414.0 · Mollie first payments are matched by payment id, consentId metadata is gone
- [not-applicable] 0.414.0:8cbdc3bc · 0.414.0 · Paddle checkouts are bound by the checkout ledger, the tenant binding key is gone
- [not-applicable] 0.414.0:8268ce80 · 0.414.0 · includePaid from a non-SystemAdmin is rejected
- [not-applicable] 0.414.0:ba4e5b9c · 0.414.0 · Anonymous file uploads need the claim handle to be bound
- [migrated] 0.414.0:6801b653 · 0.414.0 · Billing webhooks are accepted only for checkouts the server opened
- [not-applicable] 0.414.0:199dad76 · 0.414.0 · Helpdesk reply error passthrough, paged user-data lookups
- [not-applicable] 0.414.0:3d9e54f1 · 0.414.0 · A personal password mailbox only connects the caller's own account address
- [migrated] 0.414.0:c32e1e67 · 0.414.0 · Biome preset biome-rules with GritQL plugins
- [not-applicable] 0.414.0:6cbfa148 · 0.414.0 · Review fixes in document-ingest, documents, feature-toggles, auth-mfa and auth-email-password
- [not-applicable] 0.414.0:b571806e · 0.414.0 · Remove dead allowPerRequest config key option
- [not-applicable] 0.414.0:5025ef73 · 0.414.0 · anonymous uploads are capped, rate limited and answer sign_in_required
- [not-applicable] 0.414.0:7109c755 · 0.414.0 · Db and types review fixes
- [not-applicable] 0.414.0:43e3f08b · 0.414.0 · access.authenticated is renamed to access.builtinUserRoles
- [migrated] 0.414.0:7490a816 · 0.414.0 · pool statements without a tenant scope run in an empty scope; seedRow refuses event-sourced entity tables; read_ tables are not writable from plain runners
- [migrated] 0.414.0:37a28a10 · 0.414.0 · Boot fails when the booted features declare tables the generated schema lacks
- [migrated] 0.414.0:48abc1d0 · 0.414.0 · system tenant read policy only on tables marked systemRowsReadable
- [not-applicable] 0.414.0:4fe09931 · 0.414.0 · Test-stack cleanup removes only its own queues; one sweep per integration run
- [not-applicable] 0.414.0:8f1009d5 · 0.414.0 · cardRenderer removed from entityList and projectionList
- [not-applicable] 0.414.0:77a47b67 · 0.414.0 · DashboardTextPanel: blocks optional, text and items accept i18n objects
- [not-applicable] 0.413.0:4c75b7c3 · 0.413.0 · contact feature renamed to helpdesk

### Codemods applied

- 0.414.0 · scripts/codemod/lint-ignore-to-biome.ts · Single-file guards are replaced by the Biome preset biome-rules

## [0.409.0] - 2026-11-01

### Changed

- @cosmicdrift/kumiko-*: 0.405.0 → 0.409.0

## [0.405.0] - 2026-10-31

### Changed

- @cosmicdrift/kumiko-*: 0.403.0 → 0.405.0

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
