# Earthquake AOR Alert Requirements

**Status: Initial / Provisional Documentation**

This document distinguishes confirmed requirements from design conveniences
that must be validated and information that remains unknown. It does not
define source fields, mappings, recipients, thresholds, statuses, or alert
logic.

## A. Confirmed Requirements

### 1. Earthquake Information Source

The prototype should obtain earthquake information from an existing
earthquake-information website or source. The exact source and access method
remain unknown.

### 2. AOR-Based Filtering

The prototype should identify earthquake information relevant to a station's
Area of Responsibility.

### 3. Province Criterion

Province is explicitly part of the initial AOR identification method.

### 4. Municipality Criterion

Municipality is explicitly part of the initial AOR identification method.

### 5. Google Sheets

The five-day prototype should use Google Sheets.

### 6. Google Apps Script

Apps Script should support automation and email notification.

### 7. Display Relevant Earthquake Information

Earthquake information belonging to the applicable AOR should be displayed in
the spreadsheet.

### 8. Email Notification

The prototype should send an email notification to responsible personnel when
an event is plotted within their respective AOR.

### 9. Preliminary Quake Report Support

The tool should make relevant information easier to identify for Preliminary
Quake Report-related work.

### 10. Aftershock-Count Monitoring Support

The tool should make relevant earthquake information easier to review for
aftershock-count monitoring. The prototype must not be assumed to determine
scientifically whether an event is an aftershock.

### 11. Initial Coverage

The minimum prototype target is three provinces and all municipalities inside
those selected provinces. The three provinces must be selected or confirmed
by Glyn, the facilitator, or an appropriate operational or subject-matter
authority.

## B. Provisional / To Validate

The following are possible design conveniences, each marked **PROVISIONAL –
TO VALIDATE**:

- Automatic data refresh.
- Manual refresh.
- Station or AOR selector.
- Province filter.
- Municipality filter.
- Earthquake-event table.
- Alert log.
- Last-refresh timestamp.
- Duplicate-notification prevention.
- Event search.
- Configuration sheet.
- Error log.

## C. Information Still Required

### Earthquake Information Source

- What exact earthquake-information website or source is used?
- Is automated access permitted?
- Is there an API or downloadable feed?
- If not, how is information currently obtained?
- What fields are available?
- How frequently is it updated?
- Is there a stable unique event identifier?

### AOR

- What is the authoritative definition of each Station AOR?
- Which provinces belong to each station?
- Which municipalities belong to each station?
- Can one municipality belong to more than one Station AOR?
- Who approves AOR mappings?
- What source or document defines the mappings?

### Three-Province Prototype

- Which three provinces should be used?
- Are all municipalities in each selected province included?
- Are there exceptions?

### Email

- Who should receive alerts?
- Is there one or more recipient per AOR?
- What information should appear in the email?
- When exactly is an email triggered?
- Should an updated earthquake record trigger another email?
- How are duplicate emails prevented?

### Preliminary Quake Reports

- Which fields are required from the earthquake-information source?
- Is any formatted output needed?

### Aftershock Counts

- Does the source already identify aftershocks?
- Is an existing aftershock list or count available?
- Should the prototype only display or count supplied classifications?
- If calculation is required later, what approved methodology applies?

### Existing System

- What existing program, spreadsheet, script, database, or system already
  performs part of the process?
- Which part should be retained?
- Which part should be improved?

## Out of Scope for Initial MVP

The initial prototype will not automatically include:

- Nationwide AOR coverage.
- Public earthquake alerts.
- Earthquake early warning.
- Earthquake detection.
- Earthquake-location computation.
- Magnitude computation.
- Scientific earthquake interpretation.
- Automated aftershock classification without approved rules.
- SMS notification.
- Mobile push notification.
- GIS polygon processing.
- Radius-based or geofence matching.
- Production deployment.
- Automatic publication of official earthquake information.
- Replacement of authoritative PHIVOLCS earthquake systems.
