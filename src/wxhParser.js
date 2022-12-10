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

export { WxHParser };
