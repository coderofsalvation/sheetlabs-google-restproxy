var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var qs = require('querystring');
var app = express();

// configure app to use bodyParser() for json input parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// can be anything, we're using an google appscript which is linked to the google spreadsheet
var resturl     = "https://script.google.com/macros/s/AKfycbz3iw80lYaoN1UaYNbP7GjDLU8_KQrQJNz_KsR5234/exec";

// the url of your sheetlab api
var sheetlaburl = "https://sheetlabs.com/YOURAPI/URL";

app.get('/', function (req, res) {
  req.pipe( request.get( sheetlaburl ) ).pipe(res); 
});

var proxy = function(req, res) {
  req.body.action = req.method;
  url = resturl + "?" + qs.stringify(req.body);
  request.get( url, function(req,resp){
    res.send(resp.body);
  });
}

// this will turn PUT/DELETE/POST request into GET requests which are compatible with the gscript
app.post('/', proxy );
app.put('/', proxy );
app.delete('/', proxy );

app.listen(8001);
