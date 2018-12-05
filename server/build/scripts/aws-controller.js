'use strict';

// https://devdactic.com/ionic-aws-nodejs-1/
// app.get('/aws/files/:fileName', awsController.getFileSignedRequest);

var aws = require('aws-sdk');
// var secrets = require('./secrets');

var s3 = new aws.S3({
    signatureVersion: 'v4',
    region: 'us-east-2' // Change for your Region, check inside your browser URL for S3 bucket ?region=...
});

exports.signedRequest = function (req, res) {
    var fileName = req.query['file-name'];
    var fileType = req.query['file-type'];
    var s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Expires: 60,
        ContentType: fileType,
        ACL: 'private'
    };

    s3.getSignedUrl('putObject', s3Params, function (err, data) {
        if (err) {
            console.log(err);
            return res.end();
        }
        var returnData = {
            signedRequest: data,
            url: 'https://' + process.env.S3_BUCKET_NAME + '.s3.amazonaws.com/' + fileName
        };

        return res.json(returnData);
    });
};

exports.getFileSignedRequest = function (req, res) {
    var s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: req.params.fileName,
        Expires: 60
    };

    s3.getSignedUrl('getObject', s3Params, function (err, data) {
        return res.json(data);
    });
};

exports.listFiles = function (req, res) {
    var s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Delimiter: '/'
    };

    s3.listObjects(s3Params, function (err, data) {
        if (err) {
            console.log(err);
            return res.end();
        }
        return res.json(data);
    });
};

exports.deleteFile = function (req, res) {
    var s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: req.params.fileName
    };

    s3.deleteObject(s3Params, function (err, data) {
        if (err) {
            console.log(err);
            return res.end();
        }

        return res.status(200).send({ "msg": "File deleted" });
    });
};