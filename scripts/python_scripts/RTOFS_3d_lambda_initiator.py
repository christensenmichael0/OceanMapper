# -*- coding: utf-8 -*-
"""
Created on Mon Apr  2 17:20:30 2018

@author: Michael Christensen
"""


import json
import boto3
import numpy as np
from RTOFS_forecast_info import get_latest_RTOFS_forecast_time
from build_model_times import assemble_model_timesteps
import datetime
import time

lam = boto3.client('lambda')

def lambda_handler(event, context):
    """
    lambda_handler(event, context):

    This function invokes concurrent lambda functions to read, parse, and save
    daily (24 hour) RTOFS ocean current data for the water column at specific levitus depths
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

    rtofs_url = 'https://nomads.ncep.noaa.gov/dods/rtofs'
    available_data = get_latest_RTOFS_forecast_time(rtofs_url, '3d')
    output_info = assemble_model_timesteps(available_data,'daily')
    
    for product_type in output_info['products'].keys():

        zipped_time_and_indx = np.array(tuple(zip(output_info['products'][product_type]['field_datetimes'], 
            output_info['products'][product_type]['forecast_indx'])))
        
        for model_field in zipped_time_and_indx:
            model_field_indx = model_field[1]

            # only grab the upper 10m
            levels = output_info['general']['levels']
            stop_depth_indx = levels.index(100) + 1
            for level_indx, level_depth in enumerate(levels[:stop_depth_indx]):
                # build payload for initiation of lambda function
                payload = {}
                payload['url'] = output_info['products'][product_type]['url']
                payload['forecast_time'] = datetime.datetime.strftime(model_field[0],'%Y%m%dT%H:%M')
                payload['forecast_indx'] = model_field_indx
                payload['level'] = {'level_depth': level_depth, 'level_indx': level_indx}

                # InvocationType = RequestResponse # this is used for synchronous lambda calls
                try:
                    response = lam.invoke(FunctionName='grab_rtofs_3d', 
                        InvocationType='Event', Payload=json.dumps(payload))
                except Exception as e:
                    print(e)
                    raise e

                print(response)
                time.sleep(0.1)
	           

if __name__ == "__main__":
	lambda_handler('','')
