/*
 * Import required packages.
 * Packages should be installed with "npm install".
 */
const express = require('express');
const aws = require('aws-sdk');
const path = require('path');

/*
 * Set-up and run the Express app.
 */
const app = express();
// app.set('views', './views');

app.use(express.static('views'))
app.use('/scripts', express.static('scripts'))




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




app.listen(process.env.PORT || 3000);