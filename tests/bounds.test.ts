import { describe, expect, it } from 'vitest';
import { computeLayoutBounds, resolveTargetDisplay } from '../src/renderer/shared/utils/bounds';
import { buildBorderStyle, normalizeBorderColor } from '../src/renderer/shared/utils/appearance';

describe('layout bounds', () => {
  it('computes halves', () => {
    expect(
      computeLayoutBounds(
        'left',
        { x: 0, y: 0, width: 1440, height: 900 },
        { width: 400, height: 300 },
      ),
    ).toEqual({ x: 0, y: 0, width: 720, height: 900 });
    expect(
      computeLayoutBounds(
        'right',
        { x: 0, y: 0, width: 1440, height: 900 },
        { width: 400, height: 300 },
      ),
    ).toEqual({ x: 720, y: 0, width: 720, height: 900 });
    expect(
      computeLayoutBounds(
        'top',
        { x: 0, y: 0, width: 1440, height: 900 },
        { width: 400, height: 300 },
      ),
    ).toEqual({ x: 0, y: 0, width: 1440, height: 450 });
    expect(
      computeLayoutBounds(
        'bottom',
        { x: 0, y: 0, width: 1440, height: 900 },
        { width: 400, height: 300 },
      ),
    ).toEqual({ x: 0, y: 450, width: 1440, height: 450 });
    expect(
      computeLayoutBounds(
        'full',
        { x: 0, y: 0, width: 1440, height: 900 },
        { width: 400, height: 300 },
      ),
    ).toEqual({ x: 0, y: 0, width: 1440, height: 900 });
  });

  it('centers a page window', () => {
    expect(
      computeLayoutBounds(
        'center',
        { x: 0, y: 0, width: 1440, height: 900 },
        { width: 400, height: 300 },
      ),
    ).toEqual({
      x: 520,
      y: 300,
      width: 400,
      height: 300,
    });
  });
});

describe('resolveTargetDisplay', () => {
  const displays = [
    { id: 1, workArea: { x: 0, y: 0, width: 1440, height: 900 } },
    { id: 2, workArea: { x: -1920, y: 0, width: 1920, height: 1080 } },
  ];

  it('uses the display containing the current window center by default', () => {
    expect(
      resolveTargetDisplay(displays, undefined, { x: -1800, y: 100, width: 800, height: 600 })?.id,
    ).toBe(2);
  });

  it('uses an explicitly selected display', () => {
    expect(resolveTargetDisplay(displays, 2, { x: 0, y: 0, width: 800, height: 600 })?.id).toBe(2);
  });
});

describe('window appearance', () => {
  it('normalizes supported border colors', () => {
    expect(normalizeBorderColor(' #ffffff ')).toBe('#ffffff');
    expect(normalizeBorderColor('red')).toBe('red');
    expect(normalizeBorderColor('invalid; color')).toBe('transparent');
    expect(normalizeBorderColor('', '#000000')).toBe('#000000');
  });

  it('builds an inset page border and removes transparent borders', () => {
    expect(buildBorderStyle('#ffffff')).toContain('outline: 4px solid #ffffff');
    expect(buildBorderStyle('transparent')).toBe('');
  });
});
