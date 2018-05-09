# -*- coding: utf-8 -*-
"""
Created on Mon Apr  2 17:20:30 2018

@author: user1
"""


import json
# import boto3
import numpy as np
from scipy import interpolate
from scipy.interpolate import griddata, RegularGridInterpolator
from matplotlib import pyplot as plt
import netCDF4
import pdb

def lambda_handler(event, context):	
	url = 'http://nomads.ncep.noaa.gov:9090/dods/rtofs/rtofs_global20180508/rtofs_glo_2ds_nowcast_daily_prog'
	file = netCDF4.Dataset(url)
	lat  = file.variables['lat'][:]
	lon  = file.variables['lon'][:]

	# transform masked values to 0
	u_data_raw = file.variables['u_velocity'][0,0,:,:]
	v_data_raw = file.variables['u_velocity'][0,0,:,:]
	
	u_data_mask_applied = np.where(~u_data_raw.mask, u_data_raw, 0)
	v_data_mask_applied = np.where(~v_data_raw.mask, v_data_raw, 0)

	file.close()

	# rtofs longitudes go from 74.16 to 434.06227 -- remap and sort to -180 to 180 grid
	lon_translate = np.where(lon>180, lon-360.0, lon)
	lon_sort_indices = np.argsort(lon_translate)

	# ordered longitude array
	lon_ordered = lon_translate[lon_sort_indices]

	# rebuild u/v data with correct longitude sorting (monotonic increasing)
	u_data_cleaned = np.array([lat_row[lon_sort_indices] for lat_row in u_data_mask_applied])
	v_data_cleaned = np.array([lat_row[lon_sort_indices] for lat_row in v_data_mask_applied])

	minLat = np.min(lat)
	maxLat = np.max(lat)
	minLon = np.min(lon)
	maxLon = np.max(lon)

	dx = np.diff(lon)[0]
	dy = np.diff(lat)[0]

	output_lat_array = np.arange(-90,90.5,0.5) # last point is excluded with arange (-90 to 90)
	output_lon_array = np.arange(-180,180.5,0.5) # last point is excluded with arange (-180 to 180)

	u_interp_func = interpolate.interp2d(lon_ordered, lat, u_data_cleaned, kind='cubic')
	v_interp_func = interpolate.interp2d(lon_ordered, lat, v_data_cleaned, kind='cubic')

	u_data_interp = u_interp_func(output_lon_array, output_lat_array)
	v_data_interp = v_interp_func(output_lon_array, output_lat_array)
	# plt.imshow(u_data_interp, interpolation='none')
	# plt.show(block=True)

	pdb.set_trace()
	#build the correct format
	
	output_data = [
		{'header': {
			'parameterUnit': "m.s-1",
			'parameterNumber': 2,
			'dx': dx,
			'dy': dy,
			'parameterNumberName': "Eastward current",
			'la1': minLat,
			'la2': minLon,
			'parameterCategory': 2,
			'lo1': minLon,
			'lo2': maxLon,
			'nx': len(output_lon_array),
			'ny': len(output_lat_array),
			'refTime': "2017-02-01 23:00:00",
			},
			'data': u_data_interp.flatten().tolist()
		},
		{'header': {
			'parameterUnit': "m.s-1",
			'parameterNumber': 2,
			'dx': dx,
			'dy': dy,
			'parameterNumberName': "Northward current",
			'la1': minLat,
			'la2': maxLat,
			'parameterCategory': 2,
			'lo1': minLon,
			'lo2': maxLon,
			'nx': len(output_lon_array),
			'ny': len(output_lat_array),
			'refTime': "2017-02-01 23:00:00",
			},
			'data': v_data_interp.flatten().tolist()
		},
	]

	# output_data = {
	# 'blah1': 1,
	# 'blah2': 2
	# }
	
	with open('data.json', 'w') as f:
		json.dump(output_data, f)
	


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
