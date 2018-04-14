# -*- coding: utf-8 -*-
"""
Created on Mon Apr  2 17:20:30 2018

@author: user1
"""

import netCDF4
import json

url = 'http://nomads.ncep.noaa.gov:9090/dods/rtofs/rtofs_global20180408/rtofs_glo_2ds_nowcast_daily_prog'
file = netCDF4.Dataset(url)
lat  = (file.variables['lat'][:]).tolist()
lon  = (file.variables['lon'][:]).tolist()
data=(file.variables['u_velocity'][1,1,:,:]).tolist()
file.close()
output_data = {'lat': lat, 'lon': lon, 'u_vel': data}
json.dumps(output_data)
