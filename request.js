'use strict';

const WxHParser = {
  // parse the size, "d" from the query string.
  // Look for parameter d with value <width>x<height> where width and height
  //   are integers, e.g. "d=300x200"
  parseWxH: (dimSpec) => {
    let dimension = null
    const dimensionMatch = dimSpec.split("x");
    if (dimensionMatch.length == 1) {
      const dim = parseInt(dimensionMatch[0])
      dimension = { w: dim, h: dim }
    } else if (dimensionMatch.length === 2) {
      dimension = {
        w: parseInt(dimensionMatch[0]),
        h: parseInt(dimensionMatch[1])
      }
    }
    if (dimension && (isNaN(dimension.w) || isNaN(dimension.h))) {
      dimension = null
    }
    return dimension
  }
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
      dimension = WxHParser.parseWxH(params.d);
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
// return null if second to last path element is not present or formatted
//   incorrectly, otherwise return
// { w: <width>, h: <height> } where <width> and <height> are integers
exports.URIParser = (uri) => {
    let parser = {};

    parser.parseElements = () => {
    let elements = parser.elements;
    if (elements === undefined) {
      const match = uri.match(/(.*)\/([^\/]*)\/([^\/]*)\.(.*)/);
      if (match) {
        elements = {
          prefix: match[1],
          dimSpec: match[2],
          name: match[3],
          extension: match[4]
        }
        const dims = WxHParser.parseWxH(elements.dimSpec);
        if (!dims) {
          elements.prefix = elements.prefix + '/' + elements.dimSpec;
          elements.dimSpec = null;
        }
      }
      parser.elements = elements;
    }
    return elements;
  };

  parser.dimensions = () => {
    const elems = parser.parseElements();
    return (elems && elems.dimSpec) ? WxHParser.parseWxH(elems.dimSpec) : null;
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

exports.ImageRequestHandler = {
  // defines the allowed dimensions, default dimensions and how much variance from allowed
  // dimension is allowed.
  variables: {
        allowedDimension : [ {w:600,h:600}, {w:1200,h:1200}, {w:2400,h:2400} ],
        defaultDimension : {w:600,h:600},
        variance: 200,
        webpExtension: 'webp'
  },

  // determine requested image dimensions from the request
  requestDimension: (request) => {
    const qsp = exports.QueryStringParser;
    const urip = exports.URIParser(uri);
    return qsp.dimension(request.queryString) || urip.dimensions();
  }
};

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    const irh = exports.ImageRequestHandler;
    const dims = irh.requestDimension(request);

    // if there is no dimension attribute, just pass the request
    if (!dims) {
        callback(null, request);
        return;
    }

    // set the width and height parameters
    let width = dims.w;
    let height = dims.h;

    // fetch the uri of original image
    let fwdUri = request.uri;

    // define variable to be set to true if requested dimension is allowed.
    let validDimension = false;

    // calculate the acceptable variance. If image dimension is 105 and is within acceptable
    // range, then in our case, the dimension would be corrected to 100.
    let variancePercent = (variables.variance/100);

    for (let dimension of variables.allowedDimension) {
        let minWidth = dimension.w - (dimension.w * variancePercent);
        let maxWidth = dimension.w + (dimension.w * variancePercent);
        if(width >= minWidth && width <= maxWidth){
            width = dimension.w;
            height = dimension.h;
            validDimension = true;
            break;
        }
    }
    // if no match is found from allowed dimension with variance then set to default
    //dimensions.
    if(!validDimension){
        width = variables.defaultDimension.w;
        height = variables.defaultDimension.h;
    }

    // read the accept header to determine if webP is supported.
    let accept = headers['accept']?headers['accept'][0].value:"";

    // build the new uri to be forwarded upstream
    let url = [];
    url.push(irh.prefix());
    url.push(width+"x"+height);

    // check support for webp
    if (accept.includes(variables.webpExtension)) {
        url.push(variables.webpExtension);
    }
    else{
        url.push(irh.extension());
    }
    url.push(irh.imageName() + "." + irh.extension());

    fwdUri = url.join("/");

    // final modified url is of format /images/200x200/webp/image.jpg
    request.uri = fwdUri;
    callback(null, request);
};
