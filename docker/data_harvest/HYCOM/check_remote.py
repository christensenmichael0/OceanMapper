import sys
sys.path.append("..")

import boto3
import datetime
import json
import re

from harvest_utils.remote_data_info import get_max_date
from harvest_utils.data_endpoints import hycom_catalog_root
from HYCOM.HYCOM_forecast_info import get_hycom_forecast_info

s3 = boto3.resource('s3')
AWS_BUCKET_NAME = 'oceanmapper-data-storage'

def is_data_fresh():
    '''
    Checks if the latest available forecast field in s3 bucket matches the 
    extent of the latest HYCOM forecast run.

    Returns True if the forecast extents match (i.e. the data is fresh)
    '''

    s3_max_date = get_max_date('HYCOM_DATA')

    # get the max of s3_dates and compare to max_remote_date
    hycom_catalog_url = '{}catalog.html'.format(hycom_catalog_root)
    forecast_info = get_hycom_forecast_info(hycom_catalog_url)
    max_datasource_date = max(forecast_info['forecast']['field_datetimes'])

    if s3_max_date != max_datasource_date:
        return False

    return True
    

if __name__ == "__main__":
    is_data_fresh()
