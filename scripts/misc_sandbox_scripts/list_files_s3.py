import boto3
import pdb
# from boto.s3.key import Key

s3 = boto3.resource('s3')
my_bucket = s3.Bucket('oceanmapper-data-storage')

# k = Key(bucket,srcFileName)            #Get the key of the given object
# k.delete()                             #Delete the object

for object in my_bucket.objects.filter(Prefix='RTOFS_OC/0m/rtofs_currents'):
    print(object.key)
    pdb.set_trace()
