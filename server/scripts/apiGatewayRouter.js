import express from 'express';
import aws from 'aws-sdk';
import request from 'request';

const apiGatewayRouter = express.Router();

// creating a mapping object to facilitate condensing code below
const apiGatewayRouteMapping = {
  '/individual-field': process.env.INDIVIDUAL_FIELD_ENDPOINT,
  '/point-data': process.env.POINT_DATA_ENDPOINT,
  '/timeseries-data': process.env.TIMESERIES_DATA_ENDPOINT,
  '/profile-data': process.env.PROFILE_DATA_ENDPOINT
} 

// https://stackoverflow.com/questions/39301227/external-api-calls-with-express-node-js-and-require-module

apiGatewayRouter.get(['/individual-field', '/point-data', '/timeseries-data','/profile-data'], 
  function(req, res, next) {
  
  let path = req.path;
  let uri = apiGatewayRouteMapping[path];

  request({
    uri: uri,
    headers: {
      'x-api-key': process.env.AWS_API_GATEWAY_KEY
    },
    qs: req.query,
    
  }).pipe(res);
  
});

export default apiGatewayRouter;
