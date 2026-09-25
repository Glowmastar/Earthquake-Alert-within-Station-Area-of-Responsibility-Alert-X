-- Staged SCSS/STSS workbook integration and schema corrections.
-- Workbook values remain DRAFT and never participate in operational classification until approved.

-- Allow inventory records without invented coordinates. Operational AOR boundary imports still require coordinates.
ALTER TABLE stations
    ALTER COLUMN latitude DROP NOT NULL,
    ALTER COLUMN longitude DROP NOT NULL,
    ALTER COLUMN location DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS station_type VARCHAR(10) NOT NULL DEFAULT 'SCSS',
    ADD COLUMN IF NOT EXISTS parent_station_id BIGINT,
    ADD COLUMN IF NOT EXISTS cluster_name VARCHAR(50),
    ADD COLUMN IF NOT EXISTS raw_station_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS raw_location_text VARCHAR(250),
    ADD COLUMN IF NOT EXISTS source_reference VARCHAR(250),
    ADD COLUMN IF NOT EXISTS source_sheet VARCHAR(50),
    ADD COLUMN IF NOT EXISTS source_row INTEGER,
    ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) NOT NULL DEFAULT 'UNVERIFIED';

DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_station_parent') THEN
  ALTER TABLE stations ADD CONSTRAINT fk_station_parent FOREIGN KEY(parent_station_id) REFERENCES stations(station_id);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_station_type') THEN
  ALTER TABLE stations ADD CONSTRAINT chk_station_type CHECK(station_type IN ('SCSS','STSS','OFFICE'));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_station_validation') THEN
  ALTER TABLE stations ADD CONSTRAINT chk_station_validation CHECK(validation_status IN ('UNVERIFIED','IN_REVIEW','VERIFIED','REJECTED'));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_station_coordinate_set') THEN
  ALTER TABLE stations ADD CONSTRAINT chk_station_coordinate_set CHECK(
   (latitude IS NULL AND longitude IS NULL AND location IS NULL) OR
   (latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NOT NULL)
  );
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_stations_parent ON stations(parent_station_id) WHERE parent_station_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stations_type ON stations(station_type);

-- Correct evaluation uniqueness so the same revision/boundary can be evaluated under a new rule version.
ALTER TABLE event_aor_evaluations DROP CONSTRAINT IF EXISTS uq_revision_boundary_eval;
ALTER TABLE event_aor_evaluations
 ADD CONSTRAINT uq_revision_boundary_rule_eval UNIQUE(revision_id,aor_boundary_version_id,rule_version_id);

-- Prevent branched decision roots and enforce same-revision supersession.
CREATE UNIQUE INDEX IF NOT EXISTS uq_decision_revision_root
 ON event_aor_decisions(revision_id) WHERE supersedes_decision_id IS NULL;
CREATE OR REPLACE FUNCTION enforce_decision_supersession_revision()
RETURNS TRIGGER AS $$
DECLARE previous_revision BIGINT;
BEGIN
 IF NEW.supersedes_decision_id IS NULL THEN RETURN NEW; END IF;
 SELECT revision_id INTO previous_revision FROM event_aor_decisions WHERE decision_id=NEW.supersedes_decision_id;
 IF previous_revision IS NULL OR previous_revision<>NEW.revision_id OR NEW.supersedes_decision_id=NEW.decision_id THEN
  RAISE EXCEPTION 'A superseded decision must exist on the same earthquake revision';
 END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_decision_supersession_revision ON event_aor_decisions;
CREATE TRIGGER trg_decision_supersession_revision
 BEFORE INSERT OR UPDATE OF revision_id,supersedes_decision_id ON event_aor_decisions
 FOR EACH ROW EXECUTE FUNCTION enforce_decision_supersession_revision();

CREATE OR REPLACE VIEW vw_current_aor_decisions AS
SELECT DISTINCT ON (revision_id) d.*
FROM event_aor_decisions d
WHERE NOT EXISTS(SELECT 1 FROM event_aor_decisions newer WHERE newer.supersedes_decision_id=d.decision_id)
ORDER BY revision_id,decided_at DESC,decision_id DESC;

