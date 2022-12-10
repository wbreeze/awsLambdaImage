'use strict';

import AWS from 'aws-sdk';
import Sharp from 'sharp';
import { URIParser } from './uriParser';

const S3 = new AWS.S3({ apiVersion: '2006-03-01' });

const SRC_BUCKET = process.env.AWS_S3_RESIZE_SRC_NAME;
const DST_BUCKET = process.env.AWS_S3_RESIZE_DST_NAME;
const BUCKETS_REGION = process.env.AWS_S3_RESIZE_REGION;

let ImageHandler = (request, response) => {
  let scaler = {};

  // returns a promise of response
  scaler.processResponse = () => {
    console.log("Image source bucket is " + SRC_BUCKET);
    console.log("Image destination bucket is " + DST_BUCKET);
    console.log("Image bucket region is " + BUCKETS_REGION);
    console.log("Image request is " + JSON.stringify(request));
    console.log("Image response is " + JSON.stringify(response));

    // read the required path.
    // e.g. /images/100x100/webp/image.jpg
    const uriParser = URIParser(request.uri);
    const parts = uriParser.getParts();
    console.log("Image locator parts " + JSON.stringify(parts));

    return scaler.retrieveImage(parts)
    .then(result => scaler.scaleImage(parts, result.Body))
    .then(([_, imgResponse]) => imgResponse)
    .catch(err => {
      console.log("Exception while reading source image :%j",err);
      return response;
    });
  };

  // returns a promise of a GetObjectCommandOutput object
  scaler.retrieveImage = (parts) => {
    const params = {
      "Bucket": SRC_BUCKET,
      "Key": parts.sourceKey
    };
    let request = S3.getObject(params)
    return request.promise();
  };

  // returns a promise of [PutObjectCommandOutput, response]
  scaler.scaleImage = (parts, data) => {
    console.log("Scaling %j", parts);
    return Sharp(data)
    .resize(parts.width, parts.height)
    .toFormat(parts.requiredFormat)
    .toBuffer()
    .then(buffer => doResponseInParallel(parts, buffer))
    .catch(err => {
      console.log("Exception while scaling is %j", err);
      return [null, response];
    });
  };

  // returns a promise of [PutObjectCommandOutput, response]
  scaler.doResponseInParallel = (parts, buffer) => {
    console.log("Response in parallel %j", parts);
    return Promise.allSettled([
        scaler.writeImageCache(parts, buffer),
        // even if there is exception in saving the object we send the
        // generated image back to viewer
        scaler.generateImageResponse(parts, buffer)
    ]);
  };

  // write resized image to S3 destination bucket
  // returns a promise of PutObjectCommandOutput
  scaler.writeImageCache = (parts, buffer) => {
    console.log("Writing " + JSON.stringify(parts));
    const params = {
      Body: buffer,
      Bucket: DST_BUCKET,
      ContentType: 'image/' + parts.requiredFormat,
      CacheControl: 'max-age=31536000',
      Key: parts.scaledKey
    };
    request = S3.putObject(params)
    .on('error', (err, response) => {
      console.log("Exception writing \"" + parts.scaledKey +
        "\" to bucket is: " + JSON.stringify(err) +
        "\n\twith response error :" + JSON.stringify(response.error));
    });
    return request.promise();
  };

  // generate a binary response with resized image
  // returns a promise resolvehd with a response object
  scaler.generateImageResponse = (parts, buffer) => {
    console.log("Modifying response " + JSON.stringify(parts));
    response.status = 200;
    response.statusDescription = "Success";
    response.body = buffer.toString('base64');
    response.bodyEncoding = 'base64';
    response.headers['content-type'] = [
      { key: 'Content-Type',
        value: 'image/' + parts.requiredFormat
      }
    ];
    console.log("Generated image response is " + JSON.stringify(response));
    return Promise.resolve(response);
  };

  return scaler;
};

// returns a promise of a response
let processEvent = (event) => {
  let responsePromise;
  console.log("Have event " + JSON.stringify(event));
  console.log("Have Records " + JSON.stringify(event.Records));
  console.log("Have Records[0] " + JSON.stringify(event.Records[0]));
  console.log("Have Records[0].cf " + JSON.stringify(event.Records[0].cf));
  let response = event.Records[0].cf.response;
  console.log("Have Response " + JSON.stringify(response));
  if (400 <= response.status && response.status < 500) {
    let request = event.Records[0].cf.request;
    console.log("Request is " + JSON.stringify(response));
    let imageHandler = ImageHandler(request, response);
    responsePromise = imageHandler.processResponse();
  } else {
    responsePromise = Promise.resolve(response);
  }
  return responsePromise;
}

let handler = (event, context, callback) => {
  console.log("Event is " + JSON.stringify(event));
  processEvent(event).then(response => {
    console.log("Resolved response is " + JSON.stringify(response));
    callback(null, response);
  });
};

export { ImageHandler, processEvent, handler };
