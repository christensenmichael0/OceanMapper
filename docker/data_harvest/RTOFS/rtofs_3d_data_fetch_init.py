import sys
sys.path.append("..")

import os
import json
import boto3
import numpy as np
import datetime
import time
import logging

from RTOFS_forecast_info import get_latest_RTOFS_forecast_time
from RTOFS_process_3d_fields import process_3d_fields
from build_model_times import assemble_model_timesteps
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

    This function kicks off a script to read, process, and save rtofs forecast data to s3
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 4/18/2019
    """

    logger.info('-- FETCHING RTOFS DATA --')

    # update the harvest status file
    status_update = update_process_status('rtofs', 'processing')

    rtofs_url = 'https://nomads.ncep.noaa.gov:9090/dods/rtofs'
    available_data = get_latest_RTOFS_forecast_time(rtofs_url, '3d')
    output_info = assemble_model_timesteps(available_data,'daily')

    levels = output_info['general']['levels']
    stop_level = 100
    levels_array=[(level_indx, level) for level_indx, level in enumerate(levels) 
        if level % 10 == 0 and level <= stop_level]

    for product_type in output_info['products'].keys():

        zipped_time_and_indx = np.array(tuple(zip(output_info['products'][product_type]['field_datetimes'], 
            output_info['products'][product_type]['forecast_indx'])))
            
        data_url = output_info['products'][product_type]['url']

        for forecast_time, model_field_indx in zipped_time_and_indx:
            # only utilize certain forecast times for efficiency
            if forecast_time.hour % 6 == 0:
                try:
                    process_3d_fields(data_url, forecast_time, model_field_indx, levels_array)
                except Exception as e:
                    logger.error('An error occured!! - {}'.format(e))
                    continue

    # set processing status back to ready
    status_update = update_process_status('rtofs', 'ready')

if __name__ == "__main__":
    main()