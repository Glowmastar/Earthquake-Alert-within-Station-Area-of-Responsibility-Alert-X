# Alert X — earthquake AOR monitoring

Alert X combines a React/TypeScript monitoring dashboard, Express API, PostgreSQL/PostGIS, and a separate TypeScript worker. This release uses persistent earthquake, AOR, review, contact, delivery, station-network, and data-validation records. It has no built-in station polygons, recipient contacts, or live demo earthquakes. The previously bundled mock data and hard-coded development password have been removed.

For a Render deployment, use the repository Blueprint in `render.yaml` and follow [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md). It preserves the API/worker split, runs checksummed migrations before both services, provisions private PostgreSQL, and keeps ingestion and delivery disabled until their operational gates pass.

## Run locally with Docker Desktop

1. Copy `.env.example` to `.env`. Change `POSTGRES_PASSWORD` and the matching password in `DATABASE_URL`. Set `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_NAME`, and a unique `INITIAL_ADMIN_PASSWORD` of at least 14 characters. For local Docker development leave `APP_ORIGIN=http://localhost:3000` and `NODE_ENV=development`.
2. Install Docker Desktop. From the project folder run `docker compose up --build -d`. The database starts first, followed by the checksummed migrations, the web app and the background worker.
3. Create your administrator *once*: `docker compose run --rm api node build/server/bootstrap.js`. Remove `INITIAL_ADMIN_PASSWORD` from `.env` afterwards and recreate the containers if necessary.
4. Open `http://localhost:3000`. Sign in with your chosen administrator credentials. Dashboard records will initially be empty.
5. In Settings, import approved station AOR polygons (GeoJSON), the approved land dataset, and active AOR rules. Set up recipients and record email-verification evidence. Without these inputs the worker blocks automatic evaluation or holds alerts for review.

No official PCP/BIP/CGP station definition or polygon is assumed. Use authoritative approvals for these records.

## Workbook station and AOR staging

Migration 006 stages Provinces within AOR.xlsx without treating it as operational GIS authority. It loads 28 SCSS stations, one Main Office record, 80 STSS records, 81 traceable source rows, and 29 province assignments. The source placeholder NONE / - is preserved in staging but does not create a station. Main Office is classified as OFFICE, and every STSS links to its parent SCSS.

All workbook province assignments start as DRAFT. They do not participate in earthquake classification or alert routing. In Settings, the Workbook data review section lets an administrator inspect source rows and validation issues. Approval requires:

- an active province already loaded with an authoritative PSGC code;
- an approved operational AOR belonging to the same SCSS station;
- review evidence and an accountable user.

The source-derived CSVs in database/staging are review aids. The original workbook remains the source reference. Station coordinates and AOR polygons are intentionally left blank until verified; no automatic geocoding or province inference is performed.

## Run without Docker

Use Node.js 24+, PostgreSQL with PostGIS and pgcrypto, and two terminal windows. Set a database connection in `.env`, then run:

```sh
npm ci
npm run db:migrate
npm run db:bootstrap
npm run dev:server
npm run dev:worker
npm run dev:client
```

The last three commands must run separately. The Vite dev server at `http://localhost:3000` proxies `/api` to port 4000. `db:bootstrap` creates one administrator and fails rather than overwriting an existing account.

## Station User access

Migration 005 adds a `USER` role, report creator tracking, and station-attributed audit entries. It does not automatically change existing accounts or remove older role assignments. An administrator should assign `USER` and the appropriate station access in Administration → Add user / Update user access. Do not assign `ADMIN` to station users; it bypasses station scoping. Existing specialist roles remain available during transition.

`USER` can review assigned-station exceptions, submit and verify field reports, create social drafts, manage assigned-station contacts and recipients, inspect station activity, and activate versioned rules for assigned AORs. Rule activation requires a written reason and password confirmation. Existing records without a known report creator or station attribution retain a blank creator/station in the new columns. A shared contact assigned to multiple stations must be edited by an administrator. Reviews that affect multiple stations also require an administrator because the current review case is event-wide.

