export const DEFAULT_BORDER_COLOR = 'transparent';

export const BORDER_PRESETS = [
  { key: 'transparent', label: '无', color: 'transparent' },
  { key: 'white', label: '白', color: '#ffffff' },
  { key: 'black', label: '黑', color: '#000000' },
] as const;

const CSS_COLOR_PATTERN =
  /^(transparent|#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})|(?:rgba?|hsla?)\(\s*[-\d.,%\s]+\)|[a-z]+)$/i;

export function normalizeBorderColor(value: unknown, fallback = DEFAULT_BORDER_COLOR): string {
  const color = typeof value === 'string' ? value.trim() : '';
  if (!color) return fallback;
  return CSS_COLOR_PATTERN.test(color) ? color : fallback;
}

export function buildBorderStyle(color: string): string {
  const normalized = normalizeBorderColor(color);
  if (normalized === 'transparent') return '';

  return [
    'html {',
    '  outline: 4px solid ' + normalized + ' !important;',
    '  outline-offset: -4px !important;',
    '}',
  ].join('\n');
}
