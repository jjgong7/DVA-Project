import os
import sqlite3

import numpy as np
import pandas as pd

from flask import Flask, g, jsonify, render_template, request

application = Flask(__name__)

# configure app
application.config.update(dict(
    DATABASE=os.path.join(application.root_path, '.', 'data', 'processed', 'pums_complete.db')
))
application._static_folder = 'static'

coli = pd.read_csv(os.path.join(application.root_path,'.','data','raw','coli.csv'))

def get_db():
    """
    From the Flask tutorial (http://flask.pocoo.org/docs/0.12/tutorial/dbcon/)
    Opens a new database connection if there is none yet for the
    current application context.
    """
    if not hasattr(g, 'sqlite_conn'):
        g.sqlite_conn = sqlite3.connect(application.config['DATABASE'])
        g.sqlite_conn.row_factory = sqlite3.Row
    return g.sqlite_conn

@application.route('/')
def index():
    """
    This function handles the home page of the site.
    """
    return render_template('index.html')

@application.route('/majors')
def majors():
    cn = get_db()
    query = """
        SELECT fod1p as id, fod1p_desc as name
        FROM fod1p_map
    """
    results = cn.execute(query).fetchall()
    return jsonify([{
        'id': r['id'],
        'text': r['name']
    } for r in results])

@application.route('/careers')
def careers():
    cn = get_db()
    query = """
        SELECT socp as id, socp_desc as name
        FROM socp_map
    """
    results = cn.execute(query).fetchall()
    return jsonify([{
        'id': r['id'],
        'text': r['name']
    } for r in results])

@application.route('/sankey')
def sankey():
    cn = get_db()
    majors = request.args.getlist('m', None)
    careers = request.args.getlist('c', None)
    if majors and not careers:
        results = get_majors_sankey(cn, majors)
    elif careers and not majors:
        results = get_careers_sankey(cn, careers)
    elif careers and majors:
        results = get_combo_sankey_data(cn, majors, careers)
    else:
        raise Exception('uhoh')

    return jsonify([{
        'major_id': r['major_id'],
        'major': r['major'],
        'career_id': r['career_id'],
        'career': r['career'],
        'weight': r['weight']
    } for r in results])

@application.route('/career_earnings')
def career_earnings():
    cn = get_db()
    careers = request.args.getlist('c', None)
    # only ONE age-range supported.
    age_range = request.args.get('age_range', 'All')

    career_params = ','.join(['?']*len(careers))
    query = """
        SELECT fm.SOCP_DESC as career, pw.Wages as wages, pw.AGE as age
        FROM pums_wages pw
        JOIN socp_map fm
        ON pw.CareerId = fm.SOCP
        WHERE
            pw.Wages > 0 AND 
            pw.CareerId IN ("""+career_params+""")
    """
    if age_range != 'All':
        # The database has no rows for "All", so we remove the whole
        # SQL clause if age is not specified.
        query += "\tAND pw.AGE = ?"
        results = cn.execute(query, careers +[age_range]).fetchall()
    else:
        results = cn.execute(query, careers).fetchall()

    return jsonify([{
        'Career': r['career'],
        'Wage': r['wages'],
        'Age': r['age']
    } for r in results])
    #TODO: Pull earnings for the career histogram (and line chart??)

@application.route('/binned_earnings')
def binned_earnings():
    occs = request.args.getlist('c')
    mean_wage = get_db().execute("""
        SELECT SUM(Weight*Wages)/SUM(Weight)
        FROM pums_wages
        WHERE
            CareerId IN(""" + ','.join(['?']*len(occs)) + """)
            AND Wages > 0
        """,occs).fetchone()[0]
    query = """
        SELECT age_range, wage_bin, SUM(weight) AS weight
        FROM career_earnings_binned
        WHERE career_id IN(""" + ','.join(['?']*len(occs)) + """)
        GROUP BY age_range, wage_bin
    """
    results = get_db().execute(query, occs).fetchall()
    return jsonify({
        "mean": mean_wage,
        "bin_width": 10000,
        "bins": [{
            'age': r['age_range'],
            'x': int(r['wage_bin'][4:].split('_')[0]),
            'y': r['weight']
        } for r in results]
    })

@application.route('/similar_majors')
def similar_majors():
    """
    Get majors most similar to a list of one or more given majors.
    """
    majors = request.args.getlist('m')
    limit = request.args.get('limit', 10)

    cn = get_db()
    params = ','.join('?'*len(majors))
    query = """
        SELECT ms.major2 as major_id, mm.fod1p_desc as major, AVG(distance) as distance
        FROM majors_similarity ms 
        JOIN fod1p_map mm ON(mm.fod1p = ms.major2)
        WHERE ms.major1 IN(%s)
            and ms.major2 NOT IN(%s)
        GROUP BY ms.major2
        ORDER BY distance LIMIT ?
    """ % (params, params)

    results = cn.execute(query, [*majors, *majors, limit])
    
    return jsonify([{
        'major_id': r['major_id'],
        'major': r['major'],
        'distance': round(r['distance'], 4)
    } for r in results])

