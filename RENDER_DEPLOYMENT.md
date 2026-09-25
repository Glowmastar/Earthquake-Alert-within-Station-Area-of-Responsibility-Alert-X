# Deploy Alert X to Render

This runbook applies the generic Render workflow to Alert X without changing its application architecture. Alert X is a full-stack web service with a separate background worker and a PostgreSQL/PostGIS database. It is not a Render Static Site.

## Deployment topology

The repository-level `render.yaml` creates these same-region resources in Singapore:

- `alertx-api`, a public Docker web service that serves the React client and Express API;
- `alertx-worker`, a private Docker background worker for ingestion, evaluation, delivery, and cleanup;
- `alertx-db`, a private Render Postgres 16 database.

Both services run the checksummed migration command before deployment. The migration code uses a PostgreSQL advisory lock, so simultaneous API and worker deploys serialize safely and the second migration pass is a no-op.

The Blueprint selects paid baseline resources because the worker cannot use Render's free web-service tier and this application is intended for operational use. Review the selected plans, database disk size, region, backup retention, and expected charges before creating the Blueprint.

## 1. Complete local release checks

Run:

```sh
npm ci
npm run check:render
npm run build
npm test
npm run test:integration
docker compose build
```

Do not deploy a commit unless these checks pass. The Blueprint check validates YAML, Render's published JSON schema, cross-resource references, and Alert X's deployment safety policy. The GitHub workflow also builds the production container and runs the unit and PostGIS integration tests. The Blueprint uses `autoDeployTrigger: checksPass` so commits deploy only after linked CI checks pass. Render performs the final account-aware validation when the Blueprint is created or synchronized.

## 2. Prepare external services

Create a private S3-compatible bucket for immutable PHIVOLCS source archives. Enable versioning and retention outside Alert X. Give the application credentials access only to the required archive prefix.

Prepare an approved SMTP provider, but do not add live delivery credentials or enable delivery yet. If organizational sign-in is required, register the final HTTPS callback URL before enabling OIDC:

```text
https://YOUR-APP-ORIGIN/api/auth/oidc/callback
```

## 3. Create the Render Blueprint

Push the repository to a private Git provider repository, then create a Render Blueprint from `render.yaml`.

Review the resource names and region before confirming. The Blueprint blocks public database access with an empty `ipAllowList`; the API and worker use the database's same-region private connection string.

Render prompts for these secret or deployment-specific values on the API service:

```text
APP_ORIGIN
S3_BUCKET
S3_ENDPOINT
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
```

The worker receives these values through Blueprint service references, so there is one source of truth and no second secret entry. `APP_ORIGIN` must be the exact public HTTPS origin with no path or trailing slash, for example `https://alertx.example.gov.ph`. For AWS S3, use the applicable regional endpoint and set `S3_FORCE_PATH_STYLE=false` on both services after Blueprint creation if required by the provider.

If the generated `onrender.com` address is the initial public address, verify the actual API service URL immediately after Blueprint creation and correct `APP_ORIGIN` before testing authentication. When adding a custom domain later, update `APP_ORIGIN` to that domain and redeploy the API and worker together.

For organizational sign-in, add `OIDC_ISSUER`, `OIDC_CLIENT_ID`, and `OIDC_CLIENT_SECRET` to the API service only. For licensed basemap tiles, add `VITE_TILE_URL` and `VITE_TILE_ATTRIBUTION` to the API service before a deploy; these client settings are compiled into the browser bundle and therefore require a rebuild. Leave optional variables absent instead of saving empty placeholder values.

The Blueprint uses `DB_SSL=false` because `DATABASE_URL` is Render's private same-region connection. If the database is moved outside Render, switch to `DB_SSL=true` and provide a trusted CA through `DB_CA_FILE`.

## 4. First deployment

The API and worker begin with these safety switches:

```text
INGESTION_ENABLED=false
DELIVERY_ENABLED=false
```

The migration command creates PostGIS and pgcrypto and applies every migration before either service starts. If extension creation or a migration fails, stop and resolve the database issue; do not bypass the pre-deploy command.

After both services deploy, open an API service shell and run:

```sh
node build/server/verify-deployment.js
```

The command verifies PostGIS, pgcrypto, and every migration checksum without changing the database.

## 5. Bootstrap the administrator

Temporarily add these environment variables to the API service only:

```text
INITIAL_ADMIN_EMAIL
INITIAL_ADMIN_NAME
INITIAL_ADMIN_PASSWORD
```

Use a unique password of 14 to 72 characters. In the API shell, run exactly once:

```sh
node build/server/bootstrap.js
```

Sign in successfully, then delete `INITIAL_ADMIN_PASSWORD` from the service environment and redeploy the API. The bootstrap command refuses to overwrite an existing administrator.

## 6. Staging acceptance gate

Keep ingestion and delivery disabled while validating:

- `/api/health/live` returns a successful response;
- `/api/health` returns a successful response and detects database loss;
- login, logout, session expiry, password reset, CSRF, and origin checks;
- administrator and station-user authorization, including cross-station denial;
- direct browser refreshes on application routes;
- database persistence after service restart;
- audit records for privileged actions;
- worker startup and heartbeat;
- graceful API and worker shutdown during deployment.

After the worker has run for at least 30 seconds, execute:

```sh
node build/server/verify-deployment.js --require-worker
```

This additionally requires a current `RUNNING` worker heartbeat no more than 90 seconds old.

## 7. Configure operational data

In Settings, import and approve authoritative station AOR polygons, the land dataset, active AOR rules, recipients, and verification evidence. Workbook-derived province assignments remain drafts until PSGC/AOR reconciliation and approval.

Do not enable ingestion until a controlled EQInfo retrieval both creates an immutable raw archive record and parses the authorized live PHIVOLCS listing correctly. A changed page layout must stop or quarantine the run rather than create guessed records.

## 8. Enable controlled delivery

Add SMTP settings to the worker service:

```text
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASSWORD
EMAIL_FROM
```

Set `DELIVERY_ENABLED=true` only for a controlled recipient test. Confirm queued, accepted, failed, and uncertain outcomes are recorded correctly. Never automatically replay an uncertain attempt because the provider might already have accepted it.

After controlled testing and operational sign-off, enable delivery for the approved recipients. The API service does not need SMTP credentials.

## 9. Enable ingestion

Set `INGESTION_ENABLED=true` on the worker service only after archive, parser, station, AOR, and monitoring gates pass. Monitor the first source run, event revision, AOR evaluation, review decision, alert creation, and delivery lifecycle end to end.

## 10. Monitoring and rollback

Monitor:

- `/api/health` and API error logs;
- worker heartbeat age;
- failed ingestion runs and quarantined rows;
- failed and uncertain deliveries;
- blocked event-processing records;
- database storage, connections, backups, and restore tests;
- S3 archive-write failures.

Before each release, create and verify a database backup. To roll back application code, redeploy the last known-good image or commit. Do not reverse database migrations by editing applied migration files. Follow `UPGRADE.md` and use a tested database restore when a schema rollback is required.

## Release gate

Do not activate production ingestion or delivery if any of these are true:

- build, unit, or integration tests fail;
- migrations or deployment verification fail;
- PostGIS or pgcrypto is unavailable;
- the worker heartbeat is stale;
- raw-source archiving fails;
- live-source parsing has not been validated;
- station, AOR, land-mask, or recipient data lacks approval;
- database restore has not been tested;
- authorization testing reveals cross-station access;
- uncertain deliveries cannot be reconciled operationally.
