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
  current: Pick<PageBounds, 'width' | 'height'>,
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

export interface DisplayLike {
  id: number;
  workArea: Rect;
}

/**
 * Resolve the display used for a layout. An explicit target wins; otherwise
 * use the display nearest the current window center. This handles secondary
 * displays placed on any side of the primary display, including negative x/y.
 */
export function resolveTargetDisplay<T extends DisplayLike>(
  displays: readonly T[],
  targetDisplayId: number | undefined,
  current: Pick<PageBounds, 'x' | 'y' | 'width' | 'height'>,
): T | undefined {
  const explicit =
    targetDisplayId == null ? undefined : displays.find((d) => d.id === targetDisplayId);
  if (explicit) return explicit;

  const centerX = (current.x ?? 0) + current.width / 2;
  const centerY = (current.y ?? 0) + current.height / 2;
  return displays.reduce<T | undefined>((nearest, display) => {
    if (!nearest) return display;

    const distance = ({ x, y, width, height }: Rect): number => {
      const dx = Math.max(x - centerX, 0, centerX - (x + width));
      const dy = Math.max(y - centerY, 0, centerY - (y + height));
      return dx * dx + dy * dy;
    };

    return distance(display.workArea) < distance(nearest.workArea) ? display : nearest;
  }, undefined);
}
