# 01_ingest_acs.R — download + assemble ACS tract dataset

library(tidycensus)
library(dplyr)
library(tidyr)
library(readr)

source("src/config/settings.R")
source("src/config/variables.R")

# ---- age data (long -> wide -> aggregated bands) ----
age_data <- get_acs(
  geography = "tract",
  state = PROJECT$state,
  county = PROJECT$county,
  variables = AGE_VARS,
  year = PROJECT$year,
  survey = PROJECT$survey
)

age_wide <- age_data %>%
  select(GEOID, variable, estimate) %>%
  pivot_wider(names_from = variable, values_from = estimate)

age_aggregated <- age_wide %>%
  mutate(
    popAge0_4  = B01001_003 + B01001_027,
    popAge5_14 = B01001_004 + B01001_005 + B01001_028 + B01001_029,
    popAge15_24 = rowSums(select(., B01001_006:B01001_010, B01001_030:B01001_034), na.rm = TRUE),
    popAge25_44 = rowSums(select(., B01001_011:B01001_014, B01001_035:B01001_038), na.rm = TRUE),
    popAge45_64 = rowSums(select(., B01001_015:B01001_019, B01001_039:B01001_043), na.rm = TRUE),
    popAge65    = rowSums(select(., B01001_020:B01001_025, B01001_044:B01001_049), na.rm = TRUE)
  ) %>%
  select(GEOID, starts_with("popAge"))

# ---- other ACS variables (wide) ----
other_data <- get_acs(
  geography = "tract",
  state = PROJECT$state,
  county = PROJECT$county,
  variables = ACS_VARS,
  year = PROJECT$year,
  survey = PROJECT$survey,
  output = "wide"
)

# keep only estimate columns, rename them cleanly
other_clean <- other_data %>%
  select(GEOID, NAME, ends_with("E")) %>%
  rename_with(~ gsub("E$", "", .x))  # remove E suffix

final_data <- other_clean %>%
  left_join(age_aggregated, by = "GEOID")

# ---- export ----
dir.create(PATHS$data_processed, recursive = TRUE, showWarnings = FALSE)

out_csv <- file.path(PATHS$data_processed, paste0("acs_tract_", PROJECT$year, "_sd.csv"))
write_csv(final_data, out_csv)

message("Wrote: ", out_csv)
