import json
import boto3

s3 = boto3.client('s3')

def grab_data_availability():
    """
    grab_data_availability()

    This function is used to read the data_availability.json file on s3 and convert to json
    -----------------------------------------------------------------------
    Inputs: no inputs
    -----------------------------------------------------------------------
    Output: the data availability object
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 09/16/2018
    """

    bucket='oceanmapper-data-storage'
    key='data_availability.json'

    try:
        raw_data = s3.get_object(Bucket=bucket, Key=key)
        availability_struct = json.loads(raw_data['Body'].read().decode('utf-8'))
        return availability_struct
    except Exception as e:
        return None