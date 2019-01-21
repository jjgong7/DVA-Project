import argparse
import sqlite3

import pandas as pd
import numpy as np
from scipy.spatial.distance import cosine as cos_dist

if __name__ == '__main__':

    output_table = 'majors_similarity'
    db_file = 'data/processed/pums_complete.db'

    cn  = sqlite3.connect(db_file)

    df = pd.read_sql(
        sql="""
            SELECT
                major_id,
                career_id,
                weight
            FROM career_weights
            WHERE
                major_id != "" AND
                career_id != ""
        """,
        con=cn
    )

    major_code_to_idx = {m: i for i, m in enumerate(df.major_id.unique())}
    major_idx_code = {v: k for k, v in major_code_to_idx.items()}
    career_code_idx = {c: i for i, c in enumerate(df.career_id.unique())}
    n_majors = len(major_code_to_idx)
    n_careers = len(career_code_idx)

    major_career_matrix = np.zeros(
        shape=(n_majors, n_careers),
        dtype=np.float64
    )
    for m, c, w in zip(df.major_id.values, df.career_id.values, df.weight.values):
        major_career_matrix[ major_code_to_idx[m], career_code_idx[c] ] = w

    majors_distance = np.zeros((n_majors, n_majors))
    for i in range(0, n_majors):
        for j in range(0, n_majors):
            if i != j:
                m1 = major_career_matrix[i,:]
                m2 = major_career_matrix[j,:]
                majors_distance[i,j] = cos_dist(m1/np.linalg.norm(m1), m2/np.linalg.norm(m2))
            else:
                majors_distance[i,j] = 1.0

    majors_final_df = pd.DataFrame(
        [(major_idx_code[i], major_idx_code[j], majors_distance[i,j])\
         for i in range(n_majors) for j in range(n_majors)],
        columns = ['major1', 'major2', 'distance']
    )

    majors_final_df.to_sql(name=output_table, con=cn, if_exists='replace')
    cn.execute('CREATE INDEX m1 ON %s (major1)' % output_table)
    cn.execute('CREATE INDEX m2 ON %s (major2)' % output_table)
