// Compute thumbnails and upload them to S3.
const AWS = require('aws-sdk');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const sharp = require('sharp');
const urlmod = require('url');

AWS.config.update({
  region: 'us-west-2',
  httpOptions: {
    agent: new https.Agent({
      maxSockets: 25,
    }),
  },
});


function isBlacklistUrl(url) {
  return false;
}

const THUMBNAIL_SIZE = 312;

function getPath(urlObject) {
  let path = urlObject.path;
  if (urlObject.hash) { path += urlObject.hash; }
  return path;
}

function hasHeader(header, headers) {
  var headers = Object.keys(headers || this.headers)
    , lheaders = headers.map(function (h) {return h.toLowerCase()})
    ;
  header = header.toLowerCase();
  for (var i=0;i<lheaders.length;i++) {
    if (lheaders[i] === header) return headers[i];
  }
  return false;
}

function getUrl(url, referrer) {
  return new Promise((resolve, reject) => {
    var httpLib = http;  
    if (/^https/.test(url)) {  
      httpLib = https;
    }    

    const theUrl = urlmod.parse(url);
    const imageRequestParams = {
      method: 'GET',
      host: theUrl.hostname,
      port: theUrl.port || undefined,
      path: getPath(theUrl),
      headers: {
        'User-Agent': 'TheOnceAndFuture/1.0'
      }
    };
    if (referrer) {
      console.log('Referer: ', referrer);
      imageRequestParams.headers['Referer'] = referrer;
    }

    const imageRequest = httpLib.request(imageRequestParams, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && hasHeader('location', response.headers)) {
        const location = response.headers[hasHeader('location', response.headers)];
        getUrl(location, referrer).then(
          result => resolve(result),
          reason => reject(reason)
        );
      } else {
        resolve(response);
      }
    });
    imageRequest.on('error', e => reject(e));
    imageRequest.end();
  });
}

function processUrl(url, skipChecks, referrer) {
  console.log('Loading ', url, skipChecks, referrer);
  return new Promise((resolve, reject) => {
    if (!skipChecks && isBlacklistUrl(url)) {
      reject('blacklist');
    }
    
    getUrl(url, referrer).then(response => {
      const image = sharp();
      response.pipe(image);

      return image.metadata().then(metadata => {
        const width = metadata.width;
        const height = metadata.height;

        if (!skipChecks) {
          const area = width * height;
          if (area < 5000) {            
            throw 'too small';          
          }
          const ratio = Math.max(width, height) / Math.min(width, height);
          if (ratio > 2.25) {
            throw 'too oblong';
          }
        }

        let sourceSize = Math.min(width, height);
        let targetSize = THUMBNAIL_SIZE;          
        if (sourceSize < targetSize) {
          targetSize = sourceSize;
        }

        return image
          .resize(sourceSize, sourceSize)
          .crop(sharp.strategy.entropy)
          .resize(targetSize, targetSize);          
      });
    }).then(
      result => resolve(result),
      reason => reject(reason)
    ); 
  });
}

function putBuffer(fileName, contentType, buffer) {
  return new Promise((resolve, reject) => {
    const s3 = new AWS.S3();
    const params = {
      Bucket: 'onceandfuture-thumbs',
      Key: fileName,
      Body: buffer,
      ContentType: contentType
    };

    s3.putObject(params, (error, result) => {
      if (error) { 
        reject(error); 
      } else {
        resolve('https://onceandfuture-thumbs.s3.amazonaws.com/' + encodeURIComponent(fileName));
      }
    });            
  });
}

function saveImage(image) {  
  return new Promise((resolve, reject) => {    
    var details = { image: image };
    
    var mimeType;
    var extension;
    
    image.metadata().then(metadata => {
      details.metadata = metadata;
      if (metadata.hasAlpha) {
        mimeType = 'image/png';
        extension = '.png';
        return image.png().toBuffer();
      } else {
        mimeType = 'image/jpeg';
        extension = '.jpeg';
        return image.jpeg().toBuffer();        
      }
    }).then(buffer => {
      const hash = crypto.createHash('sha1').update(buffer).digest('base64');
      const fileName = hash.replace('/', '-') + extension;
          
      return putBuffer(fileName, mimeType, buffer);
    }).then(
      thumbnailUrl => {
        details.url = thumbnailUrl;
        resolve(details);
      },
      error => reject(error)
    );
  });
}

function dream(url, skipChecks, referrer) {
  return new Promise((resolve, reject) => {
    processUrl(url, skipChecks, referrer)
      .then(image => saveImage(image))
      .then(
        result => resolve({
          originalUrl: url,
          thumbnailUrl: result.url,
          originalWidth: result.metadata.width,
          originalHeight: result.metadata.height,
          thumbnailWidth: THUMBNAIL_SIZE,
          thumbnailHeight: THUMBNAIL_SIZE,
        }),
        reason => {
          console.log('Nightmare: ', reason);
          reason = reason.toString();          
          resolve({
            originalUrl: url,
            error: reason,
          });
        }
      );    
  }); 
}

module.exports = {
  dream: dream,
};