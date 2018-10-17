import boto3
import datetime
import os
import re

s3 = boto3.resource('s3')
data_bucket = s3.Bucket('oceanmapper-data-storage')

datasets = ['HYCOM_DATA', 'RTOFS_DATA', 'WW3_DATA', 'GFS_DATA']

# get present time in UTC
utc_now = datetime.datetime.utcnow()

def lambda_handler(event, context):
	"""
	This function deletes files from s3 that are older than the 'keep_days'
	environment variable
	-----------------------------------------------------------------------
	Output: None

	"""
	keep_days = os.getenv('keep_days', 10)

	for dataset_value in datasets:
		for object in data_bucket.objects.filter(Prefix=dataset_value):
			pattern = r'\d{8}_\d{2}'
			match = re.search(pattern,object.key)

			if match:
				model_field_date = datetime.datetime.strptime(match.group(0),'%Y%m%d_%H')
				if model_field_date < (utc_now - datetime.timedelta(days=int(keep_days))):
					object.delete()

if __name__ == '__main__':
	lambda_handler('', '')