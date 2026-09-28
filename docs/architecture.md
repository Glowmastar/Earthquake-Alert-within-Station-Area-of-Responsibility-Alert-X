# Earthquake AOR Alert Architecture

**Status: High Level / Provisional**

The target conceptual architecture is deliberately simple and remains
provisional until the earthquake-information source is inspected.

```text
Approved Earthquake Information Source
                ↓
       Google Apps Script
       Data Retrieval Layer
                ↓
       Google Sheets
       Earthquake Data
                ↓
       Province/Municipality
       AOR Matching Logic
                ↓
       AOR View
          +     \
          |      \
          |       → Email Alert Logic
          |                ↓
          |          Approved Recipient
          ↓
       Alert Log
```

## Architecture Principles

- Keep the five-day prototype centered on Google Sheets and Google Apps
  Script.
- Keep AOR matching based on approved province and municipality mappings.
- Do not introduce a backend server, microservices, cloud database, separate
  frontend framework, GIS engine, or spatial database without later
  requirements.

## Decisions Deferred

The source, access method, source fields, update behavior, AOR mappings,
recipients, and alert handling must be verified before implementation details
are selected.
