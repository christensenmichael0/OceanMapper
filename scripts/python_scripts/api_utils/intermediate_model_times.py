import numpy as np
import datetime

def get_model_times_in_range(dataset_folder,sub_resource_folder,model_start_time_datetime,
        model_end_time_datetime,level_formatted,file_type,availability_struct):
    """
    get_model_times_in_range(dataset_folder,sub_resource_folder,model_start_time_datetime,
        model_end_time_datetime,level_formatted,file_type,availability_struct)

    This function is used to find the available model times between a provided start
    and end time
    -----------------------------------------------------------------------
    Inputs: 
    dataset_folder (str): the s3 'folder' to search
    sub_resource_folder (str): the s3 sub folder to search (i.e. ocean_current_speeds)
    model_start_time_datetime (datetime): the requested start time of the timeseries range
    model_end_time_datetime (datetime): the requested end time of the timeseries range
    level_formatted (str): the level (altitude/depth) of the data (i.e. 10m)
    file_type (str): one of [json, pickle]
    availability_struct (obj): information on data availability for environmental datasets stored on S3
    -----------------------------------------------------------------------
    Output: an array of datetimes representing valid model times between a provided start and end time
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 10/13/2018
    """
    dataset_type = file_type
    available_times = availability_struct[dataset_folder][sub_resource_folder]['level'][level_formatted][dataset_type]

    available_times_dt = [datetime.datetime.strptime(datetime_str,'%Y%m%d_%H') 
        for datetime_str in available_times]

    # turn into numpy array (unique and sorted)
    available_times_dt_array = np.unique(np.array(available_times_dt))

    trimmed_available_times = available_times_dt_array[np.logical_and(available_times_dt_array >= model_start_time_datetime,
        available_times_dt_array <= model_end_time_datetime)]
       
    return trimmed_available_times
