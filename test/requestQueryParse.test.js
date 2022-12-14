'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import { WxHParser } from "../src/wxhParser.js"
const pwh = WxHParser();

// Parses query parameters for dimensions

test('finds width and height', () => {
  let dims = pwh.parseWxH('300x400')
  assert.equal(dims.w, 300)
  assert.equal(dims.h, 400)
});

test('returns null if width is not an integer', () => {
  let dims = pwh.parseWxH('abcx400')
  assert.equal(dims, null)
});

test('returns null if height is not an integer', () => {
  let dims = pwh.parseWxH('300xabc')
  assert.equal(dims, null)
});

test('returns equal width and height if "x" omitted', () => {
  let dims = pwh.parseWxH('300')
  assert.equal(dims.w, 300)
  assert.equal(dims.h, 300)
});

test('returns null if "x" omitted and value is text', () => {
  let dims = pwh.parseWxH('abc')
  assert.equal(dims, null)
});

test('returns null if there are too many "x"', () => {
  let dims = pwh.parseWxH('300x400x500')
  assert.equal(dims, null)
});
