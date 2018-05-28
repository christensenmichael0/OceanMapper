import datetime
import netCDF4
import collections

def assemble_model_timesteps(available_data):
    """
    assemble_model_timesteps(available_data)

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
    
    RTOFS: nowcast --> only need the last nowcast field (the first 2 days are model spin up)
    RTOFS: forecast --> the first field is the same date as the nowcast and is all NaNs

    """

    # TODO: need to kepp track of the forecast indx 
    
    start_indx={'nowcast': 2, 'forecast': 1}
    time_array=[]
    info = collections.OrderedDict()

    for product_type in available_data.keys():
        info[product_type]={}
        info[product_type]['url'] = available_data[product_type]['url']
        info[product_type]['field_datetimes'] = [] # provide empty array
        info[product_type]['forecast_indx'] = [] # provide empty array
        
        file = netCDF4.Dataset(available_data[product_type]['url'])    
        product_times = file.variables['time'][start_indx[product_type]:]

        for forecast_indx, forecast_time in enumerate(product_times):
            basetime_int = int(forecast_time)
            extra_days = forecast_time - basetime_int

            # need to subtract 1 since RTOFS is days since 0001-01-01 (yyyy-mm-dd)
            full_forecast_time = (datetime.datetime.fromordinal(basetime_int) + 
            datetime.timedelta(days = extra_days) - datetime.timedelta(days=1))

            if len(time_array) == 0:
                time_array.append(full_forecast_time)
                info[product_type]['field_datetimes'].append(full_forecast_time)
                info[product_type]['forecast_indx'].append(start_indx[product_type] + forecast_indx)
            else:
                # make sure the time isnt already present and that it is also larger than the last time
                # in the time array
                if (full_forecast_time not in time_array and full_forecast_time > time_array[-1]):
                    time_array.append(full_forecast_time)
                    info[product_type]['field_datetimes'].append(full_forecast_time)
                    info[product_type]['forecast_indx'].append(start_indx[product_type] + forecast_indx)

        file.close()

    return info

