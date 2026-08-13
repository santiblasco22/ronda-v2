export function formatPrice(value: number): string {
  return `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

export function formatRelativeDate(timestampMs: number): string {
  const diffMs = Date.now() - timestampMs;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'ahora';
  if (diffMs < hour) return `hace ${Math.floor(diffMs / minute)} min`;
  if (diffMs < day) return `hace ${Math.floor(diffMs / hour)} h`;
  if (diffMs < 7 * day) return `hace ${Math.floor(diffMs / day)} d`;

  return new Date(timestampMs).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
