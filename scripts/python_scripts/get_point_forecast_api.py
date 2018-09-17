import boto3
import datetime
import numpy as np
import json
import re

from utils.s3_filepath_utils import build_file_path
from utils.datasets import datasets
from api_utils.response_constructor import generate_response
from api_utils.check_query_params import check_query_params, filter_failed_params
from api_utils.fetch_data_availability import grab_data_availability
from api_utils.nearest_model_time import get_available_model_times
from api_utils.get_model_value import get_model_value

s3 = boto3.client('s3')
bucket = 'oceanmapper-data-storage'

def lambda_handler(event, context):
    """
    add docstring
    """

    if ('model' in event['queryStringParameters'] and 
        event['queryStringParameters']['model'] == 'ww3_data'):
        required_query_params = ['time','model','sub_resource','level','coordinates']
    else:
        required_query_params = ['time','model','level','coordinates']

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

    # default headers for request
    headers = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

    # model time
    model_time = event['queryStringParameters']['time']
    model_time_datetime = datetime.datetime.strptime(model_time,'%Y-%m-%dT%H:%MZ')

    # model
    model = event['queryStringParameters']['model'].lower()

    if model == 'ww3_data':
        sub_resource = event['queryStringParameters']['sub_resource'].lower()

    # model level
    level = event['queryStringParameters']['level']
    level_formatted = str(level) + 'm' if len(str(level)) else '' # wave data have no level

    # coordinates
    coords = [float(coord) for coord in event['queryStringParameters']['coordinates'].split(',')]
    overlay_type = datasets[model]['overlay_type']
    if overlay_type == 'ocean':
        pass
        # TODO implement check_ocean function
    
    # TODO: if model is (ocean only) then check the coords to make sure they are in the ocean before
    # pulling data... only do this check once and set some global var

    # TODO: get nearest data for
    dataset_folder = datasets[model]['s3_folder']
    dataset_type = 'pickle'

    available_time = get_available_model_times(dataset_folder,model_time_datetime,
        level_formatted,dataset_type,availability_struct)

    data_key, _ = build_file_path(dataset_folder, model, available_time, dataset_type, 
            None, None, level_formatted)

    # TODO need function to do the interpolation
    data_value = get_model_value(coords, data_key)
    import pdb; pdb.set_trace()
    print('here')


if __name__ == '__main__':
    
    event = {
        "queryStringParameters": {
            "level": "",
            "model": "ww3_data",
            "sub_resource": "sig_wave_height",
            "time": "2018-09-13T08:00Z",
            "coordinates": "-65.0,42.0"
        }
    }

    lambda_handler(event,'')
