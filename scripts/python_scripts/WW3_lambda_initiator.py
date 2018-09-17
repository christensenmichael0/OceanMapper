# -*- coding: utf-8 -*-
"""
Created on Mon Apr  2 17:20:30 2018

@author: Michael Christensen
"""


import json
import boto3
import numpy as np
from WW3_forecast_info import get_ww3_forecast_info
import datetime
import time

lam = boto3.client('lambda')

def lambda_handler(event, context):
    """
    lambda_handler(event, context):

    This function invokes concurrent lambda functions to read, parse, and save
    Wave Watch 3 data- Combined NCEP/FNMOC Wave Ensembles Mean and Spread
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
    Date Modified: 07/07/2018
    """

    ww3_url = 'http://nomads.ncep.noaa.gov:9090/dods/wave/nww3'
    forecast_info = get_ww3_forecast_info(ww3_url)
        
    for forecast_indx, forecast_time in forecast_info['data']:
        # only utilize 1 forecast/day (00:00 UTC) for cost savings 
        if forecast_time.hour == 0:
            # build payload for initiation of lambda function
            payload = {}
            payload['url'] = forecast_info['url']
            payload['forecast_time'] = datetime.datetime.strftime(forecast_time,'%Y%m%dT%H:%M')
            payload['forecast_indx'] = forecast_indx

            # InvocationType = RequestResponse # this is used for synchronous lambda calls
            try:
                response = lam.invoke(FunctionName='grab_ww3', 
                    InvocationType='Event', Payload=json.dumps(payload))
            except Exception as e:
                print(e)
                raise e

            print(response)
            time.sleep(0.1)
               

if __name__ == "__main__":
    lambda_handler('','')
