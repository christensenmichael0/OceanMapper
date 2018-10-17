import boto3
import datetime
import json
import re

s3 = boto3.resource('s3')
AWS_BUCKET_NAME = 'oceanmapper-data-storage'

datasets = ['HYCOM_DATA', 'RTOFS_DATA', 'WW3_DATA', 'GFS_DATA']

def lambda_handler(event, context):

        data_bucket = s3.Bucket(AWS_BUCKET_NAME)
        availability_struct = {}
        
        for dataset_value in datasets:
            availability_struct[dataset_value] = {}
            filtered_objects = data_bucket.objects.filter(Prefix=dataset_value)

            for object in filtered_objects:
                
                pattern = r'model_folder/(\d{8}_\d{2})/(\w*)/?(\w*)/(json|pickle)/.*[.](json|pickle)$'.replace('model_folder',dataset_value)

                match = re.search(pattern,object.key)
                if match:
                    parsed_date = match.group(1)
                    parsed_sub_resource = match.group(2)
                    parsed_level = match.group(3)
                    parsed_type = match.group(4)

                    availability_struct[dataset_value].setdefault(parsed_sub_resource,{})  
                    availability_struct[dataset_value][parsed_sub_resource].setdefault('level',{})                    
                    availability_struct[dataset_value][parsed_sub_resource]['level'].setdefault(parsed_level,{})
                    availability_struct[dataset_value][parsed_sub_resource]['level'][parsed_level].setdefault(parsed_type,[]).append(parsed_date)

        # dump json file to s3
        output_json_path = 'data_availability.json'
        
        client = boto3.client('s3')
        client.put_object(Body=json.dumps(availability_struct), Bucket=AWS_BUCKET_NAME, Key=output_json_path)
    
if __name__ == '__main__':
    lambda_handler('','')
    
