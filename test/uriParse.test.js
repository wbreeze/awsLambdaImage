const URIParser = require("../request.js").URIParser;

describe('Parses uri for dimensions', () => {
  it('finds width and height', () => {
    let urip = URIParser('https://this/path/to/300x400/image.jpeg')
    let dims = urip.dimensions();
    expect(dims.w).toEqual(300)
    expect(dims.h).toEqual(400)
  });

  it('returns null for no dimensions found', () => {
    let urip = URIParser('https://this/path/to/nodims/image.jpeg')
    expect(urip.dimensions()).toBe(null)
  });

  it('returns null if width is not an integer', () => {
    let urip = URIParser('https://this/path/to/abcx300/image.jpeg')
    expect(urip.dimensions()).toBe(null)
  });

  it('returns null if height is not an integer', () => {
    let urip = URIParser('https://this/path/to/300xabc/image.jpeg')
    expect(urip.dimensions()).toBe(null)
  });

  it('returns equal width and height if "x" omitted', () => {
    let urip = URIParser('https://this/path/to/300/image.jpeg')
    let dims = urip.dimensions();
    expect(dims.w).toEqual(300)
    expect(dims.h).toEqual(300)
  });

  it('returns null if there are too many "x"', () => {
    let urip = URIParser('https://this/path/to/300x400x500/image.jpeg')
    expect(urip.dimensions()).toBe(null)
  });

  it('returns null if the path is short', () => {
    let urip = URIParser('https://image.jpeg')
    expect(urip.dimensions()).toBe(null)
  });
});

describe('Parses uri for prefix', () => {
  it('returns prefix minus dimensions if dimensions present', () => {
    let urip = URIParser('https://this/path/to/300/image.jpeg')
    let prefix = urip.prefix();
    expect(prefix).toEqual('https://this/path/to')
  });

  it('returns full prefix if dimensions not present', () => {
    let urip = URIParser('https://this/path/to/image.jpeg')
    let prefix = urip.prefix();
    expect(prefix).toEqual('https://this/path/to')
  });

  it('returns full prefix if dimensions not valid', () => {
    let urip = URIParser('https://this/path/to/abcx300/image.jpeg')
    let prefix = urip.prefix();
    expect(prefix).toEqual('https://this/path/to/abcx300')
  });
});

describe('Parses uri for image name', () => {
  it('returns image name if dimensions present', () => {
    let urip = URIParser('https://this/path/to/300/image.jpeg')
    let name = urip.imageName();
    expect(name).toEqual('image');
  });

  it('returns image name if dimensions not present', () => {
    let urip = URIParser('https://this/path/to/image.jpeg')
    let name = urip.imageName();
    expect(name).toEqual('image');
  });

  it('returns image name if dimensions not valid', () => {
    let urip = URIParser('https://this/path/to/abcx300/image.jpeg')
    let name = urip.imageName();
    expect(name).toEqual('image');
  });
});

describe('Parses uri for image extension', () => {
  it('returns image ext if dimensions present', () => {
    let urip = URIParser('https://this/path/to/300/image.jpeg')
    let ext = urip.imageExtension();
    expect(ext).toEqual('jpeg');
  });

  it('returns image ext if dimensions not present', () => {
    let urip = URIParser('https://this/path/to/image.jpeg')
    let ext = urip.imageExtension();
    expect(ext).toEqual('jpeg');
  });

  it('returns image ext if dimensions not valid', () => {
    let urip = URIParser('https://this/path/to/abcx300/image.jpeg')
    let ext = urip.imageExtension();
    expect(ext).toEqual('jpeg');
  });
});

describe('Memoizes uri for size, prefix, image name, and extension', () => {
  it('returns memoized values', () => {
    let urip = URIParser('https://this/is/the/way/to/800/grandma.png')
    let ext = urip.imageExtension();
    const memo = urip.elements;
    expect(memo).toBeDefined();
    expect(ext).toEqual('png');
    expect(urip.imageName()).toEqual('grandma');
    expect(urip.prefix()).toEqual('https://this/is/the/way/to');
    expect(urip.dimensions()).toEqual({ w:800, h:800 });
    expect(urip.elements).toBe(memo);
  });
});
