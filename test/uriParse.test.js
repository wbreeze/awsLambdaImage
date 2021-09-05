const urip = require("../request.js").URIParser;

describe('Parses uri for dimensions', () => {
  it('finds width and height', () => {
    let dims = urip.dimension('https://this/path/to/300x400/image.jpeg')
    expect(dims.w).toEqual(300)
    expect(dims.h).toEqual(400)
  });

  it('returns null for no dimensions found', () => {
    let dims = urip.dimension('https://this/path/to/nodims/image.jpeg')
    expect(dims).toBe(null)
  });

  it('returns null if width is not an integer', () => {
    let dims = urip.dimension('https://this/path/to/abcx300/image.jpeg')
    expect(dims).toBe(null)
  });

  it('returns null if height is not an integer', () => {
    let dims = urip.dimension('https://this/path/to/300xabc/image.jpeg')
    expect(dims).toBe(null)
  });

  it('returns equal width and height if "x" omitted', () => {
    let dims = urip.dimension('https://this/path/to/300/image.jpeg')
    expect(dims.w).toEqual(300)
    expect(dims.h).toEqual(300)
  });

  it('returns null if there are too many "x"', () => {
    let dims = urip.dimension('https://this/path/to/300x400x500/image.jpeg')
    expect(dims).toBe(null)
  });

  it('returns null if the path is short', () => {
    let dims = urip.dimension('https://image.jpeg')
    expect(dims).toBe(null)
  });
});
