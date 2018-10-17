import boto3
import numpy as np
import mercantile
import pickle
import json

s3 = boto3.client('s3')
lam = boto3.client('lambda')

def pickle_task_distributor(pickle_filepath, bucket_name, output_picklepath, zoom=3):
    """
    tile_task_distributor(pickle_filepath, data_type, bucket_name, output_picklepath, zoom=3)

    -----------------------------------------------------------------------
    Inputs:
    picke_data_path: (str) - the path of the .pickle data file
    bucket_name: (str) the AWS bucket name
    output_picklepath: (str) - the location where subsetted data are saved
    zoom: (int) - the zoom level to generate data 'tiles'

    -----------------------------------------------------------------------
    Output: Invokes process_pickle.py lambda function on AWS with fully specified event
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 10/08/2018
    """

    pickle_data = s3.get_object(Bucket=bucket_name, Key=pickle_filepath)
    body_string = pickle_data['Body'].read()
    data = pickle.loads(body_string)

    lat = data['lat']
    lon = data['lon']

    tiles = mercantile.tiles(west=lon.min(), south=lat.min(), east=lon.max(), north=lat.max(), zooms=zoom)
    x,y,z = zip(*[t for t in tiles])

    #break into groups of 50
    group_size = 50
    tile_break_points=(list(range(0,len(x), group_size)))
    tile_break_points.append(len(x))

    # check that the event is valid format
    for break_indx in range(len(tile_break_points)-1):
        # build payload for initiation of lambda function
        payload = {}
        payload['pickle_filepath'] = pickle_filepath
        payload['bucket_name'] = bucket_name
        payload['output_picklepath'] = output_picklepath
        payload['xyz_info'] = {'start_indx': tile_break_points[break_indx], 
            'end_indx': tile_break_points[break_indx+1]}
        payload['zoom'] = zoom

        # invoke process_tiles with appropriate payload
        try:
            response = lam.invoke(FunctionName='process_pickle', 
                InvocationType='Event', Payload=json.dumps(payload))
        except Exception as e:
            raise e

if __name__ == "__main__":
    lambda_handler('','')