# -*- coding: utf-8 -*-
"""
Created on Mon Apr 09 19:12:40 2018

@author: Michael
"""

import datetime
import re
import urllib.request as urllib

import numpy as np
from bs4 import BeautifulSoup

from utils.fetch_utils import get_opendapp_netcdf


def get_ww3_forecast_info(ww3_url):
    """
    get_ww3_forecast_info(ww3_url)

    This function assembles an array tuples containing the model forecast field datetime
    as well as the index of the forecast field. This facilitates to concurrent downloads of model data.
    -----------------------------------------------------------------------
    Input: {string} ww3_url - displays available Wave Watch 3 forecast model runs 

    i.e. https://nomads.ncep.noaa.gov:9090/dods/wave/nww3
    -----------------------------------------------------------------------
    Output: array of tuples with this structure:

    forecast_info = [(forecast_indx, forecast_field_datetime), ...]
	-----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 02/06/2019
    """
    
    page = urllib.urlopen(ww3_url).read()
    soup = BeautifulSoup(page,'html.parser')
    soup.prettify()
    
    date_array = np.array([])
    for datetime_element in soup.findAll('b'):
        match = re.search(r'(\d{8})[/]:$', datetime_element.string)
    
        if match:
            unformatted_date = match.group(1)
            datetime_element = datetime.datetime.strptime(unformatted_date,'%Y%m%d')
            date_array = np.append(date_array, datetime_element)
    
    max_forecast_run_date = np.max(date_array)
    formatted_latest_date = datetime.datetime.strftime(max_forecast_run_date, '%Y%m%d')

    # find the latest run using bs4
    forecast_run_url = ww3_url + "/" + formatted_latest_date
    page = urllib.urlopen(forecast_run_url).read()
    soup = BeautifulSoup(page,'html.parser')
    soup.prettify()

    for model_run in soup.findAll('b'):
        match = re.search(r'gfswave.global.0p25_(\d{2})z', model_run.string)

        if match:
            run_name = match.group(0)

    # build forecast field datetime/indx array
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

        # need to subtract 1 since WW3 is days since 0001-01-01 (yyyy-mm-dd)
        full_forecast_time = (datetime.datetime.fromordinal(basetime_int) + 
        datetime.timedelta(days = extra_days) - datetime.timedelta(days=1))
        forecast_info['data'].append((forecast_indx, full_forecast_time))

    return forecast_info

if __name__ == '__main__':
    ww3_url = 'https://nomads.ncep.noaa.gov:9090/dods/wave/nww3'
    get_ww3_forecast_info(ww3_url)



