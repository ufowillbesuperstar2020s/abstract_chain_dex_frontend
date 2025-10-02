/**
 * Fetch current ETH → USD price from CoinGecko
 */
export async function fetchEthPriceUSD(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { cache: 'no-store' } // avoid Next.js fetch caching
    );
    const json = await res.json();
    return json?.ethereum?.usd ?? null;
  } catch (err) {
    console.error('Failed to fetch ETH price:', err);
    return null;
  }
}

/**
 * Convert an ETH amount to USD using current price
 */
export async function ethToUsd(amountEth: number): Promise<number | null> {
  const price = await fetchEthPriceUSD();
  if (!price) return null;
  return amountEth * price;
}
