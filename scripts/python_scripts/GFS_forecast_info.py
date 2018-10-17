# -*- coding: utf-8 -*-
"""
Created on Mon Apr 09 19:12:40 2018

@author: Michael
"""

import urllib.request as urllib
from bs4 import BeautifulSoup
import datetime
import numpy as np
import re
from utils.fetch_utils import get_opendapp_netcdf


def get_gfs_forecast_info(gfs_url):
    """
    get_gfs_forecast_info(gfs_url)

    This function assembles an array tuples containing the model forecast field datetime
    as well as the index of the forecast field. This facilitates to concurrent downloads of model data.
    -----------------------------------------------------------------------
    Input: {string} gfs_url - displays available GFS forecast model runs 

    i.e. http://nomads.ncep.noaa.gov:9090/dods/gfs_0p25
    -----------------------------------------------------------------------
    Output: array of tuples with this structure:

    forecast_info = [(forecast_indx, forecast_field_datetime), ...]

    """
    
    page = urllib.urlopen(gfs_url).read()
    soup = BeautifulSoup(page,'html.parser')
    soup.prettify()

    date_array = np.array([])
    for anchor in soup.findAll('a', href=True):
        anchor_str = anchor['href']
        match = re.search(r'gfs(\d{8})$', anchor_str)
    
        if match:
            unformatted_date = match.group(1)
            datetime_element = datetime.datetime.strptime(unformatted_date,'%Y%m%d')
            date_array = np.append(date_array, datetime_element)
    
    max_forecast_run_date = np.max(date_array)
    formatted_latest_date = datetime.datetime.strftime(max_forecast_run_date, '%Y%m%d')

    # find the latest run using bs4
    forecast_run_url = gfs_url +'/gfs' + formatted_latest_date
    page = urllib.urlopen(forecast_run_url).read()
    soup = BeautifulSoup(page,'html.parser')
    soup.prettify()

    forecast_run_array = {}
    for model_run in soup.findAll('b'):
        match = re.search(r'(gfs_.*_(\d{2})z):$', model_run.string)
    
        if match:
            run_name = match.group(1)
            forecast_run_hour = match.group(2)
            forecast_run_array.setdefault(int(forecast_run_hour), run_name)

    # build forecast field datetime/indx array
    max_run = max(forecast_run_array.keys())
    opendapp_url = forecast_run_url + '/' + run_name
    file = get_opendapp_netcdf(opendapp_url)
    product_times = file.variables['time'][:]
    file.close()

    forecast_info = {}
    forecast_info['url'] = opendapp_url
    forecast_info['data'] = []
    for forecast_indx, forecast_time in enumerate(product_times):
        basetime_int = int(forecast_time)
        extra_days = forecast_time - basetime_int

        # need to subtract 1 since GFS is days since 0001-01-01 (yyyy-mm-dd)
        full_forecast_time = (datetime.datetime.fromordinal(basetime_int) + 
        datetime.timedelta(days = extra_days) - datetime.timedelta(days=1))
        forecast_info['data'].append((forecast_indx, full_forecast_time))

    return forecast_info

if __name__ == "__main__":
    gfs_url = 'http://nomads.ncep.noaa.gov:9090/dods/gfs_0p25'
    get_gfs_forecast_info(gfs_url)



