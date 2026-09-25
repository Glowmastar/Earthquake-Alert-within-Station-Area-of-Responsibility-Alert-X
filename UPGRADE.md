# Upgrading from alertx-schema-integrated.zip

This is a new project archive. Extract it to a new folder; do not replace the older archive or its database volume during review. The original supplied 3NF schema is preserved in `database/migrations/001_base_schema.sql`. Migration 002 fixes the missing classification join in the operational view. Migration 003 now seeds only reference data. Migration 004 adds revocable sessions, station access, an explicit review outcome, versioned land-mask history and durable delivery jobs.

For a new database, follow README.md. The migration runner records checksums, applies each SQL file within a transaction, and never runs the old sample password bootstrap. A single new administrator is created separately by `db:bootstrap`.

For an existing database initialized by the earlier archive:

1. Take and restore-test a full database backup. Ensure nobody is ingesting events or sending alerts during the upgrade. Do not run `docker compose down -v` against the existing volume.
2. Verify that the existing database really contains the complete original 001 schema, and inspect differences if any SQL was applied manually. `db:migrate` refuses to assume that an untracked database is identical.
3. Only after confirming the schema, run `npm run db:migrate -- --adopt-legacy` (or `node build/server/migrate.js --adopt-legacy` from the Docker image). This records the supplied baseline and runs migrations 002, 003, and 004. If a migration fails it rolls back that migration; fix the discrepancy rather than bypassing the failure.
4. Migration 004 locks the known former development account `admin@alertx.local` only if it still has the published `ChangeMe123!` password. Retire that account manually if it uses another known development credential. Create a new administrator with `db:bootstrap` if needed. No production password is published in this archive.
5. Populate official stations, approved polygons and land mask, active rule assignments, verified recipients, and controlled source/SMTP settings before switching on live processing.

Existing sessions used JWT in browser storage; they are not imported. Users sign in anew with the cookie session. Importing the old mock data is deliberately not automatic.

## Upgrading this operational release to station USER access

After taking a database backup, run `npm run db:migrate` to apply additive migration 005. Do not edit existing migration files: checksums protect deployed installations. Migration 005 creates the `USER` role and nullable `created_by` and `station_id` fields for old reports and audit events. It does not infer historical authors, change existing roles, enable network delivery, or grant station assignments.

Create a test `USER` account assigned to one station using the administrator interface and verify that it cannot view or edit another station. Convert staff from older roles individually after confirming their duties. Keep at least one administrator for system configuration, recovery, held-alert release and delivery reconciliation. New station activity entries include station context; historical entries lacking that context remain visible to administrators in the organization log.

## Applying migration 006

Back up the database, stop ingestion and delivery workers, then run `npm run db:migrate`. Migration 006:

- permits station-inventory records with unknown coordinates while retaining all-or-none coordinate consistency;
- adds SCSS, STSS and OFFICE types, parent-station links, provenance and validation status;
- corrects AOR evaluation uniqueness to include the rule version;
- strengthens decision supersession and selects one current decision per revision;
- stages the workbook station hierarchy and draft province assignments;
- creates validation issues for missing coverage, overlaps, placeholders and ambiguous names.

The migration does not activate boundaries, create operational AOR polygons, approve province mappings, geocode stations, or enable alert delivery. Review staged records in the administrator Settings page. Do not mark an assignment approved until its PSGC province and operational AOR have been independently verified.
