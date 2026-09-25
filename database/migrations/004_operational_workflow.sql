CREATE TABLE app_sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 csrf_token text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL, last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX app_sessions_expiry ON app_sessions(expires_at);
CREATE TABLE user_station_access (
 user_id uuid REFERENCES users ON DELETE CASCADE, station_id bigint REFERENCES stations ON DELETE CASCADE,
 PRIMARY KEY(user_id,station_id)
);
CREATE TABLE oidc_identities (
 issuer text NOT NULL, subject text NOT NULL, user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 PRIMARY KEY(issuer,subject)
);
CREATE TABLE oidc_transactions (
 state_hash text PRIMARY KEY, browser_hash text NOT NULL, verifier text NOT NULL, nonce text NOT NULL,
 expires_at timestamptz NOT NULL
);
UPDATE users SET account_status='LOCKED'
WHERE email='admin@alertx.local' AND password_hash=crypt('ChangeMe123!',password_hash);
ALTER TABLE alerts ADD COLUMN idempotency_key text UNIQUE;
CREATE TABLE alert_delivery_jobs (
 delivery_id bigint PRIMARY KEY REFERENCES alert_deliveries ON DELETE CASCADE,
 state text NOT NULL DEFAULT 'READY' CHECK(state IN ('READY','RUNNING','DONE','FAILED','UNCERTAIN','CANCELLED')),
 attempts integer NOT NULL DEFAULT 0, max_attempts integer NOT NULL DEFAULT 5,
 next_attempt_at timestamptz NOT NULL DEFAULT now(), lease_token uuid, lease_until timestamptz,
 last_error text, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX delivery_jobs_ready ON alert_delivery_jobs(next_attempt_at) WHERE state='READY';
ALTER TABLE alert_deliveries ADD COLUMN provider_message_id text;
ALTER TABLE alert_deliveries ADD COLUMN failure_reason text;
ALTER TABLE alert_deliveries DROP CONSTRAINT chk_delivery_status;
ALTER TABLE alert_deliveries ADD CONSTRAINT chk_delivery_status CHECK(delivery_status IN
 ('QUEUED','SENDING','SENT','DELIVERED','FAILED','CANCELLED','UNCERTAIN'));
ALTER TABLE delivery_attempts DROP CONSTRAINT chk_attempt_status;
ALTER TABLE delivery_attempts ADD CONSTRAINT chk_attempt_status CHECK(attempt_status IN
 ('SUCCESS','FAILED','RETRYING','UNCERTAIN'));
CREATE TABLE worker_health (
 worker_id text PRIMARY KEY, heartbeat_at timestamptz NOT NULL DEFAULT now(), status text NOT NULL
);
ALTER TABLE earthquake_revisions ADD COLUMN content_hash text;
CREATE INDEX revisions_hash ON earthquake_revisions(earthquake_id,content_hash);
CREATE TABLE ingestion_quarantine (
 quarantine_id bigserial PRIMARY KEY, ingestion_run_id bigint REFERENCES ingestion_runs,
 source_id bigint NOT NULL REFERENCES earthquake_sources, raw_payload text NOT NULL,
 reason text NOT NULL, received_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE event_processing (
 revision_id bigint PRIMARY KEY REFERENCES earthquake_revisions,
 status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','EVALUATED','REVIEW','BLOCKED','RETRACTED')),
 reason text, processed_at timestamptz
);
CREATE TABLE operational_reviews (
 review_case_id uuid PRIMARY KEY REFERENCES review_cases ON DELETE CASCADE,
 revision_id bigint NOT NULL REFERENCES earthquake_revisions, decision_id bigint REFERENCES event_aor_decisions,
 selected_aor_id bigint REFERENCES aors, result_alert_id uuid REFERENCES alerts, UNIQUE(revision_id)
);
CREATE TABLE ingest_controls (
 source_id bigint PRIMARY KEY REFERENCES earthquake_sources,
 next_poll_at timestamptz NOT NULL DEFAULT now(), lease_token uuid, lease_until timestamptz
);
INSERT INTO audit_event_types(event_type_code,event_type_name) VALUES
 ('APP_ACTION','Application Action'),('AUTH_SESSION','Session Event') ON CONFLICT DO NOTHING;
INSERT INTO contact_roles(role_code,role_name) VALUES ('STATION_PERSONNEL','Station Personnel'),
 ('ADMIN_RECIPIENT','Administrative Recipient') ON CONFLICT DO NOTHING;
CREATE VIEW vw_operational_events AS
SELECT e.earthquake_id,e.external_event_id,e.source_id,src.source_name,r.revision_id,r.revision_number,
 r.origin_time,r.magnitude,r.depth_km,r.latitude,r.longitude,r.source_location_text,r.revision_status,
 d.decision_id,ct.classification_code,d.decision_reason,a.aor_code,a.aor_name,a.station_id,
 st.station_name,rv.review_case_id,rc.case_status,al.alert_id,al.alert_status,
 COALESCE(ds.accepted,0)::int AS accepted_count,COALESCE(ds.delivered,0)::int AS delivered_count,
 COALESCE(ds.failed,0)::int AS failed_count,COALESCE(ds.pending,0)::int AS pending_count,
 COALESCE(ds.uncertain,0)::int AS uncertain_count,ep.status AS processing_status,ep.reason AS processing_reason
FROM earthquake_events e JOIN earthquake_sources src USING(source_id)
JOIN LATERAL (SELECT * FROM earthquake_revisions WHERE earthquake_id=e.earthquake_id
 ORDER BY revision_number DESC LIMIT 1) r ON true
LEFT JOIN LATERAL (SELECT * FROM event_aor_decisions WHERE revision_id=r.revision_id
 ORDER BY decided_at DESC,decision_id DESC LIMIT 1) d ON true
LEFT JOIN aor_classification_types ct USING(classification_type_id)
LEFT JOIN event_aor_decision_assignments da ON da.decision_id=d.decision_id AND da.assignment_type='PRIMARY'
LEFT JOIN aors a ON a.aor_id=da.aor_id LEFT JOIN stations st ON st.station_id=a.station_id
LEFT JOIN operational_reviews rv ON rv.revision_id=r.revision_id
LEFT JOIN review_cases rc ON rc.review_case_id=rv.review_case_id
LEFT JOIN event_processing ep ON ep.revision_id=r.revision_id
LEFT JOIN LATERAL (SELECT * FROM alerts WHERE revision_id=r.revision_id
 ORDER BY created_at DESC,alert_id DESC LIMIT 1) al ON true
LEFT JOIN LATERAL (SELECT
 count(*) FILTER(WHERE delivery_status IN ('SENT','DELIVERED')) AS accepted,
 count(*) FILTER(WHERE delivery_status='DELIVERED') AS delivered,
 count(*) FILTER(WHERE delivery_status='FAILED') AS failed,
 count(*) FILTER(WHERE delivery_status IN ('QUEUED','SENDING')) AS pending,
 count(*) FILTER(WHERE delivery_status='UNCERTAIN') AS uncertain
 FROM alert_deliveries WHERE alert_id=al.alert_id) ds ON true;
CREATE TABLE approved_land_mask (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), boundary_geometry geometry(MULTIPOLYGON,4326) NOT NULL,
 source_name text NOT NULL, approved_by uuid NOT NULL REFERENCES users, approved_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE earthquake_revisions ADD COLUMN source_bulletin_number integer NOT NULL DEFAULT 1;
CREATE TABLE land_mask_history (
 version_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), boundary_geometry geometry(MULTIPOLYGON,4326) NOT NULL,
 source_name text NOT NULL, approved_by uuid NOT NULL REFERENCES users, approved_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE approved_land_mask ADD COLUMN version_id uuid REFERENCES land_mask_history;
ALTER TABLE event_processing ADD COLUMN land_mask_version_id uuid REFERENCES land_mask_history;
CREATE UNIQUE INDEX uq_decision_primary_assignment ON event_aor_decision_assignments(decision_id) WHERE assignment_type='PRIMARY';
CREATE UNIQUE INDEX uq_users_email_casefold ON users(lower(email));
