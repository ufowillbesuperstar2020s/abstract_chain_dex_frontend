export * from './formatAge';

export function formatAgeShort(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) secs = 0;

  if (secs < 60) return `${Math.floor(secs)}s`;

  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m`;

  const h = Math.floor(secs / 3600);
  if (h < 24) return `${h}h`;

  const d = Math.floor(secs / 86400);
  if (d < 30) return `${d}d`;

  const mo = Math.floor(d / 30); // 30-day month
  if (mo < 12) return `${mo}M`;

  const y = Math.floor(mo / 12); // 12 months
  return `${y}y`;
}
