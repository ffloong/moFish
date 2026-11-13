import type { BrowserWindow } from 'electron';
import { buildBorderStyle } from '../renderer/shared/utils/appearance';

const BORDER_STYLE_ID = 'mofish-window-border-style';

/**
 * Apply a visible frame without changing page layout. Outline is intentionally
 * used so external web apps do not get reflowed when the color changes.
 */
export function applyPageBorder(win: BrowserWindow, color: string): void {
  if (win.isDestroyed() || win.webContents.isDestroyed()) return;

  const css = buildBorderStyle(color);
  const script = `
    (() => {
      const id = ${JSON.stringify(BORDER_STYLE_ID)};
      document.getElementById(id)?.remove();
      ${css ? `const style = document.createElement('style'); style.id = id; style.textContent = ${JSON.stringify(css)}; document.head.appendChild(style);` : ''}
    })();
  `;

  void win.webContents.executeJavaScript(script, true).catch(() => {
    // Navigation, CSP, or window destruction can make an individual injection fail.
  });
}
