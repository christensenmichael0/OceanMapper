'use strict';

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Import required packages.
 * Packages should be installed with "npm install".
 */
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

// for testing
app.get('/cities', function (req, res) {
  var cities = [{ name: 'New York City', population: 8175133 }, { name: 'Los Angeles', population: 3792621 }, { name: 'Chicago', population: 2695598 }];
  res.json(cities);
});

// error handler here: (prior middleware should pass next(errorObj))
app.use((0, _errorhandler2.default)());

// 404 on failed get (doesnt exist)
// 400 dont do something for some reason
// 204 sucessful delete
// 200 sucessful get

app.use('/*', staticFiles);

app.set('port', process.env.PORT || 3001);

app.listen(app.get('port'), function () {
  console.log('Listening on ' + app.get('port'));
});