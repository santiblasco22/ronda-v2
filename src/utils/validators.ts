import { MAX_USERNAME_LENGTH, MIN_USERNAME_LENGTH } from '@/constants/limits';

const USERNAME_REGEX = /^[a-z0-9_.]+$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, '');
}

export function validateUsername(raw: string): string | null {
  const value = normalizeUsername(raw);
  if (value.length < MIN_USERNAME_LENGTH) {
    return `El nombre de usuario debe tener al menos ${MIN_USERNAME_LENGTH} caracteres.`;
  }
  if (value.length > MAX_USERNAME_LENGTH) {
    return `El nombre de usuario debe tener como máximo ${MAX_USERNAME_LENGTH} caracteres.`;
  }
  if (!USERNAME_REGEX.test(value)) {
    return 'Usá solo letras minúsculas, números, puntos y guiones bajos.';
  }
  return null;
}

export function validateEmail(raw: string): string | null {
  const value = raw.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Ingresá un email válido.';
  }
  return null;
}

export function validatePassword(raw: string): string | null {
  if (raw.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  return null;
}

export function validatePrice(raw: string): string | null {
  const value = Number(raw);
  if (Number.isNaN(value) || value <= 0) {
    return 'Ingresá un precio válido.';
  }
  return null;
}
