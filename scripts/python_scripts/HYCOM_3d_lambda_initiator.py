# -*- coding: utf-8 -*-
"""
Created on Mon Apr  2 17:20:30 2018

@author: Michael Christensen
"""

import datetime
import json
import time
import boto3
from HYCOM_forecast_info import get_hycom_forecast_info

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
    Date Modified: 10/17/2022
    """

    hycom_url = 'https://tds.hycom.org/thredds/catalog/GLBy0.08/expt_93.0/FMRC/runs/catalog.html'
    forecast_info = get_hycom_forecast_info(hycom_url)

    field_datetimes = forecast_info['forecast']['field_datetimes']
    data_url = forecast_info['forecast']['data_url']
    levels = forecast_info['forecast']['levels']

    for forecast_time_indx, forecast_time in enumerate(field_datetimes):
        # only use a subset of the available forecast fields for cost savings
        if forecast_time.hour % 6 == 0:
            # only grab the upper 100m
            stop_depth_indx = levels.index(100)  # use a depth of 100 as the stop indx
            for level_indx, level_depth in enumerate(levels[:stop_depth_indx]):
                # only utilize depths at intervals of 10
                if level_depth % 10 == 0:
                    # build payload for initiation of lambda function
                    payload = {
                        'url': data_url,
                        'forecast_time': datetime.datetime.strftime(forecast_time, '%Y%m%dT%H:%M'),
                        'forecast_time_indx': forecast_time_indx,
                        'level': {'level_depth': level_depth, 'level_indx': level_indx}
                    }

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
    lambda_handler('', '')
