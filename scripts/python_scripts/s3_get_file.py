import boto3
import json
import pdb

# s3 = boto3.resource('s3')
s3 = boto3.client('s3')

bucket = 'oceanmapper-data-storage'
key = 'example.json'

try:
	raw_data = s3.get_object(Bucket=bucket, Key=key)
	data = json.loads(raw_data['Body'].read().decode('utf-8'))
	#pdb.set_trace()
	print(data)
except Exception as e:
	print('Error getting object {} from bucket {}. Make sure they exist and your bucket is in the same region as this function.'.format(key, bucket))