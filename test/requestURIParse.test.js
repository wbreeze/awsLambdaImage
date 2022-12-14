'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import { URIParser } from "../src/uriParser.js";

// URIParser uri for prefix
test('returns prefix with numeric element last in path', () => {
  let urip = URIParser('https://this/path/to/300/image.jpeg')
  let prefix = urip.prefix();
  assert.equal(prefix, 'https://this/path/to/300');
});

test('returns full prefix', () => {
  let urip = URIParser('https://this/path/to/image.jpeg')
  let prefix = urip.prefix();
  assert.equal(prefix, 'https://this/path/to');
});

test('returns valid prefix if the path is short', () => {
  let urip = URIParser('https://image.jpeg')
  assert.equal(urip.prefix(), 'https:/');
});

// URIParser uri for image name
test('returns image name if dimensions present', () => {
  let urip = URIParser('https://this/path/to/300/image.jpeg')
  let name = urip.imageName();
  assert.equal(name, 'image');
});

test('returns image name if dimensions not present', () => {
  let urip = URIParser('https://this/path/to/image.jpeg')
  let name = urip.imageName();
  assert.equal(name, 'image');
});

test('returns image name if dimensions not valid', () => {
  let urip = URIParser('https://this/path/to/abcx300/image.jpeg')
  let name = urip.imageName();
  assert.equal(name, 'image');
});

// URIParser uri for image extension
test('returns image ext if dimensions present', () => {
  let urip = URIParser('https://this/path/to/300/image.jpeg')
  let ext = urip.imageExtension();
  assert.equal(ext, 'jpeg');
});

test('returns image ext if dimensions not present', () => {
  let urip = URIParser('https://this/path/to/image.jpeg')
  let ext = urip.imageExtension();
  assert.equal(ext, 'jpeg');
});

test('returns image ext if dimensions not valid', () => {
  let urip = URIParser('https://this/path/to/abcx300/image.jpeg')
  let ext = urip.imageExtension();
  assert.equal(ext, 'jpeg');
});

// URIParser Memoizes uri
test('returns memoized values', () => {
  let urip = URIParser('https://this/is/the/way/to/800/grandma.png')
  let ext = urip.imageExtension();
  const memo = urip.elements;
  assert(memo);
  assert.equal(ext, 'png');
  assert.equal(urip.imageName(), 'grandma');
  assert.equal(urip.prefix(), 'https://this/is/the/way/to/800');
  assert.equal(urip.elements, memo);
});
