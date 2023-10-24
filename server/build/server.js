'use strict';

var _cluster = require('cluster');

var _cluster2 = _interopRequireDefault(_cluster);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _errorhandler = require('errorhandler');

var _errorhandler2 = _interopRequireDefault(_errorhandler);

var _downloadFromS = require('./scripts/downloadFromS3');

var _downloadFromS2 = _interopRequireDefault(_downloadFromS);

var _apiGatewayRouter = require('./scripts/apiGatewayRouter');

var _apiGatewayRouter2 = _interopRequireDefault(_apiGatewayRouter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Code to run if we're in the master process
if (_cluster2.default.isMaster) {
  // Count the machine's CPUs
  var cpuCount = _os2.default.cpus().length;
  console.log('Number of available CPUs: ' + cpuCount);

  // Create a worker for each CPU
  for (var i = 0; i < cpuCount; i += 1) {
    _cluster2.default.fork();
  }
  // restart an exited worker
  _cluster2.default.on('exit', function (worker, code, signal) {
    console.log('worker %d died (%s). restarting...', worker.process.pid, signal || code);
    _cluster2.default.fork();
  });
} else {
  // worker process
  var app = (0, _express2.default)();
  app.use(_bodyParser2.default.json());
  // app.use(bodyParser.urlencoded({extended: false}));

  var router = _express2.default.Router();
  var staticFiles = _express2.default.static(_path2.default.join(__dirname, '../../client/build'));
  app.use(staticFiles);

  var S3_BUCKET = process.env.S3_BUCKET_NAME;

  // logging middleware
  app.use((0, _morgan2.default)('dev'));

  // add other routes below
  app.use('/download', _downloadFromS2.default);
  app.use('/data', _apiGatewayRouter2.default);

  // for testing
  app.get('/test', function (req, res) {
    var cities = [{ name: 'New York City', population: 8175133 }, { name: 'Los Angeles', population: 3792621 }, { name: 'Chicago', population: 2695598 }];
    res.json(cities);
  });

  // error handler here: (prior middleware should pass next(errorObj))
  app.use((0, _errorhandler2.default)());

  app.use('/*', staticFiles);

  app.set('port', process.env.PORT || 3001);

  app.listen(app.get('port'), function () {
    console.log('Worker ' + _cluster2.default.worker.id + ' listening on ' + app.get('port'));
  });
}