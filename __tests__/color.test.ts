import { describe, it, expect } from 'vitest';
import { intensityToRGBA, hexToRgb } from '@/utils/color';

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#F5C518')).toEqual([245, 197, 24]);
  });
  it('parses without hash', () => {
    expect(hexToRgb('F5C518')).toEqual([245, 197, 24]);
  });
});

describe('intensityToRGBA', () => {
  it('count 0 returns empty cell color', () => {
    expect(intensityToRGBA('#F5C518', 0)).toBe('#F2F2F2');
  });
  it('count 1 maps to 0.18 alpha', () => {
    expect(intensityToRGBA('#F5C518', 1)).toBe('rgba(245,197,24,0.18)');
  });
  it('count 2 maps to 0.45 alpha', () => {
    expect(intensityToRGBA('#F5C518', 2)).toBe('rgba(245,197,24,0.45)');
  });
  it('count 3 maps to 0.78 alpha', () => {
    expect(intensityToRGBA('#F5C518', 3)).toBe('rgba(245,197,24,0.78)');
  });
  it('count 4+ maps to 1.0 alpha (cap)', () => {
    expect(intensityToRGBA('#F5C518', 4)).toBe('rgba(245,197,24,1)');
    expect(intensityToRGBA('#F5C518', 10)).toBe('rgba(245,197,24,1)');
  });
  it('works for other emotion colors', () => {
    expect(intensityToRGBA('#4A6FA5', 2)).toBe('rgba(74,111,165,0.45)');
  });
});