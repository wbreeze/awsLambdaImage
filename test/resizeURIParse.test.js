'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import { URIParser } from '../src/uriParser.js';

test('parses expected format', () => {
  const testURI = 'https://path/to/300x400/jpeg/image.jpeg';
  let urip = URIParser(testURI);
  let parts = urip.getParts();
  assert.equal(parts.width, 300);
  assert.equal(parts.height, 400);
  assert.equal(parts.prefix, 'path/to');
  assert.equal(parts.requiredFormat, 'jpeg');
  assert.equal(parts.imageName, 'image.jpeg');
  assert.equal(parts.sourceKey, 'path/to/image.jpeg');
  assert.equal(parts.scaledKey, 'path/to/300x400/jpeg/image.jpeg');
});

test('parses non ssl format', () => {
  const testURI = 'http://path/to/300x400/jpeg/image.jpeg'
  let urip = URIParser(testURI)
  let parts = urip.getParts();
  assert.equal(parts.width, 300);
  assert.equal(parts.height, 400);
  assert.equal(parts.prefix, 'path/to');
  assert.equal(parts.requiredFormat, 'jpeg');
  assert.equal(parts.imageName, 'image.jpeg');
  assert.equal(parts.sourceKey, 'path/to/image.jpeg');
  assert.equal(parts.scaledKey, 'path/to/300x400/jpeg/image.jpeg');
});

test('parses format without prefix', () => {
  const testURI = '/300x400/jpeg/image.jpeg'
  let urip = URIParser(testURI)
  let parts = urip.getParts();
  assert.equal(parts.width, 300);
  assert.equal(parts.height, 400);
  assert.equal(parts.prefix, '');
  assert.equal(parts.requiredFormat, 'jpeg');
  assert.equal(parts.imageName, 'image.jpeg');
  assert.equal(parts.sourceKey, 'image.jpeg');
  assert.equal(parts.scaledKey, '300x400/jpeg/image.jpeg');
});

test('parses format with path but no prefix', () => {
  const testURI = '/images/300x400/jpeg/image.jpeg'
  let urip = URIParser(testURI)
  let parts = urip.getParts();
  assert.equal(parts.width, 300);
  assert.equal(parts.height, 400);
  assert.equal(parts.prefix, 'images');
  assert.equal(parts.requiredFormat, 'jpeg');
  assert.equal(parts.imageName, 'image.jpeg');
  assert.equal(parts.sourceKey, 'images/image.jpeg');
  assert.equal(parts.scaledKey, 'images/300x400/jpeg/image.jpeg');
});