@application.route('/similar_careers')
def similar_careers():
    """
    Get careers most similar to a list of one or more given careers.
    """
    careers = request.args.getlist('c')
    limit = request.args.get('limit', 10)

    cn = get_db()
    params = ','.join('?'*len(careers))
    query = """
        SELECT cs.career2 as career_id, cm.SOCP_DESC as career, AVG(distance) as distance
        FROM careers_similarity cs 
        JOIN socp_map cm ON(cm.SOCP = cs.career2)
        WHERE cs.career1 IN(%s)
            and cs.career2 NOT IN(%s)
        GROUP BY cs.career2
        ORDER BY distance LIMIT ?
    """ % (params, params)

    results = cn.execute(query, [*careers, *careers, limit])
    
    return jsonify([{
        'career_id': r['career_id'],
        'career': r['career'],
        'distance': round(r['distance'], 4)
    } for r in results])

@application.route('/state_coli_earn')
def state_coli_earn():
    career_ids = request.args.getlist('c')
    if len(career_ids) == 0:
        raise Exception("provide some career ids")
    state_data = get_coli_adjusted_state_median_earnings(get_db(), career_ids, coli)
    projections = get_state_projections(get_db(), career_ids)
    state_data = pd.merge(state_data, projections, on='state_id', how='left')
    return jsonify([{
        'state_id': int(r['state_id']),
        'state': r['State'],
        'median_earnings': None if np.isnan(r['median_earnings']) else r['median_earnings'],
        'median_adjusted': None if np.isnan(r['median_adjusted']) else r['median_adjusted'],
        'weight': r['weight'],
        'sample_size': r['sample_size'],
        'projection' : None if np.isnan(r['projection']) else r['projection']
    } for i, r in state_data.iterrows()])

@application.teardown_appcontext
def close_db(error):
    """
    From the Flask tutorial (http://flask.pocoo.org/docs/0.12/tutorial/dbcon/)
    Closes the database again at the end of the request.
    """
    if hasattr(g, 'sqlite_conn'):
        g.sqlite_conn.close()

def get_majors_sankey(cn, majors):
    """
    Filter by majors, get top N careers, and then group
    the remaining careers together into "other".
    """
    params = ','.join('?'*len(majors))
    query = """
    SELECT 
        major_id, fod1p_desc AS major, 
        career_id2 as career_id, 
        CASE WHEN socp_desc IS NULL 
            THEN '(Other Careers)' 
        ELSE socp_desc END as career, 
        weight
    FROM (
        SELECT
            major_id,
            CASE
                WHEN career_id IN(
                    SELECT career_id
                    FROM major_weights
                    WHERE major_id IN("""+params+""")
                    GROUP BY career_id
                    ORDER BY SUM(weight) DESC LIMIT 25
                )
                THEN career_id
                ELSE 'xc'
            END AS career_id2,
            SUM(weight) as weight
        FROM major_weights 
        WHERE major_id IN("""+params+""")
        GROUP BY major_id, career_id2
        ORDER BY CASE
            WHEN career_id2 = 'xc' THEN 0
            ELSE weight
        END DESC
    ) w
    LEFT JOIN fod1p_map m ON(m.fod1p = w.major_id)
    LEFT JOIN socp_map s ON(s.socp = w.career_id2);
    """
    return cn.execute(query, [*majors, *majors]).fetchall()

def get_careers_sankey(cn, careers):
    """
    Filter by careers, get top N majors, then group
    other majors together into 'Other'.
    """
    params = ','.join('?'*len(careers))
    query = """
    SELECT 
        major_id2 as major_id,
        CASE WHEN fod1p_desc IS NULL 
            THEN '(Other Majors)' 
        ELSE fod1p_desc END as major, 
        career_id, 
        socp_desc as career,
        weight
    FROM (
        SELECT
            career_id,
            CASE
                WHEN major_id IN(
                    SELECT major_id
                    FROM major_weights
                    WHERE career_id IN("""+params+""")
                    GROUP BY major_id
                    ORDER BY SUM(weight) DESC LIMIT 25
                )
                THEN major_id
                ELSE 'xm'
            END AS major_id2,
            SUM(weight) as weight
        FROM major_weights 
        WHERE career_id IN("""+params+""")
        GROUP BY major_id2, career_id
        ORDER BY CASE
            WHEN major_id2 = 'xm' THEN 0
            ELSE weight
        END DESC
    ) w
    LEFT JOIN fod1p_map m ON(m.fod1p = w.major_id2)
    LEFT JOIN socp_map s ON(s.socp = w.career_id)
    """
    return cn.execute(query, [*careers, *careers]).fetchall()

