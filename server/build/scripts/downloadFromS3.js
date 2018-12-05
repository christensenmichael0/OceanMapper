'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _awsS3Obj = require('./awsS3Obj');

var _awsS3Obj2 = _interopRequireDefault(_awsS3Obj);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var downloadFromS3Router = _express2.default.Router();
downloadFromS3Router.get('/:filename', function (req, res) {
  var s3 = _awsS3Obj2.default;

  var s3Params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: req.params.filename
  };

  s3.getObject(s3Params, function (error, data) {
    if (error != null) {
      res.json({ "error": error });
    } else {
      // Convert Body from a Buffer to a String
      res.write(data.Body.toString('utf-8'));
      res.end();
    }
  });
});

exports.default = downloadFromS3Router;