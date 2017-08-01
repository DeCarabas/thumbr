// This is the AWS lambda import.
const { dream } = require('./thumbs');

exports.handler = (event, context, callback) => {
    var url = event.queryStringParameters.dream || 
        event.queryStringParameters.url;
    var skipChecks = event.queryStringParameters.skipChecks;
    var referrer = event.queryStringParameters.referrer;
    
    dream(url, skipChecks, referrer).then(result => {
       callback(null, result); 
    });
};