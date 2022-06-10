const ImageHandler = require("../resize.js").ImageHandler;
const processEvent = require("../resize.js").processEvent;

let mockEvent = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EDFDVBD6EXAMPLE"
        },
        "request": {
          "clientIp": "2001:0db8:85a3:0:0:8a2e:0370:7334",
          "method": "GET",
          "uri": "/images/image.jpg",
          "querystring": "d=200x200",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "d111111abcdef8.cloudfront.net"
              }
            ],
            "user-agent": [
              {
                "key": "User-Agent",
                "value": "curl/7.51.0"
              }
            ]
          }
        },
        "response": {
          "clientIp": "2001:0db8:85a3:0:0:8a2e:0370:7334",
          "method": "GET",
          "status": 404,
          "uri": "/images/200x200/jpg/image.jpg",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "d111111abcdef8.cloudfront.net"
              }
            ],
            "user-agent": [
              {
                "key": "User-Agent",
                "value": "curl/7.51.0"
              }
            ]
          }
        }
      }
    }
  ]
};

let mockRequest = mockEvent.Records[0].cf.request;
let mockResponse = mockEvent.Records[0].cf.response;
let mockBuffer = "this is not an image but it will serve";
let successResponse = {
  "clientIp": "2001:0db8:85a3:0:0:8a2e:0370:7334",
  "method": "GET",
  "status": 200,
  "body": mockBuffer.toString('base64'),
  "bodyEncoding": "base64",
  "uri": "/images/200x200/jpg/image.jpg",
  "headers": {
    "content-type": [
      {
        key: "Content-Type",
        value: "image/jpeg"
      }
    ],
    "host": [
      {
        "key": "Host",
        "value": "d111111abcdef8.cloudfront.net"
      }
    ],
    "user-agent": [
      {
        "key": "User-Agent",
        "value": "curl/7.51.0"
      }
    ]
  }
}

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

describe('Event handling', () => {
  it('passes response unaltered given 200 status', () => {
    mockEvent.Records[0].cf.response.status = 200;
    mockResponse.status = 200;
    expect(processEvent(mockEvent)).resolves.toEqual(mockResponse);
  });
});
