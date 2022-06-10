const ImageHandler = require("../resize.js").ImageHandler;

const mockEvent = {
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

const mockRequest = mockEvent.Records[0].cf.request;
const mockResponse = mockEvent.Records[0].cf.response;
const mockBuffer = "this is not an image but it will serve";
const successResponse = {
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
  handler.writeImageCache = (parts, buffer) => {
    return failWrite ? Promise.reject("write") : Promise.resolve("write");
  }
  handler.scaleImage = (parts, data) => {
    return failScale ? Promise.reject("scale") : Promise.resolve("scale");
  }
  handler.retrieveImage = (parts) => {
    return failRetrieve ? Promise.reject("read") : Promise.resolve("read");
  }
  return handler;
}

describe('ImageHandler processing', () => {
  it('generates an image response', () => {
    let ih = mockedImageHandler(mockRequest, mockResponse, true, true, true);
    const parts = { "requiredFormat": "jpeg" };
    return expect(ih.generateImageResponse(parts, mockBuffer))
      .resolves.toEqual(successResponse);
  });

  it('returns original response on failure to read image', () => {
    let ih = mockedImageHandler(mockRequest, mockResponse, true, true, true);
    return expect(ih.processRequest()).resolves.toEqual(mockResponse);
  });

  it('returns original response on failure to scale image', () => {
    let ih = mockedImageHandler(mockRequest, mockResponse, false, true, true);
    return expect(ih.processRequest()).resolves.toEqual(mockResponse);
  });

  it('returns modified response on failure to write cache', () => {
    let ih = mockedImageHandler(mockRequest, mockResponse, false, false, true);
    return expect(ih.processRequest()).resolves.toEqual(successResponse);
  });
});

