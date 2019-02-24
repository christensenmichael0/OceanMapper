import pickle
import datetime
import copy
import io
import os
import re

import boto3
import numpy as np
import mercantile
import PIL

from utils.datasets import datasets


s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    This function creates data 'tiles' (.pickle) -- subsetted data -- and saves them in S3
    -----------------------------------------------------------------------
    Inputs:

    event: AWS Lambda uses this parameter to pass in event data to the handler. 
    This parameter is usually of the Python dict type. It can also be list, str, int, float, or NoneType type.
    In this case the event contains these keys: 
    'pickle_filepath': (string) the location of the pickle data file
    'data_type': (string) - one of 'wind_speed', 'current_speed', 'wave_height', 'wave_period'
    'bucket_name': (string) the name of the S3 bucket ('oceanmapper-data-storage')
    'output_picklepath': (string) - the location where the file will be saved on S3
    'xyz_info': the start and end indx of the tiles to be processed from the mercantile generator
    'zoom': (int) the zoom level to make data 'tiles' for
        *(http://www.maptiler.org/google-maps-coordinates-tile-bounds-projection/)
    
    context: AWS Lambda uses this parameter to provide runtime information to your handler. 
    This parameter is of the LambdaContext type.
    -----------------------------------------------------------------------
    Output: pickle files are saved to S3
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 10/08/2018
    """


    # get event paramaters
    bucket_name = event['bucket_name']
    pickle_filepath = event['pickle_filepath']
    output_picklepath = event['output_picklepath']
    zoom = event['zoom']
    start_indx = event['xyz_info']['start_indx']
    end_indx = event['xyz_info']['end_indx']

    # load data
    pickle_data = s3.get_object(Bucket=bucket_name, Key=pickle_filepath)
    body_string = pickle_data['Body'].read()
    data = pickle.loads(body_string)

    # process the data in preparation for data 'tiling'
    if hasattr(data['lat'],'mask'):
        lat = data['lat'].data
    else:
        lat = data['lat']

    if hasattr(data['lon'],'mask'):
        lon = data['lon'].data
    else:
        lon = data['lon']

    lat_diff = np.diff(lat)[0]
    lon_diff = np.diff(lon)[0]
    
    time_origin = data['time_origin']

    # parse top level folder and sub resource from path so we can use datasets to loop through vars
    pattern = r'(\w*)/\d{8}_\d{2}/(\w*)'
    match = re.search(pattern,pickle_filepath)
    dataset = match.group(1)
    sub_resource = match.group(2)
    variables = datasets[dataset]['sub_resource'][sub_resource]['variables']

    # get list of all tiles for certain geographic extents and zooms
    tiles_gen = mercantile.tiles(west=lon.min(), south=lat.min(), east=lon.max(), north=lat.max(), zooms=zoom)
    tiles = [tile for tile in tiles_gen]

    for tile_indx in range(start_indx,end_indx):
        tile = tiles[tile_indx]
        
        i,j,zoom=[*tile]
        ll = mercantile.bounds(i, j, zoom)

        _wgs84_lon_min, _wgs84_lat_min = ll[:2]
        _wgs84_lon_max, _wgs84_lat_max = ll[2:]

        # extend bounds slightly to avoid issue with data being cut off at tile boundaries
        _wgs84_lon_min_padded = _wgs84_lon_min - (2 * lon_diff)
        _wgs84_lon_max_padded = _wgs84_lon_max + (2 * lon_diff)
        _wgs84_lat_min_padded = _wgs84_lat_min - (2 * lat_diff)
        _wgs84_lat_max_padded = _wgs84_lat_max + (2 * lat_diff)
        
        # trimming here based on the extents of the tile
        keep_lat_bool = np.logical_and(lat<=_wgs84_lat_max_padded, lat>=_wgs84_lat_min_padded)
        keep_lat_indx = np.argwhere(keep_lat_bool).ravel()

        keep_lon_bool = np.logical_and(lon<=_wgs84_lon_max_padded, lon>=_wgs84_lon_min_padded)
        keep_lon_indx = np.argwhere(keep_lon_bool).ravel()

        # TODO: add model valid time to output data
        output_data = {}
        output_data['lat'] = lat[keep_lat_indx]
        output_data['lon'] = lon[keep_lon_indx]
        output_data['time_origin'] = time_origin
        for var in variables:
            output_data[var] = data[var][keep_lat_indx,:][:,keep_lon_indx]

        filename = '{0}{1}/{2}/{3}.pickle'.format(output_picklepath, str(zoom), str(i), str(j))
    
        # save the file
        raw_data_pickle = pickle.dumps(output_data)
        s3.put_object(Body=raw_data_pickle, Bucket=bucket_name, Key=filename)
            

if __name__ == "__main__":
 
    event = {
        'pickle_filepath': 'RTOFS_DATA/20190224_00/ocean_current_speed/0m/pickle/rtofs_currents_20190224_00.pickle',
        'bucket_name': 'oceanmapper-data-storage', 
        'output_picklepath': 'test_data/',
        'xyz_info': {'start_indx': 0, 'end_indx': 50},
        'zoom': 3
    }

    context = {}
    lambda_handler(event,context)

