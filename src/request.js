'use strict';

import { ImageRequestBuilder } from "./imageRequestBuilder.js";

var parseEvent = (event) => {
  var request = event.request;
  return {
    "request": request,
    "uri": request.uri ?? "",
    "query": request.querystring ?? "",
    "accept": request.headers.accept.value ?? ""
  }
};

var handler = (event, context, callback) => {
    var params = parseEvent(event);
    var irb = ImageRequestBuilder(
      params.uri, params.query, params.accept);
    var fwdURI = irb.edgeRequest()
    var request = params.request

    if (fwdURI) {
      request.uri = fwdURI;
      request.querystring = {};
    }
    if (callback) { callback(null, request) };
    return request;
};

export { parseEvent, handler };
