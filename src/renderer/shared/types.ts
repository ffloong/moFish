export interface PageBounds {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

export type FrameMode = 'framed' | 'frameless' | 'mini';
export type AlwaysOnTopLevel = 'floating' | 'screen-saver';

export interface PageState {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  bounds: PageBounds;
  opacity: number;
  alwaysOnTop: boolean;
  alwaysOnTopLevel: AlwaysOnTopLevel;
  visible: boolean;
  frameMode: FrameMode;
  createdAt: number;
  lastActiveAt: number;
}

export interface CreatePageRequest {
  url: string;
  options?: Partial<
    Pick<PageState, 'bounds' | 'opacity' | 'alwaysOnTop' | 'frameMode'>
  >;
}

export interface UpdatePageRequest {
  id: string;
  updates: Partial<
    Pick<
      PageState,
      | 'bounds'
      | 'opacity'
      | 'alwaysOnTop'
      | 'alwaysOnTopLevel'
      | 'visible'
      | 'frameMode'
      | 'title'
    >
  >;
}

export interface DisplayInfo {
  id: number;
  label: string;
  isPrimary: boolean;
  workArea: { x: number; y: number; width: number; height: number };
}

export interface AppSettings {
  defaultWidth: number;
  defaultHeight: number;
  defaultOpacity: number;
  defaultAlwaysOnTop: boolean;
  startupBehavior: 'restore' | 'blank';
}

export interface PersistedData {
  pages: PageState[];
  settings: AppSettings;
  savedAt: number;
}
