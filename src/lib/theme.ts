export interface AppSettings {
  theme: string;
  accentColor: string;
  editorFont: string;
  editorFontSize: number;
  lineHeight: number;
  uiFont: string;
  wordWrap: boolean;
  lineNumbers: boolean;
  highlightActiveLine: boolean;
  showMinimap: boolean;
  tabSize: number;
  spellcheck: boolean;
  autoSave: boolean;
  maxWidth: number;
  focusFade: number;
  zenToolbar: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

type ThemeDefinition = {
  label: string;
  dark: boolean;
  vars: Record<string, string>;
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'default-light',
  accentColor: '#9875c1',
  editorFont: 'google-sans',
  editorFontSize: 15,
  lineHeight: 1.75,
  uiFont: 'google-sans',
  wordWrap: true,
  lineNumbers: true,
  highlightActiveLine: true,
  showMinimap: false,
  tabSize: 2,
  spellcheck: true,
  autoSave: true,
  maxWidth: 740,
  focusFade: 40,
  zenToolbar: false,
  reducedMotion: false,
  highContrast: false,
};

export const THEMES: Record<string, ThemeDefinition> = {
  'default-light': {
    label: 'Vantage Light', dark: false,
    vars: {
      '--bg': '#ffffff', '--bg-alt': '#f7f7f7', '--bg-deep': '#f0f0f0',
      '--text': '#0a0a0a', '--text-2': '#2a2a2a', '--text-3': '#3a3a3a', '--text-4': '#636363',
      '--surface-0': 'rgba(255,255,255,0.72)', '--surface-1': 'rgba(255,255,255,0.88)', '--surface-2': 'rgba(255,255,255,0.97)',
      '--border': 'rgba(0,0,0,0.09)', '--border-med': 'rgba(0,0,0,0.14)', '--border-strong': 'rgba(0,0,0,0.22)',
      '--surface-sidebar': 'rgba(238,238,238,0.94)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.06)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.10),0 2px 6px rgba(0,0,0,0.06)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.14),0 2px 10px rgba(0,0,0,0.07)',
    },
  },
  'default-dark': {
    label: 'Vantage Dark', dark: true,
    vars: {
      '--bg': '#0a0a0a', '--bg-alt': '#111111', '--bg-deep': '#181818',
      '--text': '#f0f0f0', '--text-2': '#d0d0d0', '--text-3': '#b8b8b8', '--text-4': '#787878',
      '--surface-0': 'rgba(16,16,16,0.75)', '--surface-1': 'rgba(22,22,22,0.88)', '--surface-2': 'rgba(28,28,28,0.97)',
      '--border': 'rgba(255,255,255,0.10)', '--border-med': 'rgba(255,255,255,0.16)', '--border-strong': 'rgba(255,255,255,0.26)',
      '--surface-sidebar': 'rgba(20,20,20,0.96)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.35)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.45)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.55)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.65)',
    },
  },
  'catppuccin-mocha': {
    label: 'Catppuccin Mocha', dark: true,
    vars: {
      '--bg': '#1e1e2e', '--bg-alt': '#181825', '--bg-deep': '#11111b',
      '--text': '#cdd6f4', '--text-2': '#bac2de', '--text-3': '#a6adc8', '--text-4': '#7f849c',
      '--surface-0': 'rgba(30,30,46,0.80)', '--surface-1': 'rgba(36,36,54,0.92)', '--surface-2': 'rgba(42,42,62,0.98)',
      '--border': 'rgba(205,214,244,0.10)', '--border-med': 'rgba(205,214,244,0.16)', '--border-strong': 'rgba(205,214,244,0.24)',
      '--surface-sidebar': 'rgba(17,17,27,0.97)',
      '--accent': '#cba6f7', '--accent-hover': '#b388ef', '--accent-light': '#d8b4fe',
      '--accent-subtle': 'rgba(203,166,247,0.10)', '--accent-subtle2': 'rgba(203,166,247,0.18)', '--accent-glow': 'rgba(203,166,247,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'catppuccin-latte': {
    label: 'Catppuccin Latte', dark: false,
    vars: {
      '--bg': '#eff1f5', '--bg-alt': '#e6e9ef', '--bg-deep': '#dce0e8',
      '--text': '#4c4f69', '--text-2': '#5c5f77', '--text-3': '#6c6f85', '--text-4': '#9ca0b0',
      '--surface-0': 'rgba(239,241,245,0.80)', '--surface-1': 'rgba(230,233,239,0.92)', '--surface-2': 'rgba(220,224,232,0.98)',
      '--border': 'rgba(76,79,105,0.10)', '--border-med': 'rgba(76,79,105,0.16)', '--border-strong': 'rgba(76,79,105,0.24)',
      '--surface-sidebar': 'rgba(220,224,232,0.97)',
      '--accent': '#8839ef', '--accent-hover': '#7527e0', '--accent-light': '#9d4ded',
      '--accent-subtle': 'rgba(136,57,239,0.09)', '--accent-subtle2': 'rgba(136,57,239,0.16)', '--accent-glow': 'rgba(136,57,239,0.25)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.06)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.08)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.10)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.14)',
    },
  },
  'darcula': {
    label: 'Darcula', dark: true,
    vars: {
      '--bg': '#2b2b2b', '--bg-alt': '#313335', '--bg-deep': '#3c3f41',
      '--text': '#a9b7c6', '--text-2': '#9aa6b5', '--text-3': '#859198', '--text-4': '#606366',
      '--surface-0': 'rgba(43,43,43,0.85)', '--surface-1': 'rgba(49,51,53,0.92)', '--surface-2': 'rgba(55,57,59,0.98)',
      '--border': 'rgba(169,183,198,0.12)', '--border-med': 'rgba(169,183,198,0.18)', '--border-strong': 'rgba(169,183,198,0.26)',
      '--surface-sidebar': 'rgba(37,37,37,0.98)',
      '--accent': '#6897bb', '--accent-hover': '#5580a0', '--accent-light': '#89b4d4',
      '--accent-subtle': 'rgba(104,151,187,0.12)', '--accent-subtle2': 'rgba(104,151,187,0.20)', '--accent-glow': 'rgba(104,151,187,0.30)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'monokai': {
    label: 'Monokai', dark: true,
    vars: {
      '--bg': '#272822', '--bg-alt': '#1e1f1c', '--bg-deep': '#16161a',
      '--text': '#f8f8f2', '--text-2': '#e8e8e2', '--text-3': '#c8c8c2', '--text-4': '#75715e',
      '--surface-0': 'rgba(39,40,34,0.85)', '--surface-1': 'rgba(45,46,40,0.92)', '--surface-2': 'rgba(51,52,46,0.98)',
      '--border': 'rgba(248,248,242,0.10)', '--border-med': 'rgba(248,248,242,0.16)', '--border-strong': 'rgba(248,248,242,0.24)',
      '--surface-sidebar': 'rgba(30,31,28,0.98)',
      '--accent': '#a6e22e', '--accent-hover': '#8dc920', '--accent-light': '#c4f05a',
      '--accent-subtle': 'rgba(166,226,46,0.10)', '--accent-subtle2': 'rgba(166,226,46,0.18)', '--accent-glow': 'rgba(166,226,46,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'nord': {
    label: 'Nord', dark: true,
    vars: {
      '--bg': '#2e3440', '--bg-alt': '#3b4252', '--bg-deep': '#434c5e',
      '--text': '#eceff4', '--text-2': '#e5e9f0', '--text-3': '#d8dee9', '--text-4': '#88c0d0',
      '--surface-0': 'rgba(46,52,64,0.85)', '--surface-1': 'rgba(59,66,82,0.92)', '--surface-2': 'rgba(67,76,94,0.98)',
      '--border': 'rgba(236,239,244,0.10)', '--border-med': 'rgba(236,239,244,0.16)', '--border-strong': 'rgba(236,239,244,0.24)',
      '--surface-sidebar': 'rgba(39,44,55,0.98)',
      '--accent': '#88c0d0', '--accent-hover': '#6aaec0', '--accent-light': '#a3cfdb',
      '--accent-subtle': 'rgba(136,192,208,0.10)', '--accent-subtle2': 'rgba(136,192,208,0.18)', '--accent-glow': 'rgba(136,192,208,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'solarized-dark': {
    label: 'Solarized Dark', dark: true,
    vars: {
      '--bg': '#002b36', '--bg-alt': '#073642', '--bg-deep': '#0d4451',
      '--text': '#fdf6e3', '--text-2': '#eee8d5', '--text-3': '#93a1a1', '--text-4': '#657b83',
      '--surface-0': 'rgba(0,43,54,0.85)', '--surface-1': 'rgba(7,54,66,0.92)', '--surface-2': 'rgba(13,68,81,0.98)',
      '--border': 'rgba(253,246,227,0.10)', '--border-med': 'rgba(253,246,227,0.16)', '--border-strong': 'rgba(253,246,227,0.24)',
      '--surface-sidebar': 'rgba(0,35,44,0.98)',
      '--accent': '#268bd2', '--accent-hover': '#1a7abf', '--accent-light': '#4fa8e8',
      '--accent-subtle': 'rgba(38,139,210,0.10)', '--accent-subtle2': 'rgba(38,139,210,0.18)', '--accent-glow': 'rgba(38,139,210,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'solarized-light': {
    label: 'Solarized Light', dark: false,
    vars: {
      '--bg': '#fdf6e3', '--bg-alt': '#eee8d5', '--bg-deep': '#d8d2c0',
      '--text': '#073642', '--text-2': '#135564', '--text-3': '#586e75', '--text-4': '#93a1a1',
      '--surface-0': 'rgba(253,246,227,0.80)', '--surface-1': 'rgba(238,232,213,0.92)', '--surface-2': 'rgba(216,210,192,0.98)',
      '--border': 'rgba(7,54,66,0.10)', '--border-med': 'rgba(7,54,66,0.16)', '--border-strong': 'rgba(7,54,66,0.24)',
      '--surface-sidebar': 'rgba(238,232,213,0.98)',
      '--accent': '#268bd2', '--accent-hover': '#1a7abf', '--accent-light': '#4fa8e8',
      '--accent-subtle': 'rgba(38,139,210,0.09)', '--accent-subtle2': 'rgba(38,139,210,0.16)', '--accent-glow': 'rgba(38,139,210,0.25)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.06)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.08)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.10)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.14)',
    },
  },
  'github-dark': {
    label: 'GitHub Dark', dark: true,
    vars: {
      '--bg': '#0d1117', '--bg-alt': '#161b22', '--bg-deep': '#21262d',
      '--text': '#e6edf3', '--text-2': '#c9d1d9', '--text-3': '#b1bac4', '--text-4': '#8b949e',
      '--surface-0': 'rgba(13,17,23,0.85)', '--surface-1': 'rgba(22,27,34,0.92)', '--surface-2': 'rgba(33,38,45,0.98)',
      '--border': 'rgba(230,237,243,0.10)', '--border-med': 'rgba(230,237,243,0.16)', '--border-strong': 'rgba(230,237,243,0.24)',
      '--surface-sidebar': 'rgba(9,13,18,0.98)',
      '--accent': '#2f81f7', '--accent-hover': '#1f6fe5', '--accent-light': '#58a6ff',
      '--accent-subtle': 'rgba(47,129,247,0.10)', '--accent-subtle2': 'rgba(47,129,247,0.18)', '--accent-glow': 'rgba(47,129,247,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'github-light': {
    label: 'GitHub Light', dark: false,
    vars: {
      '--bg': '#ffffff', '--bg-alt': '#f6f8fa', '--bg-deep': '#eaeef2',
      '--text': '#1f2328', '--text-2': '#2f363d', '--text-3': '#57606a', '--text-4': '#6e7781',
      '--surface-0': 'rgba(255,255,255,0.82)', '--surface-1': 'rgba(246,248,250,0.94)', '--surface-2': 'rgba(234,238,242,0.98)',
      '--border': 'rgba(31,35,40,0.10)', '--border-med': 'rgba(31,35,40,0.16)', '--border-strong': 'rgba(31,35,40,0.24)',
      '--surface-sidebar': 'rgba(246,248,250,0.98)',
      '--accent': '#0969da', '--accent-hover': '#0550ae', '--accent-light': '#218bff',
      '--accent-subtle': 'rgba(9,105,218,0.09)', '--accent-subtle2': 'rgba(9,105,218,0.16)', '--accent-glow': 'rgba(9,105,218,0.25)',
      '--sh-xs': '0 1px 3px rgba(15,23,42,0.06)', '--sh-sm': '0 2px 10px rgba(15,23,42,0.08)',
      '--sh-md': '0 4px 22px rgba(15,23,42,0.10)', '--sh-lg': '0 8px 40px rgba(15,23,42,0.14)',
    },
  },
  'tokyo-night': {
    label: 'Tokyo Night', dark: true,
    vars: {
      '--bg': '#1a1b26', '--bg-alt': '#16161e', '--bg-deep': '#13131a',
      '--text': '#a9b1d6', '--text-2': '#9aa5ce', '--text-3': '#787c99', '--text-4': '#565f89',
      '--surface-0': 'rgba(26,27,38,0.85)', '--surface-1': 'rgba(22,22,30,0.92)', '--surface-2': 'rgba(19,19,26,0.98)',
      '--border': 'rgba(169,177,214,0.10)', '--border-med': 'rgba(169,177,214,0.16)', '--border-strong': 'rgba(169,177,214,0.24)',
      '--surface-sidebar': 'rgba(15,15,20,0.98)',
      '--accent': '#7aa2f7', '--accent-hover': '#5d8ef5', '--accent-light': '#9cbaf9',
      '--accent-subtle': 'rgba(122,162,247,0.10)', '--accent-subtle2': 'rgba(122,162,247,0.18)', '--accent-glow': 'rgba(122,162,247,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'rose-pine': {
    label: 'Rose Pine', dark: true,
    vars: {
      '--bg': '#191724', '--bg-alt': '#1f1d2e', '--bg-deep': '#26233a',
      '--text': '#e0def4', '--text-2': '#c5c0e0', '--text-3': '#9893b8', '--text-4': '#6e6a86',
      '--surface-0': 'rgba(25,23,36,0.85)', '--surface-1': 'rgba(31,29,46,0.92)', '--surface-2': 'rgba(38,35,58,0.98)',
      '--border': 'rgba(224,222,244,0.10)', '--border-med': 'rgba(224,222,244,0.16)', '--border-strong': 'rgba(224,222,244,0.24)',
      '--surface-sidebar': 'rgba(15,14,22,0.98)',
      '--accent': '#c4a7e7', '--accent-hover': '#ad8ed4', '--accent-light': '#d8c0f0',
      '--accent-subtle': 'rgba(196,167,231,0.10)', '--accent-subtle2': 'rgba(196,167,231,0.18)', '--accent-glow': 'rgba(196,167,231,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'gruvbox-dark': {
    label: 'Gruvbox Dark', dark: true,
    vars: {
      '--bg': '#282828', '--bg-alt': '#32302f', '--bg-deep': '#1d2021',
      '--text': '#ebdbb2', '--text-2': '#d5c4a1', '--text-3': '#bdae93', '--text-4': '#928374',
      '--surface-0': 'rgba(40,40,40,0.85)', '--surface-1': 'rgba(50,48,47,0.92)', '--surface-2': 'rgba(60,56,54,0.98)',
      '--border': 'rgba(235,219,178,0.10)', '--border-med': 'rgba(235,219,178,0.16)', '--border-strong': 'rgba(235,219,178,0.24)',
      '--surface-sidebar': 'rgba(29,32,33,0.98)',
      '--accent': '#d79921', '--accent-hover': '#b57614', '--accent-light': '#fabd2f',
      '--accent-subtle': 'rgba(215,153,33,0.12)', '--accent-subtle2': 'rgba(215,153,33,0.20)', '--accent-glow': 'rgba(215,153,33,0.32)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'gruvbox-light': {
    label: 'Gruvbox Light', dark: false,
    vars: {
      '--bg': '#fbf1c7', '--bg-alt': '#f2e5bc', '--bg-deep': '#ebdbb2',
      '--text': '#3c3836', '--text-2': '#504945', '--text-3': '#665c54', '--text-4': '#928374',
      '--surface-0': 'rgba(251,241,199,0.80)', '--surface-1': 'rgba(242,229,188,0.92)', '--surface-2': 'rgba(235,219,178,0.98)',
      '--border': 'rgba(60,56,54,0.10)', '--border-med': 'rgba(60,56,54,0.16)', '--border-strong': 'rgba(60,56,54,0.24)',
      '--surface-sidebar': 'rgba(235,219,178,0.98)',
      '--accent': '#d65d0e', '--accent-hover': '#af3a03', '--accent-light': '#fe8019',
      '--accent-subtle': 'rgba(214,93,14,0.09)', '--accent-subtle2': 'rgba(214,93,14,0.16)', '--accent-glow': 'rgba(214,93,14,0.25)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.06)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.08)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.10)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.14)',
    },
  },
  'dracula': {
    label: 'Dracula', dark: true,
    vars: {
      '--bg': '#282a36', '--bg-alt': '#21222c', '--bg-deep': '#191a21',
      '--text': '#f8f8f2', '--text-2': '#e2e2dc', '--text-3': '#c8c8c0', '--text-4': '#6272a4',
      '--surface-0': 'rgba(40,42,54,0.85)', '--surface-1': 'rgba(33,34,44,0.92)', '--surface-2': 'rgba(26,27,38,0.98)',
      '--border': 'rgba(248,248,242,0.10)', '--border-med': 'rgba(248,248,242,0.16)', '--border-strong': 'rgba(248,248,242,0.24)',
      '--surface-sidebar': 'rgba(25,26,33,0.98)',
      '--accent': '#bd93f9', '--accent-hover': '#a472f0', '--accent-light': '#caa8fb',
      '--accent-subtle': 'rgba(189,147,249,0.10)', '--accent-subtle2': 'rgba(189,147,249,0.18)', '--accent-glow': 'rgba(189,147,249,0.30)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'one-dark': {
    label: 'One Dark', dark: true,
    vars: {
      '--bg': '#282c34', '--bg-alt': '#21252b', '--bg-deep': '#181a1f',
      '--text': '#abb2bf', '--text-2': '#9aa0ad', '--text-3': '#818896', '--text-4': '#5c6370',
      '--surface-0': 'rgba(40,44,52,0.85)', '--surface-1': 'rgba(33,37,43,0.92)', '--surface-2': 'rgba(26,29,35,0.98)',
      '--border': 'rgba(171,178,191,0.10)', '--border-med': 'rgba(171,178,191,0.16)', '--border-strong': 'rgba(171,178,191,0.24)',
      '--surface-sidebar': 'rgba(24,26,31,0.98)',
      '--accent': '#61afef', '--accent-hover': '#4d9fdf', '--accent-light': '#84c4f5',
      '--accent-subtle': 'rgba(97,175,239,0.10)', '--accent-subtle2': 'rgba(97,175,239,0.18)', '--accent-glow': 'rgba(97,175,239,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'night-owl': {
    label: 'Night Owl', dark: true,
    vars: {
      '--bg': '#011627', '--bg-alt': '#01111d', '--bg-deep': '#010e16',
      '--text': '#d6deeb', '--text-2': '#c0c8db', '--text-3': '#a0a8bb', '--text-4': '#637777',
      '--surface-0': 'rgba(1,22,39,0.85)', '--surface-1': 'rgba(1,17,29,0.92)', '--surface-2': 'rgba(1,14,22,0.98)',
      '--border': 'rgba(214,222,235,0.10)', '--border-med': 'rgba(214,222,235,0.16)', '--border-strong': 'rgba(214,222,235,0.24)',
      '--surface-sidebar': 'rgba(1,11,18,0.98)',
      '--accent': '#82aaff', '--accent-hover': '#628de8', '--accent-light': '#a5c0ff',
      '--accent-subtle': 'rgba(130,170,255,0.10)', '--accent-subtle2': 'rgba(130,170,255,0.18)', '--accent-glow': 'rgba(130,170,255,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.50)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.60)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.70)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.80)',
    },
  },
  'material-ocean': {
    label: 'Material Ocean', dark: true,
    vars: {
      '--bg': '#0f111a', '--bg-alt': '#090b10', '--bg-deep': '#060608',
      '--text': '#8f93a2', '--text-2': '#7e8294', '--text-3': '#6b6f80', '--text-4': '#464b5d',
      '--surface-0': 'rgba(15,17,26,0.85)', '--surface-1': 'rgba(9,11,16,0.92)', '--surface-2': 'rgba(6,6,8,0.98)',
      '--border': 'rgba(143,147,162,0.10)', '--border-med': 'rgba(143,147,162,0.16)', '--border-strong': 'rgba(143,147,162,0.24)',
      '--surface-sidebar': 'rgba(4,4,6,0.98)',
      '--accent': '#82aaff', '--accent-hover': '#5f8fe8', '--accent-light': '#a8beff',
      '--accent-subtle': 'rgba(130,170,255,0.10)', '--accent-subtle2': 'rgba(130,170,255,0.18)', '--accent-glow': 'rgba(130,170,255,0.30)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.60)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.70)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.80)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.85)',
    },
  },
  'ayu-dark': {
    label: 'Ayu Dark', dark: true,
    vars: {
      '--bg': '#0d1017', '--bg-alt': '#0a0e14', '--bg-deep': '#070b10',
      '--text': '#bfbdb6', '--text-2': '#aea9a0', '--text-3': '#8d9099', '--text-4': '#5c6773',
      '--surface-0': 'rgba(13,16,23,0.85)', '--surface-1': 'rgba(10,14,20,0.92)', '--surface-2': 'rgba(7,11,16,0.98)',
      '--border': 'rgba(191,189,182,0.10)', '--border-med': 'rgba(191,189,182,0.16)', '--border-strong': 'rgba(191,189,182,0.24)',
      '--surface-sidebar': 'rgba(5,8,12,0.98)',
      '--accent': '#e6b450', '--accent-hover': '#c99a36', '--accent-light': '#f0c870',
      '--accent-subtle': 'rgba(230,180,80,0.10)', '--accent-subtle2': 'rgba(230,180,80,0.18)', '--accent-glow': 'rgba(230,180,80,0.30)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.50)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.60)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.70)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.80)',
    },
  },
  'ayu-light': {
    label: 'Ayu Light', dark: false,
    vars: {
      '--bg': '#fafafa', '--bg-alt': '#f0eee4', '--bg-deep': '#e6e1cf',
      '--text': '#5c6166', '--text-2': '#4a5054', '--text-3': '#6c7176', '--text-4': '#8a9199',
      '--surface-0': 'rgba(250,250,250,0.82)', '--surface-1': 'rgba(240,238,228,0.94)', '--surface-2': 'rgba(230,225,207,0.98)',
      '--border': 'rgba(92,97,102,0.10)', '--border-med': 'rgba(92,97,102,0.16)', '--border-strong': 'rgba(92,97,102,0.24)',
      '--surface-sidebar': 'rgba(240,238,228,0.98)',
      '--accent': '#ff9940', '--accent-hover': '#f07f24', '--accent-light': '#ffad66',
      '--accent-subtle': 'rgba(255,153,64,0.10)', '--accent-subtle2': 'rgba(255,153,64,0.18)', '--accent-glow': 'rgba(255,153,64,0.26)',
      '--sh-xs': '0 1px 3px rgba(15,23,42,0.06)', '--sh-sm': '0 2px 10px rgba(15,23,42,0.08)',
      '--sh-md': '0 4px 22px rgba(15,23,42,0.10)', '--sh-lg': '0 8px 40px rgba(15,23,42,0.14)',
    },
  },
  'everforest-dark': {
    label: 'Everforest Dark', dark: true,
    vars: {
      '--bg': '#232a2e', '--bg-alt': '#2d353b', '--bg-deep': '#1e2326',
      '--text': '#d3c6aa', '--text-2': '#c7b89c', '--text-3': '#a7c080', '--text-4': '#859289',
      '--surface-0': 'rgba(35,42,46,0.85)', '--surface-1': 'rgba(45,53,59,0.92)', '--surface-2': 'rgba(30,35,38,0.98)',
      '--border': 'rgba(211,198,170,0.10)', '--border-med': 'rgba(211,198,170,0.16)', '--border-strong': 'rgba(211,198,170,0.24)',
      '--surface-sidebar': 'rgba(30,35,38,0.98)',
      '--accent': '#a7c080', '--accent-hover': '#8daa68', '--accent-light': '#b8cf95',
      '--accent-subtle': 'rgba(167,192,128,0.10)', '--accent-subtle2': 'rgba(167,192,128,0.18)', '--accent-glow': 'rgba(167,192,128,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'everforest-light': {
    label: 'Everforest Light', dark: false,
    vars: {
      '--bg': '#fdf6e3', '--bg-alt': '#f3ead3', '--bg-deep': '#e6dcc6',
      '--text': '#5c6a72', '--text-2': '#4f5b58', '--text-3': '#708089', '--text-4': '#939f91',
      '--surface-0': 'rgba(253,246,227,0.82)', '--surface-1': 'rgba(243,234,211,0.94)', '--surface-2': 'rgba(230,220,198,0.98)',
      '--border': 'rgba(92,106,114,0.10)', '--border-med': 'rgba(92,106,114,0.16)', '--border-strong': 'rgba(92,106,114,0.24)',
      '--surface-sidebar': 'rgba(243,234,211,0.98)',
      '--accent': '#8da101', '--accent-hover': '#778800', '--accent-light': '#9fb530',
      '--accent-subtle': 'rgba(141,161,1,0.10)', '--accent-subtle2': 'rgba(141,161,1,0.17)', '--accent-glow': 'rgba(141,161,1,0.25)',
      '--sh-xs': '0 1px 3px rgba(15,23,42,0.06)', '--sh-sm': '0 2px 10px rgba(15,23,42,0.08)',
      '--sh-md': '0 4px 22px rgba(15,23,42,0.10)', '--sh-lg': '0 8px 40px rgba(15,23,42,0.14)',
    },
  },
  'kanagawa': {
    label: 'Kanagawa', dark: true,
    vars: {
      '--bg': '#1f1f28', '--bg-alt': '#2a2a37', '--bg-deep': '#16161d',
      '--text': '#dcd7ba', '--text-2': '#c8c093', '--text-3': '#a6a69c', '--text-4': '#727169',
      '--surface-0': 'rgba(31,31,40,0.85)', '--surface-1': 'rgba(42,42,55,0.92)', '--surface-2': 'rgba(22,22,29,0.98)',
      '--border': 'rgba(220,215,186,0.10)', '--border-med': 'rgba(220,215,186,0.16)', '--border-strong': 'rgba(220,215,186,0.24)',
      '--surface-sidebar': 'rgba(22,22,29,0.98)',
      '--accent': '#7e9cd8', '--accent-hover': '#6587cb', '--accent-light': '#9ab2e3',
      '--accent-subtle': 'rgba(126,156,216,0.10)', '--accent-subtle2': 'rgba(126,156,216,0.18)', '--accent-glow': 'rgba(126,156,216,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.42)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.52)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.62)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.72)',
    },
  },
  'poimandres': {
    label: 'Poimandres', dark: true,
    vars: {
      '--bg': '#1b1e28', '--bg-alt': '#232635', '--bg-deep': '#171922',
      '--text': '#e4f0fb', '--text-2': '#cbd6e2', '--text-3': '#a6accd', '--text-4': '#767c9d',
      '--surface-0': 'rgba(27,30,40,0.85)', '--surface-1': 'rgba(35,38,53,0.92)', '--surface-2': 'rgba(23,25,34,0.98)',
      '--border': 'rgba(228,240,251,0.10)', '--border-med': 'rgba(228,240,251,0.16)', '--border-strong': 'rgba(228,240,251,0.24)',
      '--surface-sidebar': 'rgba(23,25,34,0.98)',
      '--accent': '#5de4c7', '--accent-hover': '#3fd8b6', '--accent-light': '#82ead5',
      '--accent-subtle': 'rgba(93,228,199,0.10)', '--accent-subtle2': 'rgba(93,228,199,0.18)', '--accent-glow': 'rgba(93,228,199,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.42)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.52)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.62)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.72)',
    },
  },
  'paper': {
    label: 'Paper', dark: false,
    vars: {
      '--bg': '#f5f0e8', '--bg-alt': '#ede8e0', '--bg-deep': '#e4ddd4',
      '--text': '#2c2416', '--text-2': '#3d3222', '--text-3': '#5a4c38', '--text-4': '#8c7a64',
      '--surface-0': 'rgba(245,240,232,0.80)', '--surface-1': 'rgba(237,232,224,0.92)', '--surface-2': 'rgba(228,221,212,0.98)',
      '--border': 'rgba(44,36,22,0.10)', '--border-med': 'rgba(44,36,22,0.16)', '--border-strong': 'rgba(44,36,22,0.24)',
      '--surface-sidebar': 'rgba(228,221,212,0.98)',
      '--accent': '#8b3a00', '--accent-hover': '#6e2e00', '--accent-light': '#b85000',
      '--accent-subtle': 'rgba(139,58,0,0.09)', '--accent-subtle2': 'rgba(139,58,0,0.16)', '--accent-glow': 'rgba(139,58,0,0.25)',
      '--sh-xs': '0 1px 3px rgba(44,36,22,0.08)', '--sh-sm': '0 2px 10px rgba(44,36,22,0.10)',
      '--sh-md': '0 4px 22px rgba(44,36,22,0.12)', '--sh-lg': '0 8px 40px rgba(44,36,22,0.16)',
    },
  },
};

export const EDITOR_FONTS = [
  { id: 'google-sans', label: 'Google Sans', stack: "'Google Sans Flex','Google Sans','DM Sans',sans-serif", mono: false },
  { id: 'georgia', label: 'Georgia', stack: "Georgia,'Times New Roman',serif", mono: false },
  { id: 'palatino', label: 'Palatino', stack: "'Palatino Linotype',Palatino,'Book Antiqua',serif", mono: false },
  { id: 'garamond', label: 'EB Garamond', stack: "'EB Garamond',Garamond,serif", mono: false },
  { id: 'merriweather', label: 'Merriweather', stack: "Merriweather,Georgia,serif", mono: false },
  { id: 'lora', label: 'Lora', stack: "Lora,Georgia,serif", mono: false },
  { id: 'jetbrains', label: 'JetBrains Mono', stack: "'JetBrains Mono','Fira Code',monospace", mono: true },
  { id: 'fira-code', label: 'Fira Code', stack: "'Fira Code','Cascadia Code',monospace", mono: true },
  { id: 'ibm-plex-mono', label: 'IBM Plex Mono', stack: "'IBM Plex Mono','Courier New',monospace", mono: true },
  { id: 'source-code', label: 'Source Code Pro', stack: "'Source Code Pro',monospace", mono: true },
];

export const UI_FONTS = [
  { id: 'google-sans', label: 'Google Sans', stack: "'Google Sans Flex','Google Sans','DM Sans',sans-serif" },
  { id: 'system', label: 'System UI', stack: "system-ui,-apple-system,sans-serif" },
  { id: 'inter', label: 'Inter', stack: "'Inter',sans-serif" },
  { id: 'dm-sans', label: 'DM Sans', stack: "'DM Sans',sans-serif" },
  { id: 'plus-jakarta', label: 'Plus Jakarta', stack: "'Plus Jakarta Sans',sans-serif" },
];

export const ACCENT_COLORS = [
  { id: 'purple', label: 'Violet', value: '#9875c1' },
  { id: 'blue', label: 'Blue', value: '#2f81f7' },
  { id: 'teal', label: 'Teal', value: '#14b8a6' },
  { id: 'green', label: 'Green', value: '#22c55e' },
  { id: 'amber', label: 'Amber', value: '#f59e0b' },
  { id: 'rose', label: 'Rose', value: '#f43f5e' },
  { id: 'orange', label: 'Orange', value: '#f97316' },
  { id: 'indigo', label: 'Indigo', value: '#6366f1' },
];

export const DARK_TO_LIGHT: Record<string, string> = {
  'default-dark': 'default-light',
  'catppuccin-mocha': 'catppuccin-latte',
  'solarized-dark': 'solarized-light',
  'gruvbox-dark': 'gruvbox-light',
  'github-dark': 'github-light',
  'ayu-dark': 'ayu-light',
  'everforest-dark': 'everforest-light',
};

export const LIGHT_TO_DARK: Record<string, string> = Object.fromEntries(
  Object.entries(DARK_TO_LIGHT).map(([dark, light]) => [light, dark])
);

export const SETTINGS_KEY = 'cs-settings';

const ALL_THEME_VARS = [
  '--bg', '--bg-alt', '--bg-deep',
  '--surface-0', '--surface-1', '--surface-2', '--surface-sidebar',
  '--border', '--border-med', '--border-strong',
  '--text', '--text-2', '--text-3', '--text-4', '--text-5',
  '--sh-xs', '--sh-sm', '--sh-md', '--sh-lg',
  '--accent', '--accent-hover', '--accent-light', '--accent-subtle', '--accent-subtle2', '--accent-glow',
];

export function isDarkTheme(themeId: string): boolean {
  return THEMES[themeId]?.dark ?? true;
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function hasSavedSettings(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SETTINGS_KEY) !== null;
  } catch {}
  return false;
}

export function resolveSettings(settings?: Partial<AppSettings> | null): AppSettings {
  const localSettings = loadSettings();

  // When local settings exist, prefer them over metadata so route changes
  // don't snap back to stale server values while metadata sync is in flight.
  if (settings) {
    return hasSavedSettings()
      ? { ...DEFAULT_SETTINGS, ...settings, ...localSettings }
      : { ...DEFAULT_SETTINGS, ...settings };
  }

  if (hasSavedSettings()) {
    return localSettings;
  }

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return { ...localSettings, theme: 'default-light' };
  }

  return localSettings;
}

export function saveSettings(s: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}

export function applySettings(s: AppSettings): boolean {
  if (typeof document === 'undefined') return false;

  const theme = THEMES[s.theme] ?? THEMES['default-dark'];
  const isDark = theme.dark;
  const root = document.documentElement;

  root.classList.add('theme-transitioning');
  requestAnimationFrame(() => setTimeout(() => root.classList.remove('theme-transitioning'), 260));

  root.dataset.theme = s.theme;
  root.classList.toggle('dark', isDark);

  ALL_THEME_VARS.forEach((variable) => root.style.removeProperty(variable));
  Object.entries(theme.vars).forEach(([key, value]) => root.style.setProperty(key, value));

  if (!theme.vars['--accent']) {
    const accent = s.accentColor;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-hover', `${accent}cc`);
    root.style.setProperty('--accent-light', `${accent}aa`);
    root.style.setProperty('--accent-subtle', `${accent}18`);
    root.style.setProperty('--accent-subtle2', `${accent}28`);
    root.style.setProperty('--accent-glow', `${accent}40`);
  }

  root.style.setProperty('--ink', root.style.getPropertyValue('--text'));
  root.style.setProperty('--paper', root.style.getPropertyValue('--bg'));
  root.style.setProperty('--cream', root.style.getPropertyValue('--bg-alt'));
  root.style.setProperty('--mid', root.style.getPropertyValue('--text-4'));
  root.style.setProperty('--rule', root.style.getPropertyValue('--border'));
  root.style.setProperty('--tape-bg', root.style.getPropertyValue('--bg-deep'));
  root.style.setProperty('--accent-dim', root.style.getPropertyValue('--accent-subtle'));
  root.style.setProperty('--accent-sub', root.style.getPropertyValue('--accent-subtle2'));

  const editorFont = EDITOR_FONTS.find((font) => font.id === s.editorFont)?.stack ?? EDITOR_FONTS[0].stack;
  root.style.setProperty('--editor-font', editorFont);
  root.style.setProperty('--editor-font-size', `${s.editorFontSize}px`);
  root.style.setProperty('--editor-line-height', String(s.lineHeight));
  root.style.setProperty('--editor-max-width', `${s.maxWidth}px`);

  const uiFont = UI_FONTS.find((font) => font.id === s.uiFont)?.stack ?? UI_FONTS[0].stack;
  root.style.setProperty('--ui-font', uiFont);

  root.classList.toggle('reduced-motion', s.reducedMotion);
  root.classList.toggle('high-contrast', s.highContrast);

  return isDark;
}

export function getThemeBootstrapScript(): string {
  const defaultTheme = DEFAULT_SETTINGS.theme;
  const lightThemeIds = Object.entries(THEMES)
    .filter(([, theme]) => !theme.dark)
    .map(([id]) => id);

  return `
    (function() {
      try {
        var settings = localStorage.getItem('${SETTINGS_KEY}');
        var parsed = settings ? JSON.parse(settings) : {};
        var theme = parsed && parsed.theme ? parsed.theme : '${defaultTheme}';

        if (!settings && window.matchMedia('(prefers-color-scheme: light)').matches) {
          theme = 'default-light';
        }

        var isDark = ${JSON.stringify(lightThemeIds)}.indexOf(theme) === -1;
        document.documentElement.dataset.theme = theme;
        document.documentElement.classList.toggle('dark', isDark);
      } catch (error) {}
    })();
  `;
}
