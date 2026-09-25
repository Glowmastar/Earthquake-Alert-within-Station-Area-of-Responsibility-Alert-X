-- ============================================================
-- ALERT X
-- Earthquake AOR Monitoring and Alerting System
-- PostgreSQL + PostGIS
-- 3NF Database Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- 1. USERS AND AUTHORIZATION
-- ============================================================

CREATE TABLE users (
    user_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username            VARCHAR(80) NOT NULL UNIQUE,
    email               VARCHAR(150) NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    full_name           VARCHAR(150) NOT NULL,
    account_status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at       TIMESTAMPTZ,

    CONSTRAINT chk_user_status
        CHECK (account_status IN ('ACTIVE','INACTIVE','LOCKED','SUSPENDED'))
);


CREATE TABLE roles (
    role_id             SMALLSERIAL PRIMARY KEY,
    role_code           VARCHAR(30) NOT NULL UNIQUE,
    role_name           VARCHAR(100) NOT NULL UNIQUE,
    description         TEXT
);


CREATE TABLE user_roles (
    user_id             UUID NOT NULL,
    role_id             SMALLINT NOT NULL,
    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by         UUID,

    PRIMARY KEY (user_id, role_id),

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id),

    CONSTRAINT fk_user_roles_assigner
        FOREIGN KEY (assigned_by)
        REFERENCES users(user_id)
);


-- ============================================================
-- 2. ORGANIZATIONS AND STATIONS
-- ============================================================

