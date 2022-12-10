'use strict';

import { WxHParser } from "./wxhParser.js";
import { URIParser } from "./uriParser.js";

// parse the image dimensions from the query string.
// Look for parameter d with value <width>x<height> where width and height
//   are integers, e.g. "d=300x200" returns { w:300, h:200 }
// A single integer dimension is valid as well, and is applied to both, e.g.
//   "d=300" returns { w:300, h:300 }
// return null if d not present or formatted incorrectly, otherwise return
//   { w: <width>, h: <height> } where <width> and <height> are integers
var QueryStringParser = {
  dimension: (query) => {
    var dimension = null
    if (query.d) {
      dimension = WxHParser().parseWxH(query.d.value);
    }
    return dimension
  }
};

// parse the image dimensions from the uri
// Look for second to last path element d with value <width>x<height>
//   where width and height are integers,
//   e.g. "https://300x200/image.jpeg" returns { w:300, h:200 }
// A single integer dimension is valid as well, and is applied to both,
//   e.g. "https://300/image.jpeg" returns { w:300, h:300 }
// Memoize the path prefix before the dimensions specification,
//   the image name and the image extension
// If the second to last path element d does not have a valid dimension
//   specificaton, leave dimensions unspecified and include the last path
//   element in the memoized prefix.
var ImageRequestBuilder = (uri, query, accept) => {
  var builder = {};

  // defines the allowed dimension requests
  builder.allowedDimensions = [
      { w:600, h:600 },
      { w:1200, h:1200 },
      { w:2400, h:2400 },
      { w:3600, h:3600 }
    ];

  // file extension for requests that accept webp format
  builder.webpExtension = 'webp';

  builder.uriParser = () => {
    if (builder.memoizedParser === undefined) {
      builder.memoizedParser = URIParser(uri)
    }
    return builder.memoizedParser;
  }

  // determine requested image dimensions from the request
  builder.requestDimension = () => {
    var qsp = QueryStringParser;
    return qsp.dimension(query);
  };

  // find the smallest allowed dimension greater than that requested
  // not finding one, return the greatest allowed size
  builder.allowedDimension = (dimRequested) => {
    var allowed =
      builder.allowedDimensions[builder.allowedDimensions.length - 1];
    if (dimRequested && dimRequested.h && dimRequested.w) {
      for (var i = 0; i < builder.allowedDimensions.length; ++i) {
        var dimension = builder.allowedDimensions[i];
        if (dimRequested.h <= dimension.h &&
            dimRequested.w <= dimension.w
        ) {
          allowed = dimension;
          break;
        }
      }
    }
    return allowed;
  }

  builder.buildRequestURI = (uri, dimsWxH, acceptWebp) => {
    var parser = builder.uriParser(uri);

    // build the new uri to be forwarded upstream
    var parts = [];
    parts.push(parser.prefix());
    parts.push(dimsWxH.w + "x" + dimsWxH.h);

    // check support for webp
    if (acceptWebp) {
        parts.push(builder.webpExtension);
    }
    else{
        parts.push(parser.imageExtension());
    }
    parts.push(parser.imageName() + "." + parser.imageExtension());

    return parts.join("/");
  };

  // build edge request url of format /images/200x200/webp/image.jpg
  builder.edgeRequest = () => {
    var edgeURI = uri;
    var dims = builder.requestDimension();

    if (dims) {
      edgeURI = builder.buildRequestURI(
        uri,
        builder.allowedDimension(dims),
        accept.includes(builder.webpExtension)
      );
    }

    return edgeURI;
  };

  return builder;
};

export { QueryStringParser, ImageRequestBuilder };