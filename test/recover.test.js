'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import { ImageHandler, processEvent } from "../src/recover.js";

let createMockCF = () => {
  return {
    "Records": [
        {
            "cf": {
                "config": {
                    "distributionDomainName": "domain.cloudfront.net",
                    "distributionId": "EDSEXAMPLEDID",
                    "eventType": "origin-response",
                    "requestId": "pN1SoewTOXVxYcNPthsxo1Gi9yf-uqzSCrU-e2yjj8bfBr1KyKGTAA=="
                },
                "request": {
                    "clientIp": "127.0.0.0",
                    "headers": {
                        "x-forwarded-for": [
                            {
                                "key": "X-Forwarded-For",
                                "value": "127.0.0.0"
                            }
                        ],
                        "user-agent": [
                            {
                                "key": "User-Agent",
                                "value": "Amazon CloudFront"
                            }
                        ],
                        "via": [
                            {
                                "key": "Via",
                                "value": "1.1 arn.cloudfront.net (CloudFront)"
                            }
                        ],
                        "host": [
                            {
                                "key": "Host",
                                "value": "arn.s3.eu-west-1.amazonaws.com"
                            }
                        ]
                    },
                    "method": "GET",
                    "origin": {
                        "s3": {
                            "authMethod": "origin-access-identity",
                            "customHeaders": {},
                            "domainName": "arn.s3.eu-west-1.amazonaws.com",
                            "path": "",
                            "region": "eu-west-1"
                        }
                    },
                    "querystring": "",
                    "uri": "/600x600/png/IMG_8932.png"
                },
                "response": {
                    "headers": {
                        "x-amz-request-id": [
                            {
                                "key": "x-amz-request-id",
                                "value": "AJCP06B0MNSV9JH2"
                            }
                        ],
                        "x-amz-id-2": [
                            {
                                "key": "x-amz-id-2",
                                "value": "acVAebmZ7YB0YHwdDfsUtb+R0dFe91cEkbhTg6cEvVRO2SoBe3sY+WG8Z2zIDQCfpDSqQAQ1zAE="
                            }
                        ],
                        "date": [
                            {
                                "key": "Date",
                                "value": "Mon, 13 Jun 2022 14:46:01 GMT"
                            }
                        ],
                        "server": [
                            {
                                "key": "Server",
                                "value": "AmazonS3"
                            }
                        ],
                        "content-type": [
                            {
                                "key": "Content-Type",
                                "value": "application/xml"
                            }
                        ],
                        "transfer-encoding": [
                            {
                                "key": "Transfer-Encoding",
                                "value": "chunked"
                            }
                        ]
                    },
                    "status": "404",
                    "statusDescription": "Not Found"
                }
            }
        }
    ]
  }
};

function mockedImageHandler(
  request, response, passCheck, passTouch
) {
  let handler = ImageHandler(request, response);
  handler.didCallCheck = false;
  handler.didCallTouch = false;

  handler.checkImage = (parts) => {
    handler.didCallCheck = true;
    return passCheck ?
      Promise.resolve({"modification-date": Date()}) :
      Promise.reject('Fn checkImage did fail');
  }

  handler.touchImage = (parts, attributes) => {
    handler.didCallTouch = true;
    return passTouch ?
      Promise.resolve('Touched') :
      Promise.reject('Fn touchImage did fail');
  }

  return handler;
};

let mockCFNotFound = createMockCF();
let mockRequest = mockCFNotFound.Records[0].cf.request;
let mockResponse = mockCFNotFound.Records[0].cf.response;

test('checks for the image', () => {
  let ih = mockedImageHandler(mockRequest, mockResponse, true, true);
  return ih.processResponse().then(() => assert.ok(ih.didCallCheck));
});

test('tries to touch the image', () => {
  let ih = mockedImageHandler(mockRequest, mockResponse, true, true);
  return ih.processResponse().then(() => assert.ok(ih.didCallTouch));
});

test('generates a redirect when source image found and touched', () => {
  let ih = mockedImageHandler(mockRequest, mockResponse, true, true);
  return ih.processResponse()
    .then((response) => {
      assert.equal(response.status, 302);
      assert.equal(response.statusDescription, 'Found');
      assert.equal(response.headers.location[0].value, 'IMG_8932.png');
      return true;
    });
});

test('generates a redirect when source image found and touch failed', () => {
  let ih = mockedImageHandler(mockRequest, mockResponse, true, false);
  return ih.processResponse()
    .then((response) => {
      assert.equal(response.status, 302);
      assert.equal(response.statusDescription, 'Found');
      assert.equal(response.headers.location[0].value, 'IMG_8932.png');
      return true;
    });
});

test('returns original response when the image does not exist', () => {
  let ih = mockedImageHandler(mockRequest, mockResponse, false, false);
  return ih.processResponse()
    .then((response) => assert.equal(response, mockResponse));
});

test('passes response unaltered given 200 status', () => {
  let mockCFFound = createMockCF();
  let mockResponse = mockCFFound.Records[0].cf.response;
  mockResponse.status = 200;
  mockResponse.statusDescription = "Success";
  return processEvent(mockCFFound)
    .then((response) => assert.equal(response, mockResponse));
});