The administrator still controls boundary imports, global earthquake sources, the land mask, accounts, held alert release, and provider delivery reconciliation. These actions are deliberately outside station `USER` routes. The system continues to check session, CSRF and station access on the server. Station users without an assignment cannot change any station data. Adding a role to a currently signed-in account takes effect on the next request because permissions are loaded from the database for each request.

## Operations

- Every retrieved PHIVOLCS page is archived before it is parsed. Local development stores it in PostgreSQL (`RAW_ARCHIVE_BACKEND=DATABASE`); production should use private S3-compatible object storage (`RAW_ARCHIVE_BACKEND=S3`). An archive write failure fails the ingestion run rather than creating an unauditable event. See [DEPLOYMENT.md](DEPLOYMENT.md).
- `INGESTION_ENABLED=false` and `DELIVERY_ENABLED=false` are the defaults. Setting only a source's `active` checkbox does not override the global ingestion switch. Configure and verify source access, then enable ingestion deliberately. The adapter reads the official PHIVOLCS earthquake listing, selects the newest linked bulletin number per event, records revisions, and quarantines unrecognized rows; a changed page layout stops a run rather than inventing records. The official site was inaccessible from the build environment, so test the parser against the authorized live listing in your deployment before enabling it.
- Configure approved SMTP credentials, a sender identity and TLS before enabling `DELIVERY_ENABLED`. Queued alerts remain queued while sending is disabled. The dashboard distinguishes queued, SMTP accepted, delivered, failed and uncertain. SMTP acceptance alone does not prove delivery to the person's mailbox. After a worker crash or ambiguous provider timeout an attempt is **UNCERTAIN** and must be reconciled by an administrator; automatic replay could duplicate a message.
- Operational approvals require a resolved review, explicit evaluated AOR, a reason, station permission and an active current revision. An AOR evaluated as `OUTSIDE` cannot be approved for notification. `ALL_AORS` recipient subscriptions are restricted to the recipient's own station. Retries reuse the same alert. New source revisions close open reviews and cancel unclaimed deliveries for older revisions. In-flight SMTP messages cannot be recalled; their actual outcome remains in the audit record.
- The map uses approved PostGIS GeoJSON data and optional basemap tiles. Set `VITE_TILE_URL` and `VITE_TILE_ATTRIBUTION` for a licensed basemap and rebuild the client; otherwise geographic layers are displayed without tiles.
- Organizational sign-in is optional: configure OIDC issuer, client ID and client secret, then explicitly link each provider subject to an active Alert X user through administration. There is no email-based automatic account linking. Local sign-in uses a revocable HttpOnly session. All mutation requests require the origin and CSRF token.
- Social Media is a persistent **draft-only** page. Intensity reports require manual verification. The consolidated view displays maxima from verified field and instrumental readings, not a finalized official bulletin.

## Maintenance and checks

`npm run build` checks TypeScript, builds the React client and compiles the API and worker. `npm test` runs source parsing, policy and retry tests. `npm run test:integration` exercises all seven migrations and the API/worker against an isolated PostgreSQL/PostGIS-compatible in-process test database. CI runs the same integration suite against a fresh native PostGIS container. Set `TEST_DATABASE_URL` to an **empty** native PostgreSQL database whose name ends `_test` to test locally against your actual deployment version. Integration tests add records to that database.

Migrations run in order from `database/migrations/` and track checksums in `schema_migrations`. They do not erase an existing database. Read [UPGRADE.md](UPGRADE.md) before upgrading the prior integrated archive. Make tested backups of the database and secure administrator recovery processes before organizational rollout. Run behind HTTPS with `APP_ORIGIN` set to the public origin, TLS-verified database access, approved map tiles, and monitored backups and worker health.
