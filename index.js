// This is the entry point for AWS lambda.
const { dream } = require('./thumbs');

exports.handler = (event, context, callback) => {
  var url, skipChecks, referrer;

  if (event.queryStringParameters) {
    url = event.queryStringParameters.dream || event.queryStringParameters.url; 
    skipChecks = event.queryStringParameters.skipChecks;
    referrer = event.queryStringParameters.referrer;    
  } else {
    var request = JSON.parse(event.body);
    url = request.dream || request.url;
    skipChecks = request.skipChecks;
    referrer = request.referrer;
  }

  dream(url, skipChecks, referrer).then(result => {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(result)
    });
  });
};