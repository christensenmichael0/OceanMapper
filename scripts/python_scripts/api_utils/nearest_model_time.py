import numpy as np
import datetime

def get_available_model_times(dataset_folder,sub_resource_folder,model_time_datetime,
        level_formatted,file_type,availability_struct):
    """
    get_available_model_times(dataset_folder,sub_resource_folder,model_time_datetime,
        level_formatted,file_type,availability_struct)

    This function is used to get the nearest available time with data for a specific model
    -----------------------------------------------------------------------
    Inputs: 
    dataset_folder (str): the s3 'folder' to search
    sub_resource_folder (str): the s3 sub folder to search (i.e. ocean_current_speeds)
    model_time_datetime (datetime): the requested time to search against
    level_formatted (str): the level (altitude/depth) of the data (i.e. 10m)
    file_type (str): one of [json, pickle]
    availability_struct (obj): information on data availability for environmental datasets stored on S3
    -----------------------------------------------------------------------
    Output: datetime representing the nearest available time (looking in reverse)
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 09/20/2018
    """
    dataset_type = file_type
    available_times = availability_struct[dataset_folder][sub_resource_folder]['level'][level_formatted][dataset_type]

    available_times_dt = [datetime.datetime.strptime(datetime_str,'%Y%m%d_%H') 
        for datetime_str in available_times]

    # turn into numpy array (unique and sorted)
    available_times_dt_array = np.unique(np.array(available_times_dt))
    trimmed_available_times = available_times_dt_array[available_times_dt_array <= model_time_datetime]

    # select the last time
    available_time = None # default value
    data_key = None
    if len(trimmed_available_times):
        available_time = trimmed_available_times[-1]
        # if available time is more than 24 hours before requested time then return no data
        time_req_diff = model_time_datetime - available_time

        if time_req_diff > datetime.timedelta(hours=24):
            available_time = None
       
        return available_time
