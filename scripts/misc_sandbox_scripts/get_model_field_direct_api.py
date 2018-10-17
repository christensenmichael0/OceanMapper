import boto3
import datetime
import numpy as np
import json
import re

s3 = boto3.resource('s3')
bucket = 'oceanmapper-data-storage'

datasets = {
    'hycom_currents': 'HYCOM_OCEAN_CURRENTS_3D',
    'rtofs_currents': 'RTOFS_OCEAN_CURRENTS_3D/',
    'gfs_winds': 'GFS_WINDS/'
}

def lambda_handler(event, context):
    
    if event['queryStringParameters']:
        if 'time' in event['queryStringParameters']:
            model_time = event['queryStringParameters']['time']
            datetime_pattern=r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z'
            datetime_match = re.search(datetime_pattern,model_time)
            
            if datetime_match:
                model_time_datetime = datetime.datetime.strptime(model_time,'%Y-%m-%dT%H:%MZ')

        if 'model' in event['queryStringParameters']:
            model = event['queryStringParameters']['model']
            dataset_value = datasets[model]

        if 'level' in event['queryStringParameters']:
            level = event['queryStringParameters']['level']
            level_formatted = str(level) + 'm'

        # TODO: need to make sure all required query params are present before moving forward..
        # if not return some message 404... 

        # TODO: to speed things up should we be running some kind of chron job to keep track of what times
        # are available for each data source.. save that as json in a folder 

        data_bucket = s3.Bucket(bucket)
        filtered_model_times = data_bucket.objects.filter(Prefix=dataset_value)

        # empty arrays to be populated
        available_times = []
        available_keys = []

        for object in data_bucket.objects.filter(Prefix=dataset_value):
            pattern = r'model_folder/(\d{8}_\d{2})/level/json/.*[.]json$'.replace(
                'model_folder',dataset_value).replace('level',level_formatted)

            match = re.search(pattern,object.key)
            if match:
                model_field_date = datetime.datetime.strptime(match.group(1),'%Y%m%d_%H')
                
                if (model_field_date <= model_time_datetime):
                    available_times.append(model_field_date)
                    available_keys.append(object.key)

        # get nearest time (going backwards)
        available_times_arr = np.array(available_times)
        trimmed_available_times = available_times_arr[available_times_arr <= model_time_datetime]
        
        # select the last time
        available_time = None # default value
        data_key = None
        if len(trimmed_available_times):
            available_time = trimmed_available_times[-1]
            available_time_str = datetime.datetime.strftime(available_time,'%Y-%m-%dT%H:%MZ')
            available_indx = len(trimmed_available_times) - 1
            data_key = available_keys[available_indx]

            # get the file
            raw_data = s3.Object(bucket, data_key)

            try:
                response_body = {
                    'model': model,
                    'valid_time': available_time_str,
                    'data': raw_data.get()['Body'].read().decode('utf-8')
                }

                return {
                    'statusCode': 200,
                    'body': json.dumps(response_body),
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
                }
            except Exception as e:

                response_body = {
                    'status': 'data not available',
                }

                return {
                    'statusCode': 404,
                    'body': json.dumps(response_body),
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
                }

        else:
            response_body = {
                'model': model,
                'valid_time': None,
                'data': None
            }

            return {
                'statusCode': 200,
                'body': json.dumps(response_body),
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
            }

        
if __name__ == '__main__':
    
    event = {
        "queryStringParameters": {
            "level": 10,
            "model": "hycom_currents",
            "time": "2018-09-03T02:00Z"
        }
    }

    lambda_handler(event,'')
    
