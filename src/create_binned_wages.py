import numpy as np
import pandas as pd
import sqlite3

db = sqlite3.connect('../src/data/processed/pums_complete.db')

BIN_SIZE = 10000
MAX_BIN = 750000
bins = list(range(0, MAX_BIN + BIN_SIZE, BIN_SIZE))

bin_whens = ["WHEN Wages >= %s AND Wages < %s THEN 'bin_%s_%s'" % (lwr, uppr, lwr, uppr) \
             for lwr, uppr in zip(bins[0:-1], bins[1:])]

def make_earnbin_query(all_ages=False):
    query = """
    SELECT
        CareerId AS career_id,
        """ + ("'All'" if all_ages else "AGE") + """ AS age_range,
        CASE
            """ + '\n\t'.join(bin_whens) + """
            ELSE 'bin_""" + str(MAX_BIN) + """_'
        END AS wage_bin,
        SUM(Weight) as weight
    FROM pums_wages pw
    WHERE
        Wages > 0
    GROUP BY CareerId, """ + ('' if all_ages else "AGE, ") + """wage_bin
    """
    return query

db.execute("DROP TABLE IF EXISTS career_earnings_binned")
db.execute("""
CREATE TABLE career_earnings_binned (
    career_id TEXT,
    age_range TEXT,
    wage_bin TEXT,
    weight REAL,
    PRIMARY KEY(career_id, age_range, wage_bin)
)""")
db.execute("""
INSERT INTO career_earnings_binned
""" + make_earnbin_query(all_ages=True))
db.execute("""
INSERT INTO career_earnings_binned
""" + make_earnbin_query(all_ages=False))
db.commit()