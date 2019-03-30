import sys
sys.path.append("..")

import boto3
import datetime
import json
import re

from harvest_utils.remote_data_info import get_max_date
from RTOFS.RTOFS_forecast_info import get_latest_RTOFS_forecast_time
from RTOFS.build_model_times import assemble_model_timesteps

s3 = boto3.resource('s3')
AWS_BUCKET_NAME = 'oceanmapper-data-storage'

def is_data_fresh():
    '''
    Checks if the latest available forecast field in s3 bucket matches the 
    extent of the latest RTOFS forecast run.

    Returns True if the forecast extents match (i.e. the data is fresh)
    '''
    
    s3_max_date = get_max_date('RTOFS_DATA')

    # get the max of s3_dates and compare to max_remote_date
    rtofs_url = 'https://nomads.ncep.noaa.gov:9090/dods/rtofs'
    available_data = get_latest_RTOFS_forecast_time(rtofs_url, '3d')
    output_info = assemble_model_timesteps(available_data,'daily')
    max_datasource_date = max(output_info['products']['forecast']['field_datetimes'])

    if s3_max_date != max_datasource_date:
        return False

    return True
    

if __name__ == "__main__":
    is_data_fresh()
