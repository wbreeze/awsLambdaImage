'use strict';

// set the S3 and API GW endpoints
const BUCKET = 'image-resize-${AWS::AccountId}-us-east-1';

exports.URIParser = (uri) => {
  let parser = {};

  // correction for jpg required for 'Sharp'
  parser.imageFormat = (spec) => {
    const format = spec.toLowerCase();
    return format == 'jpg' ? 'jpeg' : format
  }

  // parse the prefix, width, height and image name
  // Ex: uri=images/200x200/webp/image.jpg
  parser.getParts = () => {
    if (parser.memoizedParts === undefined) {
      let parts = {}

      // parse the prefix, width, height and image name
      // Ex: key=images/200x200/webp/image.jpg
      try {
        const match = uri.match(
          /https?:\/(.*)\/(\d+)x(\d+)\/([^\/]+)\/([^\/]+)/
        );
        parts.prefix = match[1];
        parts.width = parseInt(match[2], 10);
        parts.height = parseInt(match[3], 10);
        parts.requiredFormat = parser.imageFormat(match[4]);
        parts.imageName = match[5];
        parts.sourceKey = parts.prefix + "/" + parts.imageName;
      }
      catch (err) {
        // no prefix for image..
        console.log("no prefix present.. " + err);
        const match = uri.match(/(\d+)x(\d+)\/(.*)\/(.*)/);
        parts.prefix = "";
        parts.width = parseInt(match[1], 10);
        parts.height = parseInt(match[2], 10);
        parts.requiredFormat = parser.imageFormat(match[3]);
        parts.imageName = match[4];
        parts.sourceKey = parts.imageName;
      }
      parts.scaledKey = [
        parts.prefix,
        (parts.width + 'x' +  parts.height),
        parts.requiredFormat,
        parts.imageName
      ].join('/');

      parser.memoizedParts = parts;
    }
    return parser.memoizedParts;
  }

  return parser;
}

exports.handler = (event, context, callback) => {
  let response = event.Records[0].cf.response;

  //check if image is not present
  if (response.status == 404) {
    let request = event.Records[0].cf.request;
    const AWS = require('aws-sdk');
    const S3 = new AWS.S3({
      signatureVersion: 'v4',
    });
    const Sharp = require('sharp');

    // read the required path.
    // e.g. /images/100x100/webp/image.jpg
    const uriParser = exports.URIParser(request.uri);
    const parts = uriParser.getParts();

    // get the source image file
    S3.getObject({ Bucket: BUCKET, Key: parts.sourceKey }).promise()
      // perform the resize operation
      .then(data => Sharp(data.Body)
        .resize(parts.width, parts.height)
        .toFormat(parts.requiredFormat)
        .toBuffer()
      )
      .then(buffer => {
        // save the resized object to S3 bucket with appropriate object key.
        S3.putObject({
            Body: buffer,
            Bucket: BUCKET,
            ContentType: 'image/' + parts.requiredFormat,
            CacheControl: 'max-age=31536000',
            Key: parts.scaledKey,
            StorageClass: 'STANDARD'
        }).promise()
        .catch(() => {
          console.log("Exception while writing resized image to bucket")
        });

        // even if there is exception in saving the object we send the
        // generated image back to viewer
        // generate a binary response with resized image
        response.status = 200;
        response.body = buffer.toString('base64');
        response.bodyEncoding = 'base64';
        response.headers['content-type'] = [
          { key: 'Content-Type',
            value: 'image/' + parts.requiredFormat
          }
        ];
        callback(null, response);
      })
    .catch( err => {
      console.log("Exception while reading source image :%j",err);
    });
  } // end of if block checking response statusCode
  else {
    // allow the response to pass through
    callback(null, response);
  }
};
