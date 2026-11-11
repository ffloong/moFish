import type { PageBounds } from '../types';

export type LayoutPreset = 'left' | 'right' | 'top' | 'bottom' | 'center' | 'full';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Compute a layout bounds relative to a display's workArea.
 * This makes layouts correct on any connected display, not just the primary one.
 */
export function computeLayoutBounds(
  preset: LayoutPreset,
  workArea: Rect,
  current: Pick<PageBounds, 'width' | 'height'>
): PageBounds & Required<Pick<PageBounds, 'x' | 'y'>> {
  const wa = workArea;
  switch (preset) {
    case 'left':
      return { x: wa.x, y: wa.y, width: Math.round(wa.width / 2), height: wa.height };
    case 'right':
      return {
        x: wa.x + Math.round(wa.width / 2),
        y: wa.y,
        width: Math.round(wa.width / 2),
        height: wa.height,
      };
    case 'top':
      return { x: wa.x, y: wa.y, width: wa.width, height: Math.round(wa.height / 2) };
    case 'bottom':
      return {
        x: wa.x,
        y: wa.y + Math.round(wa.height / 2),
        width: wa.width,
        height: Math.round(wa.height / 2),
      };
    case 'center': {
      const w = Math.min(current.width ?? wa.width, wa.width);
      const h = Math.min(current.height ?? wa.height, wa.height);
      return {
        x: wa.x + Math.round((wa.width - w) / 2),
        y: wa.y + Math.round((wa.height - h) / 2),
        width: w,
        height: h,
      };
    }
    case 'full':
      return { x: wa.x, y: wa.y, width: wa.width, height: wa.height };
  }
}
