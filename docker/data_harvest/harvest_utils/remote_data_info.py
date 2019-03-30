import boto3
import datetime
import re

s3 = boto3.resource('s3')
AWS_BUCKET_NAME = 'oceanmapper-data-storage'

def get_max_date(dataset):
    '''
    '''

    data_bucket = s3.Bucket(AWS_BUCKET_NAME)
    filtered_objects = data_bucket.objects.filter(Prefix=dataset)

    s3_dates = []
    for object in filtered_objects:
        pattern = r'model_folder/(\d{8}_\d{2})/(\w*)/?(\w*)/(json|pickle)/.*[.](json|pickle)$'.replace('model_folder',dataset)

        match = re.search(pattern,object.key)
        if match:
            parsed_date = datetime.datetime.strptime(match.group(1),'%Y%m%d_%H')
            s3_dates.append(parsed_date)

    return max(s3_dates)