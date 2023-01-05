'use strict';

let URIParser = (uri) => {
  let parser = {};

  // The 'Sharp' image package wants 'jpeg' over 'jpg'
  // We standardize on 'jpeg' in the scaled image path even if the
  //   image extension is 'jpg'
  // Normalize to lower case
  let normalizeImageFormat = (spec) => {
    const format = spec.toLowerCase();
    return format == 'jpg' ? 'jpeg' : format
  }

  parser.getKeysUsingFormat = (parts, imageFormat) => {
    parts.requiredFormat = normalizeImageFormat(imageFormat);

    let imageNameWithExt = parts.imageName + '.' + parts.imageExtension;
    let scaledPathElements;
    if (parts.prefix.length == 0) {
      parts.sourceKey = imageNameWithExt;
      scaledPathElements = [];
    } else {
      parts.sourceKey = parts.prefix + "/" + imageNameWithExt;
      scaledPathElements = [parts.prefix];
    }

    parts.scaledKey = scaledPathElements.concat([
      (parts.width + 'x' +  parts.height),
      parts.requiredFormat,
      imageNameWithExt
    ]).join('/');

    return parts;
  };

  let partsFromScaledPathMatch = (match) => {
    let parts = {};
    parts.prefix = match[1].trim();
    parts.width = parseInt(match[2], 10);
    parts.height = parseInt(match[3], 10);
    parts.imageName = match[5];
    parts.imageExtension = match[6];

    return parser.getKeysUsingFormat(parts, match[4]);
  }

  // parse the prefix, width, height and image name
  // Ex: uri=images/200x200/webp/image.jpg
  parser.getPartsFromScaledImageURI = () => {
    if (parser.memoizedParts === undefined) {
      let match = uri.match(
        /https?:\/\/(.*)\/(\d+)x(\d+)\/([^\/]+)\/([^\/]+)\.([^\/\.]+)/
      );
      if (match == null) {
        // perhaps there is no http protocol in the uri?
        match = uri.match(/\/?(.*)\/(\d+)x(\d+)\/(.*)\/(.*)\.([^\/\.]+)/);
      }
      try {
        parser.memoizedParts = partsFromScaledPathMatch(match);
      } catch(err) {
        console.error("URIParser has poor match for uri " +
          JSON.stringify(uri) + " error is " + err);
        parser.memoizedParts = {};
      }
    }
    return parser.memoizedParts;
  }

  let partsFromSourcePathMatch = (match) => {
    let parts = {};

    parts.prefix = match[1].trim();
    parts.imageName = match[2];
    parts.imageExtension = match[3];
    parts.width = 0;
    parts.height = 0;

    return parts;
  }

  // parse the prefix and image name
  // Ex. /path/to/images/image.jpg
  parser.getPartsFromSourceURI = () => {
    if (parser.memoizedParts === undefined) {
      var match = uri.match(/(.*)\/([^\/]+)\.([^\/]+)/);
      try {
        parser.memoizedParts = partsFromSourcePathMatch(match);
      } catch(err) {
        console.error("URIParser has poor match for uri " +
          JSON.stringify(uri) + " error is " + err);
        parser.memoizedParts = {};
      }
    }
    return parser.memoizedParts;
  };

  return parser;
};

export { URIParser };
