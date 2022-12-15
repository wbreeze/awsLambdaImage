'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import { ImageHandler, processEvent } from "../src/recover.js";
import { createMockCF } from "./createMockCF.js";

function mockedImageHandler(
  request, response, passCheck, passTouch
) {
  let handler = ImageHandler(request, response);
  handler.didCallCheck = false;
  handler.didCallTouch = false;

  handler.checkImage = (parts) => {
    handler.didCallCheck = true;
    return passCheck ?
      Promise.resolve({"modification-date": Date()}) :
      Promise.reject('Fn checkImage did fail');
  }

  handler.touchImage = (parts, attributes) => {
    handler.didCallTouch = true;
    return passTouch ?
      Promise.resolve('Touched') :
      Promise.reject('Fn touchImage did fail');
  }

  return handler;
};

let mockCFNotFound = createMockCF();
let mockRequest = mockCFNotFound.Records[0].cf.request;
let mockResponse = mockCFNotFound.Records[0].cf.response;

test('checks for the image', () => {
  let ih = mockedImageHandler(mockRequest, mockResponse, true, true);
  return ih.processResponse().then(() => assert.ok(ih.didCallCheck));
});

test('tries to touch the image', () => {
  let ih = mockedImageHandler(mockRequest, mockResponse, true, true);
  return ih.processResponse().then(() => assert.ok(ih.didCallTouch));
});

test('generates a redirect when source image found and touched', () => {
  let ih = mockedImageHandler(mockRequest, mockResponse, true, true);
  return ih.processResponse()
    .then((response) => {
      assert.equal(response.status, 302);
      assert.equal(response.statusDescription, 'Found');
      assert.equal(response.headers.location[0].value, 'IMG_8932.png');
      return true;
    });
});

test('generates a redirect when source image found and touch failed', () => {
  let ih = mockedImageHandler(mockRequest, mockResponse, true, false);
  return ih.processResponse()
    .then((response) => {
      assert.equal(response.status, 302);
      assert.equal(response.statusDescription, 'Found');
      assert.equal(response.headers.location[0].value, 'IMG_8932.png');
      return true;
    });
});

test('returns original response when the image does not exist', () => {
  let ih = mockedImageHandler(mockRequest, mockResponse, false, false);
  return ih.processResponse()
    .then((response) => assert.equal(response, mockResponse));
});

test('passes response unaltered given 200 status', () => {
  let mockCFFound = createMockCF();
  let mockResponse = mockCFFound.Records[0].cf.response;
  mockResponse.status = 200;
  mockResponse.statusDescription = "Success";
  return processEvent(mockCFFound)
    .then((response) => assert.equal(response, mockResponse));
});

