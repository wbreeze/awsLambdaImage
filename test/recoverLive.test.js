'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import { ImageRequestBuilder } from "../src/imageRequestBuilder.js";
import { ImageHandler, processEvent } from "../src/recover.js";
import { createMockCF } from "./createMockCF.js";

/**
This test invokes the S3 API to query and touch an image on S3.
As such, this test is a "live" test, not a mock test.
Use the test to reproduce the activity that occurs when the
CloudFront server armed with the `recover` script fails to return
a scaled version of an image that exists in the source image bucket.

The environment from which you invoke the test will require the following:

AWS_S3_RESIZE_REGION - region of the source and derived image buckets
AWS_S3_RESIZE_SRC_NAME - address of the source image bucket
AWS_S3_RESIZE_IMAGE_PATH - full path (key) of an image in the source image bucket

For the identity with which to authenticate
AWS_ACCESS_KEY_ID - The account key from IAM
AWS_SECRET_ACCESS_KEY - The secret matching the account key

Change `{ skip: 'live test touches S3' }` to
`{ skip: false }` in order to run the test.
Invoke as `node --test test/recoverLive.test.js`.
**/

test('touch image on S3 source bucket', () => {
  const SRC_IMAGE = process.env.AWS_S3_RESIZE_IMAGE_PATH;
  if (SRC_IMAGE === undefined) {
    assert.fail(
      'Configure environment variable, "AWS_S3_RESIZE_IMAGE_PATH"' +
      '\nUse a leading forward slash, e.g. "/Clock.jpg"'
    );
  };
  let mockCFNotFound = createMockCF();
  let mockRequest = mockCFNotFound.Records[0].cf.request;
  let mockResponse = mockCFNotFound.Records[0].cf.response;

  var irb = ImageRequestBuilder(SRC_IMAGE, {'d':{'value':'600'}}, 'image/webp');
  mockRequest.uri = irb.edgeRequest()
  console.log("Request URI is %s", mockRequest.uri);

  let handler = ImageHandler(mockRequest, mockResponse);
  return handler.processResponse().then((response) => {
    assert.equal(response.status, 302);
    assert.equal(response.statusDescription, 'Found');
    assert.ok(response.headers.location[0].value.includes(SRC_IMAGE));
    return response;
  });
});

