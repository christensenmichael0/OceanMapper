import boto3
import pickle
import datetime
import numpy as np
import mercantile

from utils.s3_filepath_utils import build_tiledata_path
from utils.datasets import datasets
from api_utils.fetch_data_availability import grab_data_availability
from api_utils.nearest_model_time import get_available_model_times
from build_tile_image import build_tile_image

from process_tiles import blank_tile


s3 = boto3.client('s3')
bucket = 'oceanmapper-data-storage'

def lambda_handler(event, context):
    """
    lambda_handler(event, context):

    This function is used in conjunction with aws api gateway (lambda proxy integration)
    to generate an tile image on the fly
    -----------------------------------------------------------------------
    Inputs:

    event: Event data (pathParameters and queryStringParameters) are parsed from call to aws api endpoint
    
    context: AWS Lambda uses this parameter to provide runtime information to your handler. 
    This parameter is of the LambdaContext type.
    -----------------------------------------------------------------------
    Notes:
    https://aws.amazon.com/blogs/compute/parallel-processing-in-python-with-aws-lambda/
    -----------------------------------------------------------------------
    Output: response object
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 02/23/2018
    """

    response_obj = {
        "isBase64Encoded": True,
        "statusCode": 200,
        "headers": {'Content-Type': 'image/png', 'Access-Control-Allow-Origin': '*'},
        "body":  None # base64.b64encode(content_bytes).decode("utf-8") #TODO drop image bytes in here
    }

    # load data availability file from s3
    availability_struct = grab_data_availability()
    if not availability_struct:
        # build a blank image and inject data into response
        response_obj['body'] = blank_tile()
        return response_obj
        
    # model time
    model_time = event['queryStringParameters']['time']
    model_time_datetime = datetime.datetime.strptime(model_time,'%Y-%m-%dT%H:%MZ')

    # dataset (model)
    dataset = event['queryStringParameters']['dataset']

    # sub resource
    sub_resource = event['queryStringParameters']['sub_resource']
    sub_resource_folder = datasets[dataset]['sub_resource'][sub_resource]

    # model level
    level = event['queryStringParameters']['level']
    level_formatted = str(level) + 'm' if len(str(level)) else '' # wave data have no level

    # dataset type 
    dataset_type = 'pickle'

    available_time = get_available_model_times(dataset,sub_resource, model_time_datetime,
        level_formatted, dataset_type, availability_struct)

    target_zoom = datasets[dataset]['sub_resource'][sub_resource]['data_tiles_zoom_level'][-1]
    zoom, i, j = tuple([int(val) for val in event['pathParameters']['proxy'].split('/')])

    # need to find the smallest available data from s3 to load and construct a tile
    # dataset.py provides info on data_tiles_zoom_levels
    incoming_tile = mercantile.Tile(i, j, zoom)
    west, south, east, north = [*mercantile.bounds(incoming_tile)]
    lon_average = np.average(np.array([west, east]))
    lat_average = np.average(np.array([south, north]))

    if zoom < target_zoom:
        target_zoom = zoom

    if available_time:
        available_time_str = datetime.datetime.strftime(available_time,'%Y-%m-%dT%H:%MZ')

        # this is the subsetted .pickle data
        data_key = build_tiledata_path(dataset, sub_resource, level_formatted, available_time, 
            [lon_average, lat_average], target_zoom)

        # TODO: future task: check s3 cache first before building image
        # is it faster to load an image from s3 and then send to client opposed to building here?
        try:
            response_obj['body'] = build_tile_image(incoming_tile, data_key, sub_resource, 
                event['queryStringParameters'])
        except:
            response_obj['body'] = blank_tile()      
        
    else:
        response_obj['body'] = blank_tile()

    return response_obj


if __name__ == '__main__':

    event = {
        "queryStringParameters": {
            "level": "10",
            "dataset": "GFS_DATA",
            "sub_resource": "wind_speed",
            "time": "2019-03-01T23:00Z",

        },
        "pathParameters": {
            "proxy": "5/9/12"# "6/16/27"
        }
    }

    lambda_handler(event,'')

# https://a7vap1k0cl.execute-api.us-east-2.amazonaws.com/staging/dynamic-tile/5/8/13?dataset=RTOFS_DATA&sub_resource=ocean_current_speed&level=0&time=2019-02-21T23:00Z
# https://a7vap1k0cl.execute-api.us-east-2.amazonaws.com/staging/dynamic-tile/2/1/2?dataset=GFS_DATA&sub_resource=wind_speed&level=10&time=2019-02-26T23:00Z&n_levels=100&color_map=magma&data_range=0,100








    
    
