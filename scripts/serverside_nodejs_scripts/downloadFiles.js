const express = require('express');
const { s3 } = require('../../aws_s3.js');
const S3_BUCKET = process.env.S3_BUCKET_NAME;


downloadFilesRouter = express.Router();

downloadFilesRouter.get('/', (req, res) => {
  // const fileName = req.query['file-name'];
  // const bucket = req.query['bucket'];

  // Key: "RTOFS_OC/0m/rtofs_currents_20160512_00.json"

  const s3Params = {
    Bucket: S3_BUCKET,
    Key: "RTOFS_OC/0m/rtofs_currents_20160512_00.json"
  };

   s3.getObject(s3Params, function (error, data) {
      if (error != null) {
        // alert("Failed to retrieve an object: " + error);
      } else {
        // alert("Loaded " + data.ContentLength + " bytes");

        // Convert Body from a Buffer to a String
        res.write(JSON.stringify(data.Body.toString('utf-8'))); //.toString('utf-8');

        
        // console.log(data.ContentLength + ' bytes');
        res.end();
      }
    }
  ); 
});

module.exports = downloadFilesRouter;