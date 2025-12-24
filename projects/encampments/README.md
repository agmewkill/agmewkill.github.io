# Encampments & Social Determinants of Health (San Diego)

This project demonstrates a tract-level data engineering and analysis workflow
linking aggregated homeless encampment counts with American Community Survey (ACS)
socioeconomic indicators for San Diego County.

Encampment data are **pre-aggregated by census tract** to ensure privacy and
anonymity. No individual-level or point-location data are used in this project.

---

## Project scope

- Geography: Census tracts, San Diego County
- Data level: Aggregated tract-level counts only
- Focus:
  - Reproducible ACS ingestion
  - Variable construction and normalization
  - Tract-level joins
  - Descriptive analysis and statistical modeling

This project is designed to mirror real-world public-sector and research workflows
where sensitive location data must be protected while still enabling spatial analysis.

---

## Repository structure
encampments/
├── src/
│ ├── config/ # Variable definitions and configuration
│ ├── ingest/ # ACS data acquisition and assembly
│ ├── transform/ # Tract-level joins and cleaning
│ └── analysis/ # Descriptive statistics and models
├── data/ # Ignored raw and intermediate data
├── outputs/ # Small, reviewable artifacts (tables, summaries)
└── README.md

---

## Workflow overview

1. **Ingest**
   - Pull ACS 5-year tract estimates using `tidycensus`
   - Normalize variable names and schemas
   - Aggregate age and demographic indicators

2. **Transform**
   - Standardize census tract identifiers (GEOID)
   - Join ACS indicators with pre-aggregated encampment counts
   - Validate coverage and missing values

3. **Analysis**
   - Produce tract-level descriptive summaries
   - Explore relationships between encampments and socioeconomic indicators
   - Run regression models appropriate for aggregated count data

---

## Privacy and data handling

- Encampment data are already aggregated by census tract
- No individual locations or point geometries are included
- All analysis is conducted at an anonymized geographic unit
- This structure reflects best practices for sensitive spatial data workflows

---

## Tools

- R
- tidycensus
- dplyr / tidyr
- sf (for tract-level geometry where needed)

---

## Status

This project is being actively developed as a part of my Master's Thesis, titled "Structural Inequities and Health: The Possible Social Determinants of Health in Correlation with Homeless Encampments in San Diego County" under the guidance of Dr. Ming-Hsiang Tsou at San Diego State University. 





