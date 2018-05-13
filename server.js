/*
 * Import required packages.
 * Packages should be installed with "npm install".
 */
const express = require('express');
const aws = require('aws-sdk');
const path = require('path');

aws.config.region = 'us-east-1';
const S3_BUCKET = process.env.S3_BUCKET_NAME;
console.log(S3_BUCKET);

/*
 * Set-up and run the Express app.
 */
const app = express();
// app.set('views', './views');

app.use(express.static('views'))
app.use('/scripts', express.static('scripts'))
app.use('/external_libraries', express.static('external_libraries'))




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

  debugger
  s3.getObject(
	  { Bucket: "my-bucket", Key: "my-picture.jpg" },
	  function (error, data) {
	    if (error != null) {
	      alert("Failed to retrieve an object: " + error);
	    } else {
	      alert("Loaded " + data.ContentLength + " bytes");
	      // do something with data.Body
	    }
	  }
	);
  
  // const fileName = req.query['file-name'];
  // const fileType = req.query['file-type'];

  // debugger
  // const s3Params = {
  //   Bucket: S3_BUCKET,
  //   Key: fileName,
  //   Expires: 60,
  //   ContentType: fileType,
  //   ACL: 'public-read'
  // };

  // s3.getSignedUrl('getObject', s3Params, (err, data) => {
  //   if(err){
  //     console.log(err);
  //     return res.end();
  //   }
  //   const returnData = {
  //     signedRequest: data,
  //     url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
  //   };
  //   res.write(JSON.stringify(returnData));
  //   res.end();
  // });
});




app.listen(process.env.PORT || 3000);