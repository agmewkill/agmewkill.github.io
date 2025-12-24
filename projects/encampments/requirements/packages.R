# packages.R — packages used in this project
pkgs <- c(
  "tidycensus","dplyr","tidyr","readr","tigris","sf","psych"
)

install_if_missing <- function(p) {
  if (!requireNamespace(p, quietly = TRUE)) install.packages(p)
}

invisible(lapply(pkgs, install_if_missing))
