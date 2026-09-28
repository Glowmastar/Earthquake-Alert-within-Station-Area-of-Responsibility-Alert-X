# Alert X project analysis

Reviewed 28 September 2026. Scope: application source, database migration chain and staging data, authentication and permissions, operational workflows, tests, build configuration, container/CI configuration, and deployment documentation. No application implementation or migrations were changed.

**Assessment:** This is a functioning, database-backed operational application with substantial safeguards. The build and existing automated tests pass, but the review found defects in station onboarding, policy conflict handling, data protection, and operational reporting. Resolve the high-priority findings before relying on live notifications.

## Architecture and actual behavior

| Component | Responsibility | Main files |
|---|---|---|
| React client | Session sign-in, monitoring dashboard, records, map, reviews, recipients, reports, drafts and settings | src/App.tsx, src/views/*, src/components/* |
| HTTP API | Server-side validation, session and role checks, station scoping, administrative mutations | server/src/app.ts, auth.ts, admin.ts, stations.ts, oidc.ts |
| Background worker | Source polling, blocked/pending evaluation, delivery claims, recovery and session cleanup | server/src/worker.ts |
| Ingestion | PHIVOLCS listing parsing, bulletin selection, quarantine, revision deduplication and cancellation of obsolete queued deliveries | server/src/ingestion.ts |
| Spatial policy | Approved PostGIS geometry, boundary tolerance, land/offshore checks, rule thresholds and review decisions | server/src/workflow.ts |
| Delivery | Durable jobs, recipient revalidation, SMTP handoff, retries and uncertain-outcome handling | server/src/delivery.ts |
| Persistence | PostgreSQL/PostGIS, seven checksummed migrations, versioned boundaries/rules and audit records | database/migrations/*, server/src/db.ts |
| Deployment | Multi-stage Docker image, separate API/worker, Compose, Render Blueprint and CI | Dockerfile, docker-compose.yml, render.yaml, .github/workflows/check.yml |

The normal operational chain is: retrieve and archive source HTML → parse or quarantine rows → persist an earthquake revision → evaluate approved AORs → suppress, review or prepare an alert → select verified recipients → queue delivery jobs → record SMTP outcome. Corrections supersede the old revision, close old open reviews and cancel unclaimed old delivery jobs. Already in-flight messages cannot be recalled.

The client polls its resources every 30 seconds and preserves previously loaded data with an error notice when a later refresh fails. The map uses database geometry and optional configured tiles. Navigation is React state rather than URL-based routing.

## Prioritized findings

### 1. High — workbook stations cannot complete recipient onboarding

Evidence: [boundary station upsert](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/server/src/admin.ts:98), [recipient prerequisite](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/server/src/stations.ts:42), and [workbook station seed](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/database/migrations/006_workbook_staging.sql:151).

Migration 006 creates workbook stations without organization_id. Importing an approved boundary for an existing station updates its name and coordinates but does not set its organization. Both administrative and station recipient creation reject a station without an organization. There is no station-organization edit endpoint to complete this through the application.

**Reproduced:** after all migrations, importing a boundary for BBP returned 201, but adding its recipient returned 400 with “Station needs an organization.” The existing integration suite creates a new TEST station, so its successful recipient test misses this path.

**Minimal fix:** assign the approved organization when promoting an existing workbook station, preserving an existing non-null organization. Backfill confirmed affected stations in a new migration or explicit administrative operation, and add a workbook-station onboarding regression test.

### 2. High — conflicting overlap policies depend on AOR creation order

Evidence: [candidate selection and exception policy](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/server/src/workflow.ts:81).

Candidates are sorted by aor_id. For an overlap, the first matching candidate becomes chosen and supplies overlap_action. A second affected station’s rule is not considered when deciding whether to open review.

**Reproduced:** two overlapping approved AORs, the first set to SUPPRESS and the second to REVIEW, produced classification OVERLAP with processing status EVALUATED and no review case. No explicit operational priority justifies that choice.

**Minimal fix:** define conflict handling across all matching AORs; a conservative default is to require review when any affected rule requires it. If ordered precedence is intended, persist an explicit approved priority rather than relying on database IDs. Test both insertion orders.

### 3. Medium — station metadata protection can never activate

Evidence: [protection trigger](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/database/migrations/007_stack_hardening.sql:61) and [allowed station validation states](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/database/migrations/006_workbook_staging.sql:27).

The trigger checks OLD.validation_status = 'VALID', but stations allow only UNVERIFIED, IN_REVIEW, VERIFIED and REJECTED. VALID is a boundary-validation state, not a station state.

**Reproduced:** a workbook station marked VERIFIED could have its name changed without the protection trigger rejecting it.

**Minimal fix:** replace the trigger function in a new migration using the correct station state, with a regression test. Clarify which changes are approved operational edits and which are workbook staging updates. Do not modify an already-applied checksummed migration.

### 4. Medium — dashboard enablement indicators describe the API, not the worker

Evidence: [dashboard flags](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/server/src/app.ts:61) and [worker-only activation instructions](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/RENDER_DEPLOYMENT.md:133).

The deployment runbook correctly enables ingestion and delivery on the separate worker. The dashboard returns config.INGESTION_ENABLED and config.DELIVERY_ENABLED from the API process. Under that deployment, the dashboard can say retrieval and sending are disabled while the worker is actively doing both.

**Validation:** confirmed by tracing configuration and deployment instructions; no live deployment was changed.

**Minimal fix:** publish effective worker capabilities and settings with its heartbeat and return that information from the dashboard, including an unknown/stale state when the worker is unavailable.

### 5. Medium — historical delivery totals disappear after source corrections

Evidence: [dashboard delivery aggregate](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/server/src/app.ts:55).

Delivery counts join to vw_operational_events by revision_id. That view exposes only the latest revision of each event. Once a correction arrives, delivery outcomes from the previous revision drop out of the dashboard aggregate even though delivery history still contains them.

**Reproduced:** one recorded SENT delivery counted as 1 before a correction and 0 afterwards; the delivery history still showed SENT. Failed and uncertain older deliveries can similarly vanish from these aggregates.

**Minimal fix:** compute delivery lifecycle totals from their historical alert/revision records with station scope based on the alert’s decision. If the intended metric is explicitly current-revision-only, label it that way and provide separate unresolved delivery totals across all revisions.

### 6. Medium — raw database archives are not guaranteed byte-exact

Evidence: [database archive encoding](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/server/src/archive.ts:38).

The archive hash and byte count are computed from the original Buffer, but the DATABASE backend stores body.toString('utf8') in a TEXT column. Invalid UTF-8 bytes are replaced during decoding, so the stored evidence cannot always reconstruct the bytes that were hashed.

**Reproduced:** an HTML payload with an ISO-8859-1 character produced a stored text payload whose reconstructed SHA-256 differed from content_sha256.

**Minimal fix:** preserve original bytes as BYTEA or lossless base64 and decode a separate copy for parsing using an explicit encoding policy. Preserve compatibility with existing archive rows through an additive migration.

### 7. Medium — a stalled archive upload delays the whole worker while heartbeat stays fresh

Evidence: [S3 upload](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/server/src/archive.ts:30) and [worker processing order and heartbeat](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/server/src/worker.ts:9).

Unlike the source fetch, the S3 PUT has no application deadline. The worker awaits polling before reaching evaluation and dispatch. A slow or stalled archive request can therefore delay delivery and cleanup, while a separate timer continues updating its RUNNING heartbeat.

**Validation:** code-path finding; no real S3 fault was injected.

**Minimal fix:** add a bounded upload deadline and record last successful loop progress separately from process liveness. Consider separating polling and dispatch scheduling if operational latency requires it.

### 8. Medium — capped lists make older actionable records inaccessible in the UI

Evidence: [delivery and contact list limits](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/server/src/app.ts:97), [audit list limit](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/server/src/admin.ts:84), and [event selector source](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/src/App.tsx:36).

Only earthquake records have pagination. Delivery history stops at 200 rows, contacts and recipients at 500, field reports and social drafts at 200, and administrator audit at 500. There are no corresponding pagination controls. Old failed/uncertain deliveries can fall out of the only UI that exposes reconciliation. Field-report and social forms choose from the recent 100 earthquake records.

**Minimal fix:** add pagination and actionable-status filters, starting with unresolved deliveries. Add event search for forms that need older records. Display counts or truncation notices until pagination exists.

### 9. Low — map submenu selections do not change the map

Evidence: [map navigation state](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/src/App.tsx:30) and [map render](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/src/App.tsx:55).

Station Boundaries, Epicenters and Boundary Review change sidebar selection state, but mapSub is not passed to the map or used to filter its content. The three selections render the same layers and table. Settings submenus likewise do not select distinct sections in OperationsSettings.

**Minimal fix:** connect selection to layers/filtering or simplify the navigation to match the single implemented view.

## Implemented safeguards worth retaining

- Authentication uses HttpOnly cookies, hashed session tokens, expiration and server-side revocation. Production cookies are Secure. Mutations require origin and CSRF validation.
- Permissions and station assignments are loaded from the database on each request; UI visibility is not the authorization boundary.
- Organizational sign-in uses explicit issuer/subject mapping, PKCE, state and nonce. It does not automatically link by email.
- SQL values are parameterized in the reviewed application queries, and incoming mutations generally use Zod validation.
- Earthquake, review and delivery operations use transactions and relevant row locks. Repeated review approval reuses the existing outcome.
- Recipient routing checks verification, active dates, subscription state and selected station/AOR relationships.
- SMTP acceptance is distinguished from confirmed delivery. Ambiguous transport outcomes and expired leases become UNCERTAIN instead of being blindly replayed.
- Migrations use an advisory lock, transactions and checksums; bootstrap refuses to overwrite an existing account.
- Ingestion and delivery default to disabled. Source requests restrict the origin, disallow redirects, and bound source response time and size.

These are confirmed implementation features, not a claim that every security or concurrency edge case has been tested.

## Features and data that are incomplete or intentionally limited

- Social media is stored draft content only. No external publishing integration or full draft approval/editing lifecycle is connected.
- Instrumental intensity tables and consolidated queries exist, but there is no application ingestion/edit endpoint for instrumental readings.
- Finalized intensity bulletin tables exist without a connected authoring/finalization workflow.
- Fault matching, several location-determination structures, social attachments/checklists and email_gateway configuration exist in the schema without corresponding application workflows. SMTP configuration comes from environment variables.
- Workbook assignment approval stores reviewed relationships, but classification and recipient routing do not read aor_administrative_assignments. Approved operational polygons and rule assignments remain the actual routing authority. UI wording should not imply workbook approval itself changes routing.
- The data-quality API/UI exposes normalized station rows, assignments and issues, but does not expose all raw station_import_rows or the placeholder row. The documentation overstates direct raw-source-row inspection.
- Station-scoped users do not see globally OUTSIDE or unevaluated/blocked events through the current event-scope predicate. This follows the code’s access model; decide whether that matches the intended operational responsibilities before broadening access.
- Field reports can be verified but there is no route/UI to reject, mark duplicate or correct a verified report. A station user can verify their own report; independent verification is not enforced. Whether that is required is an organizational policy decision.

The staging CSVs contain 81 station source rows, 29 distinct SCSS/office parents and 80 non-placeholder STSS entries. Migrations produce 28 SCSS, one OFFICE and 80 STSS records. The 29 province assignments cover 11 parent records, leaving the remaining stations without supplied province coverage. The original “Provinces within AOR.xlsx” is not included, so transcription and source checksum provenance could not be independently checked against the workbook.

## Additional behavior requiring explicit operational decisions

- When a newer bulletin row is malformed but an older bulletin row is valid, the parser returns the older valid bulletin and quarantines the malformed one. The existing unit test explicitly expects B2 when B3 is invalid. Decide whether that event should instead be held to prevent notifications based on known-stale source information.
- For overlapping, offshore, boundary and corrected events, exception precedence is encoded in one conditional chain. Conflicting rule combinations need a documented policy and regression tests.
- Review approval creates a manual decision and alert without reapplying the automatic magnitude/depth/felt thresholds. This may be an intended authorized override, but the UI should make the override semantics clear.
- Enabling delivery releases eligible READY jobs already queued while sending was disabled. The deployment procedure should account for the existing backlog during controlled tests.

## Verification and remaining gaps

| Check | Result |
|---|---|
| Locked dependency installation | Completed with npm ci; package files unchanged |
| TypeScript client/server checks | Passed |
| Production client/server build | Passed |
| Existing unit and integration checks | 18 reported tests passed, including the parent integration test |
| Seven migrations and repeat application | Passed in isolated PGlite/PostGIS-compatible database |
| Render YAML/schema/reference/policy validation | Passed |
| Targeted review reproductions | Five confirmed scenarios, all assertions passed |
| Native PostgreSQL and Docker image execution | Not run; local Docker daemon unavailable |
| Live PHIVOLCS HTML compatibility | Not tested |
| Real SMTP, S3 and organizational identity provider | Not tested |
| Browser visual/accessibility and end-to-end interaction | Not tested |
| Multi-worker/native database concurrency | Not verified by the serialized portable test adapter |

The default shell Node version is 20.12.2, below package.json’s >=22.12 requirement. Verification used the available Node 24.19.0 runtime. Sandbox restrictions initially blocked downloads, the TypeScript loader and Vite; the checks passed when rerun with approved access. These initial failures were environmental, not application test failures.

Targeted reproductions are retained in [test-results/project-review.ts](C:/Users/Admin/Documents/Work/Phivolcs/projects/alertX/Earthquake-Alert-within-Station-Area-of-Responsibility-Alert-X/test-results/project-review.ts), an ignored local review artifact using a disposable database and synthetic recipients. No external alerts were sent.

The existing integration suite provides useful workflow coverage, but portable database calls are serialized. It does not establish native transaction-race safety. CI is configured for native PostGIS, but CI execution was not inspected during this review. The documentation in IMPLEMENTATION_NOTES.md about integration tests being unable to bind a port is historical; this review successfully ran the HTTP integration suite.

## Recommended order

1. Repair workbook station onboarding and overlap policy conflict handling; add regression coverage for both.
2. Repair the station-protection trigger and worker-status reporting.
3. Correct historical delivery aggregates and make unresolved delivery history accessible.
4. Preserve archive bytes and bound S3 upload latency.
5. Align UI navigation and documentation with connected features.
6. Run native PostGIS/concurrency checks and controlled source, S3, SMTP and OIDC acceptance tests in staging before live activation.

Keep the current API/worker/PostGIS architecture. The findings are localized and do not justify an unrelated rewrite.

