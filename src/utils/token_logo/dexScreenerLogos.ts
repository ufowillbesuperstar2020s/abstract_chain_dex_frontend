import { getCachedLogo, setCachedLogo } from './localLogoCache';

const DEX_SCREENER_BASE = 'https://api.dexscreener.com/tokens/v1/abstract';

type DexTokenInfo = {
  baseToken?: {
    address: string;
    name?: string;
    symbol?: string;
  };
  info?: {
    imageUrl?: string;
  };
  // other fields ignored
};

type DexLogoMap = Record<string, string>; // key: token_address (lowercase) -> imageUrl

// Split an array into chunks
function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

/**
 * Fetch logos from DexScreener by token addresses (max 30 per request).
 * Uses browser fetch, no backend.
 */
async function fetchDexLogosRaw(addresses: string[]): Promise<DexLogoMap> {
  const unique = Array.from(new Set(addresses.map((a) => a.toLowerCase())));
  const batches = chunk(unique, 30);
  const result: DexLogoMap = {};

  for (const batch of batches) {
    const url = `${DEX_SCREENER_BASE}/${batch.join(',')}`;

    try {
      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        // 429 etc – just log and skip, we will fallback to default icon
        console.warn('DexScreener logo fetch failed:', res.status, res.statusText);
        continue;
      }

      const json = (await res.json()) as DexTokenInfo[];

      for (const item of json) {
        const addr = item.baseToken?.address?.toLowerCase();
        const img = item.info?.imageUrl;
        if (!addr || !img) continue;
        result[addr] = img;
      }
    } catch (e) {
      console.warn('DexScreener logo fetch error:', e);
      // continue, we don't want to break the page
    }
  }

  return result;
}

/**
 * Public function:
 * - takes a list of token addresses
 * - uses cache first
 * - fetches only missing ones from DexScreener
 * - updates cache
 * - returns a map: token_address (lowercase) -> imageUrl
 */
export async function getDexLogosForTokens(tokenAddresses: string[]): Promise<DexLogoMap> {
  const logos: DexLogoMap = {};
  const toFetch: string[] = [];

  for (const raw of tokenAddresses) {
    const addr = raw.toLowerCase();
    const cached = getCachedLogo(addr);
    if (cached) {
      logos[addr] = cached;
    } else {
      toFetch.push(addr);
    }
  }

  if (toFetch.length > 0) {
    const fetched = await fetchDexLogosRaw(toFetch);
    for (const [addr, url] of Object.entries(fetched)) {
      logos[addr] = url;
      setCachedLogo(addr, url);
    }
  }

  return logos;
}