CREATE TABLE data_import_batches(
 import_batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 source_file_name VARCHAR(250) NOT NULL,
 source_checksum VARCHAR(128) NOT NULL,
 imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 import_status VARCHAR(20) NOT NULL DEFAULT 'STAGED',
 notes TEXT,
 CONSTRAINT uq_import_source UNIQUE(source_file_name,source_checksum),
 CONSTRAINT chk_import_status CHECK(import_status IN ('STAGED','IN_REVIEW','VALIDATED','REJECTED'))
);
CREATE TABLE station_import_rows(
 station_import_row_id BIGSERIAL PRIMARY KEY,
 import_batch_id UUID NOT NULL REFERENCES data_import_batches(import_batch_id) ON DELETE CASCADE,
 source_row INTEGER NOT NULL,
 cluster_raw VARCHAR(100),
 scss_code_raw VARCHAR(30),
 scss_name_raw VARCHAR(200),
 stss_code_raw VARCHAR(30),
 location_raw VARCHAR(250),
 is_placeholder BOOLEAN NOT NULL DEFAULT false,
 UNIQUE(import_batch_id,source_row)
);
CREATE TABLE aor_assignment_import_rows(
 assignment_import_row_id BIGSERIAL PRIMARY KEY,
 import_batch_id UUID NOT NULL REFERENCES data_import_batches(import_batch_id) ON DELETE CASCADE,
 source_row INTEGER NOT NULL,
 scss_code_raw VARCHAR(30) NOT NULL,
 area_name_raw VARCHAR(150) NOT NULL,
 area_name_standardized VARCHAR(150),
 validation_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
 UNIQUE(import_batch_id,source_row,scss_code_raw,area_name_raw),
 CONSTRAINT chk_assignment_import_status CHECK(validation_status IN ('DRAFT','IN_REVIEW','APPROVED','REJECTED'))
);
CREATE TABLE aor_administrative_assignments(
 assignment_id BIGSERIAL PRIMARY KEY,
 station_id BIGINT NOT NULL REFERENCES stations(station_id),
 aor_id BIGINT REFERENCES aors(aor_id),
 area_id BIGINT REFERENCES administrative_areas(area_id),
 raw_area_name VARCHAR(150) NOT NULL,
 standardized_area_name VARCHAR(150),
 coverage_type VARCHAR(20) NOT NULL DEFAULT 'FULL',
 approval_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
 source_reference VARCHAR(250) NOT NULL,
 source_sheet VARCHAR(50) NOT NULL,
 source_row INTEGER NOT NULL,
 import_batch_id UUID NOT NULL REFERENCES data_import_batches(import_batch_id),
 effective_from TIMESTAMPTZ,
 effective_to TIMESTAMPTZ,
 reviewed_by UUID REFERENCES users(user_id),
 reviewed_at TIMESTAMPTZ,
 review_notes TEXT,
 CONSTRAINT uq_aor_admin_source UNIQUE(import_batch_id,station_id,source_row,raw_area_name),
 CONSTRAINT chk_aor_admin_coverage CHECK(coverage_type IN ('FULL','PARTIAL','BUFFER')),
 CONSTRAINT chk_aor_admin_status CHECK(approval_status IN ('DRAFT','IN_REVIEW','APPROVED','REJECTED')),
 CONSTRAINT chk_aor_admin_dates CHECK(effective_to IS NULL OR (effective_from IS NOT NULL AND effective_to>effective_from)),
 CONSTRAINT chk_aor_admin_approval CHECK(approval_status<>'APPROVED' OR (aor_id IS NOT NULL AND area_id IS NOT NULL AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE INDEX idx_aor_admin_station_status ON aor_administrative_assignments(station_id,approval_status);
CREATE INDEX idx_aor_admin_area ON aor_administrative_assignments(area_id) WHERE area_id IS NOT NULL;

CREATE TABLE data_validation_issues(
 validation_issue_id BIGSERIAL PRIMARY KEY,
 import_batch_id UUID NOT NULL REFERENCES data_import_batches(import_batch_id) ON DELETE CASCADE,
 entity_type VARCHAR(30) NOT NULL,
 entity_reference VARCHAR(150) NOT NULL,
 issue_code VARCHAR(50) NOT NULL,
 severity VARCHAR(10) NOT NULL,
 issue_description TEXT NOT NULL,
 issue_status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
 resolved_by UUID REFERENCES users(user_id),
 resolved_at TIMESTAMPTZ,
 resolution_notes TEXT,
 UNIQUE(import_batch_id,entity_type,entity_reference,issue_code),
 CONSTRAINT chk_validation_severity CHECK(severity IN ('INFO','WARNING','BLOCKING')),
 CONSTRAINT chk_validation_issue_status CHECK(issue_status IN ('OPEN','RESOLVED','WONT_FIX'))
);

INSERT INTO data_import_batches(import_batch_id,source_file_name,source_checksum,notes)
VALUES('00000000-0000-4000-8000-000000000006','Provinces within AOR.xlsx','94455d3fbdb9c41588d6bcfa91badb16f5cefb5add8ec7f9d6e29de2c4ec6954',
 'Workbook staged on 2026-09-25. Sheet2 supplies station hierarchy; Sheet1 province values are draft AOR assignments.')
ON CONFLICT(source_file_name,source_checksum) DO NOTHING;

INSERT INTO stations(station_code,station_name,station_type,cluster_name,raw_station_name,source_reference,source_sheet,source_row,validation_status)
VALUES
('BBP','Basco Seismic Station','SCSS','North Luzon','Basco Seismic Station','Provinces within AOR.xlsx','Sheet2',2,'UNVERIFIED'),
('BCP','Baguio Seismic Station','SCSS','North Luzon','Baguio Seismic Station','Provinces within AOR.xlsx','Sheet2',3,'UNVERIFIED'),
('CVP','Callao Seismic Station','SCSS','North Luzon','Callao Seismic Station','Provinces within AOR.xlsx','Sheet2',5,'UNVERIFIED'),
('PCP','Palayan Seismic Station','SCSS','North Luzon','Palayan Seismic Station','Provinces within AOR.xlsx','Sheet2',11,'UNVERIFIED'),
('PIP','Pasuquin Seismic Station','SCSS','North Luzon','Pasuquin Seismic Station','Provinces within AOR.xlsx','Sheet2',18,'UNVERIFIED'),
('SIPP','Sinait Seismic Station','SCSS','North Luzon','Sinait Seismic Station','Provinces within AOR.xlsx','Sheet2',20,'UNVERIFIED'),
('GQP','Guinayangan Seismic Station','SCSS','South Luzon','Guinayangan Seismic Station','Provinces within AOR.xlsx','Sheet2',24,'UNVERIFIED'),
('LQP','Lucban Seismic Station','SCSS','South Luzon','Lucban Seismic Station','Provinces within AOR.xlsx','Sheet2',28,'UNVERIFIED'),
('PGP','Puerto Galera Seismic Station','SCSS','South Luzon','Puerto Galera Seismic Station','Provinces within AOR.xlsx','Sheet2',33,'UNVERIFIED'),
('M.O.','Main Office','OFFICE','South Luzon','Main Office','Provinces within AOR.xlsx','Sheet2',37,'UNVERIFIED'),
('TGY','Tagaytay Seismic Station','SCSS','South Luzon','Tagaytay Seismic Station','Provinces within AOR.xlsx','Sheet2',39,'UNVERIFIED'),
('IAP','Ibajay Seismic Station','SCSS','Visayas','Ibajay Seismic Station','Provinces within AOR.xlsx','Sheet2',41,'UNVERIFIED'),
('JAP','San Jose de Buenavista Seismic Station','SCSS','Visayas','San Jose de Buenavista Seismic Station','Provinces within AOR.xlsx','Sheet2',42,'UNVERIFIED'),
('LLP','Lapu-lapu Seismic Station','SCSS','Visayas','Lapu-lapu Seismic Station','Provinces within AOR.xlsx','Sheet2',43,'UNVERIFIED'),
('MMP','Masbate Seismic Station','SCSS','Visayas','Masbate Seismic Station','Provinces within AOR.xlsx','Sheet2',46,'UNVERIFIED'),
('PLP','Palo Seismic Station','SCSS','Visayas','Palo Seismic Station','Provinces within AOR.xlsx','Sheet2',47,'UNVERIFIED'),
('PPR','Puerto Princesa Seismic Station','SCSS','Visayas','Puerto Princesa Seismic Station','Provinces within AOR.xlsx','Sheet2',52,'UNVERIFIED'),
('RCP','Roxas Seismic Station','SCSS','Visayas','Roxas Seismic Station','Provinces within AOR.xlsx','Sheet2',57,'UNVERIFIED'),
('SNP','Sibulan Seismic Station','SCSS','Visayas','Sibulan Seismic Station','Provinces within AOR.xlsx','Sheet2',58,'UNVERIFIED'),
('TBP','Tagbilaran Seismic Station','SCSS','Visayas','Tagbilaran Seismic Station','Provinces within AOR.xlsx','Sheet2',62,'UNVERIFIED'),
('BIP','Bislig Seismic Station','SCSS','Mindanao','Bislig Seismic Station','Provinces within AOR.xlsx','Sheet2',64,'UNVERIFIED'),
('CGP','Cagayan de Oro Seismic Station','SCSS','Mindanao','Cagayan de Oro Seismic Station','Provinces within AOR.xlsx','Sheet2',68,'UNVERIFIED'),
('CTB','Cotabato Seismic Station','SCSS','Mindanao','Cotabato Seismic Station','Provinces within AOR.xlsx','Sheet2',70,'UNVERIFIED'),
('DCP','Dipolog Seismic Station','SCSS','Mindanao','Dipolog Seismic Station','Provinces within AOR.xlsx','Sheet2',71,'UNVERIFIED'),
('DMP','Davao Seismic Station','SCSS','Mindanao','Davao Seismic Station','Provinces within AOR.xlsx','Sheet2',73,'UNVERIFIED'),
('GSP','General Santos Seismic Station','SCSS','Mindanao','General Santos Seismic Station','Provinces within AOR.xlsx','Sheet2',75,'UNVERIFIED'),
('KCP','Kidapawan Seismic Station','SCSS','Mindanao','Kidapawan Seimic Station','Provinces within AOR.xlsx','Sheet2',76,'UNVERIFIED'),
('SCP','Surigao Seismic Station','SCSS','Mindanao','Surigao Seismic Station','Provinces within AOR.xlsx','Sheet2',78,'UNVERIFIED'),
('ZCP','Zamboanga Seismic Station','SCSS','Mindanao','Zamboanga Seismic Station','Provinces within AOR.xlsx','Sheet2',81,'UNVERIFIED')
ON CONFLICT(station_code) DO UPDATE SET
 station_type=EXCLUDED.station_type,cluster_name=EXCLUDED.cluster_name,raw_station_name=EXCLUDED.raw_station_name,
 source_reference='Provinces within AOR.xlsx',source_sheet='Sheet2',source_row=EXCLUDED.source_row;

WITH rows(station_code,station_name,station_type,cluster_name,raw_location_text,parent_code,source_row) AS (VALUES
('BBPS','BBPS - Basco, Batanes','STSS','North Luzon','Basco, Batanes','BBP',2),
('AGIP','AGIP - Aguinaldo, Ifugao','STSS','North Luzon','Aguinaldo, Ifugao','BCP',3),
('SAMP','SAMP - Sagada, Mountain Province','STSS','North Luzon','Sagada, Mountain Province','BCP',4),
('APYP','APYP - Conner, Apayao','STSS','North Luzon','Conner, Apayao','CVP',5),
('CAQP','CAQP - Cabarroguis, Quirino','STSS','North Luzon','Cabarroguis, Quirino','CVP',6),
('CAUP','CAUP - Cauayan, Isabela','STSS','North Luzon','Cauayan, Isabela','CVP',7),
('PALP','PALP - Palanan, Isabela','STSS','North Luzon','Palanan, Isabela','CVP',8),
('SGCP','SGCP - Gonzaga, Cagayan','STSS','North Luzon','Gonzaga, Cagayan','CVP',9),
('TCKP','TCKP - Tabuk City, Kalinga','STSS','North Luzon','Tabuk City, Kalinga','CVP',10),
('ABPP','ABPP - Abucay, Bataan','STSS','North Luzon','Abucay, Bataan','PCP',11),
('ANVP','ANVP - Ariato, Nueva Vizcaya','STSS','North Luzon','Ariato, Nueva Vizcaya','PCP',12),
('BALP','BALP - Baler, Aurora','STSS','North Luzon','Baler, Aurora','PCP',13),
('CAAP','CAAP - Casiguran, Aurora','STSS','North Luzon','Casiguran, Aurora','PCP',14),
('CATP','CATP - Camiling, Tarlac','STSS','North Luzon','Camiling, Tarlac','PCP',15),
('IBZP','IBZP - Iba, Zambales','STSS','North Luzon','Iba, Zambales','PCP',16),
('SCZP','SCZP - Santa Cruz, Zambales','STSS','North Luzon','Santa Cruz, Zambales','PCP',17),
('CICP','CICP - Calayan, Cagayan','STSS','North Luzon','Calayan, Cagayan','PIP',18),
('PACP','PACP - Pamplona, Cagayan','STSS','North Luzon','Pamplona, Cagayan','PIP',19),
('ABRA','ABRA - Dolores, Abra','STSS','North Luzon','Dolores, Abra','SIPP',20),
('BOLP','BOLP - Bolinao, Pangasinan','STSS','North Luzon','Bolinao, Pangasinan','SIPP',21),
('SMPP','SMPP - San Manuel, Pangasinan','STSS','North Luzon','San Manuel, Pangasinan','SIPP',22),
('SZP','SZP - Santa, Ilocos Sur','STSS','North Luzon','Santa, Ilocos Sur','SIPP',23),
('AIQP','AIQP - Alabat Island, Quezon','STSS','South Luzon','Alabat Island, Quezon','GQP',24),
('AUQP','AUQP - San Andres, Quezon','STSS','South Luzon','San Andres, Quezon','GQP',25),
('JCNP','JCNP - Jose Panganiban, Camarines Norte','STSS','South Luzon','Jose Panganiban, Camarines Norte','GQP',26),
('SCSP','SCSP - San Jose, Camarines Sur','STSS','South Luzon','San Jose, Camarines Sur','GQP',27),
('GNQP','GNQP - General Nakar, Quezon','STSS','South Luzon','General Nakar, Quezon','LQP',28),
('LBLP','LBLP - Los Banos, Laguna','STSS','South Luzon','Los Banos, Laguna','LQP',29),
('POLP','POLP - Polilio Island, Quezon','STSS','South Luzon','Polilio Island, Quezon','LQP',30),
('PAKP','PAKP - Pakil, Laguna','STSS','South Luzon','Pakil, Laguna','LQP',31),
('TIRP','TIRP - Talim Island, Rizal','STSS','South Luzon','Talim Island, Rizal','LQP',32),
('BOAC','BOAC - Boac, Marinduque','STSS','South Luzon','Boac, Marinduque','PGP',33),
('GOMP','GOMP - Gloria, Oriental Mindoro','STSS','South Luzon','Gloria, Oriental Mindoro','PGP',34),
('LUBP','LUBP - Lubang, Occidental Mindoro','STSS','South Luzon','Lubang, Occidental Mindoro','PGP',35),
('SJMP','SJMP - San Jose, Occidental Mindoro','STSS','South Luzon','San Jose, Occidental Mindoro','PGP',36),
('QVP','QVP - Quezon City','STSS','South Luzon','Quezon City','M.O.',37),
('RTBP','RTBP - Doña Remedios Trinidad, Bulacan','STSS','South Luzon','Doña Remedios Trinidad, Bulacan','M.O.',38),
('MABP','MABP - Mabini, Batangas','STSS','South Luzon','Mabini, Batangas','TGY',39),
('MACP','MACP - Maragondon, Cavite','STSS','South Luzon','Maragondon, Cavite','TGY',40),
('OTRP','OTRP - Odiongan, Romblon','STSS','Visayas','Odiongan, Romblon','IAP',41),
('GUIM','GUIM - Jordan, Guimaras','STSS','Visayas','Jordan, Guimaras','JAP',42),
('DACP','DACP - Dalaguete, Cebu','STSS','Visayas','Dalaguete, Cebu','LLP',43),
('MECP','MECP - Medellin, Cebu','STSS','Visayas','Medellin, Cebu','LLP',44),
('SFCP','SFCP - San Francisco, Cebu','STSS','Visayas','San Francisco, Cebu','LLP',45),
('PVCP','PVCP - Virac, Catanduanes','STSS','Visayas','Virac, Catanduanes','MMP',46),
('BESP','BESP - Borongan, Eastern Samar','STSS','Visayas','Borongan, Eastern Samar','PLP',47),
('CNPS','CNPS - Catarman, Northern Samar','STSS','Visayas','Catarman, Northern Samar','PLP',48),
('MSLP','MSLP - Maasin, Southern Leyte','STSS','Visayas','Maasin, Southern Leyte','PLP',49),
('OCLP','OCLP - Ormoc City','STSS','Visayas','Ormoc City','PLP',50),
('SPEP','SPEP - San Policarpo, Eastern Samar','STSS','Visayas','San Policarpo, Eastern Samar','PLP',51),
('BATP','BATP - Brooke''s Point, Palawan','STSS','Visayas','Brooke''s Point, Palawan','PPR',52),
('BUSP','BUSP - Busuanga, Palawan','STSS','Visayas','Busuanga, Palawan','PPR',53),
('CUYO','CUYO - Cuyo, Palawan','STSS','Visayas','Cuyo, Palawan','PPR',54),
('ENPP','ENPP - El Nido, Palawan','STSS','Visayas','El Nido, Palawan','PPR',55),
('QUPP','QUPP - Quezon, Palawan','STSS','Visayas','Quezon, Palawan','PPR',56),
('DUIP','DUIP - Dueñas, Iloilo','STSS','Visayas','Dueñas, Iloilo','RCP',57),
('CADP','CADP - Cadiz City','STSS','Visayas','Cadiz City','SNP',58),
('GNOP','GNOP - Guihulngan City','STSS','Visayas','Guihulngan City','SNP',59),
('LSIP','LSIP - Lazi, Siquijor','STSS','Visayas','Lazi, Siquijor','SNP',60),
('CNOP','CNOP - Candoni, Negros Occidental','STSS','Visayas','Candoni, Negros Occidental','SNP',61),
('GHBP','GHBP - Garcia Hernandez, Bohol','STSS','Visayas','Garcia Hernandez, Bohol','TBP',62),
('TABP','TABP - Talibon, Bohol','STSS','Visayas','Talibon, Bohol','TBP',63),
('CDOP','CDOP - Cateel, Davao Oriental','STSS','Mindanao','Cateel, Davao Oriental','BIP',64),
('LCVP','LCVP - Laak, Compostela Valley','STSS','Mindanao','Laak, Compostela Valley','BIP',65),
('TASP','TASP - Talacogon, Agusan Del Sur','STSS','Mindanao','Talacogon, Agusan Del Sur','BIP',66),
('TSSP','TSSP - Tandag, Surigao Del Sur','STSS','Mindanao','Tandag, Surigao Del Sur','BIP',67),
('BLNP','BLNP - Bacolod, Lanao Del Norte','STSS','Mindanao','Bacolod, Lanao Del Norte','CGP',68),
('BUKP','BUKP - Valencia, Bukidnon','STSS','Mindanao','Valencia, Bukidnon','CGP',69),
('MARP','MARP - Marawi City','STSS','Mindanao','Marawi City','CTB',70),
('PAGZ','PAGZ - Pagadian City','STSS','Mindanao','Pagadian City','DCP',71),
('SZNP','SZNP - Siocon, Zamboanga Del Norte','STSS','Mindanao','Siocon, Zamboanga Del Norte','DCP',72),
('DDMP','DDMP - Don Marcelino, Davao Del Sur','STSS','Mindanao','Don Marcelino, Davao Del Sur','DMP',73),
('MATI','MATI - Mati City','STSS','Mindanao','Mati City','DMP',74),
('PICP','PICP - Pikit, Cotabato','STSS','Mindanao','Pikit, Cotabato','KCP',76),
('SKMP','SKMP - Sultan Kudarat, Maguindanao','STSS','Mindanao','Sultan Kudarat, Maguindanao','KCP',77),
('BUTP','BUTP - Butuan City','STSS','Mindanao','Butuan City','SCP',78),
('LDIP','LDIP - Loreto, Dinagat Island','STSS','Mindanao','Loreto, Dinagat Island','SCP',79),
('GLSP','GLSP - General Luna, Surigao Del Norte','STSS','Mindanao','General Luna, Surigao Del Norte','SCP',80),
('IPIL','IPIL - Ipil, Zamboanga Sibugay','STSS','Mindanao','Ipil, Zamboanga Sibugay','ZCP',81),
('BTTP','BTTP - Bongao, Tawi-tawi','STSS','Mindanao','Bongao, Tawi-tawi','ZCP',82)
)
INSERT INTO stations(station_code,station_name,station_type,cluster_name,raw_location_text,source_reference,source_sheet,source_row,validation_status,parent_station_id)
SELECT r.station_code,r.station_name,r.station_type,r.cluster_name,r.raw_location_text,'Provinces within AOR.xlsx','Sheet2',r.source_row,'UNVERIFIED',p.station_id
FROM rows r JOIN stations p ON p.station_code=r.parent_code
ON CONFLICT(station_code) DO UPDATE SET
 station_type='STSS',cluster_name=EXCLUDED.cluster_name,raw_location_text=EXCLUDED.raw_location_text,
 source_reference='Provinces within AOR.xlsx',source_sheet='Sheet2',source_row=EXCLUDED.source_row,parent_station_id=EXCLUDED.parent_station_id;

INSERT INTO station_import_rows(import_batch_id,source_row,cluster_raw,scss_code_raw,scss_name_raw,stss_code_raw,location_raw,is_placeholder)
VALUES
('00000000-0000-4000-8000-000000000006',2,'North Luzon','BBP','Basco Seismic Station','BBPS','Basco, Batanes',false),
('00000000-0000-4000-8000-000000000006',3,'North Luzon','BCP','Baguio Seismic Station','AGIP','Aguinaldo, Ifugao',false),
('00000000-0000-4000-8000-000000000006',4,'North Luzon','BCP','Baguio Seismic Station','SAMP','Sagada, Mountain Province',false),
('00000000-0000-4000-8000-000000000006',5,'North Luzon','CVP','Callao Seismic Station','APYP','Conner, Apayao',false),
('00000000-0000-4000-8000-000000000006',6,'North Luzon','CVP','Callao Seismic Station','CAQP','Cabarroguis, Quirino',false),
('00000000-0000-4000-8000-000000000006',7,'North Luzon','CVP','Callao Seismic Station','CAUP','Cauayan, Isabela',false),
('00000000-0000-4000-8000-000000000006',8,'North Luzon','CVP','Callao Seismic Station','PALP','Palanan, Isabela',false),
('00000000-0000-4000-8000-000000000006',9,'North Luzon','CVP','Callao Seismic Station','SGCP','Gonzaga, Cagayan',false),
('00000000-0000-4000-8000-000000000006',10,'North Luzon','CVP','Callao Seismic Station','TCKP','Tabuk City, Kalinga',false),
('00000000-0000-4000-8000-000000000006',11,'North Luzon','PCP','Palayan Seismic Station','ABPP','Abucay, Bataan',false),
('00000000-0000-4000-8000-000000000006',12,'North Luzon','PCP','Palayan Seismic Station','ANVP','Ariato, Nueva Vizcaya',false),
('00000000-0000-4000-8000-000000000006',13,'North Luzon','PCP','Palayan Seismic Station','BALP','Baler, Aurora',false),
('00000000-0000-4000-8000-000000000006',14,'North Luzon','PCP','Palayan Seismic Station','CAAP','Casiguran, Aurora',false),
('00000000-0000-4000-8000-000000000006',15,'North Luzon','PCP','Palayan Seismic Station','CATP','Camiling, Tarlac',false),
('00000000-0000-4000-8000-000000000006',16,'North Luzon','PCP','Palayan Seismic Station','IBZP','Iba, Zambales',false),
('00000000-0000-4000-8000-000000000006',17,'North Luzon','PCP','Palayan Seismic Station','SCZP','Santa Cruz, Zambales',false),
('00000000-0000-4000-8000-000000000006',18,'North Luzon','PIP','Pasuquin Seismic Station','CICP','Calayan, Cagayan',false),
('00000000-0000-4000-8000-000000000006',19,'North Luzon','PIP','Pasuquin Seismic Station','PACP','Pamplona, Cagayan',false),
('00000000-0000-4000-8000-000000000006',20,'North Luzon','SIPP','Sinait Seismic Station','ABRA','Dolores, Abra',false),
('00000000-0000-4000-8000-000000000006',21,'North Luzon','SIPP','Sinait Seismic Station','BOLP','Bolinao, Pangasinan',false),
('00000000-0000-4000-8000-000000000006',22,'North Luzon','SIPP','Sinait Seismic Station','SMPP','San Manuel, Pangasinan',false),
('00000000-0000-4000-8000-000000000006',23,'North Luzon','SIPP','Sinait Seismic Station','SZP','Santa, Ilocos Sur',false),
('00000000-0000-4000-8000-000000000006',24,'South Luzon','GQP','Guinayangan Seismic Station','AIQP','Alabat Island, Quezon',false),
('00000000-0000-4000-8000-000000000006',25,'South Luzon','GQP','Guinayangan Seismic Station','AUQP','San Andres, Quezon',false),
('00000000-0000-4000-8000-000000000006',26,'South Luzon','GQP','Guinayangan Seismic Station','JCNP','Jose Panganiban, Camarines Norte',false),
('00000000-0000-4000-8000-000000000006',27,'South Luzon','GQP','Guinayangan Seismic Station','SCSP','San Jose, Camarines Sur',false),
('00000000-0000-4000-8000-000000000006',28,'South Luzon','LQP','Lucban Seismic Station','GNQP','General Nakar, Quezon',false),
('00000000-0000-4000-8000-000000000006',29,'South Luzon','LQP','Lucban Seismic Station','LBLP','Los Banos, Laguna',false),
('00000000-0000-4000-8000-000000000006',30,'South Luzon','LQP','Lucban Seismic Station','POLP','Polilio Island, Quezon',false),
('00000000-0000-4000-8000-000000000006',31,'South Luzon','LQP','Lucban Seismic Station','PAKP','Pakil, Laguna',false),
('00000000-0000-4000-8000-000000000006',32,'South Luzon','LQP','Lucban Seismic Station','TIRP','Talim Island, Rizal',false),
('00000000-0000-4000-8000-000000000006',33,'South Luzon','PGP','Puerto Galera Seismic Station','BOAC','Boac, Marinduque',false),
('00000000-0000-4000-8000-000000000006',34,'South Luzon','PGP','Puerto Galera Seismic Station','GOMP','Gloria, Oriental Mindoro',false),
('00000000-0000-4000-8000-000000000006',35,'South Luzon','PGP','Puerto Galera Seismic Station','LUBP','Lubang, Occidental Mindoro',false),
('00000000-0000-4000-8000-000000000006',36,'South Luzon','PGP','Puerto Galera Seismic Station','SJMP','San Jose, Occidental Mindoro',false),
('00000000-0000-4000-8000-000000000006',37,'South Luzon','M.O.','Main Office','QVP','Quezon City',false),
('00000000-0000-4000-8000-000000000006',38,'South Luzon','M.O.','Main Office','RTBP','Doña Remedios Trinidad, Bulacan',false),
('00000000-0000-4000-8000-000000000006',39,'South Luzon','TGY','Tagaytay Seismic Station','MABP','Mabini, Batangas',false),
('00000000-0000-4000-8000-000000000006',40,'South Luzon','TGY','Tagaytay Seismic Station','MACP','Maragondon, Cavite',false),
('00000000-0000-4000-8000-000000000006',41,'Visayas','IAP','Ibajay Seismic Station','OTRP','Odiongan, Romblon',false),
('00000000-0000-4000-8000-000000000006',42,'Visayas','JAP','San Jose de Buenavista Seismic Station','GUIM','Jordan, Guimaras',false),
('00000000-0000-4000-8000-000000000006',43,'Visayas','LLP','Lapu-lapu Seismic Station','DACP','Dalaguete, Cebu',false),
('00000000-0000-4000-8000-000000000006',44,'Visayas','LLP','Lapu-lapu Seismic Station','MECP','Medellin, Cebu',false),
('00000000-0000-4000-8000-000000000006',45,'Visayas','LLP','Lapu-lapu Seismic Station','SFCP','San Francisco, Cebu',false),
('00000000-0000-4000-8000-000000000006',46,'Visayas','MMP','Masbate Seismic Station','PVCP','Virac, Catanduanes',false),
('00000000-0000-4000-8000-000000000006',47,'Visayas','PLP','Palo Seismic Station','BESP','Borongan, Eastern Samar',false),
('00000000-0000-4000-8000-000000000006',48,'Visayas','PLP','Palo Seismic Station','CNPS','Catarman, Northern Samar',false),
('00000000-0000-4000-8000-000000000006',49,'Visayas','PLP','Palo Seismic Station','MSLP','Maasin, Southern Leyte',false),
('00000000-0000-4000-8000-000000000006',50,'Visayas','PLP','Palo Seismic Station','OCLP','Ormoc City',false),
('00000000-0000-4000-8000-000000000006',51,'Visayas','PLP','Palo Seismic Station','SPEP','San Policarpo, Eastern Samar',false),
('00000000-0000-4000-8000-000000000006',52,'Visayas','PPR','Puerto Princesa Seismic Station','BATP','Brooke''s Point, Palawan',false),
('00000000-0000-4000-8000-000000000006',53,'Visayas','PPR','Puerto Princesa Seismic Station','BUSP','Busuanga, Palawan',false),
('00000000-0000-4000-8000-000000000006',54,'Visayas','PPR','Puerto Princesa Seismic Station','CUYO','Cuyo, Palawan',false),
('00000000-0000-4000-8000-000000000006',55,'Visayas','PPR','Puerto Princesa Seismic Station','ENPP','El Nido, Palawan',false),
('00000000-0000-4000-8000-000000000006',56,'Visayas','PPR','Puerto Princesa Seismic Station','QUPP','Quezon, Palawan',false),
('00000000-0000-4000-8000-000000000006',57,'Visayas','RCP','Roxas Seismic Station','DUIP','Dueñas, Iloilo',false),
('00000000-0000-4000-8000-000000000006',58,'Visayas','SNP','Sibulan Seismic Station','CADP','Cadiz City',false),
('00000000-0000-4000-8000-000000000006',59,'Visayas','SNP','Sibulan Seismic Station','GNOP','Guihulngan City',false),
('00000000-0000-4000-8000-000000000006',60,'Visayas','SNP','Sibulan Seismic Station','LSIP','Lazi, Siquijor',false),
('00000000-0000-4000-8000-000000000006',61,'Visayas','SNP','Sibulan Seismic Station','CNOP','Candoni, Negros Occidental',false),
('00000000-0000-4000-8000-000000000006',62,'Visayas','TBP','Tagbilaran Seismic Station','GHBP','Garcia Hernandez, Bohol',false),
('00000000-0000-4000-8000-000000000006',63,'Visayas','TBP','Tagbilaran Seismic Station','TABP','Talibon, Bohol',false),
('00000000-0000-4000-8000-000000000006',64,'Mindanao','BIP','Bislig Seismic Station','CDOP','Cateel, Davao Oriental',false),
('00000000-0000-4000-8000-000000000006',65,'Mindanao','BIP','Bislig Seismic Station','LCVP','Laak, Compostela Valley',false),
('00000000-0000-4000-8000-000000000006',66,'Mindanao','BIP','Bislig Seismic Station','TASP','Talacogon, Agusan Del Sur',false),
('00000000-0000-4000-8000-000000000006',67,'Mindanao','BIP','Bislig Seismic Station','TSSP','Tandag, Surigao Del Sur',false),
('00000000-0000-4000-8000-000000000006',68,'Mindanao','CGP','Cagayan de Oro Seismic Station','BLNP','Bacolod, Lanao Del Norte',false),
('00000000-0000-4000-8000-000000000006',69,'Mindanao','CGP','Cagayan de Oro Seismic Station','BUKP','Valencia, Bukidnon',false),
('00000000-0000-4000-8000-000000000006',70,'Mindanao','CTB','Cotabato Seismic Station','MARP','Marawi City',false),
('00000000-0000-4000-8000-000000000006',71,'Mindanao','DCP','Dipolog Seismic Station','PAGZ','Pagadian City',false),
('00000000-0000-4000-8000-000000000006',72,'Mindanao','DCP','Dipolog Seismic Station','SZNP','Siocon, Zamboanga Del Norte',false),
('00000000-0000-4000-8000-000000000006',73,'Mindanao','DMP','Davao Seismic Station','DDMP','Don Marcelino, Davao Del Sur',false),
('00000000-0000-4000-8000-000000000006',74,'Mindanao','DMP','Davao Seismic Station','MATI','Mati City',false),
('00000000-0000-4000-8000-000000000006',75,'Mindanao','GSP','General Santos Seismic Station','NONE','-',true),
('00000000-0000-4000-8000-000000000006',76,'Mindanao','KCP','Kidapawan Seimic Station','PICP','Pikit, Cotabato',false),
('00000000-0000-4000-8000-000000000006',77,'Mindanao','KCP','Kidapawan Seimic Station','SKMP','Sultan Kudarat, Maguindanao',false),
('00000000-0000-4000-8000-000000000006',78,'Mindanao','SCP','Surigao Seismic Station','BUTP','Butuan City',false),
('00000000-0000-4000-8000-000000000006',79,'Mindanao','SCP','Surigao Seismic Station','LDIP','Loreto, Dinagat Island',false),
('00000000-0000-4000-8000-000000000006',80,'Mindanao','SCP','Surigao Seismic Station','GLSP','General Luna, Surigao Del Norte',false),
('00000000-0000-4000-8000-000000000006',81,'Mindanao','ZCP','Zamboanga Seismic Station','IPIL','Ipil, Zamboanga Sibugay',false),
('00000000-0000-4000-8000-000000000006',82,'Mindanao','ZCP','Zamboanga Seismic Station','BTTP','Bongao, Tawi-tawi',false)
ON CONFLICT DO NOTHING;

INSERT INTO aor_assignment_import_rows(import_batch_id,source_row,scss_code_raw,area_name_raw,area_name_standardized,validation_status)
VALUES
('00000000-0000-4000-8000-000000000006',2,'BBP','Batanes','Batanes','DRAFT'),
('00000000-0000-4000-8000-000000000006',3,'BCP','Benguet','Benguet','DRAFT'),
('00000000-0000-4000-8000-000000000006',3,'BCP','Ifugao','Ifugao','DRAFT'),
('00000000-0000-4000-8000-000000000006',3,'BCP','Kalinga','Kalinga','DRAFT'),
('00000000-0000-4000-8000-000000000006',5,'CVP','Kalinga','Kalinga','DRAFT'),
('00000000-0000-4000-8000-000000000006',5,'CVP','Apayao','Apayao','DRAFT'),
('00000000-0000-4000-8000-000000000006',5,'CVP','Quirino','Quirino','DRAFT'),
('00000000-0000-4000-8000-000000000006',5,'CVP','Isabela','Isabela','DRAFT'),
('00000000-0000-4000-8000-000000000006',12,'PCP','Nueva Vizcaya','Nueva Vizcaya','DRAFT'),
('00000000-0000-4000-8000-000000000006',12,'PCP','Aurora','Aurora','DRAFT'),
('00000000-0000-4000-8000-000000000006',12,'PCP','Zambales','Zambales','DRAFT'),
('00000000-0000-4000-8000-000000000006',12,'PCP','Tarlac','Tarlac','DRAFT'),
('00000000-0000-4000-8000-000000000006',18,'PIP','Ilocos Norte','Ilocos Norte','DRAFT'),
('00000000-0000-4000-8000-000000000006',18,'PIP','Cagayan','Cagayan','DRAFT'),
('00000000-0000-4000-8000-000000000006',20,'SIPP','Abra','Abra','DRAFT'),
('00000000-0000-4000-8000-000000000006',20,'SIPP','La Union','La Union','DRAFT'),
('00000000-0000-4000-8000-000000000006',20,'SIPP','Pangasinan','Pangasinan','DRAFT'),
('00000000-0000-4000-8000-000000000006',20,'SIPP','Ilocos Sur','Ilocos Sur','DRAFT'),
('00000000-0000-4000-8000-000000000006',24,'GQP','Quezon','Quezon','DRAFT'),
('00000000-0000-4000-8000-000000000006',24,'GQP','Camarines Norte','Camarines Norte','DRAFT'),
('00000000-0000-4000-8000-000000000006',24,'GQP','Camarines Sur','Camarines Sur','DRAFT'),
('00000000-0000-4000-8000-000000000006',24,'GQP','Catanduanes','Catanduanes','DRAFT'),
('00000000-0000-4000-8000-000000000006',28,'LQP','Laguna','Laguna','DRAFT'),
('00000000-0000-4000-8000-000000000006',28,'LQP','Quezon','Quezon','DRAFT'),
('00000000-0000-4000-8000-000000000006',33,'PGP','Batangas','Batangas','DRAFT'),
('00000000-0000-4000-8000-000000000006',33,'PGP','Occidental Mindoro','Occidental Mindoro','DRAFT'),
('00000000-0000-4000-8000-000000000006',33,'PGP','Oriental Mindoro','Oriental Mindoro','DRAFT'),
('00000000-0000-4000-8000-000000000006',37,'M.O.','Bulacan','Bulacan','DRAFT'),
('00000000-0000-4000-8000-000000000006',39,'TGY','Cavite','Cavite','DRAFT')
ON CONFLICT DO NOTHING;

WITH rows(station_code,raw_area_name,standardized_area_name,coverage_type,approval_status,source_reference,source_sheet,source_row,import_batch_id) AS (VALUES
('BBP','Batanes','Batanes','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',2,'00000000-0000-4000-8000-000000000006'),
('BCP','Benguet','Benguet','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',3,'00000000-0000-4000-8000-000000000006'),
('BCP','Ifugao','Ifugao','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',3,'00000000-0000-4000-8000-000000000006'),
('BCP','Kalinga','Kalinga','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',3,'00000000-0000-4000-8000-000000000006'),
('CVP','Kalinga','Kalinga','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',5,'00000000-0000-4000-8000-000000000006'),
('CVP','Apayao','Apayao','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',5,'00000000-0000-4000-8000-000000000006'),
('CVP','Quirino','Quirino','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',5,'00000000-0000-4000-8000-000000000006'),
('CVP','Isabela','Isabela','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',5,'00000000-0000-4000-8000-000000000006'),
('PCP','Nueva Vizcaya','Nueva Vizcaya','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',12,'00000000-0000-4000-8000-000000000006'),
('PCP','Aurora','Aurora','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',12,'00000000-0000-4000-8000-000000000006'),
('PCP','Zambales','Zambales','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',12,'00000000-0000-4000-8000-000000000006'),
('PCP','Tarlac','Tarlac','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',12,'00000000-0000-4000-8000-000000000006'),
('PIP','Ilocos Norte','Ilocos Norte','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',18,'00000000-0000-4000-8000-000000000006'),
('PIP','Cagayan','Cagayan','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',18,'00000000-0000-4000-8000-000000000006'),
('SIPP','Abra','Abra','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',20,'00000000-0000-4000-8000-000000000006'),
('SIPP','La Union','La Union','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',20,'00000000-0000-4000-8000-000000000006'),
('SIPP','Pangasinan','Pangasinan','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',20,'00000000-0000-4000-8000-000000000006'),
('SIPP','Ilocos Sur','Ilocos Sur','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',20,'00000000-0000-4000-8000-000000000006'),
('GQP','Quezon','Quezon','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',24,'00000000-0000-4000-8000-000000000006'),
('GQP','Camarines Norte','Camarines Norte','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',24,'00000000-0000-4000-8000-000000000006'),
('GQP','Camarines Sur','Camarines Sur','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',24,'00000000-0000-4000-8000-000000000006'),
('GQP','Catanduanes','Catanduanes','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',24,'00000000-0000-4000-8000-000000000006'),
('LQP','Laguna','Laguna','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',28,'00000000-0000-4000-8000-000000000006'),
('LQP','Quezon','Quezon','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',28,'00000000-0000-4000-8000-000000000006'),
('PGP','Batangas','Batangas','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',33,'00000000-0000-4000-8000-000000000006'),
('PGP','Occidental Mindoro','Occidental Mindoro','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',33,'00000000-0000-4000-8000-000000000006'),
('PGP','Oriental Mindoro','Oriental Mindoro','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',33,'00000000-0000-4000-8000-000000000006'),
('M.O.','Bulacan','Bulacan','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',37,'00000000-0000-4000-8000-000000000006'),
('TGY','Cavite','Cavite','FULL','DRAFT','Provinces within AOR.xlsx','Sheet1',39,'00000000-0000-4000-8000-000000000006')
)
INSERT INTO aor_administrative_assignments(station_id,raw_area_name,standardized_area_name,coverage_type,approval_status,source_reference,source_sheet,source_row,import_batch_id)
SELECT s.station_id,r.raw_area_name,r.standardized_area_name,r.coverage_type,r.approval_status,r.source_reference,r.source_sheet,r.source_row,r.import_batch_id::uuid
FROM rows r JOIN stations s USING(station_code) ON CONFLICT DO NOTHING;

INSERT INTO data_validation_issues(import_batch_id,entity_type,entity_reference,issue_code,severity,issue_description,issue_status)
VALUES
('00000000-0000-4000-8000-000000000006','STATION','GSP','PLACEHOLDER_CHILD','INFO','Workbook row 75 uses NONE / - to mean no listed STSS child. No operational STSS record was created.','RESOLVED'),
('00000000-0000-4000-8000-000000000006','STATION','M.O.','OFFICE_NOT_STATION','INFO','Main Office is classified as OFFICE rather than a physical seismic station.','RESOLVED'),
('00000000-0000-4000-8000-000000000006','STATION','KCP','SOURCE_NAME_TYPO','WARNING','Source says Kidapawan Seimic Station; standardized value uses Kidapawan Seismic Station.','OPEN'),
('00000000-0000-4000-8000-000000000006','STATION','SNP','TRAILING_LINE_BREAK','WARNING','Source station name contains a trailing line break.','OPEN'),
('00000000-0000-4000-8000-000000000006','STATION','DCP','TRAILING_LINE_BREAK','WARNING','Source station name contains a trailing line break.','OPEN'),
('00000000-0000-4000-8000-000000000006','STATION','LCVP','OUTDATED_AREA_NAME','BLOCKING','Compostela Valley requires authoritative PSGC reconciliation before approval.','OPEN'),
('00000000-0000-4000-8000-000000000006','STATION','SKMP','AMBIGUOUS_AREA_NAME','BLOCKING','Maguindanao requires authoritative PSGC reconciliation before approval.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','Kalinga','OVERLAPPING_ASSIGNMENT','WARNING','Kalinga appears under BCP and CVP. Priority and overlap rules are not supplied.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','Quezon','OVERLAPPING_ASSIGNMENT','WARNING','Quezon appears under GQP and LQP. Priority and overlap rules are not supplied.','OPEN'),
('00000000-0000-4000-8000-000000000006','WORKBOOK','Sheet1!F41:J45','UNLABELLED_DEMOGRAPHICS','WARNING','The separate demographic block has no headers or source citation and was not imported into operational tables.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','IAP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','JAP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','LLP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','MMP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','PLP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','PPR','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','RCP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','SNP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','TBP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','BIP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','CGP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','CTB','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','DCP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','DMP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','GSP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','KCP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','SCP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN'),
('00000000-0000-4000-8000-000000000006','AOR_ASSIGNMENT','ZCP','MISSING_AOR_COVERAGE','BLOCKING','No province coverage is supplied for this SCSS entry.','OPEN')
ON CONFLICT DO NOTHING;
