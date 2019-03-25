import boto3
import datetime
import json

s3 = boto3.client('s3')

def get_model_init(key, bucket):
    raw_data = s3.get_object(Bucket=bucket, Key=key)
    
    try:
    	json_data = json.loads(raw_data['Body'].read().decode('utf-8'))
    	init_time = datetime.datetime.strptime(json_data['time_origin'],'%Y-%m-%d %H:%M:%S')
    except Exception as e:
    	return None

    return init_time