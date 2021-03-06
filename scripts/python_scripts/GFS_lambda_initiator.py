# -*- coding: utf-8 -*-
"""
Created on Mon Apr  2 17:20:30 2018

@author: Michael Christensen
"""


import json
import boto3
import numpy as np
from GFS_forecast_info import get_gfs_forecast_info
import datetime
import time

lam = boto3.client('lambda')

def lambda_handler(event, context):
    """
    lambda_handler(event, context):

    This function invokes concurrent lambda functions to read, parse, and save
    10 m u/v wind velocity data from Global Forecast System (GFS)
    -----------------------------------------------------------------------
    Inputs:

    event: AWS Lambda uses this parameter to pass in event data to the handler. 
    This parameter is usually of the Python dict type. It can also be list, str, int, float, or NoneType type.
    
    context: AWS Lambda uses this parameter to provide runtime information to your handler. 
    This parameter is of the LambdaContext type.
    -----------------------------------------------------------------------
    Output: No output
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 02/06/2019
    """

    gfs_url = 'https://nomads.ncep.noaa.gov/dods/gfs_0p25'
    forecast_info = get_gfs_forecast_info(gfs_url)
        
    for forecast_indx, forecast_time in forecast_info['data']:
        # only utilize 2 forecast/day (00:00 UTC) for cost savings
        if forecast_time.hour % 6 == 0:
            # build payload for initiation of lambda function
            payload = {}
            payload['url'] = forecast_info['url']
            payload['forecast_time'] = datetime.datetime.strftime(forecast_time,'%Y%m%dT%H:%M')
            payload['forecast_indx'] = forecast_indx

            # InvocationType = RequestResponse # this is used for synchronous lambda calls
            try:
                response = lam.invoke(FunctionName='grab_gfs', 
                    InvocationType='Event', Payload=json.dumps(payload))
            except Exception as e:
                print(e)
                raise e

            print(response)
            time.sleep(0.1)
               

if __name__ == "__main__":
    lambda_handler('','')
