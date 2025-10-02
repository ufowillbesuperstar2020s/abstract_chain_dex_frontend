export function formatAddress(addr?: string, first = 6, last = 4) {
  if (!addr) return '';
  return addr.length <= first + last ? addr : `${addr.slice(0, first)}…${addr.slice(-last)}`;
}

export function copyToClipboard(text: string) {
  if (typeof window !== 'undefined') {
    navigator.clipboard?.writeText(text).catch(() => {});
  }
}