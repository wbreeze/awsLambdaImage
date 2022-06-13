'use strict';

const {
  S3Client, GetObjectCommand, PutObjectCommand
} = require("@aws-sdk/client-s3");
const S3 = new S3Client();
const Sharp = require('sharp');

const SRC_BUCKET = process.env.AWS_S3_RESIZE_SRC_NAME;
const DST_BUCKET = process.env.AWS_S3_RESIZE_DST_NAME;
const BUCKETS_REGION = process.env.AWS_S3_RESIZE_REGION;

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
        const match = uri.match(/(.*)\/(\d+)x(\d+)\/(.*)\/(.*)/);
        parts.prefix = match[1];
        parts.width = parseInt(match[2], 10);
        parts.height = parseInt(match[3], 10);
        parts.requiredFormat = parser.imageFormat(match[4]);
        parts.imageName = match[5];
        parts.sourceKey = parts.prefix + "/" + parts.imageName;
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

exports.ImageHandler = (request, response) => {
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
    const uriParser = exports.URIParser(request.uri);
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
    const command = new GetObjectCommand({
      "Bucket": SRC_BUCKET,
      "Key": parts.sourceKey
    });
    return S3.send(command);
  };

  // returns a promise of [PutObjectCommandOutput, response]
  scaler.scaleImage = (parts, data) => {
    return Sharp(data.Body)
    .resize(parts.width, parts.height)
    .toFormat(parts.requiredFormat)
    .toBuffer()
    .then(buffer => doResponseInParallel(parts, buffer));
  };

  // returns a promise of [PutObjectCommandOutput, response]
  scaler.doResponseInParallel = (parts, buffer) => {
    return Promise.allSettled([
        scaler.writeImageCache(parts, buffer),
        // even if there is exception in saving the object we send the
        // generated image back to viewer
        scaler.generateImageResponse(parts, buffer)
    ]);
  }

  // write resized image to S3 destination bucket
  // returns a promise of PutObjectCommandOutput
  scaler.writeImageCache = (parts, buffer) => {
    const command = new PutObjectCommand({
      Body: buffer,
      Bucket: DST_BUCKET,
      ContentType: 'image/' + parts.requiredFormat,
      CacheControl: 'max-age=31536000',
      Key: parts.scaledKey
    });
    return S3.send(command)
    .catch((err) => {
      console.log("Exception writing %s to bucket is: %j",
        parts.scaledKey, err);
    });
  };

  // generate a binary response with resized image
  // returns a promise resolvehd with a response object
  scaler.generateImageResponse = (parts, buffer) => {
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
exports.processEvent = (event) => {
  let responsePromise;
  let response = event.Records[0].cf.response;
  console.log("Response is " + JSON.stringify(response));
  if (response.status == 404) {
    let request = event.Records[0].cf.request;
    console.log("Request is " + JSON.stringify(response));
    let imageHandler = exports.ImageHandler(request, response);
    responsePromise = imageHandler.processResponse();
  } else {
    responsePromise = Promise.resolve(response);
  }
  return responsePromise;
}

exports.handler = (event, context, callback) => {
  console.log("Event is " + JSON.stringify(event));
  exports.processEvent(event).then(response => {
    console.log("Resolved response is " + JSON.stringify(response));
    callback(null, response);
  });
  console.log("Exiting handler");
};
