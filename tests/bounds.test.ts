import { describe, expect, it } from 'vitest';
import { computeLayoutBounds, resolveTargetDisplay } from '../src/renderer/shared/utils/bounds';

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
