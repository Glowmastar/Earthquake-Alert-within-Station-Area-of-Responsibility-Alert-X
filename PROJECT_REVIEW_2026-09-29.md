# Alert X working-folder review — 29 September 2026

The current website is a React interface served by root `server.ts`, with a live
PHIVOLCS listing scraper and substantial demo/local state. The separate
`server/src` API implements a PostgreSQL/PostGIS workflow but is not connected
to the current `App.tsx`. The earlier `PROJECT_ANALYSIS.md` describes that other
client/backend arrangement; its statements about the active client are now
outdated.

The deployment changes made after this review connect Render to the current
website. They do not resolve the operational defects listed below. P1 means
address before operational use; P2 means a material correctness/reliability
problem. Findings are based on source inspection unless explicitly reproduced.

## Current website findings

1. **P1 — Sign-in is bypassable.** `src/App.tsx:39` defaults to the administrator
   profile and `src/App.tsx:59` treats missing browser storage as authenticated.
   `src/views/LoginView.tsx:49` accepts the administrator email without checking
   its password; other emails also enter a fallback account. Root `server.ts`
   does not enforce sessions or station permissions. Connect the client to the
   existing server session endpoints and enforce authorization on mutations.

2. **P1 — Delivery success is invented.** `server.ts:164` marks inside-AOR events
   with magnitude >= 4 as Alert Sent and supplies fixed recipient counts and
   100% delivery. No delivery is performed. `src/App.tsx:129` approval and resend
   handlers only change local state/show messages;
   `src/views/EmailDesignTemplateView.tsx:283` test email is a timer. The root
   test-alert endpoint also returns success without sending. Use actual queued
   jobs/provider outcomes, or explicitly label and disable these demo actions.

3. **P1 — AOR classification does not use the displayed boundaries or rules.**
   `server.ts:138` uses three broad latitude/longitude rectangles;
   `src/data/philippinesGeoData.ts:593` displays different polygons. For example,
   latitude 18, longitude 121 is classified PCP but lies north of the displayed
   PCP polygon's maximum latitude 16.4. Rule changes do not alter the scraper.
   Use one approved mapping/geometry source for display and evaluation.

4. **P1 — Intensity is manufactured from magnitude.** `server.ts:222` assigns a
   PEIS label using magnitude thresholds without reading an intensity report.
   It is presented alongside data labeled as an official bulletin. Keep this
   field unavailable until source-reported or verified intensity is supplied.

5. **P1 — Source TLS verification is disabled.** Both HTTPS agents in root
   `server.ts` set `rejectUnauthorized: false`. The app cannot authenticate its
   upstream feed, yet presents it as official. Use normal certificate
   verification or a specifically configured trusted CA; expose failures.

6. **P1 — Configuration and operational edits are not durable.** Representative
   examples: `src/views/AORRulesView.tsx:167` only shows a saved message;
   `src/views/SettingsView.tsx:104` uses a timer; contacts, roles, boundaries,
   templates, field reports, intensity consolidation and social posts each
   keep independent local state. Navigating away resets many edits. Social
   publish/schedule buttons do not call a platform. Persist supported workflows
   through the API and make remaining prototype actions explicit.

7. **P2 — Failures are presented as successful synchronization.**
   `src/views/SettingsView.tsx:121` does not check HTTP status, substitutes 1,499
   records for zero/missing counts, and records HTTP 200. Its catch handler also
   announces completion. `src/App.tsx:163` silently keeps old/mock records on
   errors or empty results. `src/components/StatusCards.tsx` always reports
   connected/active/approved. Check response status, retain actual timestamps,
   distinguish stale/demo data, and show errors and valid empty results.

8. **P2 — Event IDs change when the listing order changes.** `server.ts:201`
   combines a date with a row counter. Prepending a new earthquake renumbers
   existing events. Use the stable source bulletin identity already parsed by
   `server/src/ingestion.ts`, with explicit revision handling.

