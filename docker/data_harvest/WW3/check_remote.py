import sys
sys.path.append("..")

import boto3
import datetime
import json
import re

from harvest_utils.remote_data_info import get_max_date
from WW3.WW3_forecast_info import get_ww3_forecast_info

s3 = boto3.resource('s3')
AWS_BUCKET_NAME = 'oceanmapper-data-storage'

def is_data_fresh():
    '''
    Checks if the latest available forecast field in s3 bucket matches the 
    extent of the latest WW3 forecast run.

    Returns True if the forecast extents match (i.e. the data is fresh)
    '''

    s3_max_date = get_max_date('WW3_DATA')

    # get the max of s3_dates and compare to max_remote_date
    ww3_url = 'https://nomads.ncep.noaa.gov:9090/dods/wave/nww3'
    forecast_info = get_ww3_forecast_info(ww3_url)
    max_datasource_date = forecast_info['data'][-1][1]

    if s3_max_date != max_datasource_date:
        return False

    return True
    

if __name__ == "__main__":
    is_data_fresh()
