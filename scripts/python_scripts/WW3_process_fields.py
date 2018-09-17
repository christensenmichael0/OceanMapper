# -*- coding: utf-8 -*-
"""
Created on Mon Apr  2 17:20:30 2018

@author: Michael Christensen
"""


import json
import boto3
import numpy as np
from scipy import interpolate
import datetime
import netCDF4
import pickle
import time
from fetch_utils import get_opendapp_netcdf
from tile_task_distributor import tile_task_distributor


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
    Date Modified: 08/19/2018
    """

    AWS_BUCKET_NAME = 'oceanmapper-data-storage'
    TOP_LEVEL_FOLDER = 'WAVE_WATCH_3'
        
    # unpack event data
    url = event['url']
    model_field_time = datetime.datetime.strptime(event['forecast_time'],'%Y%m%dT%H:%M')
    model_field_indx = event['forecast_indx']

    file = get_opendapp_netcdf(url) 
    formatted_folder_date = datetime.datetime.strftime(model_field_time,'%Y%m%d_%H')

    output_pickle_path = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + '/pickle/' +
        'ww3_data_' + formatted_folder_date + '.pickle')

    output_tile_scalar_path = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + 
        '/tiles/scalar/')

    output_tile_vector_path = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + 
        '/tiles/vector/')

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

    # assign the raw data to a variable so we can pickle it for use with other scripts
    raw_data = {'lat': lat_ordered, 'lon': lon_ordered, 'sig_wave_height': height_data_cleaned,
    'primary_wave_dir': direction_data_cleaned, 'primary_wave_period': period_data_cleaned}
    raw_data_pickle = pickle.dumps(raw_data)

    client = boto3.client('s3')
    client.put_object(Body=raw_data_pickle, Bucket=AWS_BUCKET_NAME, Key=output_pickle_path)

    # call an intermediate function to distribute tiling workload
    tile_task_distributor(output_pickle_path, 'wave_amp', AWS_BUCKET_NAME, 
        output_tile_scalar_path, range(3,4))
    
    tile_task_distributor(output_pickle_path, 'wave_dir', AWS_BUCKET_NAME, 
        output_tile_vector_path, range(3,5))

    file.close()

if __name__ == "__main__":
	lambda_handler('','')
