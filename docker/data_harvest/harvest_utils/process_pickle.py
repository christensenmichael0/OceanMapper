import pickle
import io

import boto3
import numpy as np
import mercantile

from harvest_utils.datasets import datasets


s3 = boto3.client('s3')

def generate_pickle_files(data, dataset, sub_resource, output_tile_data_path, zoom, bucket_name):
    """
    generate_pickle_files(data, dataset, sub_resource, output_tile_data_path, zoom, bucket_name)
    
    This function creates data 'tiles' (.pickle) -- subsetted data -- and saves them in S3
    -----------------------------------------------------------------------
    Inputs:

    data (dict) - dictionary containing raw forecast data
    dataset (str) - the top level dataset name (i.e. HYCOM_DATA, GFS_DATA, WW3_DATA)
    sub_resource (str) - the model subresource (i.e. ocean_current_speed, wind_speed, significant_wave_height)
    output_tile_data_path (str) - the output path for 'tile' data
    zoom (int) - the zoom level to create data tiles
    bucket_name (str) - the aws s3 bucket name

    -----------------------------------------------------------------------
    Output: pickle files are saved to S3
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 04/13/2019
    """

    # process the data in preparation for data 'tiling'
    if hasattr(data['lat'],'mask'):
        lat = data['lat'].data
    else:
        lat = data['lat']

    if hasattr(data['lon'],'mask'):
        lon = data['lon'].data
    else:
        lon = data['lon']

    lat_diff = np.abs(np.diff(lat)[0])
    lon_diff = np.abs(np.diff(lon)[0])
    
    time_origin = data['time_origin']

    # get variables based on dataset
    variables = datasets[dataset]['sub_resource'][sub_resource]['variables']

    # get list of all tiles for certain geographic extents and zooms
    tiles_gen = mercantile.tiles(west=lon.min(), south=lat.min(), east=lon.max(), north=lat.max(), zooms=zoom)
    tiles = [tile for tile in tiles_gen]

    for tile in tiles:
        
        i,j,zoom=[*tile]
        ll = mercantile.bounds(i, j, zoom)

        _wgs84_lon_min, _wgs84_lat_min = ll[:2]
        _wgs84_lon_max, _wgs84_lat_max = ll[2:]

        # extend bounds slightly to avoid issue with data being cut off at tile boundaries
        _wgs84_lon_min_padded = _wgs84_lon_min - (10 * lon_diff)
        _wgs84_lon_max_padded = _wgs84_lon_max + (10 * lon_diff)
        _wgs84_lat_min_padded = _wgs84_lat_min - (10 * lat_diff)
        _wgs84_lat_max_padded = _wgs84_lat_max + (10 * lat_diff)
        
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

        filename = '{0}{1}/{2}/{3}.pickle'.format(output_tile_data_path, str(zoom), str(i), str(j))
    
        # save the file
        with io.BytesIO() as f:
            pickle.dump(output_data,f,pickle.HIGHEST_PROTOCOL)
            f.seek(0)
            s3.upload_fileobj(f,bucket_name, filename)
