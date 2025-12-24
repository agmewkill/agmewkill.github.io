# ACS Tract-Level Output Schema 

Expected fields for processed tract-level outputs.

## Required fields
- geoid (string): Census tract GEOID (11 chars)
- median_income (number)
- rent_burden_pct (number)
- total_population (integer)
- geometry (Polygon/MultiPolygon) when spatial output is produced

## Validation notes
- All numeric columns should be numeric types (no commas or symbols)
- Missing values should be explicit nulls
- GEOIDs should be zero-padded strings
