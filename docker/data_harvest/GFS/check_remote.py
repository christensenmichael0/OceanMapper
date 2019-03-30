import sys
sys.path.append("..")

import boto3
import datetime
import json
import re

from harvest_utils.remote_data_info import get_max_date
from GFS.GFS_forecast_info import get_gfs_forecast_info

s3 = boto3.resource('s3')
AWS_BUCKET_NAME = 'oceanmapper-data-storage'

def is_data_fresh():
    '''
    Checks if the latest available forecast field in s3 bucket matches the 
    extent of the latest GFS forecast run.

    Returns True if the forecast extents match (i.e. the data is fresh)
    '''

    s3_max_date = get_max_date('GFS_DATA')

    # get the max of s3_dates and compare to max_remote_date
    gfs_url = 'https://nomads.ncep.noaa.gov:9090/dods/gfs_0p25'
    forecast_info = get_gfs_forecast_info(gfs_url)
    max_datasource_date = forecast_info['data'][-1][1]

    if s3_max_date != max_datasource_date:
        return False

    return True
    

if __name__ == "__main__":
    is_data_fresh()
