# -*- coding: utf-8 -*-
"""
Created on Mon Apr  2 17:20:30 2018

@author: Michael Christensen
"""


import json
import boto3
import numpy as np
from HYCOM_forecast_info import get_hycom_forecast_info
import datetime
import time

lam = boto3.client('lambda')

def lambda_handler(event, context):
    """
    lambda_handler(event, context):

    This function invokes concurrent lambda functions to read, parse, and save
    3d HYCOM ocean current data
    -----------------------------------------------------------------------
    Inputs:

    event: AWS Lambda uses this parameter to pass in event data to the handler. 
    This parameter is usually of the Python dict type. It can also be list, str, int, float, or NoneType type.
    
    context: AWS Lambda uses this parameter to provide runtime information to your handler. 
    This parameter is of the LambdaContext type.
    -----------------------------------------------------------------------
    Output: No output
    -----------------------------------------------------------------------
    Notes: Check here for hycom version updates: http://tds.hycom.org/thredds/catalog/datasets/catalog.html
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 06/24/2018
    """

    hycom_url = 'http://tds.hycom.org/thredds/catalog/datasets/GLBu0.08/expt_91.2/forecasts/catalog.html'
    forecast_info = get_hycom_forecast_info(hycom_url)
    
    zipped_time_and_indx = np.array(tuple(zip(forecast_info['forecast']['field_datetimes'], 
            forecast_info['forecast']['data_urls'])))  
        
    for forecast_time, data_url in zipped_time_and_indx:
        # only utilize 1 forecast/day (00:00 UTC) for cost savings 
        if forecast_time.hour == 0:
            # only grab the upper 250m
            levels = forecast_info['levels']
            stop_depth_indx = levels.index(250) + 1
            for level_indx, level_depth in enumerate(levels[:stop_depth_indx]):
                # build payload for initiation of lambda function
                payload = {}
                payload['url'] = data_url
                payload['forecast_time'] = datetime.datetime.strftime(forecast_time,'%Y%m%dT%H:%M')
                payload['level'] = {'level_depth': level_depth, 'level_indx': level_indx}

                # InvocationType = RequestResponse # this is used for synchronous lambda calls
                try:
                    response = lam.invoke(FunctionName='grab_hycom_3d', 
                        InvocationType='Event', Payload=json.dumps(payload))
                except Exception as e:
                    print(e)
                    raise e

                print(response)
                time.sleep(0.1)
	           

if __name__ == "__main__":
	lambda_handler('','')
