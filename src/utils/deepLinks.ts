import { Linking } from 'react-native';

/** Limpia un handle/usuario ingresado por el vendedor (sin @, sin espacios, sin URL). */
function cleanHandle(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?(instagram\.com|facebook\.com|wa\.me)\//i, '')
    .replace(/^@/, '')
    .replace(/\/$/, '');
}

/** Limpia un número de WhatsApp dejando solo dígitos (y el + inicial si estaba). */
function cleanPhone(value: string): string {
  return value.trim().replace(/[^\d]/g, '');
}

export function buildInstagramUrl(handle: string): string {
  return `https://instagram.com/${cleanHandle(handle)}`;
}

export function buildFacebookUrl(handle: string): string {
  return `https://facebook.com/${cleanHandle(handle)}`;
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const digits = cleanPhone(phone);
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

export async function openExternalLink(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.warn('[Ronda] No se pudo abrir el link', url, error);
  }
}

export function defaultContactMessage(listingTitle: string): string {
  return `¡Hola! Vi tu publicación "${listingTitle}" en Ronda y me interesa 👋`;
}
