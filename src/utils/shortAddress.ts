export function shortAddress(addr: string, start = 7, end = 5): string {
  if (!addr) return '';
  if (addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}
