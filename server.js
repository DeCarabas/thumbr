// Using 'express' to serve this out in glitch, but obv. other endpoints don't need this.
const express = require('express');
const { dream } = require('./thumbs');

var app = express();

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/dreams", function (request, response) {
  response.send([]);
});

// could also use the POST body instead of query string: http://expressjs.com/en/api.html#req.body
app.post("/dreams", function (request, response) {
  var url = request.query.dream;  
  var skipChecks = request.query.skipChecks;
  var referrer = request.query.referrer;
  dream(url, skipChecks, referrer).then(
    result => {
      response.send(result);
    },
    reason => {
      console.log(reason);
      response.sendStatus(500);
    }
  );
})

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});