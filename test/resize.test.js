const URIParser = require("../resize.js").URIParser;

describe('URIParser components', () => {
  it('parses expected format', () => {
    const testURI = 'https://this/path/to/300x400/jpeg/image.jpeg'
    let parser = URIParser(testURI)
    parts = parser.getParts();
    expect(parts.width).toEqual(300);
    expect(parts.height).toEqual(400);
    expect(parts.prefix).toEqual('https://this/path/to');
    expect(parts.requiredFormat).toEqual('jpeg');
    expect(parts.imageName).toEqual('image.jpeg');
    expect(parts.originalKey).toEqual('https://this/path/to/image.jpeg');
  });

  it('parses format without prefix', () => {
    const testURI = '/300x400/jpeg/image.jpeg'
    let parser = URIParser(testURI)
    parts = parser.getParts();
    expect(parts.width).toEqual(300);
    expect(parts.height).toEqual(400);
    expect(parts.prefix).toBe("")
    expect(parts.requiredFormat).toEqual('jpeg');
    expect(parts.imageName).toEqual('image.jpeg');
    expect(parts.originalKey).toEqual('/image.jpeg');
  });
});
