import boto3
import datetime
import numpy as np
import json
import re

from utils.s3_filepath_utils import build_file_path, build_date_path
from utils.datasets import datasets
from api_utils.response_constructor import generate_response
from api_utils.check_query_params import check_query_params, filter_failed_params
from api_utils.fetch_data_availability import grab_data_availability
from api_utils.nearest_model_time import get_available_model_times
from api_utils.get_model_init import get_model_init

s3 = boto3.client('s3')
bucket = 'oceanmapper-data-storage'

def lambda_handler(event, context):
    """
    lambda_handler(event, context):

    This function is used in conjunction with aws api gateway (lambda proxy integration)
    to pass json data representing a specific model field (closest to the requested time looking
    backwards). If no data is available within 24 hours of the request time then empty data is returned.
    -----------------------------------------------------------------------
    Inputs:

    event: Event data (queryStringParameters) are parsed from call to aws api endpoint
    
    context: AWS Lambda uses this parameter to provide runtime information to your handler. 
    This parameter is of the LambdaContext type.
    -----------------------------------------------------------------------
    Output: response object
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 10/21/2022
    """

    required_query_params = ['time','dataset','sub_resource','level']

    # default headers for request
    headers = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

    # load data availability file from s3
    availability_struct = grab_data_availability()
    if not availability_struct:
        response_body = {
            'status': 'Failed to load data availability structure.',
        }
        return generate_response(404, headers, response_body)

    query_param_validation = check_query_params(event,required_query_params, availability_struct, datasets)

    # make sure we have all required and valid inputs
    failed_query_param_obj = filter_failed_params(query_param_validation)

    if len(failed_query_param_obj.keys()):
        response_body = {
            'status': failed_query_param_obj,
        }
        return generate_response(404, headers, response_body)

    # model time
    model_time = event['queryStringParameters']['time']
    model_time_datetime = datetime.datetime.strptime(model_time,'%Y-%m-%dT%H:%MZ')

    # dataset (model)
    dataset = event['queryStringParameters']['dataset']

    # sub resource
    sub_resource = event['queryStringParameters']['sub_resource']

    # model level
    level = event['queryStringParameters']['level']
    level_formatted = str(level) + 'm' if len(str(level)) else '' # wave data have no level
            
    sub_resource_folder = datasets[dataset]['sub_resource'][sub_resource]
    dataset_prefix = sub_resource_folder['data_prefix']
    dataset_type = sub_resource_folder['data_type']
    scalar_tiles = sub_resource_folder['scalar_tiles']
    vector_tiles = sub_resource_folder['vector_tiles']

    available_time = get_available_model_times(dataset,sub_resource, model_time_datetime,
        level_formatted, dataset_type,availability_struct)
    
    if available_time:
        available_time_str = datetime.datetime.strftime(available_time,'%Y-%m-%dT%H:%MZ')

        data_key, tile_keys = build_file_path(dataset, sub_resource, dataset_prefix, available_time, 
            dataset_type, scalar_tiles, vector_tiles, level_formatted)

        # get model init time by looking at top level info.json file
        info_file_path = build_date_path('info.json', dataset, available_time)
        init_time = get_model_init(info_file_path, bucket)
        init_time_str = datetime.datetime.strftime(init_time,'%Y-%m-%dT%H:%MZ') if init_time else None

        # get the file (if we arent dealing with waves)
        if not dataset == 'WW3_DATA':
            try:
                raw_data = s3.get_object(Bucket=bucket, Key=data_key)
                unpacked_data = raw_data.get('Body').read().decode('utf-8')
            except Exception as e:
                response_body = {
                    'status': 'data not available',
                }
                return generate_response(404, headers, response_body)
        else:
            unpacked_data = None
        
        # construct the response body 
        response_body = {
            'model': dataset,
            'valid_time': available_time_str,
            'init_time': init_time_str,
            'data': unpacked_data,
            'tile_paths': tile_keys
        }
        return generate_response(200, headers, response_body)
    else:
        response_body = {
            'model': dataset,
            'valid_time': None,
            'init_time': None,
            'data': None,
            'tile_paths': None,
        }
        return generate_response(200, headers, response_body)

    
if __name__ == '__main__':
    
    event = {
        "queryStringParameters": {
            "level": "0",
            "dataset": "HYCOM_DATA",
            "sub_resource": "ocean_current_speed",
            "time": "2022-10-21T19:00Z"
        }
    }
    lambda_handler(event,'')
    
