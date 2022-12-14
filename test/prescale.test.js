'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import { Prescale, handler } from "../src/prescale.js";

const sourceBucket = "name-of-image-bucket";
const sourceKey = "path/to/image.png";

let mockEvent = {
  "Records": [
    {
      "s3": {
        "bucket": {
          "name": sourceBucket
        },
        "object": {
          "key": sourceKey
        }
      }
    }
  ]
};

let mockBuffer = "this is not an image but it will serve";

function mockedImageHandler(
  request, response, failRetrieve, failScale, failWrite
) {
  let handler = ImageHandler(request, response);
  handler.retrieveImage = (parts) => {
    return failRetrieve ?
      Promise.reject("read") :
      Promise.resolve("this is image data");
  }
  handler.scaleImage = (parts, data) => {
    return failScale ?
      Promise.reject("scale") :
      ImageHandler.doResponseInParallel(parts, data);
  }
  handler.writeImageCache = (parts, buffer) => {
    return failWrite ?
      Promise.reject("failed write").catch(err => {
        console.log("Simulated failed write " + err);
      }):
      Promise.resolve("successful write");
  }
  return handler;
}

// S3 trigger event handling
const pre = Prescale();
test('parses the S3 event', () => {
  const params = pre.decodeEvent(mockEvent);
  assert.equal(params.srcBucket, sourceBucket);
  assert.equal(params.srcKey, sourceKey);
  assert.equal(params.destBucket, sourceBucket + "-derived");
});
