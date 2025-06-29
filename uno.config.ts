import { globSync } from 'fast-glob';
import fs from 'node:fs/promises';
import { basename } from 'node:path';
import { defineConfig, presetIcons, presetUno, transformerDirectives } from 'unocss';

const iconPaths = globSync('./icons/*.svg');

const collectionName = 'bit';

const customIconCollection = iconPaths.reduce(
  (acc, iconPath) => {
    const [iconName] = basename(iconPath).split('.');

    acc[collectionName] ??= {};
    acc[collectionName][iconName] = async () => fs.readFile(iconPath, 'utf8');

    return acc;
  },
  {} as Record<string, Record<string, () => Promise<string>>>,
);

const BASE_COLORS = {
  white: '#FFFFFF',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  // BIT-STUDIO Color Palette
  primary: {
    50: '#FDF8F6',
    100: '#F9EDE8',
    200: '#F2D9CF',
    300: '#E8C1B3',
    400: '#DBA593',
    500: '#C97A5A', // Main BIT-STUDIO primary color
    600: '#B86A4A',
    700: '#9A5A3F',
    800: '#7D4A34',
    900: '#663D2C',
    950: '#36201A',
  },
  secondary: {
    50: '#FDFBF9',
    100: '#F6E9E0', // BIT-STUDIO secondary color
    200: '#EED8C8',
    300: '#E4C3AD',
    400: '#D7A98E',
    500: '#C97A5A',
    600: '#B86A4A',
    700: '#9A5A3F',
    800: '#7D4A34',
    900: '#663D2C',
    950: '#36201A',
  },
  // BIT-STUDIO Background Colors
  background: '#1a1817',
  card: '#23201d',
  border: '#23201d',
  input: '#23201d',
  ring: '#C97A5A',
  accent: {
    50: '#EEF9FF',
    100: '#D8F1FF',
    200: '#BAE7FF',
    300: '#8ADAFF',
    400: '#53C4FF',
    500: '#2BA6FF',
    600: '#1488FC',
    700: '#0D6FE8',
    800: '#1259BB',
    900: '#154E93',
    950: '#122F59',
  },
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  orange: {
    50: '#FFFAEB',
    100: '#FEEFC7',
    200: '#FEDF89',
    300: '#FEC84B',
    400: '#FDB022',
    500: '#F79009',
    600: '#DC6803',
    700: '#B54708',
    800: '#93370D',
    900: '#792E0D',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },
};

const COLOR_PRIMITIVES = {
  ...BASE_COLORS,
  alpha: {
    white: generateAlphaPalette(BASE_COLORS.white),
    gray: generateAlphaPalette(BASE_COLORS.gray[900]),
    red: generateAlphaPalette(BASE_COLORS.red[500]),
    accent: generateAlphaPalette(BASE_COLORS.accent[500]),
  },
};

