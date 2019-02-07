# -*- coding: utf-8 -*-
"""
Created on Mon Apr 09 19:12:40 2018

@author: Michael
"""

import urllib.request as urllib
from bs4 import BeautifulSoup
import datetime
import numpy as np
import collections
import re

def get_latest_RTOFS_forecast_time(rtofs_url, grid_dim='2d'):
    """
    get_latest_RTOFS_forecast_time(rtofs_url)

    This function assembles an object with the latest available date
    and data url for both the nowcast and forecast
    -----------------------------------------------------------------------
    Inputs: 
    {string} rtofs_url - the RTOFS opendap url
    {string} grid_dim - the RTOFS grid dimension '2d' or '3d' (i.e. the 2d surface data or 3d full water column data)


    ex: 'https://nomads.ncep.noaa.gov:9090/dods/rtofs/rtofs_global20180516/rtofs_glo_2ds_nowcast_daily_prog'
    -----------------------------------------------------------------------
    Output: object with this structure:

    available_data = {'nowcast': {'latest_date': 'yyyymmdd', 'url': xxx}, 
        'forecast': {'forecast': {'latest_date': 'yyyymmdd', 'url': xxx}}
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 06/06/2018
    """
    
    page = urllib.urlopen(rtofs_url).read()
    soup = BeautifulSoup(page,'html.parser')
    soup.prettify()

    date_array=np.array([])
    for anchor in soup.findAll('a', href=True):
        anchor_str = anchor['href']
        match = re.search(r'rtofs_global(\d{8})$', anchor_str)
    
        if match:
            unformatted_date = match.group(1)
            datetime_element = datetime.datetime.strptime(unformatted_date,'%Y%m%d')
            date_array = np.append(date_array, datetime_element)

    #sort available forecast dates in reverse order so most recent is first
    sorted_dates = np.sort(date_array)[::-1]
    sorted_dates_str = [datetime.datetime.strftime(d,'%Y%m%d') for d in sorted_dates]
    
    forecast_info = collections.OrderedDict()
    if grid_dim is '2d':
        nowcast_suffix = 'rtofs_glo_2ds_nowcast_3hrly_prog'
        forecast_suffix = 'rtofs_glo_2ds_forecast_3hrly_prog'
    else:
        # assume that if uvel is present vvel is also present
        nowcast_suffix = 'rtofs_glo_3dz_nowcast_daily_uvel'
        forecast_suffix = 'rtofs_glo_3dz_forecast_daily_uvel'
    
    if len(sorted_dates_str):
        for forecast_indx, forecast_date in enumerate(sorted_dates_str):
            rtofs_product_page_url = rtofs_url + '/rtofs_global' + sorted_dates_str[forecast_indx]
            rtofs_product_page = urllib.urlopen(rtofs_product_page_url).read().decode('utf-8')
            nowcast_data_available = nowcast_suffix in rtofs_product_page
            forecast_data_available = forecast_suffix in rtofs_product_page
            
            if nowcast_data_available and not 'nowcast' in forecast_info: 
                forecast_info['nowcast']={'latest_date': forecast_date, 
                    'url': rtofs_product_page_url + '/' + nowcast_suffix}
                    
            if forecast_data_available and not 'forecast' in forecast_info: 
                forecast_info['forecast']={'latest_date': forecast_date, 
                    'url': rtofs_product_page_url + '/' + forecast_suffix}

    #return a dictionary with the date and data_url to grab from
    return forecast_info

if __name__ == "__main__":
    rtofs_url = 'https://nomads.ncep.noaa.gov:9090/dods/rtofs'
    get_latest_RTOFS_forecast_time(rtofs_url)
