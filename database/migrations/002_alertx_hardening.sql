-- Alert X hardening migration
-- Adds integrity and traceability safeguards identified during application integration.

-- Only one CURRENT revision may exist for an earthquake.
CREATE UNIQUE INDEX IF NOT EXISTS uq_earthquake_current_revision
ON earthquake_revisions (earthquake_id)
WHERE revision_status = 'CURRENT';

-- Only one ACTIVE boundary version may exist for an AOR.
CREATE UNIQUE INDEX IF NOT EXISTS uq_aor_active_boundary
ON aor_boundary_versions (aor_id)
WHERE status = 'ACTIVE';

-- Only one ACTIVE rule version may exist for a rule set.
CREATE UNIQUE INDEX IF NOT EXISTS uq_rule_set_active_version
ON rule_versions (rule_set_id)
WHERE status = 'ACTIVE';

-- A previous decision may have at most one direct successor.
CREATE UNIQUE INDEX IF NOT EXISTS uq_decision_single_successor
ON event_aor_decisions (supersedes_decision_id)
WHERE supersedes_decision_id IS NOT NULL;

-- Preserve the exact evaluation rows used by a final decision.
CREATE TABLE IF NOT EXISTS event_aor_decision_evaluations (
    decision_id BIGINT NOT NULL,
    evaluation_id BIGINT NOT NULL,
    PRIMARY KEY (decision_id, evaluation_id),
    CONSTRAINT fk_decision_eval_decision
        FOREIGN KEY (decision_id)
        REFERENCES event_aor_decisions(decision_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_decision_eval_evaluation
        FOREIGN KEY (evaluation_id)
        REFERENCES event_aor_evaluations(evaluation_id)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_decision_evaluations_evaluation
ON event_aor_decision_evaluations(evaluation_id);

-- Preserve exact rendered alert content for audit/reproducibility.
CREATE TABLE IF NOT EXISTS alert_messages (
    alert_message_id BIGSERIAL PRIMARY KEY,
    alert_id UUID NOT NULL,
    channel VARCHAR(20) NOT NULL,
    subject TEXT,
    message_body TEXT NOT NULL,
    template_version VARCHAR(50),
    rendered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alert_message_alert
        FOREIGN KEY (alert_id)
        REFERENCES alerts(alert_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_alert_message_channel
        CHECK (channel IN ('EMAIL','SMS','SYSTEM','SOCIAL'))
);

-- Record which contact methods are enabled for each subscription.
CREATE TABLE IF NOT EXISTS subscription_contact_methods (
    subscription_id BIGINT NOT NULL,
    contact_method_id BIGINT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (subscription_id, contact_method_id),
    CONSTRAINT fk_subscription_method_subscription
        FOREIGN KEY (subscription_id)
        REFERENCES alert_subscriptions(subscription_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_subscription_method_contact_method
        FOREIGN KEY (contact_method_id)
        REFERENCES contact_methods(contact_method_id)
        ON DELETE CASCADE
);

-- Store immutable destination snapshot and lifecycle timestamps on a delivery.
ALTER TABLE alert_deliveries
    ADD COLUMN IF NOT EXISTS destination_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS destination_value VARCHAR(200),
    ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

-- A finalized bulletin should record its authoritative consolidated value.
ALTER TABLE intensity_bulletin_entries
    ADD COLUMN IF NOT EXISTS final_intensity_level_id SMALLINT,
    ADD COLUMN IF NOT EXISTS determination_basis TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_bulletin_final_level'
    ) THEN
        ALTER TABLE intensity_bulletin_entries
        ADD CONSTRAINT fk_bulletin_final_level
        FOREIGN KEY (final_intensity_level_id)
        REFERENCES intensity_levels(intensity_level_id);
    END IF;
END $$;

-- Latest-revision semantics: if the newest revision is RETRACTED, do not silently resurrect an older revision.
CREATE OR REPLACE VIEW vw_current_earthquake_revisions AS
SELECT er.*
FROM earthquake_revisions er
JOIN (
    SELECT earthquake_id, MAX(revision_number) AS max_revision
    FROM earthquake_revisions
    GROUP BY earthquake_id
) latest
  ON latest.earthquake_id = er.earthquake_id
 AND latest.max_revision = er.revision_number
WHERE er.revision_status <> 'RETRACTED';

-- Keep the denormalized alerts.revision_id consistent with its decision while the base schema retains both columns.
CREATE OR REPLACE FUNCTION enforce_alert_decision_revision_match()
RETURNS TRIGGER AS $$
DECLARE
    expected_revision BIGINT;
BEGIN
    SELECT revision_id INTO expected_revision
    FROM event_aor_decisions
    WHERE decision_id = NEW.decision_id;

    IF expected_revision IS NULL OR expected_revision <> NEW.revision_id THEN
        RAISE EXCEPTION 'alerts.revision_id (%) must match event_aor_decisions.revision_id (%) for decision %',
            NEW.revision_id, expected_revision, NEW.decision_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_alert_decision_revision_match ON alerts;
CREATE TRIGGER trg_alert_decision_revision_match
BEFORE INSERT OR UPDATE OF revision_id, decision_id ON alerts
FOR EACH ROW EXECUTE FUNCTION enforce_alert_decision_revision_match();

-- Helpful API view: current earthquake records with AOR assignment and alert status.
CREATE OR REPLACE VIEW vw_earthquake_operational_status AS
SELECT
    e.earthquake_id,
    e.external_event_id,
    src.source_name,
    r.revision_id,
    r.revision_number,
    r.origin_time,
    r.magnitude,
    r.depth_km,
    r.latitude,
    r.longitude,
    r.source_location_text,
    ct.classification_code,
    ct.classification_name,
    d.decision_id,
    d.decision_source,
    d.decision_reason,
    d.decided_at,
    primary_aor.aor_code,
    primary_aor.aor_name,
    st.station_name,
    latest_alert.alert_id,
    latest_alert.alert_status
FROM earthquake_events e
JOIN earthquake_sources src ON src.source_id = e.source_id
JOIN vw_current_earthquake_revisions r ON r.earthquake_id = e.earthquake_id
LEFT JOIN vw_current_aor_decisions d ON d.revision_id = r.revision_id
LEFT JOIN aor_classification_types ct ON ct.classification_type_id = d.classification_type_id
LEFT JOIN event_aor_decision_assignments da
    ON da.decision_id = d.decision_id AND da.assignment_type = 'PRIMARY'
LEFT JOIN aors primary_aor ON primary_aor.aor_id = da.aor_id
LEFT JOIN stations st ON st.station_id = primary_aor.station_id
LEFT JOIN LATERAL (
    SELECT a.alert_id, a.alert_status
    FROM alerts a
    WHERE a.decision_id = d.decision_id
    ORDER BY a.created_at DESC
    LIMIT 1
) latest_alert ON TRUE;

DROP VIEW IF EXISTS vw_intensity_consolidator;

-- Correct intensity consolidator: independently aggregate field/instrumental reports,
-- then FULL OUTER JOIN by earthquake + administrative area.
CREATE OR REPLACE VIEW vw_intensity_consolidator AS
WITH field_agg AS (
    SELECT
        fir.earthquake_id,
        fir.area_id,
        MAX(il.numeric_level) AS max_field_numeric_level,
        COUNT(DISTINCT fir.field_report_id) AS field_report_count
    FROM field_intensity_reports fir
    JOIN intensity_levels il ON il.intensity_level_id = fir.intensity_level_id
    WHERE fir.verification_status = 'VERIFIED'
    GROUP BY fir.earthquake_id, fir.area_id
),
instrumental_agg AS (
    SELECT
        iir.earthquake_id,
        iir.area_id,
        MAX(il.numeric_level) AS max_instrumental_numeric_level
    FROM instrumental_intensity_readings iir
    JOIN intensity_levels il ON il.intensity_level_id = iir.intensity_level_id
    GROUP BY iir.earthquake_id, iir.area_id
),
merged AS (
    SELECT
        COALESCE(f.earthquake_id, i.earthquake_id) AS earthquake_id,
        COALESCE(f.area_id, i.area_id) AS area_id,
        f.max_field_numeric_level,
        COALESCE(f.field_report_count, 0) AS field_report_count,
        i.max_instrumental_numeric_level
    FROM field_agg f
    FULL OUTER JOIN instrumental_agg i
      ON i.earthquake_id = f.earthquake_id
     AND i.area_id = f.area_id
)
SELECT
    e.earthquake_id,
    e.external_event_id,
    a.area_id,
    a.area_name,
    m.max_field_numeric_level,
    m.field_report_count,
    m.max_instrumental_numeric_level
FROM merged m
JOIN earthquake_events e ON e.earthquake_id = m.earthquake_id
JOIN administrative_areas a ON a.area_id = m.area_id;

-- Ensure a subscription can only enable contact methods belonging to the same contact.
CREATE OR REPLACE FUNCTION enforce_subscription_contact_method_owner()
RETURNS TRIGGER AS $$
DECLARE
    subscription_contact UUID;
    method_contact UUID;
BEGIN
    SELECT ca.contact_id INTO subscription_contact
    FROM alert_subscriptions s
    JOIN contact_assignments ca ON ca.contact_assignment_id = s.contact_assignment_id
    WHERE s.subscription_id = NEW.subscription_id;

    SELECT cm.contact_id INTO method_contact
    FROM contact_methods cm
    WHERE cm.contact_method_id = NEW.contact_method_id;

    IF subscription_contact IS DISTINCT FROM method_contact THEN
        RAISE EXCEPTION 'Contact method % does not belong to subscription % contact',
            NEW.contact_method_id, NEW.subscription_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscription_contact_method_owner ON subscription_contact_methods;
CREATE TRIGGER trg_subscription_contact_method_owner
BEFORE INSERT OR UPDATE ON subscription_contact_methods
FOR EACH ROW EXECUTE FUNCTION enforce_subscription_contact_method_owner();
