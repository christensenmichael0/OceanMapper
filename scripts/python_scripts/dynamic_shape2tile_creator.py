import mercantile
from build_tile_from_shape import build_tile_from_shape
from utils.tile_utils import blank_tile
import json


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
    
    https://stackoverflow.com/questions/35804042/aws-api-gateway-and-lambda-to-return-image
    -----------------------------------------------------------------------
    Output: response object
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 03/28/2020
    """

    response_obj = {
        "isBase64Encoded": True,
        "statusCode": 200,
        "headers": {'Content-Type': 'image/png', 'Access-Control-Allow-Origin': '*'},
        "body":  None # base64.b64encode(content_bytes).decode("utf-8") #TODO drop image bytes in here
    }


    shapefile_path = event['queryStringParameters']['shapefile_path']

    #TODO: str needs to be converted to number
    query_params = {
        "linewidth": float(event['queryStringParameters'].get('linewidth')) if event['queryStringParameters'].get('linewidth') else None,
        "edgecolor": event['queryStringParameters'].get('edgecolor')
    }

    override_config = {k: v for k, v in query_params.items() if v is not None}

    zoom, i, j = tuple([int(val) for val in event['pathParameters']['proxy'].split('/')])
    incoming_tile = mercantile.Tile(i, j, zoom)
    

    try:
        response_obj['body'] = build_tile_from_shape(incoming_tile, shapefile_path, override_config)
    except Exception as e:
        print('failed on tile image build')
        print(e)
        response_obj['body'] = blank_tile()


    return response_obj




if __name__ == '__main__':

    event = {
        "queryStringParameters": {
            "shapefile_path": "https://www.boem.gov/BOEM-Renewable-Energy-Shapefiles.zip",
            "linewidth": 0.9,
            "edgecolor": "#ff3300"
        },
        "pathParameters": {
            "proxy": "8/77/95"
        }
    }

    lambda_handler(event,'')

# https://a7vap1k0cl.execute-api.us-east-2.amazonaws.com/staging/dynamic-tile/5/8/13?dataset=RTOFS_DATA&sub_resource=ocean_current_speed&level=0&time=2019-02-21T23:00Z
# https://a7vap1k0cl.execute-api.us-east-2.amazonaws.com/staging/dynamic-tile/2/1/2?dataset=GFS_DATA&sub_resource=wind_speed&level=10&time=2019-02-26T23:00Z&n_levels=100&color_map=magma&data_range=0,100
