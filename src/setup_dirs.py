# Create folders
import os
folders = ['logs','data/processed','data/interim','reference/reports','data/raw/mapping_table','misc']
for folder in folders:
    if not os.path.exists(folder):
        os.makedirs(folder)