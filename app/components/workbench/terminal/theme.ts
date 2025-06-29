import type { ITheme } from '@xterm/xterm';

const style = getComputedStyle(document.documentElement);
const cssVar = (token: string) => style.getPropertyValue(token) || undefined;

export function getTerminalTheme(overrides?: ITheme): ITheme {
  return {
    cursor: cssVar('--bit-elements-terminal-cursorColor'),
    cursorAccent: cssVar('--bit-elements-terminal-cursorColorAccent'),
    foreground: cssVar('--bit-elements-terminal-textColor'),
    background: cssVar('--bit-elements-terminal-backgroundColor'),
    selectionBackground: cssVar('--bit-elements-terminal-selection-backgroundColor'),
    selectionForeground: cssVar('--bit-elements-terminal-selection-textColor'),
    selectionInactiveBackground: cssVar('--bit-elements-terminal-selection-backgroundColorInactive'),

    // ansi escape code colors
    black: cssVar('--bit-elements-terminal-color-black'),
    red: cssVar('--bit-elements-terminal-color-red'),
    green: cssVar('--bit-elements-terminal-color-green'),
    yellow: cssVar('--bit-elements-terminal-color-yellow'),
    blue: cssVar('--bit-elements-terminal-color-blue'),
    magenta: cssVar('--bit-elements-terminal-color-magenta'),
    cyan: cssVar('--bit-elements-terminal-color-cyan'),
    white: cssVar('--bit-elements-terminal-color-white'),
    brightBlack: cssVar('--bit-elements-terminal-color-brightBlack'),
    brightRed: cssVar('--bit-elements-terminal-color-brightRed'),
    brightGreen: cssVar('--bit-elements-terminal-color-brightGreen'),
    brightYellow: cssVar('--bit-elements-terminal-color-brightYellow'),
    brightBlue: cssVar('--bit-elements-terminal-color-brightBlue'),
    brightMagenta: cssVar('--bit-elements-terminal-color-brightMagenta'),
    brightCyan: cssVar('--bit-elements-terminal-color-brightCyan'),
    brightWhite: cssVar('--bit-elements-terminal-color-brightWhite'),

    ...overrides,
  };
}