def get_combo_sankey_data(conn, majors, careers):
    """
    Filter by given list of major OR career, and create two 'Other'
    groups using rows that do not have BOTH.
    """
    mparams = ','.join('?'*len(majors))
    cparams = ','.join('?'*len(careers))
    mselect = """
        CASE
            WHEN
                major_id NOT IN ("""+mparams+""") AND
                career_id IN ("""+cparams+""")
            THEN 'xm'
            ELSE major_id
        END"""
    cselect = """CASE
            WHEN
                major_id IN ("""+mparams+""") AND
                career_id NOT IN ("""+cparams+""")
            THEN 'xc'
            ELSE career_id
        END"""

    query = """
    SELECT 
        major_id2 AS major_id,
        CASE WHEN m.fod1p_desc IS NULL THEN '(Other Majors)'
        ELSE m.fod1p_desc END AS major,
        career_id2 AS career_id,
        CASE WHEN s.socp_desc IS NULL THEN '(Other Careers)'
        ELSE s.socp_desc END AS career,
        weight
    FROM (
    SELECT
        """+mselect+""" AS major_id2,
        """+cselect+""" AS career_id2,
        SUM(weight) as weight
    FROM career_weights AS w
    WHERE
        major_id IN("""+mparams+""") OR
        career_id IN("""+cparams+""")
    GROUP BY
        """+mselect+""",
        """+cselect+"""
    ORDER BY weight DESC
    ) x
    LEFT JOIN fod1p_map m ON(m.fod1p = x.major_id2)
    LEFT JOIN socp_map s ON(s.socp = x.career_id2)
    """
    subs = [*majors, *careers]*5
    return conn.execute(query, subs).fetchall()

def get_single_state_median(occ_st_df):
    median = np.nan
    sample_size = occ_st_df.shape[0]
    total_weight = 0 if sample_size==0 else occ_st_df.weight.sum()
    if sample_size >= 15:    
        # sort wages ascending
        tmp = occ_st_df.sort_values(by='wages')
        # because samples are weighted, the median isn't the value
        # at the halfway index of the sorted array; it's the value(s) 
        # where the cumulative sum of weights is equal to 50% of 
        # the total weight.
        weighted_wages = tmp[['weight', 'wages']].values
        pctile = weighted_wages[:,0].cumsum()/total_weight
        for a,b in zip(range(0, len(pctile)-1), range(1, len(pctile[1:]))):
            if pctile[a] <= .50 <= pctile[b]:
                median = (weighted_wages[a,1] + weighted_wages[b,1])/2
                break
    else:
        # sample size too small, leave median == NaN
        pass
    
    return pd.DataFrame([{
        'state_id': int(occ_st_df.iloc[0].state_id),
        'median_earnings': median,
        'weight': total_weight,
        'sample_size': sample_size
    }])

def get_all_state_medians(db, occs):
    query = """
    SELECT StateId AS state_id, Weight AS weight, Wages AS wages
    FROM pums_wages
    WHERE
        CareerId IN(""" + ','.join(['?']*len(occs)) + """)
        AND Wages > 0
    """
    records = pd.read_sql(query, con=db, params=occs)
    records['state_id'] = records['state_id'].astype(int)
    state_medians = records.groupby(['state_id'], as_index=False).apply(get_single_state_median).reset_index(drop=True)
    return state_medians
    
def adjust_by_coli(state_earn_df, coli_df):
    final_df = state_earn_df.merge(coli_df[['id','State','Index']], left_on='state_id', right_on='id')
    final_df['median_adjusted'] = final_df['median_earnings'] * 100.0/final_df['Index']
    return final_df[['state_id', 'State', 'median_earnings', 'median_adjusted', 'weight', 'sample_size']]
   
def get_coli_adjusted_state_median_earnings(cn, occs, coli_df):
    tmp = get_all_state_medians(cn, occs)
    return adjust_by_coli(tmp, coli_df)

def get_state_projections(db, occs):
    query = """
    SELECT ST as state_id, ((CAST(SUM(PROJ_NUM) AS FLOAT) - CAST(SUM(BASE_NUM) AS FLOAT))/CAST(SUM(BASE_NUM) AS FLOAT)) as projection 
    FROM projections 
    WHERE SOCP IN(""" + ','.join(['?']*len(occs)) + """) 
    GROUP BY ST;
    """
    records = pd.read_sql(query, con=db, params=occs)
    return records
