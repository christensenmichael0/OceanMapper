# -*- coding: utf-8 -*-
"""
Created on Mon Apr  2 17:20:30 2018

@author: Michael Christensen
"""


import json
import datetime
import pickle
import time

import boto3
import numpy as np
from scipy import interpolate
import netCDF4

from utils.fetch_utils import get_opendapp_netcdf
from utils.tile_task_distributor import tile_task_distributor
from utils.pickle_task_distributor import pickle_task_distributor
from utils.datasets import datasets


def lambda_handler(event, context):
    """
    lambda_handler(event, context):

    This function reads, parses, and saves a .json and .pickle file from 
    a netCDF file from a provided opendapp url (contained within the event paramater object).
    -----------------------------------------------------------------------
    Inputs:

    event: AWS Lambda uses this parameter to pass in event data to the handler. 
    This parameter is usually of the Python dict type. It can also be list, str, int, float, or NoneType type.
    
    context: AWS Lambda uses this parameter to provide runtime information to your handler. 
    This parameter is of the LambdaContext type.
    -----------------------------------------------------------------------
    Output: A .pickle file are save to S3
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 10/08/2018
    """

    AWS_BUCKET_NAME = 'oceanmapper-data-storage'
    TOP_LEVEL_FOLDER = 'WW3_DATA'
    SUB_RESOURCE_HTSGWSFC = 'sig_wave_height'
    SUB_RESOURCE_DIRPWSFC = 'primary_wave_dir'
    SUB_RESOURCE_PERPWSFC = 'primary_wave_period'
    
    # unpack event data
    url = event['url']
    model_field_time = datetime.datetime.strptime(event['forecast_time'],'%Y%m%dT%H:%M')
    model_field_indx = event['forecast_indx']

    file = get_opendapp_netcdf(url) 
    formatted_folder_date = datetime.datetime.strftime(model_field_time,'%Y%m%d_%H')

    output_pickle_path_htsgwsfc = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + 
        '/' + SUB_RESOURCE_HTSGWSFC + '/pickle/' +'ww3_htsgwsfc_' + formatted_folder_date + '.pickle')

    output_tile_scalar_path_htsgwsfc = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + 
        '/' + SUB_RESOURCE_HTSGWSFC + '/tiles/scalar/')

    output_tile_data_path_htsgwsfc = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date +
        '/' + SUB_RESOURCE_HTSGWSFC + '/tiles/data/')

    output_pickle_path_dirpwsfc = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + 
        '/' + SUB_RESOURCE_DIRPWSFC + '/pickle/' +'ww3_dirpwsfc_' + formatted_folder_date + '.pickle')

    output_tile_vector_path_dirpwsfc = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + 
        '/' + SUB_RESOURCE_DIRPWSFC + '/tiles/vector/')

    output_tile_data_path_dirpwsfc = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date +
        '/' + SUB_RESOURCE_DIRPWSFC + '/tiles/data/')

    output_pickle_path_perpwsfc = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + 
        '/' + SUB_RESOURCE_PERPWSFC + '/pickle/' +'ww3_perpwsfc_' + formatted_folder_date + '.pickle')

    output_tile_scalar_path_perpwsfc = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + 
        '/' + SUB_RESOURCE_PERPWSFC + '/tiles/scalar/')

    output_tile_data_path_perpwsfc = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date +
        '/' + SUB_RESOURCE_PERPWSFC + '/tiles/data/')

    # get model origin time
    init_time = file.variables['time'][0]
    basetime_int = int(init_time)
    extra_days = init_time - basetime_int
    time_origin = (datetime.datetime.fromordinal(basetime_int) + 
        datetime.timedelta(days = extra_days) - datetime.timedelta(days=1))

    lat  = file.variables['lat'][:]
    lon  = file.variables['lon'][:]

    # significant height of combined wind waves and swell [m]
    height_raw = file.variables['htsgwsfc'][model_field_indx,:,:] #[time,lat,lon]

    # primary wave direction [deg]
    primary_dir_raw = file.variables['dirpwsfc'][model_field_indx,:,:] #[time,lat,lon]

    # primary wave mean period [s]
    primary_period_raw = file.variables['perpwsfc'][model_field_indx,:,:] #[time,lat,lon]

    # ordered lat array
    lat_sort_indices = np.argsort(lat)
    lat_ordered = lat[lat_sort_indices]

    # remap and sort to -180 to 180 grid
    lon_translate = np.where(lon>180, lon-360.0, lon)
    lon_sort_indices = np.argsort(lon_translate)

    # ordered longitude arrays
    lon_ordered = lon_translate[lon_sort_indices]

    # rebuild sig wave height data with correct longitude sorting (monotonic increasing)
    height_data_cleaned = height_raw[lat_sort_indices,:][:,lon_sort_indices]

    # rebuild primary wave direction data with correct longitude sorting (monotonic increasing) 
    direction_data_cleaned = primary_dir_raw[lat_sort_indices,:][:,lon_sort_indices]

    # rebuild primary wave period data with correct longitude sorting (monotonic increasing) 
    period_data_cleaned = primary_period_raw[lat_sort_indices,:][:,lon_sort_indices]

    # assign the raw data to variables so we can pickle it for use with other scripts
    raw_data_htsgwsfc = {'lat': lat_ordered, 'lon': lon_ordered, 'sig_wave_height': height_data_cleaned,
        'time_origin': time_origin}
    raw_data_pickle_htsgwsfc = pickle.dumps(raw_data_htsgwsfc)

    raw_data_dirpwsfc = {'lat': lat_ordered, 'lon': lon_ordered,'primary_wave_dir': direction_data_cleaned,
        'time_origin': time_origin}
    raw_data_pickle_dirpwsfc = pickle.dumps(raw_data_dirpwsfc)

    raw_data_perpwsfc = {'lat': lat_ordered, 'lon': lon_ordered,'primary_wave_period': period_data_cleaned,
        'time_origin': time_origin}
    raw_data_pickle_perpwsfc = pickle.dumps(raw_data_perpwsfc)

    client = boto3.client('s3')
    client.put_object(Body=raw_data_pickle_htsgwsfc, Bucket=AWS_BUCKET_NAME, Key=output_pickle_path_htsgwsfc)
    client.put_object(Body=raw_data_pickle_dirpwsfc, Bucket=AWS_BUCKET_NAME, Key=output_pickle_path_dirpwsfc)
    client.put_object(Body=raw_data_pickle_perpwsfc, Bucket=AWS_BUCKET_NAME, Key=output_pickle_path_perpwsfc)

    # call an intermediate function to distribute tiling workload
    # tile_task_distributor(output_pickle_path_htsgwsfc, 'wave_amp', AWS_BUCKET_NAME,
    #     output_tile_scalar_path_htsgwsfc, range(3,4))
    
    # tile_task_distributor(output_pickle_path_dirpwsfc, 'wave_dir', AWS_BUCKET_NAME,
    #     output_tile_vector_path_dirpwsfc, range(3,5))

    # tile_task_distributor(output_pickle_path_perpwsfc, 'wave_period', AWS_BUCKET_NAME,
    #     output_tile_scalar_path_perpwsfc, range(3,4))

    # call an intermediate function to distribute pickling workload (subsetting data by tile)
    data_zoom_level_htsgwsfc = datasets[TOP_LEVEL_FOLDER]['sub_resource'][SUB_RESOURCE_HTSGWSFC]['data_tiles_zoom_level']
    pickle_task_distributor(output_pickle_path_htsgwsfc, AWS_BUCKET_NAME, output_tile_data_path_htsgwsfc, 
        data_zoom_level_htsgwsfc)

    data_zoom_level_dirpwsfc = datasets[TOP_LEVEL_FOLDER]['sub_resource'][SUB_RESOURCE_DIRPWSFC]['data_tiles_zoom_level']
    pickle_task_distributor(output_pickle_path_dirpwsfc, AWS_BUCKET_NAME, output_tile_data_path_dirpwsfc, 
        data_zoom_level_dirpwsfc)

    data_zoom_level_perpwsfc = datasets[TOP_LEVEL_FOLDER]['sub_resource'][SUB_RESOURCE_PERPWSFC]['data_tiles_zoom_level']
    pickle_task_distributor(output_pickle_path_perpwsfc, AWS_BUCKET_NAME, output_tile_data_path_perpwsfc, 
        data_zoom_level_perpwsfc)

    file.close()

if __name__ == "__main__":
	lambda_handler('','')
