import type { TextStyle, ViewStyle } from 'react-native';

import { Colors } from './colors';

/**
 * Sistema visual de Ronda: una escala de espaciado de 4, un puñado de radios
 * y una escala tipográfica. La idea es que las pantallas compongan estos
 * tokens en vez de inventar números sueltos, así el ritmo vertical y el peso
 * del texto son los mismos en toda la app.
 */

/** Escala de espaciado en múltiplos de 4. */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

/**
 * Tamaño mínimo de un objetivo táctil. Los iconos sueltos usan `hitSlop` para
 * llegar a esta medida sin agrandar el dibujo.
 */
export const MIN_TOUCH_TARGET = 44;

export const HitSlop = {
  small: { top: 8, bottom: 8, left: 8, right: 8 },
  medium: { top: 12, bottom: 12, left: 12, right: 12 },
} as const;

export const Typography = {
  /** Títulos de bienvenida / marca. */
  display: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Colors.text,
  },
  /** Título de pantalla. */
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: Colors.text,
  },
  /** Título de tarjeta o sección grande. */
  heading: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: Colors.text,
  },
  /** Encabezado de bloque dentro de una pantalla. */
  sectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
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
    lineHeight: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.textMuted,
  },
  micro: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
} satisfies Record<string, TextStyle>;

export const Shadows = {
  /** Elevación sutil para tarjetas sobre el fondo crema. */
  card: {
    shadowColor: '#3D2E1A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  /** Botones flotantes del mazo de swipe. */
  floating: {
    shadowColor: '#3D2E1A',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
} satisfies Record<string, ViewStyle>;
