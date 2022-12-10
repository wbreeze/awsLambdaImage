import { ImageHandler, processEvent } from "../src/recover.js";

let mockEvent = {
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
};

let mockRequest = mockEvent.Records[0].cf.request;
let mockResponse = mockEvent.Records[0].cf.response;
let mockBuffer = "this is not an image but it will serve";
let successResponse = {
  "headers":{"x-amz-request-id":[{"key":"x-amz-request-id","value":"AJCP06B0MNSV9JH2"}],"x-amz-id-2":[{"key":"x-amz-id-2","value":"acVAebmZ7YB0YHwdDfsUtb+R0dFe91cEkbhTg6cEvVRO2SoBe3sY+WG8Z2zIDQCfpDSqQAQ1zAE="}],"date":[{"key":"Date","value":"Mon, 13 Jun 2022 14:46:01 GMT"}],"server":[{"key":"Server","value":"AmazonS3"}],"content-type":[{"key":"Content-Type","value":"image/jpeg"}],"transfer-encoding":[{"key":"Transfer-Encoding","value":"chunked"}]},"status":200,"statusDescription":"Success","body":"this is not an image but it will serve","bodyEncoding":"base64"
};

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

describe('ImageHandler processing', () => {
  it('generates an image response', () => {
    let ih = mockedImageHandler(mockRequest, mockResponse, false, false, false);
    const parts = { "requiredFormat": "jpeg" };
    return expect(ih.generateImageResponse(parts, mockBuffer))
      .resolves.toEqual(successResponse);
  });

  it('returns original response on failure to read image', () => {
    let ih = mockedImageHandler(mockRequest, mockResponse, true, true, true);
    return expect(ih.processResponse()).resolves.toEqual(mockResponse);
  });

  it('returns original response on failure to scale image', () => {
    let ih = mockedImageHandler(mockRequest, mockResponse, false, true, true);
    return expect(ih.processResponse()).resolves.toEqual(mockResponse);
  });

  it('generates an image response on failure to write cache', () => {
    let ih = mockedImageHandler(mockRequest, mockResponse, false, false, true);
    return expect(ih.processResponse()).resolves.toEqual(successResponse);
  });
});

describe('Origin response event handling', () => {
  it('passes response unaltered given 200 status', () => {
    mockEvent.Records[0].cf.response.status = 200;
    mockResponse.status = 200;
    mockResponse.statusDescription = "Success";
    expect(processEvent(mockEvent)).resolves.toEqual(mockResponse);
  });
});