export default defineConfig({
  safelist: [...Object.keys(customIconCollection[collectionName] || {}).map((x) => `i-bit:${x}`)],
  shortcuts: {
    'bit-ease-cubic-bezier': 'ease-[cubic-bezier(0.4,0,0.2,1)]',
    'transition-theme': 'transition-[background-color,border-color,color] duration-150 bit-ease-cubic-bezier',
    kdb: 'bg-bit-elements-code-background text-bit-elements-code-text py-1 px-1.5 rounded-md',
    'max-w-chat': 'max-w-[var(--chat-max-width)]',
  },
  rules: [
    /**
     * This shorthand doesn't exist in Tailwind and we overwrite it to avoid
     * any conflicts with minified CSS classes.
     */
    ['b', {}],
  ],
  theme: {
    colors: {
      ...COLOR_PRIMITIVES,
      bit: {
        elements: {
          borderColor: 'var(--bit-elements-borderColor)',
          borderColorActive: 'var(--bit-elements-borderColorActive)',
          background: {
            depth: {
              1: 'var(--bit-elements-bg-depth-1)',
              2: 'var(--bit-elements-bg-depth-2)',
              3: 'var(--bit-elements-bg-depth-3)',
              4: 'var(--bit-elements-bg-depth-4)',
            },
          },
          textPrimary: 'var(--bit-elements-textPrimary)',
          textSecondary: 'var(--bit-elements-textSecondary)',
          textTertiary: 'var(--bit-elements-textTertiary)',
          code: {
            background: 'var(--bit-elements-code-background)',
            text: 'var(--bit-elements-code-text)',
          },
          button: {
            primary: {
              background: 'var(--bit-elements-button-primary-background)',
              backgroundHover: 'var(--bit-elements-button-primary-backgroundHover)',
              text: 'var(--bit-elements-button-primary-text)',
            },
            secondary: {
              background: 'var(--bit-elements-button-secondary-background)',
              backgroundHover: 'var(--bit-elements-button-secondary-backgroundHover)',
              text: 'var(--bit-elements-button-secondary-text)',
            },
            danger: {
              background: 'var(--bit-elements-button-danger-background)',
              backgroundHover: 'var(--bit-elements-button-danger-backgroundHover)',
              text: 'var(--bit-elements-button-danger-text)',
            },
          },
          item: {
            contentDefault: 'var(--bit-elements-item-contentDefault)',
            contentActive: 'var(--bit-elements-item-contentActive)',
            contentAccent: 'var(--bit-elements-item-contentAccent)',
            contentDanger: 'var(--bit-elements-item-contentDanger)',
            backgroundDefault: 'var(--bit-elements-item-backgroundDefault)',
            backgroundActive: 'var(--bit-elements-item-backgroundActive)',
            backgroundAccent: 'var(--bit-elements-item-backgroundAccent)',
            backgroundDanger: 'var(--bit-elements-item-backgroundDanger)',
          },
          actions: {
            background: 'var(--bit-elements-actions-background)',
            code: {
              background: 'var(--bit-elements-actions-code-background)',
            },
          },
          artifacts: {
            background: 'var(--bit-elements-artifacts-background)',
            backgroundHover: 'var(--bit-elements-artifacts-backgroundHover)',
            borderColor: 'var(--bit-elements-artifacts-borderColor)',
            inlineCode: {
              background: 'var(--bit-elements-artifacts-inlineCode-background)',
              text: 'var(--bit-elements-artifacts-inlineCode-text)',
            },
          },
          messages: {
            background: 'var(--bit-elements-messages-background)',
            linkColor: 'var(--bit-elements-messages-linkColor)',
            code: {
              background: 'var(--bit-elements-messages-code-background)',
            },
            inlineCode: {
              background: 'var(--bit-elements-messages-inlineCode-background)',
              text: 'var(--bit-elements-messages-inlineCode-text)',
            },
          },
          icon: {
            success: 'var(--bit-elements-icon-success)',
            error: 'var(--bit-elements-icon-error)',
            primary: 'var(--bit-elements-icon-primary)',
            secondary: 'var(--bit-elements-icon-secondary)',
            tertiary: 'var(--bit-elements-icon-tertiary)',
          },
          preview: {
            addressBar: {
              background: 'var(--bit-elements-preview-addressBar-background)',
              backgroundHover: 'var(--bit-elements-preview-addressBar-backgroundHover)',
              backgroundActive: 'var(--bit-elements-preview-addressBar-backgroundActive)',
              text: 'var(--bit-elements-preview-addressBar-text)',
              textActive: 'var(--bit-elements-preview-addressBar-textActive)',
            },
          },
          terminals: {
            background: 'var(--bit-elements-terminals-background)',
            buttonBackground: 'var(--bit-elements-terminals-buttonBackground)',
          },
          dividerColor: 'var(--bit-elements-dividerColor)',
          loader: {
            background: 'var(--bit-elements-loader-background)',
            progress: 'var(--bit-elements-loader-progress)',
          },
          prompt: {
            background: 'var(--bit-elements-prompt-background)',
          },
          sidebar: {
            dropdownShadow: 'var(--bit-elements-sidebar-dropdownShadow)',
            buttonBackgroundDefault: 'var(--bit-elements-sidebar-buttonBackgroundDefault)',
            buttonBackgroundHover: 'var(--bit-elements-sidebar-buttonBackgroundHover)',
            buttonText: 'var(--bit-elements-sidebar-buttonText)',
          },
          cta: {
            background: 'var(--bit-elements-cta-background)',
            text: 'var(--bit-elements-cta-text)',
          },
        },
      },
    },
  },
  transformers: [transformerDirectives()],
  presets: [
    presetUno({
      dark: {
        light: '[data-theme="light"]',
        dark: '[data-theme="dark"]',
      },
    }),
    presetIcons({
      warn: true,
      collections: {
        ...customIconCollection,
      },
      unit: 'em',
    }),
  ],
});

/**
 * Generates an alpha palette for a given hex color.
 *
 * @param hex - The hex color code (without alpha) to generate the palette from.
 * @returns An object where keys are opacity percentages and values are hex colors with alpha.
 *
 * Example:
 *
 * ```
 * {
 *   '1': '#FFFFFF03',
 *   '2': '#FFFFFF05',
 *   '3': '#FFFFFF08',
 * }
 * ```
 */
function generateAlphaPalette(hex: string) {
  return [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].reduce(
    (acc, opacity) => {
      const alpha = Math.round((opacity / 100) * 255)
        .toString(16)
        .padStart(2, '0');

      acc[opacity] = `${hex}${alpha}`;

      return acc;
    },
    {} as Record<number, string>,
  );
}
