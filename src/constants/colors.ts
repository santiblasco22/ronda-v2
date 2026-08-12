/** Paleta de colores de Ronda: cálida, tipo "feria americana". */
export const Colors = {
  background: '#F6F1E7',
  surface: '#FFFFFF',
  border: '#E7DDC9',
  text: '#2A2119',
  textMuted: '#75695A',
  primary: '#F6902A',
  primaryDark: '#D9741A',
  primarySoft: '#FCE3C2',
  accent: '#3C8C6B',
  danger: '#D6483C',
  success: '#3C8C6B',
  gold: '#E0A526',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(42, 33, 25, 0.55)',
  like: '#3C8C6B',
  pass: '#D6483C',
  instagram: '#C1358B',
  whatsapp: '#25D366',
  facebook: '#1877F2',
} as const;

export type ColorName = keyof typeof Colors;
