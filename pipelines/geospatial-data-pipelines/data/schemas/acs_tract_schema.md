# ACS Tract-Level Dataset Schema

This document describes the expected schema for processed ACS tract-level outputs.

## Fields
- `geoid` (string): Census tract GEOID
- `median_income` (numeric): Median household income
- `rent_burden_pct` (numeric): Percent of households spending >30% on rent
- `total_population` (integer)
- `geometry` (Polygon / MultiPolygon)

## Notes
- All numeric fields should be standardized to numeric types
- Missing values should be explicitly set to null
