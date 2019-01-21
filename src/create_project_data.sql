
-- CREATE calculated wages table and populate it
DROP TABLE IF EXISTS wagp_calc;
CREATE TABLE wagp_calc AS 
        SELECT SERIALNO, 
            SPORDER, 
            WAGP, 
            CASE WKW 
                WHEN 1 THEN 
                    WAGP 
                WHEN 2 THEN  
                    (wagp / 48.5) * 52 
                WHEN 3 THEN 
                    (wagp / 43.5) * 52 
                WHEN 4 THEN 
                    (wagp / 33.0) * 52 
                WHEN 5 THEN 
                    (wagp / 20.0) * 52 
                WHEN 6 THEN 
                    (wagp / 7.0) * 52 
                ELSE 
                    0 
            END wagp_calc 
        FROM PUMS_DATA  
        WHERE FOD1P != "" and SOCP != "" and WKL = 1 and WKHP >= 30;

-- CREATE pums_wages table to use for the application
DROP TABLE IF EXISTS pums_wages;
CREATE TABLE pums_wages AS 
        SELECT pd.FOD1P as 'MajorId', 
            pd.SOCP as 'CareerId', 
            pd.ST as 'StateId', 
			CASE 
				WHEN pd.AGEP < 35 THEN '25-34'
				WHEN pd.AGEP < 45 THEN '35-44'
				WHEN pd.AGEP < 55 THEN '45-54'
				WHEN pd.AGEP < 65 THEN '55-64'
				ELSE '65+'
			END as 'AGE',			
			pd.AGEP as 'Age',
            pd.PWGTP as 'Weight', 
            wc.WAGP_CALC as 'Wages' 
        FROM pums_data pd 
        JOIN wagp_calc wc 
            ON pd.SERIALNO = wc.SERIALNO 
            AND pd.SPORDER = wc.SPORDER 
        WHERE 
        	pd.AGEP >= 25
        	AND FOD1P != '' 
            AND SOCP != '' 
            AND WKL = 1 
            AND WKHP >= 30;
			
-- Drop unnecessary tables
DROP TABLE wagp_calc;

-- Create major, career proportion tables
DROP TABLE IF EXISTS mc_weights;
CREATE TABLE mc_weights
AS 
SELECT 
	majorid, careerid, SUM(weight) AS "weight" 
FROM pums_wages 
GROUP BY majorid, careerid;

DROP TABLE IF EXISTS m_weight;
CREATE TABLE m_weight
AS 
SELECT 
	majorid, SUM(weight) as "weight"
FROM mc_weights
GROUP BY majorid;

DROP TABLE IF EXISTS major_weights;
CREATE TABLE major_weights AS 
SELECT 
	mc.majorid as "major_id",
	mc.careerid as "career_id",
    mc.weight,
	(mc.weight / M.weight) as "proportion" 
FROM mc_weights mc 
JOIN m_weight m ON mc.majorid = M.majorid
;

DROP TABLE mc_weights;
DROP TABLE m_weight;

-- Create career, major proportion tables
DROP TABLE IF EXISTS cm_weights;
CREATE TABLE cm_weights
AS
SELECT
	careerid, majorid, SUM(weight) AS "weight"
FROM pums_wages 
GROUP BY careerid, majorid
;

DROP TABLE IF EXISTS c_weight;
CREATE TABLE c_weight
AS
SELECT
	careerid, SUM(weight) as "weight"
FROM cm_weights 
GROUP BY careerid
;

DROP TABLE IF EXISTS career_weights;
CREATE TABLE career_weights
AS
SELECT
	cm.majorid as "major_id",
	cm.careerid as "career_id", 
	cm.weight / c.weight as "proportion",
	cm.weight as "weight"
FROM cm_weights cm 
JOIN c_weight c ON cm.careerid = c.careerid
;

CREATE INDEX careeridx ON career_weights (career_id);
CREATE INDEX majoridx ON career_weights (major_id);

DROP TABLE cm_weights;
DROP TABLE c_weight;
DROP TABLE pums_data;
-- Eliminate free space still in the database
VACUUM;