library(sf)
library(dplyr)

pitc <- st_read("data/processed/pitc_tract_2020_clean.gpkg")

stopifnot(!any(is.na(pitc$GEOID)))
stopifnot(all(pitc$pit_total >= 0))

pitc

