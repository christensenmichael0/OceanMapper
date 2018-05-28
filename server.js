/*
 * Import required packages.
 * Packages should be installed with "npm install".
 */
const express = require('express');
const aws = require('aws-sdk');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const listFilesRouter = require('./scripts/serverside_nodejs_scripts/listFiles.js');

aws.config.region = 'us-east-1';
const S3_BUCKET = process.env.S3_BUCKET_NAME;

/*
 * Set-up and run the Express app.
 */
const app = express();
// app.set('views', './views');


app.use(express.static('views'))
app.use('/scripts', express.static('scripts'))
app.use('/external_libraries', express.static('external_libraries'))

// logging middleware 
app.use(morgan('dev'));

// body parsing middleware attaches body to request object
app.use(bodyParser.json());


// app.use(express.static(path.join(__dirname)));
// app.use("/styles", express.static(__dirname + '/styles'));
// app.use("/images", express.static(__dirname + '/images'));
// app.use("/scripts", express.static(__dirname + '/scripts'));
app.engine('html', require('ejs').renderFile);

// viewed at based directory http://localhost:8080/
app.get('/', function (req, res) {
	// res.sendFile(path.join(__dirname + '/views/index.html'));
	res.render('index.html');
});

// add other routes below
app.get('/about', function (req, res) {
  // res.sendFile(path.join(__dirname + 'views/about.html'));
  console.log(res);
});

app.get('/sign-s3', (req, res) => {
  const s3 = new aws.S3();
  // console.log(s3)

  console.log(S3_BUCKET)
 //  s3.getObject(
	//   { Bucket: S3_BUCKET, Key: "RTOFS_OC/0m/rtofs_currents_20160512_00.json" },
	//   function (error, data) {
	//     if (error != null) {
	//       alert("Failed to retrieve an object: " + error);
	//     } else {
	//       alert("Loaded " + data.ContentLength + " bytes");
	//       // do something with data.Body
	//     }
	//   }
	// );
  
  // const fileName = req.query['file-name'];
  // const fileType = req.query['file-type'];

  // let fileName = 'RTOFS_OC/0m/rtofs_currents_20160512_00.json';
  let fileName = req.query['file-name'];
  console.log(fileName);
  
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
  };

  s3.getSignedUrl('getObject', s3Params, (err, data) => {
    if(err){
      console.log(err);
      return res.end();
    }

    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
});


// Import and mount the listFilesRouter
app.use('/list-files', listFilesRouter);


app.get('/download', (req, res) => {
  // const fileName = req.query['file-name'];
  // const bucket = req.query['bucket'];

  const s3 = new aws.S3();

  const s3Params = {
    Bucket: S3_BUCKET,
    Key: "RTOFS_OC/0m/rtofs_currents_20160512_00.json"
  };

   s3.getObject(s3Params, function (error, data) {
      if (error != null) {
        // alert("Failed to retrieve an object: " + error);
      } else {
        // alert("Loaded " + data.ContentLength + " bytes");

        // Convert Body from a Buffer to a String
        res.write(JSON.stringify(data.Body.toString('utf-8'))); //.toString('utf-8');

        
        // console.log(data.ContentLength + ' bytes');
        res.end();
      }
    }
  ); 
});


// error handler here: (prior middleware should pass next(errorObj))
app.use(errorHandler());

// 404 on failed get (doesnt exist)
// 400 dont do something for some reason
// 204 sucessful delete
// 200 sucessful get

app.listen(process.env.PORT || 3000);