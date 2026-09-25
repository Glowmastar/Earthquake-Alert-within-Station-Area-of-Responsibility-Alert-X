# Alert X deployment profile

Alert X is deployed as one React/Express application and one private worker. It is deliberately a modular monolith: spatial evaluation, audit records, review decisions, and alert jobs stay transactionally consistent in PostgreSQL/PostGIS.

For the checked-in Render Blueprint, exact environment settings, first-deploy sequence, acceptance tests, activation gates, and rollback procedure, use [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md). The generic hosting guide is background guidance only; the Alert X runbook is authoritative for this application.

## Production target

Use these managed components:

- A public HTTPS load balancer in front of the API container. Keep the worker private; it must never accept public traffic.
- Two container services: `api` and `worker`, built from the supplied Dockerfile.
- Managed PostgreSQL with the PostGIS extension, private networking, automated backups, and a tested restore procedure.
- Private S3-compatible object storage for raw PHIVOLCS pages. Configure `RAW_ARCHIVE_BACKEND=S3`; do not enable EQInfo polling unless this archive is working.
- A secrets manager for database, S3, SMTP, and OIDC credentials. Do not commit a production `.env` file.
- An approved SMTP provider. `DELIVERY_ENABLED` remains `false` until recipients are verified and sending has passed controlled testing.
- Centralized JSON logs and health alarms for `/api/health`, worker heartbeat, failed ingestion runs, failed/uncertain deliveries, and blocked events.

## Required production environment

Set `NODE_ENV=production`, an HTTPS `APP_ORIGIN`, and `TRUST_PROXY=1` (or the number of trusted proxies). Use `DB_SSL=true` with a TLS-enabled external database URL and a trusted CA. The checked-in Render Blueprint instead uses `DB_SSL=false` with Render's private same-region database connection.

For the raw archive, set:

```text
RAW_ARCHIVE_BACKEND=S3
S3_BUCKET=your-private-alertx-source-archive
S3_REGION=ap-southeast-1
S3_ENDPOINT=https://your-s3-compatible-endpoint
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_FORCE_PATH_STYLE=true
```

The S3-compatible credentials need permission only to write objects in this application’s archive prefix. Bucket versioning and retention should be enabled outside the application.

## Release order

1. Back up the database and verify the restore procedure.
2. Deploy the new image to staging with ingestion and delivery disabled.
3. Run migrations once as a release job.
4. Confirm PostGIS boundaries, land mask, station scope, and verified recipients.
5. Confirm that a controlled EQInfo import creates a raw-source archive record and that the worker heartbeat is current.
6. Enable delivery only in controlled test mode. Enable live ingestion only after operational sign-off.

The draft workbook assignments remain non-operational until PSGC/AOR reconciliation and approval. The configured alert policy remains one alert for each new valid event inside an approved AOR, with no magnitude, depth, distance, or felt-status threshold.
