# -*- coding: utf-8 -*-
"""
Created on Mon Apr  2 17:20:30 2018

@author: user1
"""


import json
# import boto3
import numpy as np
import netCDF4
import pdb

def lambda_handler(event, context):

	
	url = 'http://nomads.ncep.noaa.gov:9090/dods/rtofs/rtofs_global20180423/rtofs_glo_2ds_nowcast_daily_prog'
	file = netCDF4.Dataset(url)
	#lat  = (file.variables['lat'][:]).tolist()
	lat  = file.variables['lat'][:]
	#lon  = (file.variables['lon'][:]).tolist()
	lon  = file.variables['lon'][:]
	# data=(file.variables['u_velocity'][0,0,:,:]).tolist()
	u_data_raw = file.variables['u_velocity'][0,0,:,:].flatten()
	u_data_clean = np.where(u_data_raw == None, 0, u_data_raw)
	file.close()

	minLat = np.min(lat)
	maxLat = np.max(lat)
	minLon = np.min(lon)
	maxLon = np.max(lon)

	dx = np.diff(lon)[0]
	dy = np.diff(lat)[0]

	
	
	"""
	with open('../../data_store/RTOFS/rtofs_json_data.json') as json_data:
	    jdata = json.load(json_data)
	
	cleaned_data = np.where(flat_data == None, 0, flat_data)
	"""

	pdb.set_trace()

	lon_translate = np.where(lon>360, lon-360.0, lon)

	

	


	#build the correct format
	"""
	[
		{
			header: {
			parameterUnit: "m.s-1",
			parameterNumber: 2,
			dx: dx,
			dy: dy,
			parameterNumberName: "Eastward current",
			la1: minLat,
			la2: minLon,
			parameterCategory: 2,
			lo1: minLon,
			lo2: maxLon,
			nx: 14,
			ny: 22,
			refTime: "2017-02-01 23:00:00",
			},
			data: [
			0,
			0,
			0,
			]
		},
		{
			header: {
			parameterUnit: "m.s-1",
			parameterNumber: 2,
			dx: 1,
			dy: 1,
			parameterNumberName: "Northward current",
			la1: -7.5,
			la2: -28.5,
			parameterCategory: 2,
			lo2: 156,
			nx: 14,
			ny: 22,
			refTime: "2017-02-01 23:00:00",
			lo1: 143
			},
			data: [
			0,
			0,
			0,
			]
		},
	]


	output_data = {'lat': lat, 'lon': lon, 'u_vel': data}
	data = json.dumps(output_data)

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
