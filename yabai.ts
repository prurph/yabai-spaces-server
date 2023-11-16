export type Frame = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Display = {
  id: number;
  uuid: string;
  index: number;
  frame: Frame;
  spaces: number[];
};

export type Space = {
  id: number;
  uuid: string;
  index: number;
  label: string;
  display: number;
  windows: number[];
  ['first-window']: number;
  ['last-window']: number;
  ['has-focus']: boolean;
  ['is-visible']: boolean;
  ['is-native-fullscreen']: boolean;
};

export type Window = {
  id: number;
  pid: number;
  app: string;
  title: string;
  frame: Frame;
  role: string;
  subrole: string;
  display: number;
  space: number;
  level: number;
  layer: string;
  opacity: number;
  ['split-type']: string;
  ['split-child']: string;
  ['stack-index']: string;
  ['can-move']: boolean;
  ['can-resize']: boolean;
  ['has-focus']: boolean;
  ['has-shadow']: boolean;
  ['has-parent-zoom']: boolean;
  ['has-fullscreen-zoom']: boolean;
  ['is-native-fullscreen']: boolean;
  ['is-visible']: boolean;
  ['is-minimized']: boolean;
  ['is-hidden']: boolean;
  ['is-floating']: boolean;
  ['is-sticky']: boolean;
  ['is-grabbed']: boolean;
};

export type YabaiState = {
  displays: Display[];
  spaces: Space[];
  windows: Window[];
};

export type YabaiEventArgument =
  | 'YABAI_PROCESS_ID'
  | 'YABAI_RECENT_PROCESS_ID'
  | 'YABAI_WINDOW_ID'
  | 'YABAI_SPACE_ID'
  | 'YABAI_RECENT_SPACE_ID'
  | 'YABAI_DISPLAY_ID'
  | 'YABAI_RECENT_DISPLAY_ID';

// https://github.com/koekeishiya/yabai/blob/master/doc/yabai.asciidoc#event
export const YABAI_EVENTS: { [key: string]: YabaiEventArgument[] } = {
  application_launched: ['YABAI_PROCESS_ID'],
  application_terminated: ['YABAI_PROCESS_ID'],
  application_front_switched: ['YABAI_PROCESS_ID', 'YABAI_RECENT_PROCESS_ID'],
  application_visible: ['YABAI_PROCESS_ID'],
  application_hidden: ['YABAI_PROCESS_ID'],
  window_created: ['YABAI_WINDOW_ID'],
  window_destroyed: ['YABAI_WINDOW_ID'],
  window_focused: ['YABAI_WINDOW_ID'],
  window_moved: ['YABAI_WINDOW_ID'],
  window_resized: ['YABAI_WINDOW_ID'],
  window_minimized: ['YABAI_WINDOW_ID'],
  window_deminimized: ['YABAI_WINDOW_ID'],
  window_title_changed: ['YABAI_WINDOW_ID'],
  space_created: ['YABAI_SPACE_ID'],
  space_destroyed: ['YABAI_SPACE_ID'],
  space_changed: ['YABAI_SPACE_ID', 'YABAI_RECENT_SPACE_ID'],
  display_added: ['YABAI_DISPLAY_ID'],
  display_removed: ['YABAI_DISPLAY_ID'],
  display_moved: ['YABAI_DISPLAY_ID'],
  display_resized: ['YABAI_DISPLAY_ID'],
  display_changed: ['YABAI_DISPLAY_ID', 'YABAI_RECENT_DISPLAY_ID'],
  mission_control_enter: [],
  mission_control_exit: [],
  dock_did_restart: [],
  menu_bar_hidden_changed: [],
  dock_did_change_pref: [],
};
