import express from 'express';
import aws from 'aws-sdk';
import request from 'request';

const apiGatewayRouter = express.Router();

// https://stackoverflow.com/questions/39301227/external-api-calls-with-express-node-js-and-require-module

apiGatewayRouter.get('/individual-field', function(req, res, next) {
  console.log('in the individual-field route!!');
  console.log(process.env.INDIVIDUAL_FIELD_ENDPOINT);
  request({
    uri: `${process.env.INDIVIDUAL_FIELD_ENDPOINT}`,
    headers: {
      'x-api-key': process.env.AWS_API_GATEWAY_KEY
    },
    qs: req.query,
    
  }).pipe(res);
  
});

export default apiGatewayRouter;

