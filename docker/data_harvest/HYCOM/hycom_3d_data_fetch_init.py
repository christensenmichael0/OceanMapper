import sys
sys.path.append("..")

import os
import json
import boto3
import numpy as np
import datetime
import time
import logging

from HYCOM_forecast_info import get_hycom_forecast_info
from HYCOM_process_3d_fields import process_3d_fields
from harvest_utils.data_endpoints import hycom_catalog_root
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

    This function kicks off a script to read, process, and save hycom forecast data to s3
    -----------------------------------------------------------------------
    Notes: Check here for hycom version updates: http://tds.hycom.org/thredds/catalog/datasets/catalog.html
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 4/13/2019
    """

    logger.info('-- FETCHING HYCOM DATA --')

    # update the harvest status file
    status_update = update_process_status('hycom', 'processing')
    
    hycom_catalog_url = '{}catalog.html'.format(hycom_catalog_root)
    forecast_info = get_hycom_forecast_info(hycom_catalog_url)
    
    zipped_time_and_indx = np.array(tuple(zip(forecast_info['forecast']['field_datetimes'], 
            forecast_info['forecast']['data_urls'])))

    # generate an array of tuples  [(level indx, level)...]
    levels = forecast_info['levels']
    stop_level = 100
    levels_array=[(level_indx, level) for level_indx, level in enumerate(levels) 
        if level % 10 == 0 and level <= stop_level]

    for forecast_time, data_url in zipped_time_and_indx:
        # only utilize certain forecast times for efficiency 
        if forecast_time.hour % 6 == 0:
            try:
                process_3d_fields(data_url, forecast_time, levels_array)
            except Exception as e:
                logger.error('An error occured!! - {}'.format(e))
                continue

    # set processing status back to ready
    status_update = update_process_status('hycom', 'ready')


if __name__ == "__main__":
	main()
