/**
 * Paleta de Ronda.
 *
 * La base recuerda papel, etiquetas y prendas guardadas; el coral funciona
 * como hilo conductor y el ciruela como tinta. Los pares de texto/fondo se
 * mantienen por encima de AA y nunca usamos blanco sobre el coral claro.
 */
export const Colors = {
  background: '#F7F0E7',
  backgroundDeep: '#EFE2D4',
  surface: '#FFFCF8',
  surfaceRaised: '#FFFFFF',
  surfaceMuted: '#EEE3D7',
  surfaceTint: '#F4E8DD',
  border: '#DDCDBE',
  borderStrong: '#CBB5A4',

  text: '#2D1D2C',
  textMuted: '#71616D',
  textSubtle: '#8B7984',
  textOnPrimary: '#2D1D2C',
  textOnDark: '#FFF9F4',

  primary: '#F1795F',
  primaryPressed: '#DE614A',
  primarySoft: '#FADFD7',
  primaryInk: '#9E392B',

  plum: '#59354F',
  plumSoft: '#EADDE7',
  butter: '#F3C76B',
  butterSoft: '#FAEDC9',

  success: '#327966',
  successInk: '#286454',
  successSoft: '#DCEDE6',

  danger: '#B64250',
  dangerInk: '#963440',
  dangerSoft: '#F6DFE2',

  gold: '#C58A13',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(45, 29, 44, 0.48)',
  overlayStrong: 'rgba(45, 29, 44, 0.82)',

  like: '#287260',
  pass: '#A23E4A',

  instagram: '#B63A82',
  whatsapp: '#218F5A',
  facebook: '#2864A9',
} as const;

export type ColorName = keyof typeof Colors;
