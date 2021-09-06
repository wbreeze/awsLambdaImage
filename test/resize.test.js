const URIParser = require("../resize.js").URIParser;

describe('URIParser components', () => {
  it('parses expected format', () => {
    const testURI = 'https://path/to/300x400/jpeg/image.jpeg'
    let parser = URIParser(testURI)
    parts = parser.getParts();
    expect(parts.width).toEqual(300);
    expect(parts.height).toEqual(400);
    expect(parts.prefix).toEqual('/path/to');
    expect(parts.requiredFormat).toEqual('jpeg');
    expect(parts.imageName).toEqual('image.jpeg');
    expect(parts.sourceKey).toEqual('/path/to/image.jpeg');
    expect(parts.scaledKey).toEqual('/path/to/300x400/jpeg/image.jpeg');
  });

  it('parses non ssl format', () => {
    const testURI = 'http://path/to/300x400/jpeg/image.jpeg'
    let parser = URIParser(testURI)
    parts = parser.getParts();
    expect(parts.width).toEqual(300);
    expect(parts.height).toEqual(400);
    expect(parts.prefix).toEqual('/path/to');
    expect(parts.requiredFormat).toEqual('jpeg');
    expect(parts.imageName).toEqual('image.jpeg');
    expect(parts.sourceKey).toEqual('/path/to/image.jpeg');
    expect(parts.scaledKey).toEqual('/path/to/300x400/jpeg/image.jpeg');
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
    expect(parts.sourceKey).toEqual('image.jpeg');
    expect(parts.scaledKey).toEqual('/300x400/jpeg/image.jpeg');
  });
});
