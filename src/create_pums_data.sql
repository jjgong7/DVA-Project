-- Import database
.headers off
.mode csv
.separator ','

DROP TABLE IF EXISTS pums_data;

-- CREATE pums_data table and populate it
.mode csv
CREATE TABLE pums_data(
    SERIALNO INT,
    SPORDER INT,
    PUMA INT,
    ST INT,
    ADJINC DOUBLE,
    PWGTP DOUBLE,
    AGEP INT,
    COW INT,
    INTP DOUBLE,
    NWAB INT,
    NWAV INT,
    NWLA INT,
    NWLK INT,
    OIP DOUBLE,
    SCHG INT,
    SCHL INT,
    SEMP DOUBLE,
    SEX INT,
    SSIP DOUBLE,
    SSP DOUBLE,
    WAGP DOUBLE,
    WKHP INT,
    WKL INT,
    WKW INT,
    WRK TEXT,
    ESR INT,
    FOD1P TEXT,
    FOD2P TEXT,
    INDP TEXT,
    NAICSP TEXT,
    OCCP TEXT,
    PERNP DOUBLE,
    PINCP DOUBLE,
    POWPUMA TEXT,
    POWSP TEXT,
    SOCP TEXT
);

.import data/interim/pums_extracted.csv pums_data
