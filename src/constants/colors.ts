/**
 * Paleta de Ronda: cálida, tipo "feria americana".
 *
 * Los tonos están elegidos para que el texto llegue a contraste AA (4.5:1)
 * sobre el fondo donde se usa:
 *
 * - `primary` es un naranja claro: lleva tinta oscura encima (`textOnPrimary`,
 *   6.7:1), no blanco (que daba 2.3:1).
 * - `primaryInk`, `dangerInk` y `successInk` son las versiones oscuras para
 *   texto e iconos sobre fondos claros (4.7:1, 5.3:1 y 5:1).
 * - `danger` y `success` son los rellenos, pensados con texto blanco encima
 *   (5.4:1 y 5.6:1).
 */
export const Colors = {
  background: '#F6F1E7',
  surface: '#FFFFFF',
  /** Fondo de placeholders, skeletons y fotos que no cargaron. */
  surfaceMuted: '#F0E9DA',
  border: '#E4D9C3',
  borderStrong: '#D5C6AA',

  text: '#2A2119',
  textMuted: '#6B6053',
  textOnPrimary: '#2A2119',
  textOnDark: '#FFFFFF',

  primary: '#F6902A',
  primaryPressed: '#E07F1C',
  primarySoft: '#FCE3C2',
  primaryInk: '#A85410',

  success: '#2F7358',
  successInk: '#2F7358',
  successSoft: '#DCEFE4',

  danger: '#C0392B',
  dangerInk: '#B23A2E',
  dangerSoft: '#F7E1DE',

  gold: '#E0A526',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(42, 33, 25, 0.55)',
  overlayStrong: 'rgba(42, 33, 25, 0.78)',

  like: '#2F7358',
  pass: '#C0392B',

  instagram: '#C1358B',
  whatsapp: '#25D366',
  facebook: '#1877F2',
} as const;

export type ColorName = keyof typeof Colors;
