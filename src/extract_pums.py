import argparse
import csv
import io
import logging
import sys
import zipfile

PUMS_FIELDS = ['SERIALNO','SPORDER','PUMA','ST','ADJINC','PWGTP','AGEP','COW','INTP','NWAB','NWAV','NWLA','NWLK','OIP','SCHG','SCHL','SEMP','SEX','SSIP','SSP','WAGP','WKHP','WKL','WKW','WRK','ESR','FOD1P','FOD2P','INDP','NAICSP','OCCP','PERNP','PINCP','POWPUMA','POWSP','SOCP']

if __name__ == '__main__':
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)

    parser = argparse.ArgumentParser(description='Extract subset of PUMS columns from zipped files')
    parser.add_argument('--in-file', help='5-year PUMS zipped csv file; e.g. "data/raw/pums.csv.zip')
    parser.add_argument('--out-file', help='Output CSV file for PUMS subset')
    parser.add_argument('--test', help='Test mode: only extract 1000 lines from each file in the zip archive, then stop', action='store_true')
    args = parser.parse_args()

    logger.info('Extracting PUMS data from "%s" to "%s"', args.in_file, args.out_file)
    with open(args.out_file, 'w') as csvoutput:
        csvout = csv.DictWriter(csvoutput, PUMS_FIELDS)
        with zipfile.ZipFile(args.in_file, 'r') as zf:
            filenames = filter(lambda a: a.filename[-3:] == 'csv', zf.infolist())
            logger.info('Found files to extract: %s', filenames)
            for item in filenames:
                logger.info('Extracting "%s"...', item.filename)
                f = io.TextIOWrapper(zf.open(item, 'r'), encoding='utf8')
                csvin = csv.DictReader(f)
                line = 0
                for row in csvin:
                    csvout.writerow({h: row[h] for h in PUMS_FIELDS})
                    line += 1
                    if args.test and line == TEST_LINES:
                        logger.info("Exiting early due to --test mode.")
                        sys.exit(0)
                f.close()
    logger.info('Done!')