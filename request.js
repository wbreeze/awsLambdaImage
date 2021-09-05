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

// parse the size, "d" from the query string.
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

// parse the size, "d" from the uri
// Look for second to last path element d with value <width>x<height>
//   where width and height are integers,
//   e.g. "https://300x200/image.jpeg" returns { w:300, h:200 }
// A single integer dimension is valid as well, and is applied to both,
//   e.g. "https://300/image.jpeg" returns { w:300, h:300 }
// return null if second to last path element is not present or formatted
//   incorrectly, otherwise return
// { w: <width>, h: <height> } where <width> and <height> are integers
exports.URIParser = {
  dimension: (uri) => {
    let dimension = null;

    const match = uri.match(/(.*)\/([^\/]*)\/([^\/]*)/);

    if (match) {
      let dimSpec = match[2];
      dimension = WxHParser.parseWxH(dimSpec);
    }

    return dimension;
  }
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
    const urip = exports.URIParser;
    return qsp.dimension(request.queryString) ||
      urip.dimension(request.uri);
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

    // parse the prefix, image name and extension from the uri.
    // In our case /images/image.jpg

    const match = fwdUri.match(/(.*)\/(.*)\.(.*)/);

    let prefix = match[1];
    let imageName = match[2];
    let extension = match[3];

    // define variable to be set to true if requested dimension is allowed.
    let matchFound = false;

    // calculate the acceptable variance. If image dimension is 105 and is within acceptable
    // range, then in our case, the dimension would be corrected to 100.
    let variancePercent = (variables.variance/100);

    for (let dimension of variables.allowedDimension) {
        let minWidth = dimension.w - (dimension.w * variancePercent);
        let maxWidth = dimension.w + (dimension.w * variancePercent);
        if(width >= minWidth && width <= maxWidth){
            width = dimension.w;
            height = dimension.h;
            matchFound = true;
            break;
        }
    }
    // if no match is found from allowed dimension with variance then set to default
    //dimensions.
    if(!matchFound){
        width = variables.defaultDimension.w;
        height = variables.defaultDimension.h;
    }

    // read the accept header to determine if webP is supported.
    let accept = headers['accept']?headers['accept'][0].value:"";

    let url = [];
    // build the new uri to be forwarded upstream
    url.push(prefix);
    url.push(width+"x"+height);

    // check support for webp
    if (accept.includes(variables.webpExtension)) {
        url.push(variables.webpExtension);
    }
    else{
        url.push(extension);
    }
    url.push(imageName+"."+extension);

    fwdUri = url.join("/");

    // final modified url is of format /images/200x200/webp/image.jpg
    request.uri = fwdUri;
    callback(null, request);
};