9. **P2 — Recent-event flags do not measure 24 hours.** `server.ts:221` marks the
   first 35 records as recent regardless of origin time. Date parsing also
   defaults to today's date when it cannot parse the source. Reuse validated
   Philippine-time parsing and calculate recency from an actual timestamp.

10. **P2 — Station scoping is inconsistent.** `src/views/RecipientsView.tsx:123`
    ignores the scoped recipients supplied by App and loads its own full sample
    list. `src/App.tsx:219` exports all earthquakes rather than scoped ones.
    Field/intensity/social/audit views similarly receive no authenticated
    station scope. Use server-scoped data consistently for tables and exports;
    do not treat browser filters as access control.

11. **P2 — Deleting all social posts crashes the view.**
    `src/views/SocialMediaView.tsx:407` permits deleting the final item, after
    which `selectedPost` is undefined and property reads beginning at line 236
    fail during rendering. Provide an empty state and guard the editor.

12. **P2 — Exported map file is not a valid FeatureCollection.**
    `src/views/AORMapView.tsx:116` labels the output GeoJSON but emits no
    `features` array or boundary geometry. Export proper GeoJSON features with
    longitude/latitude geometry, or label the file as station metadata JSON.

## Separate backend findings still present

The existing `test-results/project-review.ts` was inspected and rerun in a
disposable database. Its five defect reproductions all completed successfully:

| Priority | Confirmed behavior | Minimal correction |
|---|---|---|
| P1 | Workbook station boundary import succeeds, but recipient creation fails with "Station needs an organization". `server/src/admin.ts:98` does not populate organization on conflict. | Populate missing approved organization during promotion and backfill confirmed stations. |
| P1 | Overlapping AORs with SUPPRESS then REVIEW policies produce no review case. `server/src/workflow.ts:81` chooses the first database ID's policy. | Evaluate all affected policies or persist an explicit approved precedence. |
| P2 | VERIFIED workbook station metadata can be changed despite its protection trigger. `database/migrations/007_stack_hardening.sql:61` checks VALID, a disallowed station status. | Correct the trigger through a new migration. |
| P2 | A SENT delivery count changes from 1 to 0 after source correction, although history still contains it. `server/src/app.ts:55` joins only the latest revision view. | Aggregate historical deliveries with their own decision-based station scope. |
| P2 | Non-UTF-8 archived bytes cannot be reconstructed to match their recorded hash. `server/src/archive.ts:38` stores UTF-8-decoded text. | Preserve bytes losslessly and decode separately for parsing. |

Additional code-path findings remain: the S3 PUT has no application timeout and
blocks the worker's sequential loop while heartbeat updates continue; dashboard
enablement flags describe API process settings instead of worker settings; and
several actionable lists have hard limits without pagination. The earlier
analysis contains supporting backend detail, but its old client claims and
verification environment should not be applied to this website.

## Deployment repairs and verification

The original manifest/lockfile mismatch, missing CI scripts, missing backend
build output, wrong Docker entry point, and obsolete Render migrations were
addressed for the current website. The deployment now builds a standalone
`server.js`, retains the separate backend build/tests, uses Express 5-compatible
SPA routing, and supplies a lightweight `/api/health` endpoint.

- Clean `npm ci` passed in a temporary copy with the committed lockfile.
- Client/server TypeScript checks passed.
- Frontend, root server and separate backend builds passed.
- Production smoke checks passed for health, HTML, asset serving, SPA fallback
  and time API, including after pruning development dependencies.
- All 18 existing unit/integration tests passed with the updated dependencies.
- All seven migrations and their repeat application passed in the portable
  isolated PostGIS test environment.
- Updated Render YAML passed the published schema and project checks.
- Local Docker execution was unavailable because no daemon was running;
  GitHub Actions retains the Linux Docker build check.
- Live Render deployment, external PHIVOLCS compatibility, SMTP, S3, OIDC,
  browser visual/accessibility checks and native multi-worker concurrency were
  not verified. No real notifications were sent.

Follow `RENDER_DEPLOYMENT.md` for the current website. Treat this deployment as
a prototype until the active website findings above are resolved.
