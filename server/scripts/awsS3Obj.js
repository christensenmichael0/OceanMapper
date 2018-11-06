import aws from 'aws-sdk';

aws.config.region = process.env.AWS_REGION;

let s3Obj = new aws.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

export default s3Obj;