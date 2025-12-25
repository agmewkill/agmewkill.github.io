# Public Bathroom Access Audit — San Diego County

**Status:** 🚧 In progress (active development)  
**Primary focus:** Geospatial data engineering, audit workflows, and public infrastructure analysis

This project documents the development of an open-source geospatial system to audit **public bathroom access** across San Diego County. It is intentionally designed as both a **policy-relevant public interest project** and a **data engineering portfolio example** demonstrating scalable spatial workflows.

The work currently exists as an ArcGIS Online map and is being migrated toward an open, reproducible, pipeline-driven architecture.

---

## Why this project exists

Access to publicly available bathrooms is a critical issue for:
- public health,
- accessibility and ADA compliance,
- homelessness response,
- and basic urban infrastructure planning.

Despite this importance, bathroom access data is often:
- fragmented across agencies,
- outdated,
- manually maintained,
- or locked inside proprietary platforms.

This project aims to create a **transparent, auditable, and extensible dataset** that can support both **analysis** and **public-facing tools**.

---

## Current state (legacy implementation)

- ✅ Bathroom locations and attributes mapped in **ArcGIS Online**
- ✅ Structured attributes (hours, accessibility, ownership, notes)
- 🚧 No automated validation or versioning
- 🚧 Manual update workflows
- 🚧 Proprietary hosting

The ArcGIS Online map is treated as a **source and reference implementation**, not the final product.

---

## Planned open-source architecture

The long-term goal is to replace the legacy implementation with:

- **Schema-driven ingestion**
- **Automated validation**
- **Versioned datasets**
- **Support for user-submitted data**
- **Open web visualization**

---

## Unit of analysis

| Component | Description |
|--------|------------|
| Geometry | Point locations (bathroom facilities) |
| Geography | San Diego County |
| Data sensitivity | Public infrastructure only |
| Privacy | No personally identifiable information |

---

## Example schema (draft)

| Field | Description |
|------|------------|
| `bathroom_id` | Stable unique identifier |
| `name` | Facility or site name |
| `geometry` | Point (longitude/latitude) |
| `hours` | Access hours |
| `accessibility` | ADA accessible (yes/no/unknown) |
| `ownership` | City, county, state, private |
| `verified_date` | Last verification timestamp |
| `source` | City data, field audit, user submission |

Final schema will be versioned and documented during pipeline implementation.

---

## Engineering goals demonstrated

This project is explicitly designed to demonstrate:

- Geospatial data ingestion and normalization
- Schema documentation and enforcement
- Validation and QA workflows
- Migration from proprietary GIS to open systems
- Clear separation between **project context** and **reusable pipelines**
- Communication of technical tradeoffs to non-engineers

---

## Relationship to pipelines

This project **does not embed pipelines directly**.

Instead, it references reusable workflows located under: pipelines/user-generated-geo-ingestion

Those pipelines will handle:
- raw data ingestion (CSV, GeoJSON, API),
- geometry validation,
- duplicate detection,
- schema enforcement,
- and output publishing.

This separation mirrors real production data systems.

---

## Roadmap
- [ ] Export ArcGIS Online data to open formats
- [ ] Finalize and publish schema
- [ ] Build ingestion + validation pipeline
- [ ] Publish first open dataset
- [ ] Prototype user submission workflow
- [ ] Add moderation and QA rules
- [ ] Replace legacy map with open-source visualization






