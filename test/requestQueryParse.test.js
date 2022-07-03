import { WxHParser } from "../request.js"
const pwh = WxHParser();

describe('Parses query parameters for dimensions', () => {
  it('finds width and height', () => {
    let dims = pwh.parseWxH('300x400')
    expect(dims.w).toEqual(300)
    expect(dims.h).toEqual(400)
  });

  it('returns null if width is not an integer', () => {
    let dims = pwh.parseWxH('abcx400')
    expect(dims).toBe(null)
  });

  it('returns null if height is not an integer', () => {
    let dims = pwh.parseWxH('300xabc')
    expect(dims).toBe(null)
  });

  it('returns equal width and height if "x" omitted', () => {
    let dims = pwh.parseWxH('300')
    expect(dims.w).toEqual(300)
    expect(dims.h).toEqual(300)
  });

  it('returns null if "x" omitted and value is text', () => {
    let dims = pwh.parseWxH('abc')
    expect(dims).toBe(null)
  });

  it('returns null if there are too many "x"', () => {
    let dims = pwh.parseWxH('300x400x500')
    expect(dims).toBe(null)
  });
});
