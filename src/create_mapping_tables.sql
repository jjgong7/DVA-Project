---------------------
------CSV FILES------
---------------------
.mode csv
.separator ','

DROP TABLE IF EXISTS st_map;
CREATE TABLE st_map(
    ST INT,
    ST_NAME TEXT,
    ST_ABBREV TEXT
);
.import data/raw/st.csv st_map

DROP TABLE IF EXISTS adjinc_map;
CREATE TABLE adjinc_map(
    ADJINC DOUBLE,
    ADJINC_DESC TEXT,
    ADJINC_1 DOUBLE,
    ADJINC_2 DOUBLE
);
.import data/raw/adjinc.csv adjinc_map

DROP TABLE IF EXISTS schl_map;
CREATE TABLE schl_map(
    SCHL INT,
    SCHL_DESC TEXT
);
.import data/raw/schl.csv schl_map

DROP TABLE IF EXISTS sex_map;
CREATE TABLE sex_map(
    SEX INT,
    SEX_DESC TEXT
);
.import data/raw/sex.csv sex_map

DROP TABLE IF EXISTS wkl_map;
CREATE TABLE wkl_map(
    WKL INT,
    WKL_DESC TEXT
);
.import data/raw/wkl.csv wkl_map

DROP TABLE IF EXISTS wkw_map;
CREATE TABLE wkw_map(
    WKW INT,
    WKW_DESC TEXT
);
.import data/raw/wkw.csv wkw_map

DROP TABLE IF EXISTS esr_map;
CREATE TABLE esr_map(
    ESR INT,
    ESR_DESC TEXT
);
.import data/raw/esr.csv esr_map

DROP TABLE IF EXISTS projections;
CREATE TABLE projections(
    ST INT,
    SOCP TEXT,
    BASE_NUM INT,
    PROJ_NUM INT,
    PERCENT_CHANGE REAL
);
.import data/raw/projections.csv projections
CREATE INDEX projections_idx_st on projections(ST);
CREATE INDEX projections_idx_socp on projections(SOCP);

DROP TABLE IF EXISTS cost_of_living;
CREATE TABLE cost_of_living(
    ST INT,
    CLI REAL
);
.import data/raw/rpp.csv cost_of_living
CREATE INDEX cost_of_living_st on cost_of_living(ST);

DROP TABLE IF EXISTS socp_map;
CREATE TABLE socp_map(
    SOCP TEXT,
    SOCP_INDUSTRY TEXT,
    SOCP_DESC TEXT
);
.import data/raw/socp_shorter.csv socp_map
CREATE INDEX socp_idx ON socp_map(socp);

---------------------
------TSV FILES------
---------------------
.separator "\t"


DROP TABLE IF EXISTS fod1p_map;
CREATE TABLE fod1p_map(
    FOD1P INT,
    FOD1P_DESC TEXT
);
.import data/raw/fod1p.tsv fod1p_map
CREATE INDEX fod1p_idx ON fod1p_map (fod1p);

DROP TABLE IF EXISTS cow_map;
CREATE TABLE cow_map(
    COW INT,
    COW_DESC TEXT
);
.import data/raw/cow.tsv cow_map

DROP TABLE IF EXISTS naicsp_map;
CREATE TABLE naicsp_map(
    NAICSP INT,
    NAICSP_INDUSTRY TEXT,
    NAICSP_DESC TEXT
);
.import data/raw/naicsp.tsv naicsp_map
