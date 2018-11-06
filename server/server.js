/*
 * Import required packages.
 * Packages should be installed with "npm install".
 */
import bodyParser from 'body-parser';
import express from 'express';
import path from 'path';
import morgan from 'morgan';
import errorHandler from 'errorhandler';

import downloadFromS3Router from './scripts/downloadFromS3';

const app = express();
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: false}));

const router = express.Router();
const staticFiles = express.static(path.join(__dirname, '../../client/build'));
app.use(staticFiles);


const S3_BUCKET = process.env.S3_BUCKET_NAME;

// logging middleware 
app.use(morgan('dev'));

// add other routes below
app.use('/download', downloadFromS3Router)


// for testing
app.get('/cities', (req, res) => {
  const cities = [
    {name: 'New York City', population: 8175133},
    {name: 'Los Angeles',   population: 3792621},
    {name: 'Chicago',       population: 2695598}
  ]
  res.json(cities)
});

// error handler here: (prior middleware should pass next(errorObj))
app.use(errorHandler());

// 404 on failed get (doesnt exist)
// 400 dont do something for some reason
// 204 sucessful delete
// 200 sucessful get

app.use('/*', staticFiles)

app.set('port', (process.env.PORT || 3001))

app.listen(app.get('port'), () => {
  console.log(`Listening on ${app.get('port')}`)
})