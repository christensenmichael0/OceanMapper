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
    Date Modified: 06/30/2018
    """
        
    # unpack event data
    url = event['url']
    model_field_time = datetime.datetime.strptime(event['forecast_time'],'%Y%m%dT%H:%M')
    model_field_indx = event['forecast_indx']

    file = get_opendapp_netcdf(url) 
    formatted_folder_date = datetime.datetime.strftime(model_field_time,'%Y%m%d_%H')
    
    output_json_path = ('GFS_WINDS/' + formatted_folder_date + '/10m/json/' +
        'gfs_winds_' + formatted_folder_date + '.json')

    output_pickle_path = ('GFS_WINDS/' + formatted_folder_date + '/10m/pickle/' +
        'gfs_winds_' + formatted_folder_date + '.pickle')

    lat  = file.variables['lat'][:]
    lon  = file.variables['lon'][:]

    # transform masked values to 0
    u_data_raw = file.variables['ugrd10m'][model_field_indx,:,:] #[time,lat,lon] 
    v_data_raw = file.variables['vgrd10m'][model_field_indx,:,:]

    # remap and sort to -180 to 180 grid
    lon_translate = np.where(lon>180, lon-360.0, lon)
    lon_sort_indices = np.argsort(lon_translate)

    # ordered clongitude arrays
    lon_ordered = lon_translate[lon_sort_indices]

    # rebuild u/v data with correct longitude sorting (monotonic increasing) 
    u_data_cleaned = np.array([lat_row[lon_sort_indices] for lat_row in u_data_raw])
    v_data_cleaned = np.array([lat_row[lon_sort_indices] for lat_row in v_data_raw])

    # assign the raw data to a variable so we can pickle it for use with other scripts
    raw_data = {'lat': lat, 'lon': lon_ordered, 'u_vel': u_data_cleaned, 'v_vel': v_data_cleaned}
    raw_data_pickle = pickle.dumps(raw_data)

    output_lat_array = np.arange(int(min(lat)),int(max(lat))+0.5,0.5) # last point is excluded with arange (80 to -80)
    output_lon_array = np.arange(-180,180.5,0.5) # last point is excluded with arange (-180 to 180)

    u_interp_func = interpolate.interp2d(lon_ordered, lat, u_data_cleaned, kind='cubic')
    v_interp_func = interpolate.interp2d(lon_ordered, lat, v_data_cleaned, kind='cubic')

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
    			'parameterNumberName': "Eastward wind",
    			'la1': maxLat,
    			'la2': minLat,
    			'parameterCategory': 2,
    			'lo1': minLon,
    			'lo2': maxLon,
    			'nx': len(output_lon_array),
    			'ny': len(output_lat_array),
    			'refTime': datetime.datetime.strftime(model_field_time,'%Y-%m-%d %H:%M:%S'),
    			},
    			'data': [float('{:.3f}'.format(el)) if el > 0.01 else 0 for el in u_data_interp[::-1].flatten().tolist()]
    		},
    		{'header': {
    			'parameterUnit': "m.s-1",
    			'parameterNumber': 3,
    			'dx': dx,
    			'dy': dy,
    			'parameterNumberName': "Northward wind",
    			'la1': maxLat,
    			'la2': minLat,
    			'parameterCategory': 2,
    			'lo1': minLon,
    			'lo2': maxLon,
    			'nx': len(output_lon_array),
    			'ny': len(output_lat_array),
    			'refTime': datetime.datetime.strftime(model_field_time,'%Y-%m-%d %H:%M:%S'),
    			},
    			'data': [float('{:.3f}'.format(el)) if el > 0.01 else 0 for el in v_data_interp[::-1].flatten().tolist()]
    		},
      ]

    AWS_BUCKET_NAME = 'oceanmapper-data-storage'

    client = boto3.client('s3')
    client.put_object(Body=json.dumps(output_data), Bucket=AWS_BUCKET_NAME, Key=output_json_path)
    client.put_object(Body=raw_data_pickle, Bucket=AWS_BUCKET_NAME, Key=output_pickle_path)

    file.close()




if __name__ == "__main__":
	lambda_handler('','')
