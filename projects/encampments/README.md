# Encampments + ACS (San Diego)

This project demonstrates a reproducible workflow to pull ACS 5-year tract indicators, aggregate age bands, and produce an analysis-ready dataset for downstream spatial joins and modeling.

## Structure
- `src/config/` project settings + variable lists
- `src/ingest/` pull/assemble ACS data
- `src/transform/` spatial joins / cleaning (next)
- `src/analysis/` correlations / models (next)
- `data/` ignored raw + intermediate data
- `outputs/` small artifacts for review

## Run
From repo root:
- Run `src/ingest/01_ingest_acs.R`
- Output: `data/processed/acs_tract_2013_sd.csv`

