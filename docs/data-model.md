# Earthquake AOR Alert Data Model

**Status: Provisional**

## Potential Records

- **Earthquake Event**
- **Station**
- **AOR Assignment**
- **Alert Recipient**
- **Alert Record**

## Initial AOR Concept

The initial AOR concept should remain simple:

```text
Station
    → Province
        → Municipality
```

Do not define actual fields until source data are examined. Do not invent event
IDs, station codes, municipality assignments, email addresses, or scientific
thresholds.
