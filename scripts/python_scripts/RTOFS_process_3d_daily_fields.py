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
    Output: A .json file and a .pickle file are save to S3
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 08/19/2018
    """

    AWS_BUCKET_NAME = 'oceanmapper-data-storage'
    TOP_LEVEL_FOLDER = 'RTOFS_DATA'
        
    # unpack event data
    url = event['url']
    model_field_time = datetime.datetime.strptime(event['forecast_time'],'%Y%m%dT%H:%M')
    model_field_indx = event['forecast_indx']
    model_level_depth = event['level']['level_depth']
    model_level_indx = event['level']['level_indx']

    u_comp_url = url;
    v_comp_url = url.replace('uvel','vvel')

    file_u = get_opendapp_netcdf(u_comp_url)
    file_v = get_opendapp_netcdf(v_comp_url)  

    formatted_folder_date = datetime.datetime.strftime(model_field_time,'%Y%m%d_%H')
    
    # update this when fetching 4d data (right now only use surface depth
    output_json_path = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + '/ocean_current_speed/' +
        str(model_level_depth) + 'm/json/' +'rtofs_currents_' + formatted_folder_date + '.json')

    output_pickle_path = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + '/ocean_current_speed/' +
        str(model_level_depth) + 'm/pickle/' +'rtofs_currents_' + formatted_folder_date + '.pickle')

    output_tile_scalar_path = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + '/ocean_current_speed/' +
        str(model_level_depth) + 'm/tiles/scalar/')

    # get model origin time
    if 'nowcast' in u_comp_url:
        time_orig_str = file_u.variables['time'].maximum
    else:
        time_orig_str = file_u.variables['time'].minimum
    time_origin = datetime.datetime.strptime(time_orig_str,'%Hz%d%b%Y')

    lat  = file_u.variables['lat'][:]
    lon  = file_u.variables['lon'][:]

    # transform masked values to 0
    u_data_raw = file_u.variables['u'][model_field_indx,model_level_indx,:,:] #[time,level,lat,lon]
    v_data_raw = file_v.variables['v'][model_field_indx,model_level_indx,:,:]
	
    u_data_mask_applied = np.where(~u_data_raw.mask, u_data_raw, 0)
    v_data_mask_applied = np.where(~v_data_raw.mask, v_data_raw, 0)

    # ordered lat array
    lat_sort_indices = np.argsort(lat)
    lat_ordered = lat[lat_sort_indices]

    # rtofs longitudes go from 74.16 to 434.06227 -- remap and sort to -180 to 180 grid
    lon_translate = np.where(lon>180, lon-360.0, lon)
    lon_sort_indices = np.argsort(lon_translate)

    # ordered longitude arrays
    lon_ordered = lon_translate[lon_sort_indices]

    # rebuild u/v data with correct longitude sorting (monotonic increasing) 
    u_data_cleaned_filled = u_data_mask_applied[lat_sort_indices,:][:,lon_sort_indices]
    v_data_cleaned_filled = v_data_mask_applied[lat_sort_indices,:][:,lon_sort_indices]

    u_data_cleaned = u_data_raw[lat_sort_indices,:][:,lon_sort_indices]
    v_data_cleaned = v_data_raw[lat_sort_indices,:][:,lon_sort_indices]

    # assign the raw data to a variable so we can pickle it for use with other scripts
    raw_data = {'lat': lat_ordered, 'lon': lon_ordered, 'u_vel': u_data_cleaned, 'v_vel': v_data_cleaned,
        'time_origin': time_origin}
    raw_data_pickle = pickle.dumps(raw_data)

    output_lat_array = np.arange(int(min(lat)),int(max(lat))+0.5,0.5) # last point is excluded with arange (90 to -90)
    output_lon_array = np.arange(-180,180.5,0.5) # last point is excluded with arange (-180 to 180)

    u_interp_func = interpolate.interp2d(lon_ordered, lat_ordered, u_data_cleaned_filled, kind='cubic')
    v_interp_func = interpolate.interp2d(lon_ordered, lat_ordered, v_data_cleaned_filled, kind='cubic')

    u_data_interp = u_interp_func(output_lon_array, output_lat_array)
    v_data_interp = v_interp_func(output_lon_array, output_lat_array)
	
    minLat = np.min(output_lat_array)
    maxLat = np.max(output_lat_array)
    minLon = np.min(output_lon_array)
    maxLon = np.max(output_lon_array)
    
    dx = np.diff(output_lon_array)[0]
    dy = np.diff(output_lat_array)[0]
    
    output_data = [
    		{'header': {
    			'parameterUnit': "m.s-1",
    			'parameterNumber': 2,
    			'dx': dx,
    			'dy': dy,
    			'parameterNumberName': "Eastward current",
    			'la1': maxLat,
    			'la2': minLat,
    			'parameterCategory': 2,
    			'lo1': minLon,
    			'lo2': maxLon,
    			'nx': len(output_lon_array),
    			'ny': len(output_lat_array),
    			'refTime': datetime.datetime.strftime(model_field_time,'%Y-%m-%d %H:%M:%S'),
                'timeOrigin': datetime.datetime.strftime(time_origin,'%Y-%m-%d %H:%M:%S'),
    			},
    			'data': [float('{:.3f}'.format(el)) if el > 0.01 else 0 for el in u_data_interp[::-1].flatten().tolist()]
    		},
    		{'header': {
    			'parameterUnit': "m.s-1",
    			'parameterNumber': 3,
    			'dx': dx,
    			'dy': dy,
    			'parameterNumberName': "Northward current",
    			'la1': maxLat,
    			'la2': minLat,
    			'parameterCategory': 2,
    			'lo1': minLon,
    			'lo2': maxLon,
    			'nx': len(output_lon_array),
    			'ny': len(output_lat_array),
    			'refTime': datetime.datetime.strftime(model_field_time,'%Y-%m-%d %H:%M:%S'),
                'timeOrigin': datetime.datetime.strftime(time_origin,'%Y-%m-%d %H:%M:%S'),
    			},
    			'data': [float('{:.3f}'.format(el)) if el > 0.01 else 0 for el in v_data_interp[::-1].flatten().tolist()]
    		},
      ]

    client = boto3.client('s3')
    client.put_object(Body=json.dumps(output_data), Bucket=AWS_BUCKET_NAME, Key=output_json_path)
    client.put_object(Body=raw_data_pickle, Bucket=AWS_BUCKET_NAME, Key=output_pickle_path)

    # call an intermediate function to distribute tiling workload
    tile_task_distributor(output_pickle_path, 'current_speed', AWS_BUCKET_NAME, 
        output_tile_scalar_path, range(3,4))

    file_u.close()
    file_v.close()

if __name__ == "__main__":
	lambda_handler('','')
