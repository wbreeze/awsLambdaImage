'use strict';

let URIParser = (uri) => {
  let parser = {};

  // correction for jpg required for 'Sharp'
  parser.imageFormat = (spec) => {
    const format = spec.toLowerCase();
    return format == 'jpg' ? 'jpeg' : format
  }

  parser.partsFromMatch = (match) => {
    let parts = {};
    parts.prefix = match[1].trim();
    parts.width = parseInt(match[2], 10);
    parts.height = parseInt(match[3], 10);
    parts.requiredFormat = parser.imageFormat(match[4]);
    parts.imageName = match[5];
    if (parts.prefix.length == 0) {
      parts.sourceKey = parts.imageName;
      parts.scaledKey = [
        (parts.width + 'x' +  parts.height),
        parts.requiredFormat,
        parts.imageName
      ].join('/');
    } else {
      parts.sourceKey = parts.prefix + "/" + parts.imageName;
      parts.scaledKey = [
        parts.prefix,
        (parts.width + 'x' +  parts.height),
        parts.requiredFormat,
        parts.imageName
      ].join('/');
    }
    return parts;
  }

  // parse the prefix, width, height and image name
  // Ex: uri=images/200x200/webp/image.jpg
  parser.getParts = () => {
    if (parser.memoizedParts === undefined) {
      // parse the prefix, width, height and image name
      // Ex: key=images/200x200/webp/image.jpg
      let match = uri.match(
        /https?:\/\/(.*)\/(\d+)x(\d+)\/([^\/]+)\/([^\/]+)/
      );
      if (match == null) {
        // no prefix for image..
        match = uri.match(/\/?(.*)\/(\d+)x(\d+)\/(.*)\/(.*)/);
      }
      try {
        parser.memoizedParts = parser.partsFromMatch(match);
      } catch(err) {
        console.log("URIParse has poor match for uri " + JSON.stringify(uri) +
          " error is " + err);
        parser.memoizedParts = {};
      }
    }
    return parser.memoizedParts;
  }

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

export { URIParser };
