import sys
sys.path.append("..")

import urllib.request as urllib
from bs4 import BeautifulSoup
import netCDF4
import datetime
import numpy as np
import collections
import re
from harvest_utils.fetch_utils import get_opendapp_netcdf
from harvest_utils.data_endpoints import hycom_opendapp_root, hycom_data_prefix


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
    soup = BeautifulSoup(page,'html.parser')
    soup.prettify()

    forecast_dict = {}
    for anchor in soup.findAll('a', href=True):
        anchor_str = anchor['href']
        search_str = '{}'.format(hycom_data_prefix) + r'(\d{10})_t(\d{3})_uv3z.nc$'
        match = re.search(search_str, anchor_str)
    
        if match:
            unformatted_date = match.group(1)
            datetime_element = datetime.datetime.strptime(unformatted_date,'%Y%m%d%H')
            forecast_hour_extent = int(match.group(2))

            full_forecast_time = datetime_element + datetime.timedelta(hours = forecast_hour_extent)

            forecast_dict.setdefault(datetime_element, []).append({'forecast_date': full_forecast_time, 
                'forecast_hour_extent': forecast_hour_extent})

    # sort available unique forecast dates in reverse order so most recent is first
    unique_dates = sorted(forecast_dict.keys(),reverse=True)
    max_forecast_run_date = unique_dates[0]

    # use the forecast which gets full coverage (at this point in time its 168 hrs into the future)
    # deal with possibility of only 1 date available
    if len(unique_dates) > 1:
        previous_forecast_extent = forecast_dict[unique_dates[1]][-1]['forecast_hour_extent']
    else:
        previous_forecast_extent = 0 
    
    present_forecast_extent = forecast_dict[unique_dates[0]][-1]['forecast_hour_extent']

    if present_forecast_extent >= previous_forecast_extent:
        latest_date = unique_dates[0]
    else:
        latest_date = unique_dates[1]

    formatted_latest_date = datetime.datetime.strftime(latest_date, '%Y%m%d%H')
    # base_opendapp_url = 'http://tds.hycom.org/thredds/dodsC/datasets/GLBv0.08/expt_93.0/data/forecasts/hycom_glbv_930_'
    base_opendapp_url = '{}{}'.format(hycom_opendapp_root, hycom_data_prefix)

    data_urls = []
    field_datetimes=[]
    for forecast_field in forecast_dict[latest_date]:
        formatted_hour_extent = str(forecast_field['forecast_hour_extent']).zfill(3)
        output_url = base_opendapp_url + formatted_latest_date + '_t' + formatted_hour_extent + '_uv3z.nc'
        data_urls.append(output_url)
        field_datetimes.append(forecast_field['forecast_date'])

    forecast_info = {'forecast': {'latest_date': datetime.datetime.strftime(latest_date,'%Y%m%d_%H%M'), 
    'data_urls': data_urls, 'field_datetimes': field_datetimes}}

    # use the first data url to get the various depth levels (they are the same for each .nc file)
    file = get_opendapp_netcdf(data_urls[0])
    levels = file.variables['depth'][:]
    file.close()

    # add levels to output data structure
    forecast_info['levels'] = [int(lev) for lev in levels.tolist()]

    return forecast_info

if __name__ == "__main__":
    hycom_url = "http://tds.hycom.org/thredds/catalog/datasets/GLBv0.08/expt_93.0/data/forecasts/catalog.html"
    get_hycom_forecast_info(hycom_url)



