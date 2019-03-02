import boto3
import datetime
import numpy as np
import json
import re
import os

from utils.s3_filepath_utils import build_tiledata_path
from utils.datasets import datasets
from api_utils.response_constructor import generate_response
from api_utils.check_query_params import check_query_params, filter_failed_params
from api_utils.fetch_data_availability import grab_data_availability
from api_utils.nearest_model_time import get_available_model_times
from api_utils.get_model_value import get_model_value

s3 = boto3.client('s3')
lam = boto3.client('lambda')
bucket = 'oceanmapper-data-storage'

def lambda_handler(event, context):
    """
    lambda_handler(event, context):

    This function is used in conjunction with aws api gateway (lambda proxy integration)
    to pass back the interpolated value of a dataset at a specific geographic coordinate
    -----------------------------------------------------------------------
    Inputs:

    event: Event data (queryStringParameters) are parsed from call to aws api endpoint
    
    context: AWS Lambda uses this parameter to provide runtime information to your handler. 
    This parameter is of the LambdaContext type.
    -----------------------------------------------------------------------
    Output: response object
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 10/17/2018
    """

    # default headers for request
    headers = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

    required_query_params = ['time','dataset','sub_resource','level','coordinates']

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
    sub_resource_folder = datasets[dataset]['sub_resource'][sub_resource]
    dataset_prefix = sub_resource_folder['data_prefix']
    dataset_units = sub_resource_folder['units']

    # model level
    level = event['queryStringParameters']['level']
    level_formatted = str(level) + 'm' if len(str(level)) else '' # wave data have no level

    # coordinates
    coords = [float(coord) for coord in event['queryStringParameters']['coordinates'].split(',')]
    overlay_type = datasets[dataset]['sub_resource'][sub_resource]['overlay_type']

    check_ocean = os.getenv('check_ocean', False) # environment variable (easy adjument in lambda env)
    coord_in_ocean = False # default is not in ocean
    if overlay_type == 'ocean' and check_ocean:
        payload = {'lat': coords[1], 'lon': coords[0]}
        coord_in_ocean = lam.invoke(FunctionName='in_ocean', 
                InvocationType='RequestResponse', Payload=json.dumps(payload)) # this function is slow
    
    # if model is (ocean only) then check the coords to make sure they are in the ocean
    if not coord_in_ocean and overlay_type == 'ocean' and check_ocean:
        response_body = {
            'data': None,
            'status': 'point on land',
        }
        return generate_response(200, headers, response_body)

    dataset_vars = sub_resource_folder['variables']
    dataset_type = 'pickle'

    available_time = get_available_model_times(dataset,sub_resource, model_time_datetime,
        level_formatted, dataset_type, availability_struct)

    if available_time:
        available_time_str = datetime.datetime.strftime(available_time,'%Y-%m-%dT%H:%MZ')

        # this is the subsetted .pickle data
        data_key = build_tiledata_path(dataset, sub_resource, level_formatted, available_time, coords)
        data_value = get_model_value(coords, data_key, sub_resource, dataset_vars)

        # construct the response body 
        response_body = {
            'model': dataset,
            'sub_resource': sub_resource,
            'valid_time': available_time_str,
            'data': data_value,
            'units': dataset_units
        }
        return generate_response(200, headers, response_body)
    else:
        response_body = {
            'model': dataset,
            'sub_resource': sub_resource,
            'valid_time': None,
            'data': None,
            'units': None,
        }
        return generate_response(200, headers, response_body)


if __name__ == '__main__':

    event = {
        "queryStringParameters": {
            "level": "0",
            "dataset": "RTOFS_DATA",
            "sub_resource": "ocean_current_speed",
            "time": "2019-01-21T23:00Z",
            "coordinates": "-90.52318081291162,26.933536474718093" #"-81.58,23.88"
        }
    }

    lambda_handler(event,'')
