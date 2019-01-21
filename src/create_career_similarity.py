import argparse
import sqlite3

import pandas as pd
import numpy as np
from scipy.spatial.distance import cosine as cos_dist

if __name__ == '__main__':

    output_table = 'careers_similarity'
    db_file = 'data/processed/pums_complete.db'

    cn  = sqlite3.connect(db_file)

    df = pd.read_sql(
        sql="""
            SELECT
                major_id,
                career_id,
                weight
            FROM major_weights
            WHERE
                major_id != "" AND
                career_id != ""
        """,
        con=cn
    )

    career_code_to_idx = {c.rstrip(): i for i, c in enumerate(df.career_id.unique())}
    career_idx_code = {v: k for k, v in career_code_to_idx.items()}
    major_code_idx = {m: i for i, m in enumerate(df.major_id.unique())}
    n_careers = len(career_code_to_idx)
    n_majors = len(major_code_idx)
    career_major_matrix = np.zeros(
        shape=(n_careers, n_majors),
        dtype=np.float64
    )
    for c, m, w in zip(df.career_id.values, df.major_id.values, df.weight.values):
        c = c.rstrip()
        career_major_matrix[ career_code_to_idx[c], major_code_idx[m] ] = w

    careers_distance = np.zeros((n_careers, n_careers))
    for i in range(0, n_careers):
        for j in range(0, n_careers):
            if i != j:
                m1 = career_major_matrix[i,:]
                m2 = career_major_matrix[j,:]
                careers_distance[i,j] = cos_dist(m1/np.linalg.norm(m1), m2/np.linalg.norm(m2))
            else:
                careers_distance[i,j] = 1.0

    careers_final_df = pd.DataFrame(
        [(career_idx_code[i], career_idx_code[j], careers_distance[i,j])\
         for i in range(n_careers) for j in range(n_careers)],
        columns = ['career1', 'career2', 'distance']
    )

    careers_final_df.to_sql(name=output_table, con=cn, if_exists='replace')
    cn.execute('CREATE INDEX c1 ON %s (career1)' % output_table)
    cn.execute('CREATE INDEX c2 ON %s (career2)' % output_table)
