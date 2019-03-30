import sys
sys.path.append("..")

import os
import json
import boto3
import numpy as np
import datetime
import time
import logging

from GFS_forecast_info import get_gfs_forecast_info
from GFS_process_fields import process_fields
from harvest_utils.status_utility import update_process_status

# create logger
logger = logging.getLogger('data-harvest')
logger.setLevel(logging.INFO)

# create console handler
ch = logging.StreamHandler()
ch.setLevel(logging.INFO)
logger.addHandler(ch)

# create file handler
logfile_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),'data-harvest.log')
fh = logging.FileHandler("{0}".format(logfile_path))
fh.setLevel(logging.INFO)
logger.addHandler(fh)

# create formatter
formatter = logging.Formatter('%(asctime)s:%(levelname)s:%(message)s')

# add formatter to ch and fh
ch.setFormatter(formatter)
fh.setFormatter(formatter)

def main():
    """
    main():

    This function kicks off a script to read, process, and save gfs forecast data to s3
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 4/20/2019
    """

    logger.info('-- FETCHING GFS DATA --')

    # update the harvest status file
    status_update = update_process_status('gfs', 'processing')

    gfs_url = 'https://nomads.ncep.noaa.gov:9090/dods/gfs_0p25'
    forecast_info = get_gfs_forecast_info(gfs_url)
        
    for model_field_indx, forecast_time in forecast_info['data']:
        # only utilize certain forecast times for efficiency
        if forecast_time.hour % 6 == 0:

            data_url =  forecast_info['url']

            try:
                process_fields(data_url, forecast_time, model_field_indx)
            except Exception as e:
                logger.error('An error occured!! - {}'.format(e))
                continue

    # set processing status back to ready
    status_update = update_process_status('gfs', 'ready')

if __name__ == "__main__":
    main()
