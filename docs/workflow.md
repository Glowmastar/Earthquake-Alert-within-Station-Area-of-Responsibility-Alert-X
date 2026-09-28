# Initial AOR Earthquake Information Workflow

```text
Earthquake Information Source
        ↓
Retrieve / Receive Earthquake Record
        ↓
Read Relevant Geographic Information
        ↓
Province / Municipality
        ↓
Compare with Approved AOR Mapping
        ↓
Does Event Match an AOR?
       / \
     No   Yes
     ↓     ↓
No AOR   Display in Relevant
Alert    Google Sheet View
              ↓
       Check Alert Handling
              ↓
       Send Approved Email
              ↓
       Record Alert Result
```

This workflow is provisional until the earthquake-information source and AOR
mapping are inspected.

## Unresolved Workflow Details

- Data retrieval method.
- Update frequency.
- Source field mapping.
- Event uniqueness.
- AOR mapping.
- Duplicate handling.
- Updated-event handling.
- Recipients.
- Failure and retry handling.
