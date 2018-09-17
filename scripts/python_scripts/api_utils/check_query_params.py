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
    Date Modified: 09/16/2018
    """
    query_param_checker_mapping = {
        'time': (check_time_param, []),
        'model': (check_model_param, []),
        'sub_resource': (check_model_subresources_param,[]),
        'level': (check_level_param, []),
        'coordinates': (check_coordinates_param, [])
    }

    query_param_status = {}
    for param in required_query_params:
        query_param_status[param] = {'status': 'FAIL'} # default to fail then update
        func, func_args = query_param_checker_mapping[param]
        
        input = event_query_params['queryStringParameters'][param] or None
        
        # need to keep track of the model in certain cases
        try:
            model = event_query_params['queryStringParameters']['model']
        except Exception as e:
            model = None

        if param == 'model':
            func_args.extend([input, datasets])
        elif param == 'level':
            func_args.extend([input, model, datasets, availability_struct])
        elif param == 'sub_resource':
            func_args.extend([input, model, datasets])
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


def check_time_param(model_time):
    datetime_pattern=r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z'
    datetime_match = re.search(datetime_pattern,model_time)
    
    if datetime_match:
        return 'OK'
    else:
        return 'FAIL'


def check_model_param(model,datasets):
    valid_model = model in datasets.keys()
    
    if valid_model:
        return 'OK'
    else:
        return 'FAIL'

def check_model_subresources_param(sub_resource,model,datasets):
    valid_sub_resource = sub_resource in datasets[model]['sub_resources']
    
    if valid_sub_resource:
        return 'OK'
    else:
        return 'FAIL'


def check_level_param(level, model, datasets, availability_struct):
    if not level and model == 'ww3_data':
        return 'OK'
    else:
        try:
            level_formatted = level + 'm'
            dataset_folder = datasets[model]['s3_folder']
            if level_formatted in availability_struct[dataset_folder]['level'].keys():
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
        'hycom_currents': {
            's3_folder': 'HYCOM_OCEAN_CURRENTS_3D',
            'overlay_type': 'ocean',
            'data_type': 'json', 
            'scalar_tiles': True, 
            'vector_tiles': False
        },
        'rtofs_currents': {
            's3_folder': 'RTOFS_OCEAN_CURRENTS_3D',
            'overlay_type': 'ocean',
            'data_type': 'json',
            'scalar_tiles': True, 
            'vector_tiles': False
        },
        'gfs_winds': {
            's3_folder':'GFS_WINDS',
            'overlay_type': 'all',
            'data_type': 'json',
            'scalar_tiles': True, 
            'vector_tiles': False
        },
        'ww3_data': {
            's3_folder': 'WAVE_WATCH_3',
            'sub_resources': ['sig_wave_height','primary_wave_dir','primary_wave_period'],
            'overlay_type': 'ocean',
            'data_type': 'pickle',
            'scalar_tiles': True, 
            'vector_tiles': True
        }
    }
    
    event = {
        "queryStringParameters": {
            "level": "10",
            "model": "hycom_currents",
            "time": "2018-09-13T08:00Z",
            "coordinates": "-72.0,42.0"
        }
    }

    required_query_params = ['time','model','level','coordinates']
    check_query_params(event,required_query_params, datasets)