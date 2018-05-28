# -*- coding: utf-8 -*-
"""
Created on Mon Apr  2 17:20:30 2018

@author: user1
"""


import json
# import boto3
import numpy as np
from scipy import interpolate
from matplotlib import pyplot as plt
from RTOFS_forecast_info import get_latest_RTOFS_forecast_time
from build_model_times import assemble_model_timesteps
import netCDF4
import pickle
import pdb



def lambda_handler(event, context):
    rtofs_url = 'http://nomads.ncep.noaa.gov:9090/dods/rtofs'
    available_data = get_latest_RTOFS_forecast_time(rtofs_url)

    output_info = assemble_model_timesteps(available_data)

    url = available_data['nowcast']['url']
    
    # TODO: set up loop to go through output_info
    for product_type in output_info.keys():
        file = netCDF4.Dataset(output_info[product_type]['url'])
        #TODO: properly indent the code below.. close the file on outer for loop
        #make sure saving and pickling are working.. save with certain file naming convention

        zipped_time_and_indx = np.array(tuple(zip(output_info[product_type]['field_datetimes'],output_info[product_type]['forecast_indx'])))
        
        for model_field in zipped_time_and_indx:
            pdb.set_trace()

            #file = netCDF4.Dataset(url)
            lat  = file.variables['lat'][:]
            lon  = file.variables['lon'][:]

            # transform masked values to 0
            u_data_raw = file.variables['u_velocity'][0,0,:,:] #[time,level,lat,lon]
            v_data_raw = file.variables['v_velocity'][0,0,:,:]
        	
            u_data_mask_applied = np.where(~u_data_raw.mask, u_data_raw, 0)
            v_data_mask_applied = np.where(~v_data_raw.mask, v_data_raw, 0)

            file.close()

            # rtofs longitudes go from 74.16 to 434.06227 -- remap and sort to -180 to 180 grid
            lon_translate = np.where(lon>180, lon-360.0, lon)
            lon_sort_indices = np.argsort(lon_translate)

            # ordered clongitude arrays
            lon_ordered = lon_translate[lon_sort_indices]

            # rebuild u/v data with correct longitude sorting (monotonic increasing) 
            u_data_cleaned = np.array([lat_row[lon_sort_indices] for lat_row in u_data_mask_applied])
            v_data_cleaned = np.array([lat_row[lon_sort_indices] for lat_row in v_data_mask_applied])

            # assign the raw data to a variable so we can pickle it for use with other scripts
            raw_data = {'lat': lat, 'lon': lon_ordered, 'u_vel': u_data_cleaned, 'v_vel': v_data_cleaned}
            
            # output_lat_array = np.arange(-90,90.5,0.5) # last point is excluded with arange (90 to -90)
            # output_lon_array = np.arange(-180,180.5,0.5) # last point is excluded with arange (-180 to 180)

            output_lat_array = np.arange(18,32,0.5) # last point is excluded with arange (-90 to 90)
            output_lon_array = np.arange(-100,-75.5,0.5) # last point is excluded with arange (-180 to 180)

            u_interp_func = interpolate.interp2d(lon_ordered, lat, u_data_cleaned, kind='cubic')
            v_interp_func = interpolate.interp2d(lon_ordered, lat, v_data_cleaned, kind='cubic')

            u_data_interp = u_interp_func(output_lon_array, output_lat_array)
            v_data_interp = v_interp_func(output_lon_array, output_lat_array)

            # plt.imshow(u_data_interp[::-1])
            # plt.savefig('blah.png', bbox_inches='tight',transparent=True, pad_inches=0)
            # save_image(u_data_interp, 'jet', 'blah.png')
        	
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
            			'refTime': "2017-02-01 23:00:00",
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
            			'refTime': "2017-02-01 23:00:00",
            			},
            			'data': [float('{:.3f}'.format(el)) if el > 0.01 else 0 for el in v_data_interp[::-1].flatten().tolist()]
            		},
              ]

        	
            with open('data.json', 'w') as f:
                json.dump(output_data, f)

            with open('data.pickle', 'wb') as f:
                # Pickle the 'data' dictionary using the highest protocol available.
                pickle.dump(data, f, pickle.HIGHEST_PROTOCOL)
        	


        	# output_data = {'lat': lat, 'lon': lon, 'u_vel': data}
        	# data = json.dumps(output_data)

            """
        	AWS_BUCKET_NAME = 'oceanmapper-data-storage'
        	    
        	s3 = boto3.resource('s3')
        	bucket = s3.Bucket(AWS_BUCKET_NAME)
        	path = 'rtofs_json_data.json'
        	# data = b'Here we have some new data'
        	bucket.put_object(
        		ACL='public-read',
        		ContentType='application/json',
        		Key=path,
        	Body=data,
        		)

        	body = {
        		"uploaded": "true",
        		"bucket": AWS_BUCKET_NAME,
        		"path": path,
        		}

        	return {
        		"statusCode": 200,
        		"body": json.dumps(body)
        	}
        	"""

	

if __name__ == "__main__":
	lambda_handler('','')
