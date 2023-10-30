import cluster from 'cluster';
import os from 'os';
import bodyParser from 'body-parser';
import express from 'express';
import path from 'path';
import morgan from 'morgan';
import errorHandler from 'errorhandler';

import downloadFromS3Router from './scripts/downloadFromS3';
import apiGatewayRouter from './scripts/apiGatewayRouter';

// Code to run if we're in the master process
if (cluster.isMaster) {
  // Count the machine's CPUs
  var cpuCount = os.cpus().length;
  console.log(`Number of available CPUs: ${cpuCount}`);

  // Create a worker for each CPU
  for (var i = 0; i < cpuCount; i += 1) {
    cluster.fork();
  }
  // restart an exited worker
  cluster.on('exit', (worker, code, signal) => {
    console.log('worker %d died (%s). restarting...',
                worker.process.pid, signal || code);
    cluster.fork();
  });

} else {
  // worker process
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
  app.use('/download', downloadFromS3Router);
  app.use('/data', apiGatewayRouter);

  // for testing
  app.get('/test', (req, res) => {
    const cities = [
      {name: 'New York City', population: 8175133},
      {name: 'Los Angeles',   population: 3792621},
      {name: 'Chicago',       population: 2695598}
    ]
    res.json(cities)
  });

  // error handler here: (prior middleware should pass next(errorObj))
  app.use(errorHandler());

  app.use('/*', staticFiles)

  app.set('port', (process.env.PORT || 80))

  app.listen(app.get('port'), () => {
    console.log(`Worker ${cluster.worker.id} listening on ${app.get('port')}`)
  })
}
