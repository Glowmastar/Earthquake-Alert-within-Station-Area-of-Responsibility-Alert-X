-- Production stack hardening: immutable raw source evidence, station-local recipient scope,
-- and hierarchy validation. This migration does not promote any staged workbook data.

CREATE TABLE source_response_archives(
 source_response_archive_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 source_id BIGINT NOT NULL REFERENCES earthquake_sources(source_id),
 ingestion_run_id BIGINT NOT NULL UNIQUE REFERENCES ingestion_runs(ingestion_run_id) ON DELETE CASCADE,
 source_url TEXT NOT NULL,
 content_type VARCHAR(100) NOT NULL,
 content_sha256 CHAR(64) NOT NULL,
 byte_size BIGINT NOT NULL CHECK(byte_size>0),
 storage_backend VARCHAR(20) NOT NULL CHECK(storage_backend IN ('DATABASE','S3')),
 object_key TEXT,
 raw_payload TEXT,
 archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT chk_source_response_archive_location CHECK(
   (storage_backend='DATABASE' AND raw_payload IS NOT NULL AND object_key IS NULL)
   OR (storage_backend='S3' AND raw_payload IS NULL AND object_key IS NOT NULL)
 )
);
CREATE INDEX idx_source_response_archives_source_time ON source_response_archives(source_id,archived_at DESC);

-- A selected-AOR recipient can never reference an AOR from another station.
CREATE OR REPLACE FUNCTION enforce_subscription_aor_station_scope() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE recipient_station BIGINT; selected_station BIGINT;
BEGIN
 SELECT ca.station_id INTO recipient_station FROM alert_subscriptions s
 JOIN contact_assignments ca USING(contact_assignment_id) WHERE s.subscription_id=NEW.subscription_id;
 SELECT station_id INTO selected_station FROM aors WHERE aor_id=NEW.aor_id;
 IF recipient_station IS NULL OR selected_station IS NULL OR recipient_station<>selected_station THEN
  RAISE EXCEPTION 'Subscription AOR must belong to the recipient station';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_subscription_aor_station_scope ON subscription_aors;
CREATE TRIGGER trg_subscription_aor_station_scope BEFORE INSERT OR UPDATE ON subscription_aors
 FOR EACH ROW EXECUTE FUNCTION enforce_subscription_aor_station_scope();

-- Prevent accidental cycles and invalid child types in the SCSS/STSS/Main Office hierarchy.
CREATE OR REPLACE FUNCTION enforce_station_hierarchy() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE parent_type VARCHAR(20);
BEGIN
 IF NEW.parent_station_id IS NULL THEN RETURN NEW; END IF;
 IF NEW.parent_station_id=NEW.station_id THEN RAISE EXCEPTION 'A station cannot be its own parent'; END IF;
 SELECT station_type INTO parent_type FROM stations WHERE station_id=NEW.parent_station_id;
 IF parent_type NOT IN ('SCSS','OFFICE') THEN RAISE EXCEPTION 'A station parent must be an SCSS or Main Office record'; END IF;
 IF NEW.station_type<>'STSS' THEN RAISE EXCEPTION 'Only an STSS record may have a parent station'; END IF;
 IF EXISTS(WITH RECURSIVE ancestors(station_id,parent_station_id) AS (
   SELECT station_id,parent_station_id FROM stations WHERE station_id=NEW.parent_station_id
   UNION ALL SELECT s.station_id,s.parent_station_id FROM stations s JOIN ancestors a ON s.station_id=a.parent_station_id
 ) SELECT 1 FROM ancestors WHERE station_id=NEW.station_id) THEN RAISE EXCEPTION 'Station hierarchy would contain a cycle'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_station_hierarchy ON stations;
CREATE TRIGGER trg_station_hierarchy BEFORE INSERT OR UPDATE OF parent_station_id,station_type ON stations
 FOR EACH ROW EXECUTE FUNCTION enforce_station_hierarchy();

-- Workbook metadata is evidence. Preserve any already configured operational station details.
CREATE OR REPLACE FUNCTION preserve_operational_station_metadata() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.validation_status='VALID' AND NEW.source_reference='Provinces within AOR.xlsx'
   AND (NEW.station_type<>OLD.station_type OR NEW.parent_station_id IS DISTINCT FROM OLD.parent_station_id
     OR NEW.station_name<>OLD.station_name) THEN
  RAISE EXCEPTION 'Workbook staging cannot overwrite a validated operational station';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_preserve_operational_station_metadata ON stations;
CREATE TRIGGER trg_preserve_operational_station_metadata BEFORE UPDATE ON stations
 FOR EACH ROW EXECUTE FUNCTION preserve_operational_station_metadata();
