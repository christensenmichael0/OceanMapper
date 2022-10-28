import numpy as np
import pickle
from scipy import interpolate
import datetime
import time

import boto3
from functools import wraps

s3 = boto3.client('s3')
bucket = 'oceanmapper-data-storage'

def retry(ExceptionToCheck, tries=5, delay=.1):
    """
    retry(ExceptionToCheck, tries=4, delay=.1)

    Retry calling the decorated function a certain number of times with some 
    sleep interval between.
    -----------------------------------------------------------------------
    http://www.saltycrane.com/blog/2009/11/trying-out-retry-decorator-python/
    original from: http://wiki.python.org/moin/PythonDecoratorLibrary#Retry
    -----------------------------------------------------------------------
    Inputs:
    
    ExceptionToCheck (Exception or tuple): the exception to check. may be a tuple of exceptions to check
    tries (int): number of times to try (not retry) before giving up
    delay (float): delay between retries in seconds
    """
    def deco_retry(f):
        @wraps(f)
        def f_retry(*args, **kwargs):
            mtries, mdelay = tries, delay
            while mtries > 1:
                try:
                    return f(*args, **kwargs)
                except ExceptionToCheck as e:
                    time.sleep(mdelay)
                    mtries -= 1
            else:
                if 'conn' in kwargs:
                    conn.send(None)
                    conn.close()
                return

        return f_retry  # true decorator
    return deco_retry

@retry(Exception, tries=5, delay=.1)
def get_model_value(coords, data_key, sub_resource, dataset_vars, conn=None):
    """
    get_model_value(coords, data_key, sub_resource, dataset_vars, conn=None)

    -----------------------------------------------------------------------
    Inputs:
    coords: (array) - geographic coordinates
    data_key: (str) - the location of a file in s3 bucket
    sub_resource: (str) - the sub resource (i.e. HYCOM_DATA --> ocean_current_speed)
    dataset_vars: (array)- dataset variables(i.e. u_vel, v_vel)
    conn: (obj) - child connection object for multiprocessing
    -----------------------------------------------------------------------
    Notes:
    https://www.eol.ucar.edu/content/wind-direction-quick-reference
    -----------------------------------------------------------------------
    Output: 
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 10/23/2022

    """

    try:
        pickle_data = s3.get_object(Bucket=bucket, Key=data_key)
        body_string = pickle_data['Body'].read()
        data = pickle.loads(body_string)
    except Exception as e:
        raise Exception("Failed to load data from s3")

    if hasattr(data['lat'],'mask'):
        lat = data['lat'].data
    else:
        lat = data['lat']

    if hasattr(data['lon'],'mask'):
        lon = data['lon'].data
    else:
        lon = data['lon']

    interp_vals = []
    for var in dataset_vars:     
        if hasattr(data[var],'mask'):
            # transform masked values to 0
            data_raw = data[var].data
            # determine whether or not to apply the mask. If the mask is uniform (i.e. every item is false (unmasked) then the mask isn't helpful)
            all_masked = np.all(~data[var].mask)
            if ~all_masked:
                data_mask_applied = np.where(~data[var].mask, data_raw, 0)
            else:
                data_mask_applied = np.where(data_raw < data[var].fill_value, data_raw, 0)

            interp_func = interpolate.interp2d(lon, lat, data_mask_applied, kind='cubic')
            interp_vals.append(interp_func(coords[0], coords[1])[0])

    # get model time origin
    time_origin = datetime.datetime.strftime(data['time_origin'],'%Y-%m-%d %H:%M:%S')

    if sub_resource == 'ocean_current_speed' or sub_resource == 'wind_speed':
        u_vel = interp_vals[0]
        v_vel = interp_vals[1]

        var_abs = np.sqrt(u_vel**2 + v_vel**2)
        # if sub_resource is wind then convert this wind vector to the meteorological convention (from)
        if sub_resource == 'wind_speed':
            compass_deg = (270 - (np.arctan2(v_vel, u_vel) * (180/np.pi))) % 360
        elif sub_resource == 'ocean_current_speed':
            compass_deg = (90 - (np.arctan2(v_vel, u_vel) * (180/np.pi))) % 360

        output = {'val': var_abs, 'direction': compass_deg, 'time_origin': time_origin}
    else:
        output = {'val': interp_vals[0], 'time_origin': time_origin}
        if sub_resource == 'primary_wave_dir' and (output['val'] > 360 or output['val'] < 0):
            output['val'] = output['val'] % 360

    # if this is being used as part of a multiprocessing call need to send data via conn
    if conn:
        conn.send(output)
        conn.close()
    
    return output


if __name__ == '__main__':
    
    # coords=[-68.9337, 41.7016]
    # dataset_vars = ['u_vel','v_vel']
    # sub_resource = 'ocean_current_speed'
    # data_key='HYCOM_DATA/20221101_18/ocean_current_speed/0m/pickle/hycom_currents_20221101_18.pickle'

    # coords=[-68.9337, 41.7016]
    # dataset_vars = ['sig_wave_height']
    # sub_resource = 'sig_wave_height'
    # data_key='WW3_DATA/20221027_18/sig_wave_height/tiles/data/3/2/2.pickle'

    coords = [-68.9337, 41.7016]
    dataset_vars = ['primary_wave_dir']
    sub_resource = 'primary_wave_dir'
    data_key = 'WW3_DATA/20221027_18/primary_wave_dir/tiles/data/3/2/2.pickle'

    get_model_value(coords, data_key, sub_resource, dataset_vars, conn='mock_con')
