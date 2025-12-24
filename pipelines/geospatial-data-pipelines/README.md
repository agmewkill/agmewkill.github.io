# Geospatial Data Pipelines

This folder contains Python-based workflows for ingesting, cleaning, validating,
and transforming geospatial datasets for downstream analysis and visualization.

The pipelines are designed to demonstrate production-minded practices such as
clear structure, reproducibility, and data validation, while remaining lightweight.

## Example Use Case
Preparing Census and ACS datasets for spatial analysis at tract or ZCTA level,
including joins to boundary geometries and basic QA checks.

## Structure
- `scripts/ingest/` — data acquisition and standardization
- `scripts/transform/` — cleaning, normalization, and spatial joins
- `scripts/validate/` — geometry and schema checks
- `data/` — local-only inputs and outputs (not committed)

## Notes
Large datasets are intentionally excluded. Only scripts, documentation, and
small illustrative samples are included in version control.


## How to run (local)
From `pipelines/geospatial-data-pipelines/`:

```bash
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

python scripts/ingest/download_acs.py
python scripts/transform/clean_acs.py
python scripts/validate/validate_geometries.py
