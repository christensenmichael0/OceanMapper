import re
import datetime

def check_query_params(event_query_params, required_query_params, availability_struct, datasets):
    """
    check_query_params(event_query_params, required_query_params, availability_struct, datasets)

    This function is used to generalize the checking of whether or not specific
    query parameters are valid.
    -----------------------------------------------------------------------
    Inputs: 
    event_query_params (obj) - the query parameters passed on the api call
    required_query_params (list) - a list of required params to check
    availability_struct (obj) - information on data availability for environmental datasets stored on S3
    datasets (obj) - basic information about environmental datasets stored on S3
    -----------------------------------------------------------------------
    Output: object detailing the status: OK or FAIL of specific query parameters
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 10/11/2018
    """
    query_param_checker_mapping = {
        'time': (check_time_param, []),
        'start_time': (check_time_param, []),
        'end_time': (check_time_param, []),
        'dataset': (check_dataset_param, []),
        'sub_resource': (check_dataset_subresources_param,[]),
        'level': (check_level_param, []),
        'coordinates': (check_coordinates_param, [])
    }

    query_param_status = {}
    for param in required_query_params:
        query_param_status[param] = {'status': 'FAIL'} # default to fail then update
        func, func_args = query_param_checker_mapping[param]
        
        input = event_query_params['queryStringParameters'][param] or None
        
        # need to keep track of the specific_dataset in certain cases
        try:
            specific_dataset = event_query_params['queryStringParameters']['dataset']
            sub_resource = event_query_params['queryStringParameters']['sub_resource']
        except Exception as e:
            specific_dataset = None
            sub_resource = None

        if param == 'dataset':
            func_args.extend([input, datasets])
        elif param == 'level':
            func_args.extend([input, specific_dataset, sub_resource, datasets, availability_struct])
        elif param == 'sub_resource':
            func_args.extend([input, specific_dataset, datasets])
        else:
            func_args.append(input)
        output_status = func(*func_args)

        query_param_status[param]['status'] = output_status

    return query_param_status

def filter_failed_params(query_param_validation):
    failed_query_param_obj = {}
    for param in query_param_validation:
        if query_param_validation[param]['status'] == 'FAIL':
            failed_query_param_obj[param] = 'invalid'

    return failed_query_param_obj


def check_time_param(dataset_time):
    datetime_pattern=r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$'
    datetime_match = re.search(datetime_pattern,dataset_time)
    
    if datetime_match:
        return 'OK'
    else:
        return 'FAIL'


def check_dataset_param(specific_dataset,datasets):
    valid_dataset = specific_dataset in datasets.keys()
    
    if valid_dataset:
        return 'OK'
    else:
        return 'FAIL'

def check_dataset_subresources_param(sub_resource,specific_dataset,datasets):
    valid_sub_resource = sub_resource in datasets[specific_dataset]['sub_resource']
    
    if valid_sub_resource:
        return 'OK'
    else:
        return 'FAIL'


def check_level_param(level, specific_dataset, sub_resource, datasets, availability_struct):
    if not level and specific_dataset == 'WW3_DATA':
        return 'OK'
    else:
        try:
            level_formatted = level + 'm'
            if level_formatted in availability_struct[specific_dataset][sub_resource]['level'].keys():
                return 'OK'
            else:
                return 'FAIL'
        except Exception as e:
            return 'FAIL'


def check_coordinates_param(coordinates):
    coords = [float(coord) for coord in coordinates.split(',')]
    if (len(coords) == 2 and coords[0] >= -180 and coords[0] <= 180 and
        coords[1] >= -90 and coords[1] <= 90):
        return 'OK'
    else:
        return 'FAIL'



if __name__ == '__main__':

    datasets = {
    'HYCOM_DATA': {
        'sub_resource': {
            'ocean_current_speed': {
                's3_folder': 'ocean_current_speed',
                'data_prefix': 'hycom_currents',
                'overlay_type': 'ocean',
                'data_type': 'json', 
                'scalar_tiles': True, 
                'vector_tiles': False
            }
        }
    },
    'RTOFS_DATA': {
        'sub_resource': {
            'ocean_current_speed': {
                's3_folder': 'ocean_current_speed',
                'data_prefix': 'rtofs_currents',
                'overlay_type': 'ocean',
                'data_type': 'json', 
                'scalar_tiles': True, 
                'vector_tiles': False
            }
        }
    },
    'GFS_DATA': {
        'sub_resource': {
            'wind_speed': {
                's3_folder': 'wind_speed',
                'data_prefix': 'gfs_winds',
                'overlay_type': 'all',
                'data_type': 'json', 
                'scalar_tiles': True, 
                'vector_tiles': False
            }
        }
    },
    'WW3_DATA': {
        'sub_resource': {
            'sig_wave_height': {
                's3_folder': 'sig_wave_height',
                'data_prefix': 'ww3_htsgwsfc',
                'overlay_type': 'ocean',
                'data_type': 'json', 
                'scalar_tiles': True, 
                'vector_tiles': False
            },
            'primary_wave_dir': {
                's3_folder': 'primary_wave_dir',
                'data_prefix': 'ww3_dirpwsfc',
                'overlay_type': 'ocean',
                'data_type': 'json', 
                'scalar_tiles': False, 
                'vector_tiles': True
            },
            'primary_wave_period': {
                's3_folder': 'primary_wave_period',
                'data_prefix': 'ww3_perpwsfc',
                'overlay_type': 'ocean',
                'data_type': 'json', 
                'scalar_tiles': True, 
                'vector_tiles': False
            }
        }
    }
}
    
    event = {
        "queryStringParameters": {
            "level": "10",
            "dataset": "HYCOM_DATA",
            "sub_resource": "ocean_current_speed",
            "time": "2018-09-16T08:00Z",
            "coordinates": "-72.0,42.0"
        }
    }

    required_query_params = ['time','dataset','level','coordinates']
    check_query_params(event,required_query_params, datasets)