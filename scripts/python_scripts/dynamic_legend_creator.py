import boto3
from build_legend_image import build_legend_image
from process_tiles import blank_tile


s3 = boto3.client('s3')
bucket = 'oceanmapper-data-storage'

def lambda_handler(event, context):
    """
    lambda_handler(event, context):

    This function is used in conjunction with aws api gateway (lambda proxy integration)
    to generate a legend image on the fly
    -----------------------------------------------------------------------
    Inputs:

    event: Event data (pathParameters and queryStringParameters) are parsed from call to aws api endpoint
    
    context: AWS Lambda uses this parameter to provide runtime information to your handler. 
    This parameter is of the LambdaContext type.
    -----------------------------------------------------------------------
    Output: response object
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 03/09/2019
    """
    response_obj = {
        "isBase64Encoded": True,
        "statusCode": 200,
        "headers": {'Content-Type': 'image/png', 'Access-Control-Allow-Origin': '*'},
        "body":  None # base64.b64encode(content_bytes).decode("utf-8") #TODO drop image bytes in here
    }
   
    try:
        response_obj['body'] = build_legend_image(event['queryStringParameters'])
    except:
        # build blank legend image
        response_obj['body'] = blank_tile(30,300)      
    
    return response_obj


if __name__ == '__main__':

    event = {
        "queryStringParameters": {
            "color_map": "jet",
            "data_range": [0,50],
            "interval": 'None',
            "label": "Current Speed (m/s)"

        }
    }

    lambda_handler(event,'')

# https://a7vap1k0cl.execute-api.us-east-2.amazonaws.com/staging/dynamic-tile/5/8/13?dataset=RTOFS_DATA&sub_resource=ocean_current_speed&level=0&time=2019-02-21T23:00Z
# https://a7vap1k0cl.execute-api.us-east-2.amazonaws.com/staging/dynamic-tile/2/1/2?dataset=GFS_DATA&sub_resource=wind_speed&level=10&time=2019-02-26T23:00Z&n_levels=100&color_map=magma&data_range=0,100








    
    
