import express from 'express';
import aws from 'aws-sdk';
import request from 'request';

const apiGatewayRouter = express.Router();

// https://stackoverflow.com/questions/39301227/external-api-calls-with-express-node-js-and-require-module

apiGatewayRouter.get('/individual-field', function(req, res, next) {
  // TODO: parse the query parameters here and feed qs
  console.log(req.query);

  // request('http://www.google.com', function (error, response, body) {
  //   console.log('error:', error); // Print the error if one occurred
  //   console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  //   console.log('body:', body); // Print the HTML for the Google homepage.

  //   res.send(response).status(response.statusCode);
  // });

  request({
    uri: `${process.env.INDIVIDUAL_FIELD_ENPOINT}`,
    headers: {
      'x-api-key': process.env.AWS_API_GATEWAY_KEY
    },
    qs: {
      level: 0,
      time: '2018-11-30T02:00Z',
      sub_resource: 'ocean_current_speed',
      dataset: 'HYCOM_DATA'
    }
  }).pipe(res);
});


// apiGatewayRouter.get('/', (req, res) => {

//   // ${process.env.INDIVIDUAL_FIELD_ENPOINT}
//   res.status(200).send();
// });

export default apiGatewayRouter;