import collections
import datetime

import netCDF4


def assemble_model_timesteps(available_data, model_res):
    """
    assemble_model_timesteps(available_data, model_res)

    This function assembles the available model times and associated urls
    -----------------------------------------------------------------------
    Input: object with this structure:

    available_data ={'nowcast': {'latest_date': 'yyyymmdd', 'url': xxxx},
        'forecast': {'latest_date': 'yyyymmdd', 'url': xxxx}
    -----------------------------------------------------------------------
    Output: object with this structure (dt=python datetime):

    info = {'nowcast': {'url': xxx, 'field_datetimes': [dt,dt,dt]}, 
        'forecast': {url: xxx, 'field_datetimes': [dt, dt, dt]}}

    -----------------------------------------------------------------------
    Other info:
    
    RTOFS: nowcast --> only need the last nowcast field (all prior fields are model spin up)
    RTOFS: forecast --> the first field is the same date as the nowcast and is all NaNs
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 10/21/2022
    """

    # the first 15 fields are model initialization when working with 3hrly data
    start_info = {'daily': {'nowcast': 1, 'forecast': 1}, '3hrly': {'nowcast': 16, 'forecast': 1}}

    info = {}
    info['products'] = collections.OrderedDict()
    info['general'] = {}
    info['general']['levels'] = []

    for product_type in available_data.keys():
        time_array = []

        info['products'][product_type] = {}
        info['products'][product_type]['url'] = available_data[product_type]['url']
        info['products'][product_type]['field_datetimes'] = []  # provide empty array
        info['products'][product_type]['forecast_indx'] = []  # provide empty array

        file = netCDF4.Dataset(available_data[product_type]['url'])
        product_times = file.variables['time'][start_info[model_res][product_type]:]
        levels = file.variables['lev'][:]

        for forecast_indx, forecast_time in enumerate(product_times):
            basetime_int = int(forecast_time)
            extra_days = forecast_time - basetime_int

            # need to subtract 1 since RTOFS is days since 0001-01-01 (yyyy-mm-dd)
            full_forecast_time = (datetime.datetime.fromordinal(basetime_int) +
                                  datetime.timedelta(days=extra_days) - datetime.timedelta(days=1))

            time_array.append(full_forecast_time)
            info['products'][product_type]['field_datetimes'].append(full_forecast_time)
            info['products'][product_type]['forecast_indx'].append(
                start_info[model_res][product_type] + forecast_indx)

        file.close()

    # add levels to output data structure
    info['general']['levels'] = [int(lev) for lev in levels.tolist()]

    return info
