const STORAGE_KEY = 'dexscreenerTokenLogos_v1';

type LogoCache = Record<string, string>; // key: token_address (lowercase) -> imageUrl

let memoryCache: LogoCache | null = null;

function safeParse(json: string | null): LogoCache {
  if (!json) return {};
  try {
    const data = JSON.parse(json);
    if (data && typeof data === 'object') {
      return data as LogoCache;
    }
  } catch (e) {
    console.warn('Failed to parse logo cache from localStorage', e);
  }
  return {};
}

function loadFromStorage(): LogoCache {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return safeParse(raw);
  } catch (e) {
    console.warn('Cannot read logo cache from localStorage', e);
    return {};
  }
}

function saveToStorage(cache: LogoCache) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (e) {
    // quota exceeded or storage disabled – just ignore, we still have memory cache
    console.warn('Cannot write logo cache to localStorage', e);
  }
}

function getCache(): LogoCache {
  if (!memoryCache) {
    memoryCache = loadFromStorage();
  }
  return memoryCache;
}

export function getCachedLogo(tokenAddress: string): string | undefined {
  const cache = getCache();
  return cache[tokenAddress.toLowerCase()];
}

export function setCachedLogo(tokenAddress: string, url: string) {
  const key = tokenAddress.toLowerCase();
  const cache = getCache();
  if (cache[key] === url) return; // nothing to do
  cache[key] = url;
  saveToStorage(cache);
}
