export const IPC = {
  // Renderer -> Main
  PAGE_CREATE: 'page:create',
  PAGE_CLOSE: 'page:close',
  PAGE_UPDATE: 'page:update',
  PAGE_FOCUS: 'page:focus',
  PAGE_SHOW: 'page:show',
  PAGE_HIDE: 'page:hide',
  PAGE_SET_BOUNDS: 'page:set-bounds',
  PAGE_SET_OPACITY: 'page:set-opacity',
  PAGE_SET_ALWAYS_ON_TOP: 'page:set-always-on-top',
  PAGE_GET_ALL: 'page:get-all',
  PAGE_APPLY_LAYOUT: 'page:apply-layout',
  DISPLAY_GET_ALL: 'display:get-all',

  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',

  UI_NEW_PAGE_DIALOG: 'ui:new-page-dialog',

  // Main -> Renderer
  PAGE_LIST_CHANGED: 'page:list-changed',
  PAGE_STATE_CHANGED: 'page:state-changed',
  PAGE_CLOSED: 'page:closed',
} as const;

export const ALLOWED_PROTOCOLS = ['http:', 'https:', 'file:'];

export const MIN_OPACITY = 0.1;
export const MAX_OPACITY = 1.0;
export const OPACITY_STEP = 0.05;
export const LOW_OPACITY_WARNING = 0.3;

export const DEFAULT_SETTINGS = {
  defaultWidth: 960,
  defaultHeight: 640,
  defaultOpacity: 1.0,
  defaultAlwaysOnTop: false,
  startupBehavior: 'restore' as const,
};
