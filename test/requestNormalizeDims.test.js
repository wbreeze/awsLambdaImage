'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import { ImageRequestBuilder } from "../src/imageRequestBuilder.js";

test('finds the smallest', () => {
  let irb = ImageRequestBuilder({});
  let dim = irb.allowedDimension({ w: 400, h: 400 })
  assert.equal(dim.w, 600);
  assert.equal(dim.h, 600);
});

test('finds the largest', () => {
  let irb = ImageRequestBuilder({});
  let dim = irb.allowedDimension({ w: 3600, h: 3600 })
  assert.equal(dim.w, 3600);
  assert.equal(dim.h, 3600);
});

test('defaults the largest when request is larger', () => {
  let irb = ImageRequestBuilder({});
  let dim = irb.allowedDimension({ w: 36000, h: 36000 })
  assert.equal(dim.w, 3600);
  assert.equal(dim.h, 3600);
});

test('defaults the largest when none specified', () => {
  let irb = ImageRequestBuilder({});
  let dim = irb.allowedDimension(null)
  assert.equal(dim.w, 3600);
  assert.equal(dim.h, 3600);
});

test('defaults the largest when garbage specified', () => {
  let irb = ImageRequestBuilder({});
  let dim = irb.allowedDimension({ martin: "martian" })
  assert.equal(dim.w, 3600);
  assert.equal(dim.h, 3600);
});

test('finds the 2400', () => {
  let irb = ImageRequestBuilder({});
  let dim = irb.allowedDimension({ w: 2400, h: 2400 })
  assert.equal(dim.w, 2400);
  assert.equal(dim.h, 2400);
});
