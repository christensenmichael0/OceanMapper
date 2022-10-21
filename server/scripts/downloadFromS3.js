import express from 'express';
import s3Obj from './awsS3Obj';

const downloadFromS3Router = express.Router();
downloadFromS3Router.get('/:filename', (req, res) => {
  const s3 = s3Obj;

  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: req.params.filename
  };

   s3.getObject(s3Params, function (error, data) {
      if (error != null) {
      	res.json({"error": error});
      } else {
        // Convert Body from a Buffer to a String
        res.write(data.Body.toString('utf-8'));
        res.end();
      }
    }
  ); 
});

export default downloadFromS3Router;
