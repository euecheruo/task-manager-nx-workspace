import { convertTimeStringToSeconds } from './jwt.utils';

describe('convertTimeStringToSeconds', () => {
  it('should convert minutes correctly', () => {
    expect(convertTimeStringToSeconds('15m')).toBe(900);
  });

  it('should convert days correctly', () => {
    expect(convertTimeStringToSeconds('1d')).toBe(86400);
  });

  it('should return raw number if no unit', () => {
    expect(convertTimeStringToSeconds('100')).toBe(100);
  });

  it('should throw error on invalid format', () => {
    expect(() => convertTimeStringToSeconds('invalid')).toThrow();
  });
});
