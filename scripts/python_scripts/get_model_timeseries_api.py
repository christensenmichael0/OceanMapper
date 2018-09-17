import boto3
import datetime
import json
import re

s3 = boto3.resource('s3')
data_bucket = s3.Bucket('oceanmapper-data-storage')

# mapping 

datasets = {
	'hycom_currents': 'HYCOM_OCEAN_CURRENTS_3D',
	'rtofs_currents': 'RTOFS_OCEAN_CURRENTS_3D/',
	'gfs_winds': 'GFS_WINDS/',
	'ww3_wave_height': 'WAVE_WATCH_3/'
	}

accepted_models = ['hycom_currents', 'rtofs_currents', 'gfs_winds', 
'ww3_wave_height', 'ww3_wave_period', 'ww3_wave_direction']


def lambda_handler(event, context):
	print(event)
	if event['queryStringParameters']:
		
		start_time_datetime = datetime.datetime.utcnow() # default
		if 'start_time' in event['queryStringParameters']:
			start_time = event['queryStringParameters']['start_time']
			datetime_pattern=r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z'
			datetime_match = re.search(datetime_pattern,start_time)
			
			if datetime_match:
				start_time_datetime = datetime.datetime.strptime(start_time,'%Y-%m-%dT%H:%MZ')

		end_time_datetime = datetime.datetime.utcnow() + datetime.timedelta(days=7) # default
		if 'end_time' in event['queryStringParameters']:
			end_time = event['queryStringParameters']['end_time']
			datetime_pattern=r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z'
			datetime_match = re.search(datetime_pattern,end_time)
			
			if datetime_match:
				end_time_datetime = datetime.datetime.strptime(end_time,'%Y-%m-%dT%H:%MZ')

		if 'models' in event['queryStringParameters']:
			models=[]
			for model in event['queryStringParameters']['models'].split(','):
				if model.lower() in accepted_models:
					models.append(model)

		fetch_models = models
		#TODO: get a list of model times where we have data
		import pdb; pdb.set_trace()
		model = 'hycom_currents'
		#dataset_value = datasets[models[0]]
		dataset_value = 'HYCOM_OCEAN_CURRENTS_3D'
		filtered_model_times = data_bucket.objects.filter(Prefix=dataset_value)

		available_times = []
		for object in data_bucket.objects.filter(Prefix=dataset_value):
			pattern = r'model_name_(\d{8}_\d{2})[.]pickle$'.replace('model_name',model)
			match = re.search(pattern,object.key)
			if match:
				model_field_date = datetime.datetime.strptime(match.group(1),'%Y%m%d_%H')
				if (model_field_date >= start_time_datetime and 
					model_field_date <= end_time_datetime):
					pass
					# add to list... 



		#TODO: return a response alerting of missing params if any of the required ones are missing
# try:
# 	response_body = {
# 		'models': models,
# 		'start_time': start_time,
# 		'end_time': end_time,
# 	};

# 	return {
# 		'statusCode': 200,
# 		'body': json.dumps(response_body),
# 		'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
# 	}

# except Exception as e:
# 	return {
# 		'statusCode': 400,
# 		'body': json.dumps(e.message),
# 		'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
# 	}

if __name__ == '__main__':
	
	event = {
		"queryStringParameters": {
			"models": "hycom_currents",
			"start_time": "2018-08-25T00:00Z",
			"end_time": "2018-08-28T00:00Z"
		}
	}

	lambda_handler(event,'')
	


# def clean_s3(keep_days=10):
# 	"""
#     clean_s3(keep_days)

#     This function deletes files from s3 that are older than the day number 
#     argument passed into the function
#     -----------------------------------------------------------------------
#     Input: {int} keep_days - number of days prior to now to keep files 

#     -----------------------------------------------------------------------
#     Output: None

#     """
# 	for dataset_key, dataset_value in datasets.items():
# 		for object in data_bucket.objects.filter(Prefix=dataset_value):
# 		    pattern = r'(\d{8}_\d{2})[.].*$'
# 		    match = re.search(pattern,object.key)
# 		    if match:
# 		    	model_field_date = datetime.datetime.strptime(match.group(1),'%Y%m%d_%H')
# 		    	if model_field_date < (utc_now - datetime.timedelta(keep_days)):
# 		    		object.delete()
		    
