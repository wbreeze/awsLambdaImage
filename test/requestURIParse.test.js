import { URIParser } from "../request.js";

describe('URIParser uri for prefix', () => {
  it('returns prefix with numeric element last in path', () => {
    let urip = URIParser('https://this/path/to/300/image.jpeg')
    let prefix = urip.prefix();
    expect(prefix).toEqual('https://this/path/to/300')
  });

  it('returns full prefix', () => {
    let urip = URIParser('https://this/path/to/image.jpeg')
    let prefix = urip.prefix();
    expect(prefix).toEqual('https://this/path/to')
  });

  it('returns valid prefix if the path is short', () => {
    let urip = URIParser('https://image.jpeg')
    expect(urip.prefix()).toEqual('https:/')
  });
});

describe('URIParser uri for image name', () => {
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

describe('URIParser uri for image extension', () => {
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

describe('URIParser Memoizes uri', () => {
  it('returns memoized values', () => {
    let urip = URIParser('https://this/is/the/way/to/800/grandma.png')
    let ext = urip.imageExtension();
    const memo = urip.elements;
    expect(memo).toBeDefined();
    expect(ext).toEqual('png');
    expect(urip.imageName()).toEqual('grandma');
    expect(urip.prefix()).toEqual('https://this/is/the/way/to/800');
    expect(urip.elements).toBe(memo);
  });
});
