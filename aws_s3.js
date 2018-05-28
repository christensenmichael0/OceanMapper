/**
* export an object containing an s3 instance and s3 parameters
*/

const aws = require('aws-sdk');
const S3_BUCKET = process.env.S3_BUCKET_NAME;

aws.config.region = 'us-east-1';
const s3 = new aws.S3();

const s3Params = {
  Bucket: S3_BUCKET,
  MaxKeys: 1000
};

module.exports = {
  s3: s3,
  s3Params: s3Params,
};
