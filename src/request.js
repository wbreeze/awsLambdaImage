'use strict';

var WxHParser = () => {
  var parser = {}

  parser.parseIntegerStrictly = (strel) => {
      var dim = NaN;
      var digits = strel.split(/[^\d]/)
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
    var dimension = null
    var dimensionMatch = dimSpec.split("x");
    if (dimensionMatch.length == 1) {
      var dim = parser.parseIntegerStrictly(dimensionMatch[0])
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
var URIParser = (uri) => {
  var parser = {};

  parser.parseElements = () => {
    var elements = parser.elements;
    if (elements === undefined) {
      var match = uri.match(/(.*)\/([^\/]+)\.([^\/]+)/);
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
    var elems = parser.parseElements();
    return (elems && elems.prefix) ? elems.prefix : null;
  };

  parser.imageName = () => {
    var elems = parser.parseElements();
    return (elems && elems.name) ? elems.name : null;
  }

  parser.imageExtension = () => {
    var elems = parser.parseElements();
    return (elems && elems.extension) ? elems.extension : null;
  }

  return parser;
};

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

export {
  WxHParser, QueryStringParser, URIParser, ImageRequestBuilder,
  parseEvent, handler
};
