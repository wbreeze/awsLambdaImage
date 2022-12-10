'use strict';

import { parseEvent, handler } from '../src/request.js';
import { ImageRequestBuilder } from '../src/imageRequestBuilder.js';

const EventBuilder = (uri, query, doAcceptWebp) => {
    const accept = doAcceptWebp ? "webp" : "jpeg";
    let queryObject;
    if (query) {
      queryObject = { "d" : {"value" : query }}
    } else {
      queryObject = {}
    };
    return {
     "version" : "1.0",
     "context" : {
       "distributionDomainName" : "d123.cloudfront.net",
       "distributionId" : "E123",
       "eventType" : "viewer-request",
       "requestId" : "4TyzHTaYWb1GX1qTfsHhEqV6HUDd_BzoBZnwfnvQc_1oF26ClkoUSEQ=="},
       "viewer" : { "ip" : "1.2.3.4"},
     "request" : {
       "method" : "GET",
       "uri" : uri ? uri : "",
       "querystring" : queryObject,
       "headers" : {
         "accept" : { "value" : "image/" + accept }
       },
       "cookies" : {}
       }
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
    const testQuery = "300x400";
    const parms = parseEvent(EventBuilder(testURI, testQuery, false));
    const builder = ImageRequestBuilder(parms.uri, parms.query, parms.accept);
    const edge = builder.edgeRequest();
    expect(edge).toEqual('https://path/to/600x600/jpeg/image.jpeg');
  });

  it('substitutes webp if accepted', () => {
    const testURI = 'https://path/to/image.jpeg';
    const testQuery = "300";
    const event = EventBuilder(testURI, testQuery, true);
    const parms = parseEvent(event);
    const builder = ImageRequestBuilder(parms.uri, parms.query, parms.accept);
    const edge = builder.edgeRequest();
    expect(edge).toEqual('https://path/to/600x600/webp/image.jpeg');
  });

  it('parses the event from CloudFront', () => {
    const querystring = "600x600";
    const uri = "/IMG_8932.png";
    const accept = "webp";
    const event = EventBuilder(uri, querystring, true);
    const parms = parseEvent(event);
    expect(parms.uri).toEqual(uri);
    expect(parms.query).toMatchObject({ "d": { "value": querystring }});
    expect(parms.accept).toContain(accept);
  });

  it('executes the handler', () => {
    const querystring = "600x600";
    const uri = "/IMG_8932.png";
    const event = EventBuilder(uri, querystring, true);
    handler(event, null, (event, request)=>{
      expect(request.uri).toContain(uri);
      expect(request.uri).toContain("webp");
      expect(request.querystring).toEqual({});
    })
  });
});
