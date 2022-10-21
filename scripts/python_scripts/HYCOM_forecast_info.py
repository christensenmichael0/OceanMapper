# -*- coding: utf-8 -*-
"""
Created on Mon Apr 09 19:12:40 2018

@author: Michael
"""

import datetime
import re
import urllib.request as urllib
from bs4 import BeautifulSoup
from utils.fetch_utils import get_opendapp_netcdf

def get_hycom_forecast_info(hycom_url):
    """
    get_hycom_forecast_info(hycom_url)

    This function assembles an object the latest available forecast date that
    contains the full forecast extent (168hrs) as well as an array of all opendapp 
    urls (1 for each timestep) as well as an array containing the various depth levels
    supported by this model.

    Model Info: https://www.hycom.org/dataserver/gofs-3pt1/analysis
    -----------------------------------------------------------------------
    Input: {string} hycom_url - the HYCOM forecast data catalog url

    i.e. http://tds.hycom.org/thredds/catalog/datasets/GLBv0.08/expt_93.0/data/forecasts/catalog.html
    -----------------------------------------------------------------------
    Output: object with this structure:

    forecast_info = {forecast: {'latest_date': 'yyyymmdd', 'data_urls': [xxx, xxx, xxx], 
    'field_datetimes': [dt,dt...]}, 'levels': [0,2,...]}}

    """

    page = urllib.urlopen(hycom_url).read()
    soup = BeautifulSoup(page, 'html.parser')
    soup.prettify()

    forecast_dict = {}
    for anchor in soup.findAll('a', href=True):
        anchor_str = anchor['href']
        match = re.search(r'FMRC_RUN_(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$', anchor_str)

        if match:
            forecast_year = int(match.group(1))
            forecast_month = int(match.group(2))
            forecast_day = int(match.group(3))
            forecast_hour = int(match.group(4))

            datetime_element = datetime.datetime(forecast_year, forecast_month, forecast_day, forecast_hour)
            forecast_hour_extent = forecast_hour

            forecast_dict.setdefault(datetime_element, []).append({'forecast_date': datetime_element,
                                                                   'forecast_hour_extent': forecast_hour_extent})

    # sort available unique forecast dates in reverse order so most recent is first
    unique_dates = sorted(forecast_dict.keys(), reverse=True)
    max_forecast_run_date = unique_dates[0]

    formatted_latest_date = datetime.datetime.strftime(max_forecast_run_date, '%Y-%m-%dT%H:%M:%SZ')

    output_url = f"https://tds.hycom.org/thredds/dodsC/GLBy0.08/expt_93.0/FMRC/runs/GLBy0.08_930_FMRC_RUN_{formatted_latest_date}"
    file = get_opendapp_netcdf(output_url)

    levels = file.variables['depth'][:]
    time = file.variables['time']
    base_time_str_match = re.search(r'(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})', time.units)
    base_time = datetime.datetime.strptime(base_time_str_match.group(0), '%Y-%m-%d %H:%M:%S')
    forecast_time_offsets = time[:]

    file.close()

    # assemble field datetimes
    field_datetimes = [base_time + datetime.timedelta(hours=hour_offset) for hour_offset in forecast_time_offsets]

    forecast_info = {
        'forecast': {
            'latest_date': datetime.datetime.strftime(max_forecast_run_date, '%Y%m%d_%H%M'),
            'data_url': output_url,
            'field_datetimes': field_datetimes,
            'levels': [int(lev) for lev in levels.tolist()],
            'forecast_time_indx': list(range(len(field_datetimes)))
        }
    }

    return forecast_info


if __name__ == "__main__":
    hycom_url = "https://tds.hycom.org/thredds/catalog/GLBy0.08/expt_93.0/FMRC/runs/catalog.html"
    get_hycom_forecast_info(hycom_url)
