library(sf)
library(dplyr)

pitc <- st_read("data/processed/pitc_tract_2020_clean.gpkg")
acs  <- read_csv("data/processed/acs_tract_2020_clean.csv")

joined <- pitc %>%
  left_join(acs, by = "GEOID")

st_write(
  joined,
  "data/processed/tract_acs_pitc_2020.gpkg",
  delete_dsn = TRUE
)

write_csv(
  st_drop_geometry(joined),
  "data/outputs/tract_acs_pitc_2020.csv"
)
