const ImageRequestBuilder = require("../request.js").ImageRequestBuilder;
const parseEvent = require("../request.js").parseEvent;

const EventBuilder = (uri, query, doAcceptWebp) => {
    const accept = doAcceptWebp ? "webp" : "jpeg";
    return {
      "Records": [
        {
          "cf": {
            "config": {
                "distributionDomainName": "domain.cloudfront.net",
                "distributionId": "EDEXAMPLEDIDU",
                "eventType": "viewer-request",
                "requestId": "a..Ck0F1mkYcshG9ki0p7xZhdFWwQn3GquHv_xheNw=="
            },
            "request": {
                "clientIp": "192.255.255.60",
                "headers": {
                    "host": [
                        {
                            "key": "Host",
                            "value": "domain.cloudfront.net"
                        }
                    ],
                    "user-agent": [
                        {
                            "key": "User-Agent",
                            "value": "curl/7.79.1"
                        }
                    ],
                    "accept": [
                        {
                            "key": "accept",
                            "value": accept
                        }
                    ]
                },
                "method": "GET",
                "querystring": query ?? "",
                "uri": uri ?? ""
            }
          }
        }
      ]
    }
};

describe('Modifies URI of request with image dimensions and format', () => {
  it('passes undimensioned request unchanged', () => {
    const testURI = 'https://this/path/to/image.jpeg'
    const parms = parseEvent(EventBuilder(testURI, null, false));
    const builder = ImageRequestBuilder(parms.uri, parms.query, parms.accept);
    expect(builder.edgeRequest()).toEqual(testURI);
  });

  it('inserts dimensions from query param "d"', () => {
    const testURI = 'https://path/to/image.jpeg';
    const testQuery = "d=300x400";
    const parms = parseEvent(EventBuilder(testURI, testQuery, false));
    const builder = ImageRequestBuilder(parms.uri, parms.query, parms.accept);
    const edge = builder.edgeRequest();
    expect(edge).toEqual('https://path/to/600x600/jpeg/image.jpeg');
  });

  it('substitutes webp if accepted', () => {
    const testURI = 'https://path/to/image.jpeg';
    const testQuery = "d=300";
    const parms = parseEvent(EventBuilder(testURI, testQuery, true));
    const builder = ImageRequestBuilder(parms.uri, parms.query, parms.accept);
    const edge = builder.edgeRequest();
    expect(edge).toEqual('https://path/to/600x600/webp/image.jpeg');
  });

  it('parses the event from CloudFront', () => {
    const querystring = "d=600x600";
    const uri = "/IMG_8932.png";
    const accept = "webp";
    const event = EventBuilder(uri, querystring, true);
    const parms = parseEvent(event);
    expect(parms.uri).toEqual(uri);
    expect(parms.query).toEqual(querystring);
    expect(parms.accept).toEqual(accept);
  });
});
