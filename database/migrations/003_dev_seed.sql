-- Reference data only. Create credentials explicitly with npm run db:bootstrap.
INSERT INTO organizations (organization_code, organization_name, organization_type)
VALUES ('DOST-PHIVOLCS', 'DOST-PHIVOLCS', 'GOVERNMENT') ON CONFLICT DO NOTHING;
INSERT INTO earthquake_sources (source_code, source_name, endpoint_url, poll_interval_seconds, active)
VALUES ('EQINFO', 'PHIVOLCS EQInfo', 'https://earthquake.phivolcs.dost.gov.ph/', 300, FALSE)
ON CONFLICT DO NOTHING;
