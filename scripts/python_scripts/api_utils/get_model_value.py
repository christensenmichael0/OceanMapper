import numpy as np
import pickle
from scipy import interpolate

import boto3

s3 = boto3.client('s3')
bucket = 'oceanmapper-data-storage'

def get_model_value(coords, data_key):

    try:
        pickle_data = s3.get_object(Bucket=bucket, Key=data_key)
        body_string = pickle_data['Body'].read()
        data = pickle.loads(body_string)
    except Exception as e:
        return

    if np.ma.is_masked(data['lat']):
        lat = data['lat'].data
    else:
        lat = data['lat']

    if np.ma.is_masked(data['lon']):
        lon = data['lon'].data
    else:
        lon = data['lon']

    import pdb; pdb.set_trace()

if __name__ == '__main__':
    
    coords=[-68.0,42]
    data_key='' # fill this in

    lambda_handler(event,'')
