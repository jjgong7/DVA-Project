# Major, Occupation, Regional COLI & Earning
## An Application for Career Path Exploration

**Team Members:**  
Chang-Zhou Gong, David Sluder, Jared Miller, Keyi Gimpel, Margarita Kalacheva, Reese Hopkins

**Languages:**  
Python, SQL, Javascript, HTML, CSS

**Libraries:**  
D3.js, jQuery

**Frameworks:**  
Flask, Bootstrap

**Relational Database Management System:**  
SQLite3


## Description:

Our project is an interactive interface for exploring the connection between college and career: Majors, Occupations, Residence, and Earnings (MORE).

Based on a large representative sample (millions) of Americans, it shows what college majors led to what careers, and what the earnings of those careers are. It addition, it recommends similar majors to explore and shows state-specific earnings adjusted by cost of living.

The frontend is uses jQuery, D3.js, and Bootstrap CSS. The backend is a Python Flask app with a SQLite3 database. A few Python and SQL scripts process the raw Census data into smaller yet flexible aggregated tables used by the app.

**Please also check out the [project poster!](doc/Poster.pdf)**


## Installation:

Run the following commands (assuming the user is using a Mac):

```bash
virtualenv --python=python3 env
. env/bin/activate
pip install -r requirements.txt
cd src
python setup_dirs.py
```

Then, you are ready for either the shortcut or full data install.

### Shortcut Data Install

The full install takes about 45 minutes for data creation scripts to run, so a shortcut is to download our premade database (about 100MB):

1. [Download pums_complete.db (110 MB)](https://drive.google.com/uc?export=download&id=1vKM_FIK5SARIjkxiPmAeW2E4cTEmAp5a)
2. Put pums_complete.db in folder:
    * src/data/processed/pums_complete.db

### Full Data Install

1. [Download pums_2012_2016.csv.zip (2.3 GB)](https://drive.google.com/uc?export=download&id=1Nbu92pHq4V92f6Da1kRR0QVD3BH_0jWq)
2. Put pums_2012_2016.csv.zip in folder:
    * src/data/raw/Download pums_2012_2016.csv.zip

Run the following commands (Mac):

   ```bash
   python extract_pums.py --in-file=data/raw/pums_2012_2016.csv.zip --out-file=data/interim/pums_extracted.csv
   ```
   [...this can take 20-30 minutes...]

   ```bash
   ./make_dataset.sh
   ```
   [...this can take 5-10 minutes...]

## Local Execution:

Make sure the virtualenv has been created and activated (above).

```bash
cd src/app
FLASK_APP=app.py FLASK_DEBUG=1 flask run
```

Then browse to "http://localhost:5000".

## Deployment:

The project is deployed using AWS ElasticBeanstalk. This requires the EB command line tools, an AWS account and a copy of the SQLite database stored in S3. Your EB role needs a read permission policy for the S3 bucket.

See the file `.ebextensions/commands.config` for an important setting that downloads the latest database from an S3 location after every deployment.


## Features:

### 1. Major to Career & Similar Majors
1. Select Majors: Computer Science and General Engineering
2. View Sankey Diagram with flow from Majors to Careers
3. Similar Majors: Select Electrical Engineering Technology from cosine similarity algorithm 

<img src="./gifs/1.majortocareer&similarity.gif" style='border:1px solid gray'/></a>

---
### 2. Career to Major
1. Select Career: Computer Programmers
2. View Sankey Diagram with flow from Career to Majors
3. Select Careers: Computer Programmers & Web Developers
4. View Sankey Diagram with flow from Careers to Majors

<img src="./gifs/2.careertomajor.gif" style='border:1px solid gray'/></a>

---
### 3. Career Wage Histogram and Percentiles
1. Select Career: Computer Programmers
2. Wage Histogram: View histogram for different age ranges
3. Wage Percentiles: View wage percentiles chart for different age ranges

<img src="./gifs/3.wagehistogram&percentiles.gif" style='border:1px solid gray'/></a>

---
### 4. Similar Careers and Two Careers
1. Select Career: Computer Programmers
2. Similar Careers: Select Software Developers
3. Select Careers: Software Developers and Database Administrators
4. View Wage Histogram and Percentiles of combined career data

<img src="./gifs/4.careersimilarity&2careers.gif" style='border:1px solid gray'/></a>

---
### 5. Cost of Living Career Map
1. Select Career: Software Developers
2. View Cost of Living Map and hover over stats for specific states

<img src="./gifs/5.colimapcareer.gif" style='border:1px solid gray'/></a>

---
### 6. Major and Career
1. Select Major: Computer Science
2. Select Career: Software Developers
3. Select Additional Major: Computer Engineering
4. View Sankey Diagram flow
5. Select Major: Nursing
6. View Sankey Diagram flow - Nursing to Software Developers (No related major to career flow)

<img src="./gifs/6.major&career.gif" style='border:1px solid gray'/></a>

---
### 7. Major and Career Match
1. Select Major: Nursing
2. Select Career: Software Developers
3. View Sankey Diagram flow
4. Remove Career: Software Developers
5. Select Career: Registered Nurses
6. View Sankey Diagram flow (Major to Career match)
7. View Wage Histogram, Wage Percentiles, and COLI Map

<img src="./gifs/7.major&careermatch.gif" style='border:1px solid gray'/></a>
