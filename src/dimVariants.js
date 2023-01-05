'use strict';

/**
 These are here because they are used in multiple places.
 Also, you can adjust them.
 The ImageRequestBuilder.allowedDimension() function expects
   this array to have increasing  width (w) and height (h).
*/
var dimVariants = [
  { w:600, h:600 },
  { w:1200, h:1200 },
  { w:2400, h:2400 },
  { w:3600, h:3600 }
];

export { dimVariants };
