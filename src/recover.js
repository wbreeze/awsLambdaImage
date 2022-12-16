'use strict';

import {
  S3Client,
  CopyObjectCommand,
  GetObjectAttributesCommand
} from '@aws-sdk/client-s3';
import Sharp from 'sharp';
import { URIParser } from './uriParser.js';

let ImageHandler = (request, response) => {
  let recoveryHandler = {};

  const SRC_BUCKET = process.env.AWS_S3_RESIZE_SRC_NAME;
  const DST_BUCKET = process.env.AWS_S3_RESIZE_DST_NAME;
  const BUCKETS_REGION = process.env.AWS_S3_RESIZE_REGION;

  const S3 = new S3Client({
    region: BUCKETS_REGION
  });

  // returns a promise of response
  recoveryHandler.processResponse = () => {
    //console.log("Image source bucket is " + SRC_BUCKET);
    //console.log("Image destination bucket is " + DST_BUCKET);
    //console.log("Image bucket region is " + BUCKETS_REGION);
    //console.log("Image request is " + JSON.stringify(request, null, 4));
    //console.log("Image response is " + JSON.stringify(response, null, 4));

    // read the required path.
    // e.g. /images/100x100/webp/image.jpg
    const uriParser = URIParser(request.uri);
    const parts = uriParser.getParts();
    console.log("Image locator parts " + JSON.stringify(parts));

    return recoveryHandler.checkImage(parts)
    .then(result => recoveryHandler.doResponseInParallel(parts, result))
    .then(result => {
      return (result.status === 'fulfilled') ?
        Promise.resolve(result.value) :
        Promise.reject(result.reason);
      })
    .catch(err => {
      console.log("Exception while checking source image :%j",err);
      return Promise.resolve(response);
    });
  };

  // returns a promise of a GetObjectAttributesCommandOutput object
  recoveryHandler.checkImage = (parts) => {
    console.log("checkImage parts %j", parts);
    console.log("Checking %j", parts.sourceKey);
    const params = {
      "Bucket": SRC_BUCKET,
      "Key": "/" + parts.sourceKey,
      "ObjectAttributes": [ "ETag", "ObjectSize" ]
    };
    return S3.send(new GetObjectAttributesCommand(params));
  };

  // returns a promise of response
  recoveryHandler.doResponseInParallel = (parts, metadata) => {
    console.log("Response in parallel %j", parts);
    return Promise.allSettled([
        recoveryHandler.touchImage(parts, metadata),
        // even if there is exception in touching the object we send the
        // redirect back to the caller
        recoveryHandler.generateRedirectResponse(parts)
    ]).then(results => results[1]);
  };

  // touch image in S3 source bucket to trigger scaling
  // returns a promise of a CopyObjectCommandOutput object
  recoveryHandler.touchImage = (parts, attributes) => {
    console.log("Touching %j", parts.sourceKey);
    attributes.LastModified = Date.now;
    const params = {
      Bucket: SRC_BUCKET,
      CopySource: parts.sourceKey,
      Key: parts.sourceKey,
      MetadataDirective: 'replace',
      Metadata: attributes
    };
    request = S3.copyObject(params)
    .on('error', (err, response) => {
      console.log("Exception touching \"" + parts.sourceKey +
        "\" is: " + JSON.stringify(err) +
        "\n\twith response error :" + JSON.stringify(response.error));
    });
    return request.promise();
  };

  // generate a redirect to the source image
  // returns a promise resolved with a response object
  recoveryHandler.generateRedirectResponse = (parts) => {
    var redirect = {}
    redirect.status = 302;
    redirect.statusDescription = "Found";
    redirect.headers = {
      "location": [{
        "key": "Location",
        "value": parts.prefix + parts.sourceKey
      }]
    };
    redirect.headers.date = response.headers.date;
    redirect.headers.server = response.headers.server;
    return Promise.resolve(redirect);
  };

  return recoveryHandler;
};

// returns a promise of a response
let processEvent = (event) => {
  let responsePromise;
  console.log("processEvent " + JSON.stringify(event, null, 4));
  let response = event.Records[0].cf.response;
  console.log("CF response is %j", response);
  if (400 <= response.status && response.status < 500) {
    let request = event.Records[0].cf.request;
    console.log("CF request was %j", request);
    let imageHandler = ImageHandler(request, response);
    responsePromise = imageHandler.processResponse();
  } else {
    responsePromise = Promise.resolve(response);
  }
  return responsePromise;
}

let handler = (event, context, callback) => {
  processEvent(event).then(response => {
    console.log("Resolved response is %j", response);
    callback(null, response);
  });
};

export { ImageHandler, processEvent, handler };
