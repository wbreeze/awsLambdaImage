'use strict';

const WxHParser = () => {
  let parser = {}

  parser.parseIntegerStrictly = (strel) => {
      let dim = NaN;
      const digits = strel.split(/[^\d]/)
      if (digits.length === 1) {
        dim = parseInt(strel);
      }
      return dim;
  },

  // parse image size from the specification string.
  // Look for string with value "<width>x<height>" where width and height
  //   are integers strings, e.g. "300x200"
  // Or simply an integer, e.g. "300"
  // return { w: <width>, h: <height> } with <width> and <height> as
  //   numeric Integer values
  // return null if the specification is not valid
  parser.parseWxH = (dimSpec) => {
    let dimension = null
    const dimensionMatch = dimSpec.split("x");
    if (dimensionMatch.length == 1) {
      const dim = parser.parseIntegerStrictly(dimensionMatch[0])
      dimension = { w: dim, h: dim }
    } else if (dimensionMatch.length === 2) {
      dimension = {
        w: parser.parseIntegerStrictly(dimensionMatch[0]),
        h: parser.parseIntegerStrictly(dimensionMatch[1])
      }
    }
    if (dimension && (isNaN(dimension.w) || isNaN(dimension.h))) {
      dimension = null
    }
    return dimension
  }

  return parser;
};

// parse the image dimensions from the query string.
// Look for parameter d with value <width>x<height> where width and height
//   are integers, e.g. "d=300x200" returns { w:300, h:200 }
// A single integer dimension is valid as well, and is applied to both, e.g.
//   "d=300" returns { w:300, h:300 }
// return null if d not present or formatted incorrectly, otherwise return
//   { w: <width>, h: <height> } where <width> and <height> are integers
exports.QueryStringParser = {
  dimension: (query) => {
    const querystring = require('querystring');
    const params = querystring.parse(query);
    let dimension = null
    if (params.d) {
      dimension = WxHParser().parseWxH(params.d);
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
exports.URIParser = (uri) => {
  let parser = {};

  parser.parseElements = () => {
    let elements = parser.elements;
    if (elements === undefined) {
      const match = uri.match(/(.*)\/([^\/]+)\.([^\/]+)/);
      if (match) {
        elements = {
          prefix: match[1],
          name: match[2],
          extension: match[3]
        }
      }
      parser.elements = elements;
    }
    return elements;
  };

  parser.prefix = () => {
    const elems = parser.parseElements();
    return (elems && elems.prefix) ? elems.prefix : null;
  };

  parser.imageName = () => {
    const elems = parser.parseElements();
    return (elems && elems.name) ? elems.name : null;
  }

  parser.imageExtension = () => {
    const elems = parser.parseElements();
    return (elems && elems.extension) ? elems.extension : null;
  }

  return parser;
};

exports.ImageRequestBuilder = (request) => {
  let builder = {};

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
      builder.memoizedParser = exports.URIParser(request.uri)
    }
    return builder.memoizedParser;
  }

  // determine requested image dimensions from the request
  builder.requestDimension = () => {
    const qsp = exports.QueryStringParser;
    return qsp.dimension(request.queryString);
  };

  // find the smallest allowed dimension greater than that requested
  // not finding one, return the greatest allowed size
  builder.allowedDimension = (dimRequested) => {
    let allowed =
      builder.allowedDimensions[builder.allowedDimensions.length - 1];
    if (dimRequested && dimRequested.h && dimRequested.w) {
      for (let dimension of builder.allowedDimensions) {
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

  // build edge request url of format /images/200x200/webp/image.jpg
  builder.edgeRequest = () => {
    let edgeURI = request.uri;
    const dims = builder.requestDimension();
    console.log("dims is " + JSON.stringify(dims));

    if (dims) {
      const parser = builder.uriParser(request.uri);
      const normalized = builder.allowedDimension(dims);
      const headers = request.headers;

      // read the accept header to determine if webP is supported.
      let accept = request.headers['accept'] || [];

      // build the new uri to be forwarded upstream
      let url = [];
      url.push(parser.prefix());
      url.push(normalized.w + "x" + normalized.h);

      // check support for webp
      if (accept.includes(builder.webpExtension)) {
          url.push(builder.webpExtension);
      }
      else{
          url.push(parser.imageExtension());
      }
      url.push(parser.imageName() + "." + parser.imageExtension());

      edgeURI = url.join("/");
    }
    console.log("edge URI is " + JSON.stringify(edgeURI));
    return edgeURI;
  }

  return builder;
};

exports.handler = (event, context, callback) => {
    console.log("event is " + JSON.stringify(event));
    const request = event.Records[0].cf.request;
    console.log("request is " + JSON.stringify(request));
    const irb = exports.ImageRequestBuilder(request);
    const fwdURI = irb.edgeRequest()

    if (fwdURI) {
      request.uri = fwdURI;
    }
    callback(null, request);
};
