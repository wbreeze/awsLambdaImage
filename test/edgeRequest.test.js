const ImageRequestBuilder = require("../request.js").ImageRequestBuilder;
const RequestBuilder = (uri, query, doAcceptWebp) => {
  let request = {
    uri: uri,
    queryString: query,
    headers: []
  }

  if (doAcceptWebp) {
    request.headers['accept'] = [];
    request.headers['accept'].push('webp');
  }

  return request;
}

describe('Modifies URI of request with image dimensions and format', () => {
  it('passes undimensioned request unchanged', () => {
    const testURI = 'https://this/path/to/image.jpeg'
    let builder = ImageRequestBuilder(RequestBuilder(testURI, null, false))
    expect(builder.edgeRequest()).toEqual(testURI);
  });

  it('inserts dimensions from query param "d"', () => {
    const testURI = 'https://path/to/image.jpeg'
    const builder = ImageRequestBuilder(
      RequestBuilder(testURI, 'd=300x400', false)
    )
    const edge = builder.edgeRequest();
    expect(edge).toEqual('https://path/to/600x600/jpeg/image.jpeg');
  });

  it('inserts dimensions from second to last in path', () => {
    const testURI = 'https://path/to/300/image.jpeg'
    const builder = ImageRequestBuilder(
      RequestBuilder(testURI, null, false)
    )
    const edge = builder.edgeRequest();
    expect(edge).toEqual('https://path/to/600x600/jpeg/image.jpeg');
  });

  it('substitutes webp if accepted', () => {
    const testURI = 'https://path/to/300/image.jpeg'
    const builder = ImageRequestBuilder(
      RequestBuilder(testURI, null, true)
    )
    const edge = builder.edgeRequest();
    expect(edge).toEqual('https://path/to/600x600/webp/image.jpeg');
  });
});
