-- Add the operational USER role without silently expanding legacy accounts' privileges.
INSERT INTO roles(role_code,role_name) VALUES ('USER','Station User') ON CONFLICT(role_code) DO NOTHING;

ALTER TABLE field_intensity_reports ADD COLUMN created_by UUID REFERENCES users(user_id);
-- Existing reports predate creator tracking and retain NULL rather than an invented author.
ALTER TABLE audit_events ADD COLUMN station_id BIGINT REFERENCES stations(station_id);
CREATE INDEX audit_events_station_recent ON audit_events(station_id,occurred_at DESC)
 WHERE station_id IS NOT NULL;
