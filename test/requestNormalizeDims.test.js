const ImageRequestBuilder = require("../request.js").ImageRequestBuilder;

describe('Normalized dimension request', () => {
  it('finds the smallest', () => {
    let irb = ImageRequestBuilder({});
    let dim = irb.allowedDimension({ w: 400, h: 400 })
    expect(dim.w).toEqual(600);
    expect(dim.h).toEqual(600);
  });

  it('finds the largest', () => {
    let irb = ImageRequestBuilder({});
    let dim = irb.allowedDimension({ w: 3600, h: 3600 })
    expect(dim.w).toEqual(3600);
    expect(dim.h).toEqual(3600);
  });

  it('defaults the largest when request is larger', () => {
    let irb = ImageRequestBuilder({});
    let dim = irb.allowedDimension({ w: 36000, h: 36000 })
    expect(dim.w).toEqual(3600);
    expect(dim.h).toEqual(3600);
  });

  it('defaults the largest when none specified', () => {
    let irb = ImageRequestBuilder({});
    let dim = irb.allowedDimension(null)
    expect(dim.w).toEqual(3600);
    expect(dim.h).toEqual(3600);
  });

  it('defaults the largest when garbage specified', () => {
    let irb = ImageRequestBuilder({});
    let dim = irb.allowedDimension({ martin: "martian" })
    expect(dim.w).toEqual(3600);
    expect(dim.h).toEqual(3600);
  });

  it('finds the 2400', () => {
    let irb = ImageRequestBuilder({});
    let dim = irb.allowedDimension({ w: 2400, h: 2400 })
    expect(dim.w).toEqual(2400);
    expect(dim.h).toEqual(2400);
  });
});
