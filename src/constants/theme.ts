import type { TextStyle, ViewStyle } from 'react-native';

import { Colors } from './colors';

/** Ritmo base de 4pt, compartido por toda la interfaz. */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
  jumbo: 56,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

export const MIN_TOUCH_TARGET = 44;

export const HitSlop = {
  small: { top: 8, bottom: 8, left: 8, right: 8 },
  medium: { top: 12, bottom: 12, left: 12, right: 12 },
} as const;

export function hitSlopForSize(size: number) {
  const extra = Math.max(0, Math.ceil((MIN_TOUCH_TARGET - size) / 2));
  return { top: extra, bottom: extra, left: extra, right: extra };
}

export const Typography = {
  display: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
    letterSpacing: -1.2,
    color: Colors.text,
  },
  title: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
    letterSpacing: -0.7,
    color: Colors.text,
  },
  heading: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.35,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    color: Colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
    color: Colors.text,
  },
  bodyStrong: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  label: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: Colors.text,
  },
  caption: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
    color: Colors.textMuted,
  },
  micro: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.45,
  },
} satisfies Record<string, TextStyle>;

export const Shadows = {
  card: {
    shadowColor: '#44223D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  floating: {
    shadowColor: '#44223D',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 7,
  },
} satisfies Record<string, ViewStyle>;
