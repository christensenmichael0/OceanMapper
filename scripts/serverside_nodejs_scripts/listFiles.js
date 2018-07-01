const express = require('express');
const aws = require('aws-sdk');
const { s3 } = require('../../aws_s3.js');

listFilesRouter = express.Router();

listFilesRouter.get('/', (req, res, next) => {
  s3.listObjects(s3Params, function(err, data) {
    if (err) {
      let error = new Error('There was an issue listing objects from S3');
      error.status = 400;
      next(error); // this passes error to error handling middleware in main server.js file

     	console.log(err, err.stack);
  	} else {
      // console.log(data);
      res.write(JSON.stringify(data));
      // TODO: middleware to compress the data? what is the difference between write and send
      res.end();
    }
  });
});

module.exports = listFilesRouter;