CREATE TABLE organizations (
    organization_id     BIGSERIAL PRIMARY KEY,
    organization_code   VARCHAR(30) UNIQUE,
    organization_name   VARCHAR(200) NOT NULL,
    organization_type   VARCHAR(50),
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE stations (
    station_id          BIGSERIAL PRIMARY KEY,
    organization_id     BIGINT,
    station_code        VARCHAR(10) NOT NULL UNIQUE,
    station_name        VARCHAR(150) NOT NULL,
    latitude            NUMERIC(9,6) NOT NULL,
    longitude           NUMERIC(9,6) NOT NULL,
    location            GEOGRAPHY(POINT,4326) NOT NULL,
    station_status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_station_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(organization_id),

    CONSTRAINT chk_station_latitude
        CHECK (latitude BETWEEN -90 AND 90),

    CONSTRAINT chk_station_longitude
        CHECK (longitude BETWEEN -180 AND 180),

    CONSTRAINT chk_station_status
        CHECK (station_status IN ('ACTIVE','INACTIVE','MAINTENANCE'))
);


-- ============================================================
-- 3. PHILIPPINE ADMINISTRATIVE GEOGRAPHY
-- ============================================================

CREATE TABLE administrative_area_types (
    area_type_id        SMALLSERIAL PRIMARY KEY,
    area_type_code      VARCHAR(30) NOT NULL UNIQUE,
    area_type_name      VARCHAR(50) NOT NULL,
    hierarchy_level     SMALLINT NOT NULL
);


CREATE TABLE administrative_areas (
    area_id             BIGSERIAL PRIMARY KEY,
    psgc_code           VARCHAR(20) NOT NULL UNIQUE,
    area_name           VARCHAR(150) NOT NULL,
    area_type_id        SMALLINT NOT NULL,
    parent_area_id      BIGINT,
    boundary_geometry   GEOMETRY(MULTIPOLYGON,4326),
    active              BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_admin_area_type
        FOREIGN KEY (area_type_id)
        REFERENCES administrative_area_types(area_type_id),

    CONSTRAINT fk_admin_area_parent
        FOREIGN KEY (parent_area_id)
        REFERENCES administrative_areas(area_id)
);


CREATE TABLE administrative_area_populations (
    area_id             BIGINT NOT NULL,
    reference_year      SMALLINT NOT NULL,
    population          BIGINT NOT NULL,
    source_name         VARCHAR(150),

    PRIMARY KEY (area_id, reference_year),

    CONSTRAINT fk_population_area
        FOREIGN KEY (area_id)
        REFERENCES administrative_areas(area_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_population
        CHECK (population >= 0)
);


-- ============================================================
-- 4. GIS / BOUNDARY DATASETS
-- ============================================================

CREATE TABLE boundary_datasets (
    dataset_id          BIGSERIAL PRIMARY KEY,
    dataset_name        VARCHAR(150) NOT NULL UNIQUE,
    dataset_source      VARCHAR(150),
    description         TEXT
);


CREATE TABLE boundary_dataset_versions (
    dataset_version_id  BIGSERIAL PRIMARY KEY,
    dataset_id          BIGINT NOT NULL,
    version_number      VARCHAR(50) NOT NULL,
    release_date        DATE,
    checksum            VARCHAR(128),
    imported_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    imported_by         UUID,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT uq_dataset_version
        UNIQUE (dataset_id, version_number),

    CONSTRAINT fk_dataset_version_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES boundary_datasets(dataset_id),

    CONSTRAINT fk_dataset_version_user
        FOREIGN KEY (imported_by)
        REFERENCES users(user_id),

    CONSTRAINT chk_dataset_status
        CHECK (status IN ('DRAFT','ACTIVE','RETIRED','ARCHIVED'))
);


-- ============================================================
-- 5. AREA OF RESPONSIBILITY
-- ============================================================

CREATE TABLE aors (
    aor_id              BIGSERIAL PRIMARY KEY,
    station_id          BIGINT NOT NULL,
    aor_code            VARCHAR(20) NOT NULL UNIQUE,
    aor_name            VARCHAR(150) NOT NULL,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_aor_station
        FOREIGN KEY (station_id)
        REFERENCES stations(station_id)
);


CREATE TABLE aor_boundary_versions (
    aor_boundary_version_id BIGSERIAL PRIMARY KEY,
    aor_id                  BIGINT NOT NULL,
    dataset_version_id      BIGINT NOT NULL,
    version_number          INTEGER NOT NULL,
    boundary_geometry       GEOMETRY(MULTIPOLYGON,4326) NOT NULL,
    effective_from          TIMESTAMPTZ NOT NULL,
    effective_to            TIMESTAMPTZ,
    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,

    CONSTRAINT uq_aor_boundary_version
        UNIQUE (aor_id, version_number),

    CONSTRAINT fk_aor_boundary_aor
        FOREIGN KEY (aor_id)
        REFERENCES aors(aor_id),

    CONSTRAINT fk_aor_boundary_dataset
        FOREIGN KEY (dataset_version_id)
        REFERENCES boundary_dataset_versions(dataset_version_id),

    CONSTRAINT fk_aor_boundary_user
        FOREIGN KEY (created_by)
        REFERENCES users(user_id),

    CONSTRAINT chk_aor_boundary_dates
        CHECK (
            effective_to IS NULL OR
            effective_to > effective_from
        ),

    CONSTRAINT chk_aor_boundary_status
        CHECK (status IN ('DRAFT','ACTIVE','SUPERSEDED','RETIRED'))
);


CREATE TABLE aor_coverage_areas (
    aor_boundary_version_id BIGINT NOT NULL,
    area_id                 BIGINT NOT NULL,
    coverage_type           VARCHAR(20) NOT NULL,

    PRIMARY KEY (aor_boundary_version_id, area_id),

    CONSTRAINT fk_coverage_boundary
        FOREIGN KEY (aor_boundary_version_id)
        REFERENCES aor_boundary_versions(aor_boundary_version_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_coverage_area
        FOREIGN KEY (area_id)
        REFERENCES administrative_areas(area_id),

    CONSTRAINT chk_coverage_type
        CHECK (coverage_type IN ('FULL','PARTIAL','BUFFER'))
);


CREATE TABLE boundary_validations (
    validation_id           BIGSERIAL PRIMARY KEY,
    aor_boundary_version_id BIGINT NOT NULL,
    reviewer_id             UUID NOT NULL,
    validation_status       VARCHAR(20) NOT NULL,
    notes                   TEXT,
    validated_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_boundary_validation_boundary
        FOREIGN KEY (aor_boundary_version_id)
        REFERENCES aor_boundary_versions(aor_boundary_version_id),

    CONSTRAINT fk_boundary_validation_reviewer
        FOREIGN KEY (reviewer_id)
        REFERENCES users(user_id),

    CONSTRAINT chk_boundary_validation_status
        CHECK (validation_status IN (
            'PENDING',
            'VALID',
            'NEEDS_REVISION',
            'REJECTED'
        ))
);


-- ============================================================
-- 6. AOR RULE ENGINE
-- ============================================================

CREATE TABLE rule_sets (
    rule_set_id         BIGSERIAL PRIMARY KEY,
    rule_set_name       VARCHAR(100) NOT NULL UNIQUE,
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE rule_versions (
    rule_version_id             BIGSERIAL PRIMARY KEY,
    rule_set_id                 BIGINT NOT NULL,
    version_number              VARCHAR(30) NOT NULL,

    aor_basis                   VARCHAR(100) NOT NULL,
    location_method             VARCHAR(100) NOT NULL,
    province_wide_coverage      BOOLEAN NOT NULL DEFAULT FALSE,
    boundary_tolerance_km       NUMERIC(8,3) NOT NULL DEFAULT 0,
    coordinate_validation       BOOLEAN NOT NULL DEFAULT TRUE,

    send_inside_aor_alert       BOOLEAN NOT NULL DEFAULT TRUE,
    minimum_magnitude           NUMERIC(3,1),
    maximum_depth_km            NUMERIC(8,2),
    felt_event_required         BOOLEAN NOT NULL DEFAULT FALSE,
    station_distance_km         NUMERIC(8,2),
    duplicate_suppression       BOOLEAN NOT NULL DEFAULT TRUE,

    offshore_action             VARCHAR(30) NOT NULL,
    boundary_action             VARCHAR(30) NOT NULL,
    overlap_action              VARCHAR(30) NOT NULL,
    duplicate_action            VARCHAR(30) NOT NULL,
    missing_coordinate_action   VARCHAR(30) NOT NULL,
    corrected_event_action      VARCHAR(30) NOT NULL,

    status                      VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by                  UUID,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activated_at                TIMESTAMPTZ,

    CONSTRAINT uq_rule_version
        UNIQUE (rule_set_id, version_number),

    CONSTRAINT fk_rule_version_set
        FOREIGN KEY (rule_set_id)
        REFERENCES rule_sets(rule_set_id),

    CONSTRAINT fk_rule_version_user
        FOREIGN KEY (created_by)
        REFERENCES users(user_id),

    CONSTRAINT chk_minimum_magnitude
        CHECK (minimum_magnitude IS NULL OR minimum_magnitude >= 0),

    CONSTRAINT chk_maximum_depth
        CHECK (maximum_depth_km IS NULL OR maximum_depth_km >= 0),

    CONSTRAINT chk_boundary_tolerance
        CHECK (boundary_tolerance_km >= 0),

    CONSTRAINT chk_rule_status
        CHECK (status IN ('DRAFT','ACTIVE','SUPERSEDED','RETIRED'))
);


CREATE TABLE aor_rule_assignments (
    assignment_id       BIGSERIAL PRIMARY KEY,
    aor_id              BIGINT NOT NULL,
    rule_version_id     BIGINT NOT NULL,
    effective_from      TIMESTAMPTZ NOT NULL,
    effective_to        TIMESTAMPTZ,
    assigned_by         UUID,

    CONSTRAINT fk_rule_assignment_aor
        FOREIGN KEY (aor_id)
        REFERENCES aors(aor_id),

    CONSTRAINT fk_rule_assignment_version
        FOREIGN KEY (rule_version_id)
        REFERENCES rule_versions(rule_version_id),

    CONSTRAINT fk_rule_assignment_user
        FOREIGN KEY (assigned_by)
        REFERENCES users(user_id),

    CONSTRAINT chk_rule_assignment_dates
        CHECK (
            effective_to IS NULL OR
            effective_to > effective_from
        )
);


-- ============================================================
-- 7. EARTHQUAKE DATA SOURCES
-- ============================================================

CREATE TABLE earthquake_sources (
    source_id                BIGSERIAL PRIMARY KEY,
    source_code              VARCHAR(30) NOT NULL UNIQUE,
    source_name              VARCHAR(150) NOT NULL,
    endpoint_url             TEXT,
    poll_interval_seconds    INTEGER,
    active                   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_source_poll_interval
        CHECK (
            poll_interval_seconds IS NULL OR
            poll_interval_seconds > 0
        )
);


CREATE TABLE ingestion_runs (
    ingestion_run_id         BIGSERIAL PRIMARY KEY,
    source_id                BIGINT NOT NULL,
    started_at               TIMESTAMPTZ NOT NULL,
    completed_at             TIMESTAMPTZ,
    records_received         INTEGER NOT NULL DEFAULT 0,
    records_created          INTEGER NOT NULL DEFAULT 0,
    records_updated          INTEGER NOT NULL DEFAULT 0,
    run_status               VARCHAR(20) NOT NULL,
    error_message            TEXT,

    CONSTRAINT fk_ingestion_source
        FOREIGN KEY (source_id)
        REFERENCES earthquake_sources(source_id),

    CONSTRAINT chk_ingestion_counts
        CHECK (
            records_received >= 0
            AND records_created >= 0
            AND records_updated >= 0
        ),

    CONSTRAINT chk_ingestion_status
        CHECK (run_status IN (
            'RUNNING',
            'COMPLETED',
            'PARTIAL',
            'FAILED'
        ))
);


-- ============================================================
-- 8. EARTHQUAKE CORE
-- ============================================================

CREATE TABLE earthquake_events (
    earthquake_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id           BIGINT NOT NULL,
    external_event_id   VARCHAR(100) NOT NULL,
    first_received_at   TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_earthquake_external
        UNIQUE (source_id, external_event_id),

    CONSTRAINT fk_earthquake_source
        FOREIGN KEY (source_id)
        REFERENCES earthquake_sources(source_id)
);


CREATE TABLE earthquake_revisions (
    revision_id             BIGSERIAL PRIMARY KEY,
    earthquake_id           UUID NOT NULL,
    revision_number         INTEGER NOT NULL,
    origin_time             TIMESTAMPTZ NOT NULL,
    magnitude               NUMERIC(3,1) NOT NULL,
    depth_km                NUMERIC(8,2) NOT NULL,
    latitude                NUMERIC(9,6) NOT NULL,
    longitude               NUMERIC(9,6) NOT NULL,
    epicenter               GEOGRAPHY(POINT,4326) NOT NULL,
    source_location_text    TEXT,
    received_at             TIMESTAMPTZ NOT NULL,
    revision_status         VARCHAR(20) NOT NULL DEFAULT 'CURRENT',

    CONSTRAINT uq_earthquake_revision
        UNIQUE (earthquake_id, revision_number),

    CONSTRAINT fk_revision_event
        FOREIGN KEY (earthquake_id)
        REFERENCES earthquake_events(earthquake_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_revision_number
        CHECK (revision_number > 0),

    CONSTRAINT chk_revision_magnitude
        CHECK (magnitude >= 0),

    CONSTRAINT chk_revision_depth
        CHECK (depth_km >= 0),

    CONSTRAINT chk_revision_latitude
        CHECK (latitude BETWEEN -90 AND 90),

    CONSTRAINT chk_revision_longitude
        CHECK (longitude BETWEEN -180 AND 180),

    CONSTRAINT chk_revision_status
        CHECK (revision_status IN ('CURRENT','SUPERSEDED','RETRACTED'))
);


CREATE TABLE source_payload_archives (
    payload_id          BIGSERIAL PRIMARY KEY,
    revision_id         BIGINT NOT NULL,
    ingestion_run_id    BIGINT,
    content_type        VARCHAR(100),
    raw_payload         TEXT NOT NULL,
    received_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payload_revision
        FOREIGN KEY (revision_id)
        REFERENCES earthquake_revisions(revision_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payload_ingestion
        FOREIGN KEY (ingestion_run_id)
        REFERENCES ingestion_runs(ingestion_run_id)
);


-- ============================================================
-- 9. FAULT SYSTEM DATA
-- ============================================================

CREATE TABLE fault_systems (
    fault_id            BIGSERIAL PRIMARY KEY,
    fault_name          VARCHAR(150) NOT NULL UNIQUE,
    fault_geometry      GEOMETRY(MULTILINESTRING,4326),
    description         TEXT
);


CREATE TABLE earthquake_fault_matches (
    revision_id         BIGINT NOT NULL,
    fault_id            BIGINT NOT NULL,
    distance_km         NUMERIC(8,3),
    confidence_score    NUMERIC(5,2),
    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (revision_id, fault_id),

    CONSTRAINT fk_fault_match_revision
        FOREIGN KEY (revision_id)
        REFERENCES earthquake_revisions(revision_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_fault_match_fault
        FOREIGN KEY (fault_id)
        REFERENCES fault_systems(fault_id),

    CONSTRAINT chk_fault_distance
        CHECK (distance_km IS NULL OR distance_km >= 0),

    CONSTRAINT chk_fault_confidence
        CHECK (
            confidence_score IS NULL OR
            confidence_score BETWEEN 0 AND 100
        )
);


-- ============================================================
-- 10. LOCATION DETERMINATION
-- ============================================================

CREATE TABLE location_determination_methods (
    method_id           SMALLSERIAL PRIMARY KEY,
    method_code         VARCHAR(40) NOT NULL UNIQUE,
    method_name         VARCHAR(100) NOT NULL
);


CREATE TABLE event_location_determinations (
    determination_id    BIGSERIAL PRIMARY KEY,
    revision_id         BIGINT NOT NULL,
    method_id           SMALLINT NOT NULL,
    area_id             BIGINT,
    display_text        VARCHAR(250),
    distance_km         NUMERIC(8,3),
    confidence_score    NUMERIC(5,2),
    determined_by       UUID,
    determined_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_location_revision
        FOREIGN KEY (revision_id)
        REFERENCES earthquake_revisions(revision_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_location_method
        FOREIGN KEY (method_id)
        REFERENCES location_determination_methods(method_id),

    CONSTRAINT fk_location_area
        FOREIGN KEY (area_id)
        REFERENCES administrative_areas(area_id),

    CONSTRAINT fk_location_user
        FOREIGN KEY (determined_by)
        REFERENCES users(user_id),

    CONSTRAINT chk_location_distance
        CHECK (distance_km IS NULL OR distance_km >= 0),

    CONSTRAINT chk_location_confidence
        CHECK (
            confidence_score IS NULL OR
            confidence_score BETWEEN 0 AND 100
        )
);


-- ============================================================
-- 11. AOR CLASSIFICATION
-- ============================================================

CREATE TABLE aor_classification_types (
    classification_type_id SMALLSERIAL PRIMARY KEY,
    classification_code    VARCHAR(30) NOT NULL UNIQUE,
    classification_name    VARCHAR(50) NOT NULL
);


CREATE TABLE event_aor_evaluations (
    evaluation_id            BIGSERIAL PRIMARY KEY,
    revision_id              BIGINT NOT NULL,
    aor_boundary_version_id  BIGINT NOT NULL,
    rule_version_id          BIGINT NOT NULL,
    classification_type_id   SMALLINT NOT NULL,
    distance_to_boundary_km  NUMERIC(8,3),
    evaluated_at             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_revision_boundary_eval
        UNIQUE (revision_id, aor_boundary_version_id),

    CONSTRAINT fk_eval_revision
        FOREIGN KEY (revision_id)
        REFERENCES earthquake_revisions(revision_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_eval_boundary
        FOREIGN KEY (aor_boundary_version_id)
        REFERENCES aor_boundary_versions(aor_boundary_version_id),

    CONSTRAINT fk_eval_rule
        FOREIGN KEY (rule_version_id)
        REFERENCES rule_versions(rule_version_id),

    CONSTRAINT fk_eval_classification
        FOREIGN KEY (classification_type_id)
        REFERENCES aor_classification_types(classification_type_id),

    CONSTRAINT chk_eval_distance
        CHECK (
            distance_to_boundary_km IS NULL OR
            distance_to_boundary_km >= 0
        )
);


CREATE TABLE event_aor_decisions (
    decision_id              BIGSERIAL PRIMARY KEY,
    revision_id              BIGINT NOT NULL,
    rule_version_id          BIGINT NOT NULL,
    classification_type_id   SMALLINT NOT NULL,
    decision_source          VARCHAR(20) NOT NULL,
    decision_reason          TEXT,
    decided_by               UUID,
    decided_at               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    supersedes_decision_id   BIGINT,

    CONSTRAINT fk_decision_revision
        FOREIGN KEY (revision_id)
        REFERENCES earthquake_revisions(revision_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_decision_rule
        FOREIGN KEY (rule_version_id)
        REFERENCES rule_versions(rule_version_id),

    CONSTRAINT fk_decision_classification
        FOREIGN KEY (classification_type_id)
        REFERENCES aor_classification_types(classification_type_id),

    CONSTRAINT fk_decision_user
        FOREIGN KEY (decided_by)
        REFERENCES users(user_id),

    CONSTRAINT fk_decision_superseded
        FOREIGN KEY (supersedes_decision_id)
        REFERENCES event_aor_decisions(decision_id),

    CONSTRAINT chk_decision_source
        CHECK (decision_source IN ('SYSTEM','MANUAL'))
);


CREATE TABLE event_aor_decision_assignments (
    decision_id         BIGINT NOT NULL,
    aor_id              BIGINT NOT NULL,
    assignment_type     VARCHAR(20) NOT NULL,

    PRIMARY KEY (decision_id, aor_id),

    CONSTRAINT fk_decision_assignment_decision
        FOREIGN KEY (decision_id)
        REFERENCES event_aor_decisions(decision_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_decision_assignment_aor
        FOREIGN KEY (aor_id)
        REFERENCES aors(aor_id),

    CONSTRAINT chk_decision_assignment_type
        CHECK (assignment_type IN ('PRIMARY','SECONDARY'))
);


-- ============================================================
-- 12. CONTACT DIRECTORY
-- ============================================================

CREATE TABLE contacts (
    contact_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name           VARCHAR(150) NOT NULL,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE contact_roles (
    contact_role_id     SMALLSERIAL PRIMARY KEY,
    role_code           VARCHAR(40) NOT NULL UNIQUE,
    role_name           VARCHAR(100) NOT NULL
);


CREATE TABLE contact_assignments (
    contact_assignment_id BIGSERIAL PRIMARY KEY,
    contact_id             UUID NOT NULL,
    organization_id        BIGINT NOT NULL,
    station_id             BIGINT,
    contact_role_id        SMALLINT NOT NULL,
    effective_from         TIMESTAMPTZ NOT NULL,
    effective_to           TIMESTAMPTZ,

    CONSTRAINT fk_contact_assignment_contact
        FOREIGN KEY (contact_id)
        REFERENCES contacts(contact_id),

    CONSTRAINT fk_contact_assignment_org
        FOREIGN KEY (organization_id)
        REFERENCES organizations(organization_id),

    CONSTRAINT fk_contact_assignment_station
        FOREIGN KEY (station_id)
        REFERENCES stations(station_id),

    CONSTRAINT fk_contact_assignment_role
        FOREIGN KEY (contact_role_id)
        REFERENCES contact_roles(contact_role_id),

    CONSTRAINT chk_contact_assignment_dates
        CHECK (
            effective_to IS NULL OR
            effective_to > effective_from
        )
);


CREATE TABLE contact_methods (
    contact_method_id   BIGSERIAL PRIMARY KEY,
    contact_id          UUID NOT NULL,
    method_type         VARCHAR(20) NOT NULL,
    method_value        VARCHAR(200) NOT NULL,
    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
    active_from         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active_to           TIMESTAMPTZ,

    CONSTRAINT uq_contact_method
        UNIQUE (contact_id, method_type, method_value),

    CONSTRAINT fk_contact_method_contact
        FOREIGN KEY (contact_id)
        REFERENCES contacts(contact_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_contact_method_type
        CHECK (method_type IN ('EMAIL','MOBILE','LANDLINE','SMS')),

    CONSTRAINT chk_contact_method_dates
        CHECK (
            active_to IS NULL OR
            active_to > active_from
        )
);


CREATE TABLE contact_method_verifications (
    verification_id        BIGSERIAL PRIMARY KEY,
    contact_method_id      BIGINT NOT NULL,
    verification_status    VARCHAR(30) NOT NULL,
    verified_at            TIMESTAMPTZ,
    verified_by            UUID,
    verification_notes     TEXT,

    CONSTRAINT fk_method_verification_method
        FOREIGN KEY (contact_method_id)
        REFERENCES contact_methods(contact_method_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_method_verification_user
        FOREIGN KEY (verified_by)
        REFERENCES users(user_id),

    CONSTRAINT chk_method_verification_status
        CHECK (verification_status IN (
            'UNVERIFIED',
            'VERIFIED',
            'FAILED',
            'EXPIRED'
        ))
);


-- ============================================================
-- 13. ALERT SUBSCRIPTIONS
-- ============================================================

CREATE TABLE alert_subscriptions (
    subscription_id        BIGSERIAL PRIMARY KEY,
    contact_assignment_id  BIGINT NOT NULL,
    scope_type             VARCHAR(30) NOT NULL,
    minimum_magnitude      NUMERIC(3,1),
    subscription_status    VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    active_from            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active_to              TIMESTAMPTZ,

    CONSTRAINT fk_subscription_assignment
        FOREIGN KEY (contact_assignment_id)
        REFERENCES contact_assignments(contact_assignment_id),

    CONSTRAINT chk_subscription_scope
        CHECK (scope_type IN ('SELECTED_AORS','ALL_AORS')),

    CONSTRAINT chk_subscription_status
        CHECK (subscription_status IN ('ACTIVE','INACTIVE','SUSPENDED')),

    CONSTRAINT chk_subscription_magnitude
        CHECK (
            minimum_magnitude IS NULL OR
            minimum_magnitude >= 0
        ),

    CONSTRAINT chk_subscription_dates
        CHECK (
            active_to IS NULL OR
            active_to > active_from
        )
);


CREATE TABLE subscription_aors (
    subscription_id     BIGINT NOT NULL,
    aor_id              BIGINT NOT NULL,

    PRIMARY KEY (subscription_id, aor_id),

    CONSTRAINT fk_subscription_aor_subscription
        FOREIGN KEY (subscription_id)
        REFERENCES alert_subscriptions(subscription_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_subscription_aor
        FOREIGN KEY (aor_id)
        REFERENCES aors(aor_id)
);


-- ============================================================
-- 14. ALERTS
-- ============================================================

CREATE TABLE alerts (
    alert_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revision_id           BIGINT NOT NULL,
    decision_id           BIGINT NOT NULL,
    alert_type            VARCHAR(30) NOT NULL,
    alert_status          VARCHAR(30) NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_by           UUID,
    approved_at           TIMESTAMPTZ,
    suppression_reason    TEXT,
    parent_alert_id       UUID,

    CONSTRAINT fk_alert_revision
        FOREIGN KEY (revision_id)
        REFERENCES earthquake_revisions(revision_id),

    CONSTRAINT fk_alert_decision
        FOREIGN KEY (decision_id)
        REFERENCES event_aor_decisions(decision_id),

    CONSTRAINT fk_alert_approver
        FOREIGN KEY (approved_by)
        REFERENCES users(user_id),

    CONSTRAINT fk_alert_parent
        FOREIGN KEY (parent_alert_id)
        REFERENCES alerts(alert_id),

    CONSTRAINT chk_alert_status
        CHECK (alert_status IN (
            'PENDING',
            'HELD_FOR_REVIEW',
            'APPROVED',
            'DISPATCHING',
            'COMPLETED',
            'SUPPRESSED',
            'FAILED'
        ))
);


CREATE TABLE alert_deliveries (
    delivery_id          BIGSERIAL PRIMARY KEY,
    alert_id             UUID NOT NULL,
    subscription_id      BIGINT NOT NULL,
    contact_method_id    BIGINT NOT NULL,
    delivery_status      VARCHAR(20) NOT NULL,
    queued_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_alert_delivery
        UNIQUE (alert_id, subscription_id, contact_method_id),

    CONSTRAINT fk_delivery_alert
        FOREIGN KEY (alert_id)
        REFERENCES alerts(alert_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_delivery_subscription
        FOREIGN KEY (subscription_id)
        REFERENCES alert_subscriptions(subscription_id),

    CONSTRAINT fk_delivery_contact_method
        FOREIGN KEY (contact_method_id)
        REFERENCES contact_methods(contact_method_id),

    CONSTRAINT chk_delivery_status
        CHECK (delivery_status IN (
            'QUEUED',
            'SENDING',
            'SENT',
            'DELIVERED',
            'FAILED',
            'CANCELLED'
        ))
);


CREATE TABLE delivery_attempts (
    attempt_id            BIGSERIAL PRIMARY KEY,
    delivery_id           BIGINT NOT NULL,
    attempt_number        INTEGER NOT NULL,
    attempted_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attempt_status        VARCHAR(20) NOT NULL,
    provider_message_id   VARCHAR(200),
    error_message         TEXT,

    CONSTRAINT uq_delivery_attempt
        UNIQUE (delivery_id, attempt_number),

    CONSTRAINT fk_delivery_attempt_delivery
        FOREIGN KEY (delivery_id)
        REFERENCES alert_deliveries(delivery_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_attempt_number
        CHECK (attempt_number > 0),

    CONSTRAINT chk_attempt_status
        CHECK (attempt_status IN (
            'SUCCESS',
            'FAILED',
            'RETRYING'
        ))
);


-- ============================================================
-- 15. REVIEW / EXCEPTION MANAGEMENT
-- ============================================================

CREATE TABLE review_case_types (
    review_case_type_id  SMALLSERIAL PRIMARY KEY,
    case_type_code       VARCHAR(40) NOT NULL UNIQUE,
    case_type_name       VARCHAR(100) NOT NULL
);


CREATE TABLE review_cases (
    review_case_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_case_type_id  SMALLINT NOT NULL,
    priority             VARCHAR(10) NOT NULL,
    case_status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    issue_summary        TEXT NOT NULL,
    assigned_to          UUID,
    opened_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at            TIMESTAMPTZ,

    CONSTRAINT fk_review_case_type
        FOREIGN KEY (review_case_type_id)
        REFERENCES review_case_types(review_case_type_id),

    CONSTRAINT fk_review_case_assignee
        FOREIGN KEY (assigned_to)
        REFERENCES users(user_id),

    CONSTRAINT chk_review_priority
        CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),

    CONSTRAINT chk_review_status
        CHECK (case_status IN (
            'OPEN',
            'IN_REVIEW',
            'RESOLVED',
            'REJECTED',
            'CLOSED'
        ))
);


CREATE TABLE review_case_events (
    review_case_id      UUID NOT NULL,
    revision_id         BIGINT NOT NULL,

    PRIMARY KEY (review_case_id, revision_id),

    CONSTRAINT fk_review_event_case
        FOREIGN KEY (review_case_id)
        REFERENCES review_cases(review_case_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_event_revision
        FOREIGN KEY (revision_id)
        REFERENCES earthquake_revisions(revision_id)
);


CREATE TABLE review_case_boundaries (
    review_case_id           UUID NOT NULL,
    aor_boundary_version_id  BIGINT NOT NULL,

    PRIMARY KEY (review_case_id, aor_boundary_version_id),

    CONSTRAINT fk_review_boundary_case
        FOREIGN KEY (review_case_id)
        REFERENCES review_cases(review_case_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_boundary
        FOREIGN KEY (aor_boundary_version_id)
        REFERENCES aor_boundary_versions(aor_boundary_version_id)
);


CREATE TABLE review_case_actions (
    review_action_id      BIGSERIAL PRIMARY KEY,
    review_case_id        UUID NOT NULL,
    action_type           VARCHAR(30) NOT NULL,
    from_status           VARCHAR(20),
    to_status             VARCHAR(20),
    finding               TEXT,
    recommendation        TEXT,
    decision              TEXT,
    notes                 TEXT,
    performed_by          UUID NOT NULL,
    performed_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_action_case
        FOREIGN KEY (review_case_id)
        REFERENCES review_cases(review_case_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_action_user
        FOREIGN KEY (performed_by)
        REFERENCES users(user_id)
);


-- ============================================================
-- 16. INTENSITY REFERENCE DATA
-- ============================================================

CREATE TABLE intensity_scales (
    intensity_scale_id   SMALLSERIAL PRIMARY KEY,
    scale_code           VARCHAR(20) NOT NULL UNIQUE,
    scale_name           VARCHAR(100) NOT NULL
);


CREATE TABLE intensity_levels (
    intensity_level_id   SMALLSERIAL PRIMARY KEY,
    intensity_scale_id   SMALLINT NOT NULL,
    numeric_level        SMALLINT NOT NULL,
    roman_numeral        VARCHAR(10) NOT NULL,
    description          VARCHAR(150),

    CONSTRAINT uq_intensity_level
        UNIQUE (intensity_scale_id, numeric_level),

    CONSTRAINT fk_intensity_level_scale
        FOREIGN KEY (intensity_scale_id)
        REFERENCES intensity_scales(intensity_scale_id),

    CONSTRAINT chk_intensity_numeric_level
        CHECK (numeric_level > 0)
);


CREATE TABLE reporter_types (
    reporter_type_id       SMALLSERIAL PRIMARY KEY,
    reporter_type_code     VARCHAR(30) NOT NULL UNIQUE,
    reporter_type_name     VARCHAR(100) NOT NULL
);


CREATE TABLE reporting_sources (
    reporting_source_id    BIGSERIAL PRIMARY KEY,
    reporter_type_id       SMALLINT NOT NULL,
    organization_id        BIGINT,
    contact_id             UUID,
    source_name            VARCHAR(200) NOT NULL,
    active                 BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_reporting_source_type
        FOREIGN KEY (reporter_type_id)
        REFERENCES reporter_types(reporter_type_id),

    CONSTRAINT fk_reporting_source_org
        FOREIGN KEY (organization_id)
        REFERENCES organizations(organization_id),

    CONSTRAINT fk_reporting_source_contact
        FOREIGN KEY (contact_id)
        REFERENCES contacts(contact_id)
);


-- ============================================================
-- 17. FIELD INTENSITY REPORTS
-- ============================================================

CREATE TABLE field_intensity_reports (
    field_report_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    earthquake_id          UUID NOT NULL,
    area_id                BIGINT NOT NULL,
    reporting_source_id    BIGINT NOT NULL,
    intensity_level_id     SMALLINT NOT NULL,
    received_at            TIMESTAMPTZ NOT NULL,
    felt_effects           TEXT,
    verification_status    VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verified_by            UUID,
    verified_at            TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_field_report_event
        FOREIGN KEY (earthquake_id)
        REFERENCES earthquake_events(earthquake_id),

    CONSTRAINT fk_field_report_area
        FOREIGN KEY (area_id)
        REFERENCES administrative_areas(area_id),

    CONSTRAINT fk_field_report_source
        FOREIGN KEY (reporting_source_id)
        REFERENCES reporting_sources(reporting_source_id),

    CONSTRAINT fk_field_report_intensity
        FOREIGN KEY (intensity_level_id)
        REFERENCES intensity_levels(intensity_level_id),

    CONSTRAINT fk_field_report_verifier
        FOREIGN KEY (verified_by)
        REFERENCES users(user_id),

    CONSTRAINT chk_field_report_verification
        CHECK (verification_status IN (
            'PENDING',
            'VERIFIED',
            'REJECTED',
            'DUPLICATE'
        ))
);


CREATE TABLE instrumental_intensity_readings (
    reading_id             BIGSERIAL PRIMARY KEY,
    earthquake_id          UUID NOT NULL,
    station_id             BIGINT,
    area_id                BIGINT NOT NULL,
    intensity_level_id     SMALLINT NOT NULL,
    observed_at            TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_instrumental_event
        FOREIGN KEY (earthquake_id)
        REFERENCES earthquake_events(earthquake_id),

    CONSTRAINT fk_instrumental_station
        FOREIGN KEY (station_id)
        REFERENCES stations(station_id),

    CONSTRAINT fk_instrumental_area
        FOREIGN KEY (area_id)
        REFERENCES administrative_areas(area_id),

    CONSTRAINT fk_instrumental_level
        FOREIGN KEY (intensity_level_id)
        REFERENCES intensity_levels(intensity_level_id)
);


-- ============================================================
-- 18. INTENSITY CONSOLIDATION
-- ============================================================

CREATE TABLE intensity_bulletins (
    bulletin_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    earthquake_id        UUID NOT NULL,
    bulletin_version     INTEGER NOT NULL,
    bulletin_status      VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    prepared_by          UUID NOT NULL,
    validated_by         UUID,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalized_at         TIMESTAMPTZ,

    CONSTRAINT uq_intensity_bulletin
        UNIQUE (earthquake_id, bulletin_version),

    CONSTRAINT fk_bulletin_event
        FOREIGN KEY (earthquake_id)
        REFERENCES earthquake_events(earthquake_id),

    CONSTRAINT fk_bulletin_preparer
        FOREIGN KEY (prepared_by)
        REFERENCES users(user_id),

    CONSTRAINT fk_bulletin_validator
        FOREIGN KEY (validated_by)
        REFERENCES users(user_id),

    CONSTRAINT chk_bulletin_version
        CHECK (bulletin_version > 0),

    CONSTRAINT chk_bulletin_status
        CHECK (bulletin_status IN (
            'DRAFT',
            'FOR_VALIDATION',
            'VALIDATED',
            'FINALIZED',
            'SUPERSEDED'
        ))
);


CREATE TABLE intensity_bulletin_entries (
    bulletin_id              UUID NOT NULL,
    area_id                  BIGINT NOT NULL,
    observed_level_id        SMALLINT,
    instrumental_level_id    SMALLINT,

    PRIMARY KEY (bulletin_id, area_id),

    CONSTRAINT fk_bulletin_entry_bulletin
        FOREIGN KEY (bulletin_id)
        REFERENCES intensity_bulletins(bulletin_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_bulletin_entry_area
        FOREIGN KEY (area_id)
        REFERENCES administrative_areas(area_id),

    CONSTRAINT fk_bulletin_observed_level
        FOREIGN KEY (observed_level_id)
        REFERENCES intensity_levels(intensity_level_id),

    CONSTRAINT fk_bulletin_instrumental_level
        FOREIGN KEY (instrumental_level_id)
        REFERENCES intensity_levels(intensity_level_id)
);


-- ============================================================
-- 19. SOCIAL MEDIA
-- ============================================================

CREATE TABLE social_platforms (
    platform_id          SMALLSERIAL PRIMARY KEY,
    platform_code        VARCHAR(30) NOT NULL UNIQUE,
    platform_name        VARCHAR(100) NOT NULL
);


CREATE TABLE social_content_types (
    content_type_id      SMALLSERIAL PRIMARY KEY,
    content_type_code    VARCHAR(30) NOT NULL UNIQUE,
    content_type_name    VARCHAR(100) NOT NULL
);


CREATE TABLE social_posts (
    social_post_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    earthquake_id        UUID,
    bulletin_id          UUID,
    platform_id          SMALLINT NOT NULL,
    content_type_id      SMALLINT NOT NULL,
    title                VARCHAR(250),
    content              TEXT NOT NULL,
    post_status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_by           UUID NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    scheduled_at         TIMESTAMPTZ,
    published_at         TIMESTAMPTZ,

    CONSTRAINT fk_social_event
        FOREIGN KEY (earthquake_id)
        REFERENCES earthquake_events(earthquake_id),

    CONSTRAINT fk_social_bulletin
        FOREIGN KEY (bulletin_id)
        REFERENCES intensity_bulletins(bulletin_id),

    CONSTRAINT fk_social_platform
        FOREIGN KEY (platform_id)
        REFERENCES social_platforms(platform_id),

    CONSTRAINT fk_social_content_type
        FOREIGN KEY (content_type_id)
        REFERENCES social_content_types(content_type_id),

    CONSTRAINT fk_social_creator
        FOREIGN KEY (created_by)
        REFERENCES users(user_id),

    CONSTRAINT chk_social_status
        CHECK (post_status IN (
            'DRAFT',
            'FOR_APPROVAL',
            'APPROVED',
            'SCHEDULED',
            'PUBLISHED',
            'CANCELLED'
        ))
);


CREATE TABLE hashtags (
    hashtag_id           BIGSERIAL PRIMARY KEY,
    hashtag_text         VARCHAR(100) NOT NULL UNIQUE
);


CREATE TABLE social_post_hashtags (
    social_post_id       UUID NOT NULL,
    hashtag_id           BIGINT NOT NULL,

    PRIMARY KEY (social_post_id, hashtag_id),

    CONSTRAINT fk_social_hashtag_post
        FOREIGN KEY (social_post_id)
        REFERENCES social_posts(social_post_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_social_hashtag
        FOREIGN KEY (hashtag_id)
        REFERENCES hashtags(hashtag_id)
);


CREATE TABLE social_post_attachments (
    attachment_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    social_post_id       UUID NOT NULL,
    attachment_type      VARCHAR(30) NOT NULL,
    file_uri             TEXT NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_social_attachment_post
        FOREIGN KEY (social_post_id)
        REFERENCES social_posts(social_post_id)
        ON DELETE CASCADE
);


CREATE TABLE checklist_items (
    checklist_item_id    SMALLSERIAL PRIMARY KEY,
    item_code            VARCHAR(50) NOT NULL UNIQUE,
    item_name            VARCHAR(150) NOT NULL
);


CREATE TABLE social_post_checklist_results (
    social_post_id       UUID NOT NULL,
    checklist_item_id    SMALLINT NOT NULL,
    completed            BOOLEAN NOT NULL DEFAULT FALSE,
    completed_by         UUID,
    completed_at         TIMESTAMPTZ,

    PRIMARY KEY (social_post_id, checklist_item_id),

    CONSTRAINT fk_social_checklist_post
        FOREIGN KEY (social_post_id)
        REFERENCES social_posts(social_post_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_social_checklist_item
        FOREIGN KEY (checklist_item_id)
        REFERENCES checklist_items(checklist_item_id),

    CONSTRAINT fk_social_checklist_user
        FOREIGN KEY (completed_by)
        REFERENCES users(user_id)
);


CREATE TABLE social_post_status_history (
    status_history_id    BIGSERIAL PRIMARY KEY,
    social_post_id       UUID NOT NULL,
    old_status           VARCHAR(30),
    new_status           VARCHAR(30) NOT NULL,
    changed_by           UUID NOT NULL,
    changed_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes                TEXT,

    CONSTRAINT fk_social_status_post
        FOREIGN KEY (social_post_id)
        REFERENCES social_posts(social_post_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_social_status_user
        FOREIGN KEY (changed_by)
        REFERENCES users(user_id)
);


-- ============================================================
-- 20. EMAIL / SMTP CONFIGURATION
-- ============================================================

CREATE TABLE email_gateways (
    email_gateway_id     BIGSERIAL PRIMARY KEY,
    gateway_name         VARCHAR(100) NOT NULL,
    smtp_host            VARCHAR(255) NOT NULL,
    smtp_port            INTEGER NOT NULL,
    security_mode        VARCHAR(20) NOT NULL,
    username             VARCHAR(150),
    secret_reference     TEXT,
    sender_address       VARCHAR(200),
    active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_smtp_port
        CHECK (smtp_port BETWEEN 1 AND 65535),

    CONSTRAINT chk_email_security
        CHECK (security_mode IN ('NONE','SSL','TLS','STARTTLS'))
);


-- ============================================================
-- 21. AUDIT LOG
-- ============================================================

CREATE TABLE audit_event_types (
    audit_event_type_id  SMALLSERIAL PRIMARY KEY,
    event_type_code      VARCHAR(50) NOT NULL UNIQUE,
    event_type_name      VARCHAR(150) NOT NULL
);


CREATE TABLE audit_events (
    audit_event_id       BIGSERIAL PRIMARY KEY,
    audit_event_type_id  SMALLINT NOT NULL,
    actor_user_id        UUID,
    correlation_id       UUID,
    event_status         VARCHAR(20) NOT NULL,
    description          TEXT,
    occurred_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address           INET,

    CONSTRAINT fk_audit_type
        FOREIGN KEY (audit_event_type_id)
        REFERENCES audit_event_types(audit_event_type_id),

    CONSTRAINT fk_audit_actor
        FOREIGN KEY (actor_user_id)
        REFERENCES users(user_id),

    CONSTRAINT chk_audit_status
        CHECK (event_status IN (
            'SUCCESS',
            'FAILED',
            'WARNING',
            'INFO'
        ))
);


CREATE TABLE audit_object_types (
    object_type_id       SMALLSERIAL PRIMARY KEY,
    object_type_code     VARCHAR(50) NOT NULL UNIQUE,
    object_type_name     VARCHAR(100) NOT NULL
);


CREATE TABLE audit_event_objects (
    audit_event_id       BIGINT NOT NULL,
    object_type_id       SMALLINT NOT NULL,
    object_identifier    VARCHAR(100) NOT NULL,

    PRIMARY KEY (
        audit_event_id,
        object_type_id,
        object_identifier
    ),

    CONSTRAINT fk_audit_object_event
        FOREIGN KEY (audit_event_id)
        REFERENCES audit_events(audit_event_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_audit_object_type
        FOREIGN KEY (object_type_id)
        REFERENCES audit_object_types(object_type_id)
);


-- ============================================================
-- 22. IMPORTANT INDEXES
-- ============================================================

-- GIS
CREATE INDEX idx_station_location
ON stations
USING GIST (location);

CREATE INDEX idx_admin_area_geometry
ON administrative_areas
USING GIST (boundary_geometry);

CREATE INDEX idx_aor_boundary_geometry
ON aor_boundary_versions
USING GIST (boundary_geometry);

CREATE INDEX idx_earthquake_epicenter
ON earthquake_revisions
USING GIST (epicenter);

CREATE INDEX idx_fault_geometry
ON fault_systems
USING GIST (fault_geometry);


-- Earthquake
CREATE INDEX idx_earthquake_source
ON earthquake_events(source_id);

CREATE INDEX idx_revision_event
ON earthquake_revisions(earthquake_id);

CREATE INDEX idx_revision_origin_time
ON earthquake_revisions(origin_time DESC);

CREATE INDEX idx_revision_magnitude
ON earthquake_revisions(magnitude);


-- Location
CREATE INDEX idx_event_location_revision
ON event_location_determinations(revision_id);

CREATE INDEX idx_event_location_area
ON event_location_determinations(area_id);


-- AOR
CREATE INDEX idx_aor_station
ON aors(station_id);

CREATE INDEX idx_aor_boundary_aor
ON aor_boundary_versions(aor_id);

CREATE INDEX idx_aor_eval_revision
ON event_aor_evaluations(revision_id);

CREATE INDEX idx_aor_eval_classification
ON event_aor_evaluations(classification_type_id);

CREATE INDEX idx_aor_decision_revision
ON event_aor_decisions(revision_id);

CREATE INDEX idx_decision_assignment_aor
ON event_aor_decision_assignments(aor_id);


-- Contact / recipient
CREATE INDEX idx_contact_assignment_contact
ON contact_assignments(contact_id);

CREATE INDEX idx_contact_assignment_station
ON contact_assignments(station_id);

CREATE INDEX idx_contact_method_contact
ON contact_methods(contact_id);

CREATE INDEX idx_subscription_assignment
ON alert_subscriptions(contact_assignment_id);


-- Alerts
CREATE INDEX idx_alert_revision
ON alerts(revision_id);

CREATE INDEX idx_alert_status
ON alerts(alert_status);

CREATE INDEX idx_delivery_alert
ON alert_deliveries(alert_id);

CREATE INDEX idx_delivery_status
ON alert_deliveries(delivery_status);


-- Reviews
CREATE INDEX idx_review_case_status
ON review_cases(case_status);

CREATE INDEX idx_review_case_type
ON review_cases(review_case_type_id);

CREATE INDEX idx_review_case_event_revision
ON review_case_events(revision_id);


-- Intensity
CREATE INDEX idx_field_report_event
ON field_intensity_reports(earthquake_id);

CREATE INDEX idx_field_report_area
ON field_intensity_reports(area_id);

CREATE INDEX idx_field_report_status
ON field_intensity_reports(verification_status);

CREATE INDEX idx_instrumental_event
ON instrumental_intensity_readings(earthquake_id);

CREATE INDEX idx_bulletin_event
ON intensity_bulletins(earthquake_id);


-- Social media
CREATE INDEX idx_social_event
ON social_posts(earthquake_id);

CREATE INDEX idx_social_status
ON social_posts(post_status);


-- Audit
CREATE INDEX idx_audit_occurred
ON audit_events(occurred_at DESC);

CREATE INDEX idx_audit_correlation
ON audit_events(correlation_id);

CREATE INDEX idx_audit_actor
ON audit_events(actor_user_id);


-- ============================================================
-- 23. REFERENCE / SEED DATA
-- ============================================================

INSERT INTO roles (role_code, role_name)
VALUES
('ADMIN', 'Administrator'),
('GEOSPATIAL_ANALYST', 'Geospatial Analyst'),
('SEISMIC_SPECIALIST', 'Seismic Data Specialist'),
('REVIEWER', 'Reviewer'),
('OPERATOR', 'Operator');


INSERT INTO administrative_area_types
(area_type_code, area_type_name, hierarchy_level)
VALUES
('COUNTRY', 'Country', 1),
('REGION', 'Region', 2),
('PROVINCE', 'Province', 3),
('CITY', 'City', 4),
('MUNICIPALITY', 'Municipality', 4),
('BARANGAY', 'Barangay', 5);


INSERT INTO aor_classification_types
(classification_code, classification_name)
VALUES
('INSIDE', 'Inside AOR'),
('OUTSIDE', 'Outside AOR'),
('BOUNDARY', 'Boundary Event'),
('OVERLAP', 'Overlapping AOR'),
('UNRESOLVED', 'Unresolved');


INSERT INTO location_determination_methods
(method_code, method_name)
VALUES
('EQINFO_TEXT', 'EQInfo Source Location'),
('POINT_IN_POLYGON', 'GIS Point-in-Polygon'),
('NEAREST_ADMIN_AREA', 'Nearest Administrative Area'),
('MANUAL', 'Manual Determination');


INSERT INTO review_case_types
(case_type_code, case_type_name)
VALUES
('BOUNDARY_EVENT', 'Boundary Event'),
('OFFSHORE_EVENT', 'Offshore Event'),
('DUPLICATE_RECORD', 'Duplicate Record'),
('AMBIGUOUS_LOCATION', 'Ambiguous Location'),
('CORRECTED_EVENT', 'Corrected Event'),
('PROVINCE_ASSIGNMENT', 'Province Assignment'),
('BOUNDARY_VALIDATION', 'Boundary Validation'),
('DATASET_VALIDATION', 'Dataset Validation');


INSERT INTO intensity_scales
(scale_code, scale_name)
VALUES
('PEIS', 'PHIVOLCS Earthquake Intensity Scale');


INSERT INTO intensity_levels
(intensity_scale_id, numeric_level, roman_numeral)
SELECT intensity_scale_id, level_no, roman
FROM intensity_scales
CROSS JOIN (
    VALUES
        (1, 'I'),
        (2, 'II'),
        (3, 'III'),
        (4, 'IV'),
        (5, 'V'),
        (6, 'VI'),
        (7, 'VII'),
        (8, 'VIII'),
        (9, 'IX'),
        (10, 'X')
) AS x(level_no, roman)
WHERE scale_code = 'PEIS';


INSERT INTO reporter_types
(reporter_type_code, reporter_type_name)
VALUES
('DRRMO', 'Disaster Risk Reduction and Management Office'),
('POLICE_BFP', 'Police / BFP'),
('DEPED', 'Department of Education'),
('BARANGAY', 'Barangay Official'),
('CITIZEN', 'Citizen'),
('OTHER', 'Other');


INSERT INTO social_platforms
(platform_code, platform_name)
VALUES
('FACEBOOK', 'Facebook'),
('X', 'X'),
('WEBSITE', 'Website');


INSERT INTO social_content_types
(content_type_code, content_type_name)
VALUES
('INTENSITY_UPDATE', 'Intensity Update'),
('INFOGRAPHIC', 'Infographic'),
('ADVISORY', 'Advisory'),
('GENERAL_UPDATE', 'General Update'),
('SAFETY_TIPS', 'Safety Tips');


INSERT INTO checklist_items
(item_code, item_name)
VALUES
('REPORT_VALIDATED', 'Report validated'),
('DUPLICATE_CHECKED', 'Duplicate checked'),
('EQINFO_CONFIRMED', 'EQInfo confirmed'),
('INTENSITY_VERIFIED', 'Intensity verified'),
('IMAGE_ATTACHED', 'Image attached'),
('APPROVAL_COMPLETED', 'Approval completed');


INSERT INTO audit_event_types
(event_type_code, event_type_name)
VALUES
('EQINFO_RETRIEVED', 'EQInfo Retrieved'),
('EVENT_VALIDATED', 'Earthquake Event Validated'),
('AOR_CLASSIFIED', 'AOR Classification Completed'),
('ALERT_APPROVED', 'Alert Approved'),
('ALERT_SENT', 'Alert Sent'),
('ALERT_FAILED', 'Alert Failed'),
('DUPLICATE_SUPPRESSED', 'Duplicate Suppressed'),
('REVIEW_OPENED', 'Review Case Opened'),
('REVIEW_RESOLVED', 'Review Case Resolved'),
('CONTACT_UPDATED', 'Contact Updated'),
('RULE_CHANGED', 'AOR Rule Changed'),
('BOUNDARY_CHANGED', 'AOR Boundary Changed');


INSERT INTO audit_object_types
(object_type_code, object_type_name)
VALUES
('EARTHQUAKE', 'Earthquake'),
('EARTHQUAKE_REVISION', 'Earthquake Revision'),
('ALERT', 'Alert'),
('DELIVERY', 'Alert Delivery'),
('CONTACT', 'Contact'),
('REVIEW_CASE', 'Review Case'),
('AOR', 'Area of Responsibility'),
('RULE', 'AOR Rule'),
('BOUNDARY', 'AOR Boundary'),
('INTENSITY_REPORT', 'Intensity Report'),
('SOCIAL_POST', 'Social Media Post');


-- ============================================================
-- 24. USEFUL VIEWS
-- ============================================================

-- Current earthquake revision
CREATE VIEW vw_current_earthquake_revisions AS
SELECT er.*
FROM earthquake_revisions er
JOIN (
    SELECT
        earthquake_id,
        MAX(revision_number) AS max_revision
    FROM earthquake_revisions
    WHERE revision_status <> 'RETRACTED'
    GROUP BY earthquake_id
) latest
    ON latest.earthquake_id = er.earthquake_id
   AND latest.max_revision = er.revision_number;


-- Most recent AOR decision for each revision
CREATE VIEW vw_current_aor_decisions AS
SELECT d.*
FROM event_aor_decisions d
WHERE NOT EXISTS (
    SELECT 1
    FROM event_aor_decisions newer
    WHERE newer.supersedes_decision_id = d.decision_id
);


-- All earthquake records
CREATE VIEW vw_all_earthquake_records AS
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
    d.decided_at

FROM earthquake_events e

JOIN earthquake_sources src
    ON src.source_id = e.source_id

JOIN vw_current_earthquake_revisions r
    ON r.earthquake_id = e.earthquake_id

LEFT JOIN vw_current_aor_decisions d
    ON d.revision_id = r.revision_id

LEFT JOIN aor_classification_types ct
    ON ct.classification_type_id = d.classification_type_id;


CREATE VIEW vw_inside_aor_events AS
SELECT *
FROM vw_all_earthquake_records
WHERE classification_code = 'INSIDE';


CREATE VIEW vw_outside_aor_events AS
SELECT *
FROM vw_all_earthquake_records
WHERE classification_code = 'OUTSIDE';


CREATE VIEW vw_boundary_events AS
SELECT *
FROM vw_all_earthquake_records
WHERE classification_code = 'BOUNDARY';


CREATE VIEW vw_alert_delivery_summary AS
SELECT
    a.alert_id,

    COUNT(d.delivery_id) AS total_recipients,

    COUNT(d.delivery_id)
        FILTER (
            WHERE d.delivery_status IN ('SENT','DELIVERED')
        ) AS successful_deliveries,

    COUNT(d.delivery_id)
        FILTER (
            WHERE d.delivery_status = 'FAILED'
        ) AS failed_deliveries,

    ROUND(
        (
            COUNT(d.delivery_id)
                FILTER (
                    WHERE d.delivery_status IN ('SENT','DELIVERED')
                )::NUMERIC
            /
            NULLIF(COUNT(d.delivery_id), 0)
        ) * 100,
        2
    ) AS delivery_rate

FROM alerts a

LEFT JOIN alert_deliveries d
    ON d.alert_id = a.alert_id

GROUP BY a.alert_id;


CREATE VIEW vw_contact_directory AS
SELECT
    c.contact_id,
    c.full_name,
    c.active,

    o.organization_name,

    s.station_code,
    s.station_name,

    cr.role_name,

    ca.effective_from,
    ca.effective_to

FROM contacts c

LEFT JOIN contact_assignments ca
    ON ca.contact_id = c.contact_id

LEFT JOIN organizations o
    ON o.organization_id = ca.organization_id

LEFT JOIN stations s
    ON s.station_id = ca.station_id

LEFT JOIN contact_roles cr
    ON cr.contact_role_id = ca.contact_role_id;


CREATE VIEW vw_recipient_directory AS
SELECT
    sub.subscription_id,

    c.contact_id,
    c.full_name,

    o.organization_name,

    s.station_code,
    s.station_name,

    sub.scope_type,
    sub.minimum_magnitude,
    sub.subscription_status,

    sub.active_from,
    sub.active_to

FROM alert_subscriptions sub

JOIN contact_assignments ca
    ON ca.contact_assignment_id = sub.contact_assignment_id

JOIN contacts c
    ON c.contact_id = ca.contact_id

JOIN organizations o
    ON o.organization_id = ca.organization_id

LEFT JOIN stations s
    ON s.station_id = ca.station_id;


CREATE VIEW vw_pending_reviews AS
SELECT
    rc.review_case_id,
    rct.case_type_code,
    rct.case_type_name,
    rc.priority,
    rc.case_status,
    rc.issue_summary,
    rc.assigned_to,
    rc.opened_at,
    rc.updated_at
FROM review_cases rc
JOIN review_case_types rct
    ON rct.review_case_type_id = rc.review_case_type_id
WHERE rc.case_status IN ('OPEN', 'IN_REVIEW');


CREATE VIEW vw_intensity_consolidator AS
SELECT
    e.earthquake_id,
    e.external_event_id,

    a.area_id,
    a.area_name,

    MAX(fir.intensity_level_id) AS max_field_intensity_level_id,
    COUNT(DISTINCT fir.field_report_id) AS field_report_count,

    MAX(iir.intensity_level_id) AS max_instrumental_intensity_level_id

FROM earthquake_events e

LEFT JOIN field_intensity_reports fir
    ON fir.earthquake_id = e.earthquake_id
   AND fir.verification_status = 'VERIFIED'

LEFT JOIN instrumental_intensity_readings iir
    ON iir.earthquake_id = e.earthquake_id
   AND (
        fir.area_id IS NULL
        OR iir.area_id = fir.area_id
   )

LEFT JOIN administrative_areas a
    ON a.area_id = COALESCE(fir.area_id, iir.area_id)

GROUP BY
    e.earthquake_id,
    e.external_event_id,
    a.area_id,
    a.area_name;


CREATE VIEW vw_audit_timeline AS
SELECT
    ae.audit_event_id,
    ae.correlation_id,
    aet.event_type_code,
    aet.event_type_name,
    ae.event_status,
    ae.description,
    ae.occurred_at,

    u.user_id,
    u.full_name AS actor_name

FROM audit_events ae

JOIN audit_event_types aet
    ON aet.audit_event_type_id = ae.audit_event_type_id

LEFT JOIN users u
    ON u.user_id = ae.actor_user_id;
