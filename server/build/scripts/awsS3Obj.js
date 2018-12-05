'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_awsSdk2.default.config.region = process.env.AWS_REGION;

var s3Obj = new _awsSdk2.default.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

exports.default = s3Obj;