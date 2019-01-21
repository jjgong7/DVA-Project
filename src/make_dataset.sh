#!/bin/bash
# Before creating dataset, download the PUMS data from
# https://www2.census.gov/programs-surveys/acs/data/pums/2016/5-Year/csv_pus.zip
# Also download the maps from here
# https://drive.google.com/open?id=1_Re8MeB0if8YsYD8J0V0DVpbS9O6mvxU
set -x
set -e
sqlite3 data/processed/pums_complete.db < create_pums_data.sql
sqlite3 data/processed/pums_complete.db < create_mapping_tables.sql
sqlite3 data/processed/pums_complete.db < create_project_data.sql
python create_binned_wages.py
python create_major_similarity.py
python create_career_similarity.py