import json
import sys
sys.path.append("..")

import json
import datetime
import pickle
import time
import io
import logging

import boto3
import numpy as np
from scipy import interpolate
import netCDF4

from harvest_utils.fetch_utils import get_opendapp_netcdf
from harvest_utils.process_pickle import generate_pickle_files
from harvest_utils.datasets import datasets

logger = logging.getLogger('data-harvest')

def process_fields(data_url, forecast_time, model_field_indx):
    """
    process_3d_fields(data_url, forecast_time, model_field_indx)

    This function reads, parses, and saves a .json and .pickle file from 
    a netCDF file from a provided opendapp url
    -----------------------------------------------------------------------
    Inputs:

    -----------------------------------------------------------------------
    Output: A .json file and a .pickle file are save to S3
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 04/20/2019
    """
    
    AWS_BUCKET_NAME = 'oceanmapper-data-storage'
    TOP_LEVEL_FOLDER = 'GFS_DATA'
    SUB_RESOURCE = 'wind_speed'
    DATA_PREFIX = 'gfs_winds'
    
    level = '10m'

    with get_opendapp_netcdf(data_url) as file:

        formatted_folder_date = datetime.datetime.strftime(forecast_time,'%Y%m%d_%H')

        logger.info('processing GFS_DATA data: {}'.format(formatted_folder_date))

        # output model info.json filepath  
        output_info_path = TOP_LEVEL_FOLDER + '/' + formatted_folder_date + '/info.json'

        # get model origin time
        init_time = file.variables['time'][0]
        basetime_int = int(init_time)
        extra_days = init_time - basetime_int
        time_origin = (datetime.datetime.fromordinal(basetime_int) + 
            datetime.timedelta(days = extra_days) - datetime.timedelta(days=1))

        lat = file.variables['lat'][:]
        lon = file.variables['lon'][:]

        logger.info('level: 10m')

        output_json_path = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + '/' + SUB_RESOURCE + '/' +
            level + '/json/' + DATA_PREFIX + '_' + formatted_folder_date + '.json')

        output_pickle_path = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + '/' + SUB_RESOURCE + '/' +
            level + '/pickle/' + DATA_PREFIX + '_' + formatted_folder_date + '.pickle')

        output_tile_scalar_path = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + '/' + SUB_RESOURCE + '/' +
            level + '/tiles/scalar/')

        output_tile_data_path = (TOP_LEVEL_FOLDER + '/' + formatted_folder_date + '/' + SUB_RESOURCE + '/' +
            level + '/tiles/data/')

        u_data_raw = file.variables['ugrd10m'][model_field_indx,:,:] #[time,lat,lon] 
        v_data_raw = file.variables['vgrd10m'][model_field_indx,:,:]

        # ordered lat array
        lat_sort_indices = np.argsort(lat)
        lat_ordered = lat[lat_sort_indices]

        # remap and sort to -180 to 180 grid
        lon_translate = np.where(lon>180, lon-360.0, lon)
        lon_sort_indices = np.argsort(lon_translate)

        # ordered longitude arrays
        lon_ordered = lon_translate[lon_sort_indices]

        # rebuild u/v data with correct longitude sorting (monotonic increasing) 
        u_data_cleaned = u_data_raw[lat_sort_indices,:][:,lon_sort_indices]
        v_data_cleaned = v_data_raw[lat_sort_indices,:][:,lon_sort_indices]

        # assign the raw data to a variable so we can pickle it for use with other scripts
        raw_data = {'lat': lat_ordered, 'lon': lon_ordered, 'u_vel': u_data_cleaned, 'v_vel': v_data_cleaned,
            'datetime': formatted_folder_date, 'level': level, 'time_origin': time_origin}

        # create interpolation functions
        u_interp_func = interpolate.interp2d(lon_ordered, lat_ordered, u_data_cleaned, kind='cubic')
        v_interp_func = interpolate.interp2d(lon_ordered, lat_ordered, v_data_cleaned, kind='cubic')

        output_lat_array = np.arange(int(min(lat)),int(max(lat))+0.5,0.5) # last point is excluded with arange (80 to -80)
        output_lon_array = np.arange(-180,180.5,0.5) # last point is excluded with arange (-180 to 180)

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
        			'refTime': datetime.datetime.strftime(forecast_time,'%Y-%m-%d %H:%M:%S'),
                    'timeOrigin': datetime.datetime.strftime(time_origin,'%Y-%m-%d %H:%M:%S'),
        			},
        			'data': [float('{:.3f}'.format(el)) if np.abs(el) > 0.0001 else 0 for el in u_data_interp[::-1].flatten().tolist()]
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
        			'refTime': datetime.datetime.strftime(forecast_time,'%Y-%m-%d %H:%M:%S'),
                    'timeOrigin': datetime.datetime.strftime(time_origin,'%Y-%m-%d %H:%M:%S'),
        			},
        			'data': [float('{:.3f}'.format(el)) if np.abs(el) > 0.0001 else 0 for el in v_data_interp[::-1].flatten().tolist()]
        		},
          ]

        s3 = boto3.client('s3')
        with io.BytesIO() as f:
            pickle.dump(raw_data,f,pickle.HIGHEST_PROTOCOL)
            f.seek(0)
            s3.upload_fileobj(f,AWS_BUCKET_NAME, output_pickle_path)

        with io.BytesIO() as f:
            f.write(json.dumps(output_data).encode())
            f.seek(0)
            s3.upload_fileobj(f,AWS_BUCKET_NAME, output_json_path)

        with io.BytesIO() as f:
            info = {'time_origin': datetime.datetime.strftime(time_origin,'%Y-%m-%d %H:%M:%S')}
            f.write(json.dumps(info).encode())
            f.seek(0)
            s3.upload_fileobj(f,AWS_BUCKET_NAME, output_info_path)

        # subset and save data by tile
        data_zoom_level = datasets[TOP_LEVEL_FOLDER]['sub_resource'][SUB_RESOURCE]['data_tiles_zoom_level']
        generate_pickle_files(raw_data, TOP_LEVEL_FOLDER, SUB_RESOURCE, output_tile_data_path, 
            data_zoom_level, AWS_BUCKET_NAME)