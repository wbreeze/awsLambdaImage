const qsp = require("../request.js").QueryStringParser;

describe('Parses query parameters for dimensions', () => {
  it('finds width and height', () => {
    let dims = qsp.dimension('d=300x400')
    expect(dims.w).toEqual(300)
    expect(dims.h).toEqual(400)
  });

  it('returns null for no dimensions found', () => {
    let dims = qsp.dimension('w=300, h=400')
    expect(dims).toBe(null)
  });

  it('returns null if width is not an integer', () => {
    let dims = qsp.dimension('d=abcx400')
    expect(dims).toBe(null)
  });

  it('returns null if height is not an integer', () => {
    let dims = qsp.dimension('d=300xabc')
    expect(dims).toBe(null)
  });

  it('returns equal width and height if "x" omitted', () => {
    let dims = qsp.dimension('d=300')
    expect(dims.w).toEqual(300)
    expect(dims.h).toEqual(300)
  });

  it('returns null if "x" omitted and value is text', () => {
    let dims = qsp.dimension('d=abc')
    expect(dims).toBe(null)
  });

  it('returns null if there are too many "x"', () => {
    let dims = qsp.dimension('d=300x400x500')
    expect(dims).toBe(null)
  });
});
