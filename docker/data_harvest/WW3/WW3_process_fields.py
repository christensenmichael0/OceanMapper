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
    TOP_LEVEL_FOLDER = 'WW3_DATA'
    SUB_RESOURCE_HTSGWSFC = 'sig_wave_height'
    SUB_RESOURCE_DIRPWSFC = 'primary_wave_dir'
    SUB_RESOURCE_PERPWSFC = 'primary_wave_period'

    with get_opendapp_netcdf(data_url) as file:
 
        formatted_folder_date = datetime.datetime.strftime(forecast_time,'%Y%m%d_%H')

        logger.info('processing WW3_DATA data: {}'.format(formatted_folder_date))

        # get model origin time
        init_time = file.variables['time'][0]
        basetime_int = int(init_time)
        extra_days = init_time - basetime_int
        time_origin = (datetime.datetime.fromordinal(basetime_int) + 
            datetime.timedelta(days = extra_days) - datetime.timedelta(days=1))

        lat  = file.variables['lat'][:]
        lon  = file.variables['lon'][:]

        # output model info.json filepath
        output_info_path = TOP_LEVEL_FOLDER + '/' + formatted_folder_date + '/info.json'

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

        raw_data_dirpwsfc = {'lat': lat_ordered, 'lon': lon_ordered,'primary_wave_dir': direction_data_cleaned,
            'time_origin': time_origin}

        raw_data_perpwsfc = {'lat': lat_ordered, 'lon': lon_ordered,'primary_wave_period': period_data_cleaned,
            'time_origin': time_origin}

        s3 = boto3.client('s3')
        pickle_tuple = [
            (raw_data_htsgwsfc, output_pickle_path_htsgwsfc),
            (raw_data_dirpwsfc, output_pickle_path_dirpwsfc), 
            (raw_data_perpwsfc,output_pickle_path_perpwsfc)
        ]

        for pkfile, pkpath in pickle_tuple:
            with io.BytesIO() as f:
                pickle.dump(pkfile,f,pickle.HIGHEST_PROTOCOL)
                f.seek(0)
                s3.upload_fileobj(f,AWS_BUCKET_NAME, pkpath) # fix output_pickle_path
        
        with io.BytesIO() as f:
            info = {'time_origin': datetime.datetime.strftime(time_origin,'%Y-%m-%d %H:%M:%S')}
            f.write(json.dumps(info).encode())
            f.seek(0)
            s3.upload_fileobj(f,AWS_BUCKET_NAME, output_info_path)

        # call an intermediate function to distribute pickling workload (subsetting data by tile)
        data_zoom_level_htsgwsfc = datasets[TOP_LEVEL_FOLDER]['sub_resource'][SUB_RESOURCE_HTSGWSFC]['data_tiles_zoom_level']
        generate_pickle_files(raw_data_htsgwsfc, TOP_LEVEL_FOLDER, SUB_RESOURCE_HTSGWSFC, output_tile_data_path_htsgwsfc, 
            data_zoom_level_htsgwsfc, AWS_BUCKET_NAME)

        data_zoom_level_dirpwsfc = datasets[TOP_LEVEL_FOLDER]['sub_resource'][SUB_RESOURCE_DIRPWSFC]['data_tiles_zoom_level']
        generate_pickle_files(raw_data_dirpwsfc, TOP_LEVEL_FOLDER, SUB_RESOURCE_DIRPWSFC, output_tile_data_path_dirpwsfc, 
            data_zoom_level_dirpwsfc, AWS_BUCKET_NAME)

        data_zoom_level_perpwsfc = datasets[TOP_LEVEL_FOLDER]['sub_resource'][SUB_RESOURCE_PERPWSFC]['data_tiles_zoom_level']
        generate_pickle_files(raw_data_perpwsfc, TOP_LEVEL_FOLDER, SUB_RESOURCE_PERPWSFC, output_tile_data_path_perpwsfc, 
            data_zoom_level_perpwsfc, AWS_BUCKET_NAME)

